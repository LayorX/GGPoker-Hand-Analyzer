/**
 * @file stats.js (Refactored)
 * @description 撲克統計數據計算引擎
 *
 * 這個重構後的版本將統計邏輯與計算引擎分離。
 * 核心 `calculateStats` 函數現在是一個通用的處理器，它：
 * 1. 遍歷所有手牌。
 * 2. 為每手牌建立一個預先計算好的 "上下文 (Context)" 物件，以提高效能。
 * 3. 根據 `STAT_DEFINITIONS` 中的定義，調用每個數據指標的 `process` 函數。
 * * 這種架構的優點：
 * - 易擴展性: 新增數據指標只需在 `stat-definitions.js` 中定義，無需修改此文件。
 * - 易維護性: 每個數據的計算邏輯都封裝在自己的 `process` 函數中，易於查找和除錯。
 * - 高效能: "手牌上下文" 避免了在每個數據計算中重複解析手牌狀態。
 */
import { getPositionCategory } from '../utils.js';
import { STAT_DEFINITIONS } from './stat-definitions.js';

const SESSION_GAP_MINUTES = 45;

/**
 * 根據 STAT_DEFINITIONS 動態生成初始統計物件
 * @returns {object}
 */
function initStatsObject() {
    const stats = {
        rawData: [],
        gameTypes: new Set(),
        bbSize: 0.1,
        actualPlayingDurationMinutes: 0,
        profitHistory: [],
        
        // 維度數據
        byPosition: {},
        byTime: {
            byDay: {},
            byDayOfWeek: Array(7).fill(null).map(() => ({ hands: 0, profit: 0 })),
            byHourOfDay: Array(24).fill(null).map(() => ({ hands: 0, profit: 0 })),
        },
    };

    // 初始化所有位置
    const positions = ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    positions.forEach(p => {
        stats.byPosition[p] = { hands: 0, profit: 0 };
        // 為每個位置也初始化獨立的數據統計
        Object.keys(STAT_DEFINITIONS).forEach(key => {
            if (STAT_DEFINITIONS[key].init) {
                 stats.byPosition[p][key] = STAT_DEFINITIONS[key].init();
            }
        });
    });

    // 根據定義檔初始化所有頂層數據
    Object.keys(STAT_DEFINITIONS).forEach(key => {
        if (STAT_DEFINITIONS[key].init) {
            stats[key] = STAT_DEFINITIONS[key].init();
        }
    });

    return stats;
}

/**
 * 為單一一手牌建立上下文，預先計算常用數據以提高效能
 * @param {object} hand - 單手牌的解析後物件
 * @returns {object} - 手牌上下文
 */
function createHandContext(hand) {
    const heroSeat = hand.hero.seat;
    const heroPos = hand.hero.position;

    // PREFLOP CONTEXT
    const preflopActions = hand.streets.preflop.actions;
    const heroPreflopActions = preflopActions.filter(a => a.seat === heroSeat);
    const lastPreflopRaiser = [...preflopActions].filter(a => a.action === 'raises').pop();
    const preflopAggressorSeat = lastPreflopRaiser ? lastPreflopRaiser.seat : null;
    
    const firstActionIndex = preflopActions.findIndex(a => a.seat === heroSeat);
    const actionsBeforeHero = firstActionIndex > -1 ? preflopActions.slice(0, firstActionIndex) : [];
    
    const raisesBeforeHero = actionsBeforeHero.filter(a => a.action === 'raises');
    // **修正 Squeeze 邏輯**: 正確計算 Hero 前的跟注者
    const callsBeforeHero = actionsBeforeHero.filter(a => a.action === 'calls' && a.seat !== heroSeat);
    
    const facedPreflopRaise = raisesBeforeHero.length > 0;
    const raisesAfterHero = firstActionIndex > -1 && heroPreflopActions.some(a => a.action === 'raises') ? preflopActions.slice(firstActionIndex + 1).filter(a => a.action === 'raises') : [];
    
    // POSTFLOP GENERAL
    const sawFlop = hand.streets.flop.board.length > 0;
    const sawTurn = sawFlop && hand.streets.turn.board.length > 0;
    const sawRiver = sawTurn && hand.streets.river.board.length > 0;
    const reachedShowdown = sawRiver && !hand.streets.river.actions.some(a => a.seat === heroSeat && a.action === 'folds');

    // **修正角色判斷邏輯**
    const isHeroPreflopAggressor = sawFlop && preflopAggressorSeat === heroSeat;
    const heroMadeVPIPAction = heroPreflopActions.some(a => a.action === 'calls' || a.action === 'raises');
    const isHeroPreflopCaller = sawFlop && heroMadeVPIPAction && !isHeroPreflopAggressor;


    // FLOP CONTEXT
    const flopActions = hand.streets.flop.actions;
    const heroFlopActions = flopActions.filter(a => a.seat === heroSeat);
    const aggressorActionOnFlop = flopActions.find(a => a.seat === preflopAggressorSeat);
    const aggressorCBet = !!(isHeroPreflopAggressor === false && aggressorActionOnFlop && aggressorActionOnFlop.action === 'bets');
    const aggressorMissedCBet = !!(isHeroPreflopAggressor === false && aggressorActionOnFlop && aggressorActionOnFlop.action === 'checks');
    const flopCheckedThrough = sawFlop && flopActions.length > 0 && flopActions.every(a => a.action === 'checks');

    // POSITION CONTEXT
    let isHeroInPosition = false;
    if (sawFlop && preflopAggressorSeat && preflopAggressorSeat !== heroSeat) {
        const aggressorActionIndex = flopActions.map(a=>a.seat).indexOf(preflopAggressorSeat);
        const heroActionIndex = flopActions.map(a=>a.seat).indexOf(heroSeat);
        if (aggressorActionIndex > -1 && heroActionIndex > -1) {
            isHeroInPosition = heroActionIndex > aggressorActionIndex;
        } else if (hand.players.length === 2) { 
             isHeroInPosition = hand.hero.position === 'BTN';
        }
    }

    return {
        hand,
        hero: {
            seat: heroSeat,
            position: heroPos,
            result: hand.hero.result,
            isVpipOpportunity: heroPos !== 'BB' || facedPreflopRaise,
            isPreflopAggressor: isHeroPreflopAggressor,
            isPreflopCaller: isHeroPreflopCaller,
        },
        preflop: {
            actions: preflopActions,
            heroActions: heroPreflopActions,
            raisesBeforeHero,
            callsBeforeHero,
            facedRaise: facedPreflopRaise,
            faced3Bet: raisesAfterHero.length > 0
        },
        flop: {
            actions: flopActions,
            heroActions: heroFlopActions,
            aggressorCBet,
            aggressorMissedCBet,
            wasCheckedThrough: flopCheckedThrough,
            isHeroInPosition,
        },
        turn: {
            actions: hand.streets.turn.actions,
            heroActions: hand.streets.turn.actions.filter(a => a.seat === heroSeat)
        },
        river: {
            actions: hand.streets.river.actions,
            heroActions: hand.streets.river.actions.filter(a => a.seat === heroSeat)
        },
        preflopAggressorSeat,
        isHeroWinner: hand.summary.winners.some(w => w.player.includes('Hero')),
        sawFlop,
        sawTurn,
        sawRiver,
        reachedShowdown,
    };
}


/**
 * 核心計算函數
 * @param {object[]} parsedHands - 解析後的手牌陣列
 * @returns {object} - 計算後的統計物件
 */
export function calculateStats(parsedHands) {
    const stats = initStatsObject();
    if (parsedHands.length === 0) return stats;

    const sortedHands = parsedHands.sort((a, b) => new Date(a.info.startTime) - new Date(b.info.startTime));
    stats.rawData = sortedHands;

    let cumulativeProfit = 0;
    let sessionStartTime = null;
    let lastHandTime = null;
    let totalDuration = 0;

    for (const hand of sortedHands) {
        if (!hand.hero || !hand.hero.position || hand.players.length < 2) continue;

        const handStartTime = new Date(hand.info.startTime);
        
        // --- 1. Session 時長計算 ---
        if (!sessionStartTime) {
            sessionStartTime = handStartTime;
        }
        if(lastHandTime){
            const timeDiffMinutes = (handStartTime - lastHandTime) / (1000 * 60);
            if (timeDiffMinutes > SESSION_GAP_MINUTES) {
                totalDuration += (lastHandTime - sessionStartTime) / (1000 * 60);
                sessionStartTime = handStartTime;
            }
        }
        lastHandTime = handStartTime;

        // --- 2. 建立手牌上下文 ---
        const context = createHandContext(hand);
        
        // --- 3. 更新基本和維度數據 ---
        stats.gameTypes.add(hand.info.gameType);
        stats.bbSize = hand.info.bb > 0 ? hand.info.bb : stats.bbSize;

        cumulativeProfit += context.hero.result;
        stats.profitHistory.push({ hand: stats.rawData.indexOf(hand) + 1, profit: cumulativeProfit });

        const dayKey = handStartTime.toISOString().split('T')[0];
        if (!stats.byTime.byDay[dayKey]) stats.byTime.byDay[dayKey] = { hands: 0, profit: 0 };
        stats.byTime.byDay[dayKey].hands++;
        stats.byTime.byDay[dayKey].profit += context.hero.result;
        
        const dayOfWeek = handStartTime.getDay();
        stats.byTime.byDayOfWeek[dayOfWeek].hands++;
        stats.byTime.byDayOfWeek[dayOfWeek].profit += context.hero.result;
        
        const hourOfDay = handStartTime.getHours();
        stats.byTime.byHourOfDay[hourOfDay].hands++;
        stats.byTime.byHourOfDay[hourOfDay].profit += context.hero.result;

        const posCat = getPositionCategory(context.hero.position, hand.players.length);
        const posData = stats.byPosition[posCat];
        if (posData) {
            posData.hands++;
            posData.profit += context.hero.result;
        }

        // --- 4. 遍歷數據定義，執行計算 ---
        for (const key in STAT_DEFINITIONS) {
            const definition = STAT_DEFINITIONS[key];
            if (definition.process) {
                // 更新頂層數據
                definition.process(context, stats[key]);
                // 更新位置數據
                if (posData && posData[key]) {
                    definition.process(context, posData[key]);
                }
            }
        }
    }

    if (sessionStartTime && lastHandTime) {
        totalDuration += (lastHandTime - sessionStartTime) / (1000 * 60);
    }
    stats.actualPlayingDurationMinutes = totalDuration;

    return stats;
}


export function mergeStats(...statsObjects) {
    const mergedRawData = [];
    for (const stats of statsObjects) {
        if (stats && stats.rawData) {
            mergedRawData.push(...stats.rawData);
        }
    }
    // 對合併後的所有 rawData 進行一次完整的重算
    return calculateStats(mergedRawData);
}

export function filterStatsByGameType(stats, gameType) {
    if (gameType === 'All' || !stats.rawData) return finalizeStats(stats);
    const filteredRawData = stats.rawData.filter(hand => hand.info.gameType === gameType);
    const calculated = calculateStats(filteredRawData);
    return finalizeStats(calculated);
}

/**
 * 最終化統計數據，計算百分比和衍生數據
 * @param {object} stats - 計算後的統計物件
 * @returns {object} - 最終用於顯示的統計物件
 */
export function finalizeStats(stats) {
    if (!stats || stats.rawData.length === 0) return initStatsObject();

    const final = JSON.parse(JSON.stringify(stats));
    const toPercent = (a, o) => (o > 0 ? (a / o) * 100 : 0);

    const totalHands = stats.rawData.length;
    final.total_hands = { value: totalHands };

    // --- 計算頂層衍生數據 ---
    for (const key in stats) {
        const stat = stats[key];
        if (stat && typeof stat.opportunities === 'number' && typeof stat.actions === 'number') {
            final[`${key}_p`] = toPercent(stat.actions, stat.opportunities);
        } else if (key.startsWith('afq_')) {
            const totalAgg = stat.bets + stat.raises;
            const totalActions = totalAgg + stat.calls + stat.checks;
            final[`${key}_p`] = toPercent(totalAgg, totalActions);
        }
    }
    final.total_profit_with_rake = { value: final.total_profit.value + final.total_rake.value };
    final.total_jackpot = { value: final.total_jackpot.value };
    final.bb_per_100 = { value: totalHands > 0 ? (final.total_profit.value / stats.bbSize) / (totalHands / 100) : 0 };
    final.bb_with_rake_per_100 = { value: totalHands > 0 ? ((final.total_profit.value+final.total_rake.value) / stats.bbSize) / (totalHands / 100) : 0 };
    final.profit_bb = { value: stats.bbSize > 0 ? (final.total_profit.value / stats.bbSize) : 0 };
    final.profit_with_rake_bb = { value: stats.bbSize > 0 ? ((final.total_profit.value +final.total_rake.value)/ stats.bbSize) : 0 };
    
    const durationInHours = stats.actualPlayingDurationMinutes / 60;
    final.total_duration = { value: stats.actualPlayingDurationMinutes };
    final.hands_per_hour = { value: durationInHours > 0.01 ? totalHands / durationInHours : 0 };
    final.profit_per_hour = { value: durationInHours > 0.01 ? final.total_profit.value / durationInHours : 0 };
    final.profit_with_rake_per_hour = { value: durationInHours > 0.01 ? final.total_profit_with_rake.value / durationInHours : 0 };


    // --- 計算各位置的衍生數據 ---
    Object.keys(final.byPosition).forEach(pos => {
        const pData = stats.byPosition[pos];
        const pFinal = final.byPosition[pos];
        if (pData.hands > 0) {
            for (const key in pData) {
                const stat = pData[key];
                 if (stat && typeof stat.opportunities === 'number' && typeof stat.actions === 'number') {
                    pFinal[`${key}_p`] = toPercent(stat.actions, stat.opportunities);
                }
            }
            pFinal.bb_per_100 = (pData.profit / stats.bbSize) / (pData.hands / 100);
        } else {
             pFinal.bb_per_100 = 0;
        }
    });
    
    // --- 計算時間維度的衍生數據 ---
    final.byTime.byDayOfWeek.forEach((d, i) => {
        const dayData = stats.byTime.byDayOfWeek[i];
        d.bb_per_100 = dayData.hands > 0 ? (dayData.profit / stats.bbSize) / (dayData.hands / 100) : 0;
    });
    final.byTime.byHourOfDay.forEach((h, i) => {
        const hourData = stats.byTime.byHourOfDay[i];
        h.bb_per_100 = hourData.hands > 0 ? (hourData.profit / stats.bbSize) / (hourData.hands / 100) : 0;
    });

    return final;
}

