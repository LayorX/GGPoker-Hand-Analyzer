/**
 * Poker Stats Calculation Module (V7 - Logic Refinement)
 * 負責計算、合併、過濾和最終化撲克統計數據。
 * 本次更新重點：
 * 1. [核心修正] VPIP 邏輯修正，更精確地排除大盲位過牌的非自願情況。
 * 2. [核心修正] WTSD / W$SD 邏輯重構，使其嚴格符合「玩到攤牌」的定義。
 * 3. [核心修正] 總時長計算改為基於 Session 的實際時間差，而非估算。
 * 4. [程式碼優化] 增加註解並微調結構，提高可讀性。
 */
import { getPositionCategory } from '../utils.js';

const SESSION_GAP_MINUTES = 45; // 相鄰牌局超過45分鐘，視為新的 Session

function initStatsObject() {
    const positions = ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    const byPosition = {};
    positions.forEach(p => {
        byPosition[p] = { 
            hands: 0, profit: 0, 
            vpip: { opportunities: 0, actions: 0 }, 
            pfr: { opportunities: 0, actions: 0 },
            '3bet': { opportunities: 0, actions: 0 },
            cbetFlop: { opportunities: 0, actions: 0 },
        };
    });

    return {
        rawData: [],
        gameTypes: new Set(),
        totalHands: 0, totalProfit: 0, totalRake: 0, bbSize: 0.1, totalJackpot: 0,
        actualPlayingDurationMinutes: 0, // **修正**: 實際遊戲時長
        profitHistory: [], byPosition, 
        byTime: { 
            byDay: {},
            byDayOfWeek: Array(7).fill(null).map(() => ({ hands: 0, profit: 0 })), // 0=Sun, 6=Sat
            byHourOfDay: Array(24).fill(null).map(() => ({ hands: 0, profit: 0 }))  // 0-23
        },

        // Pre-flop
        VPIP: { opportunities: 0, actions: 0 }, PFR: { opportunities: 0, actions: 0 },
        '3Bet': { opportunities: 0, actions: 0 }, '4Bet': { opportunities: 0, actions: 0 },
        ColdCall: { opportunities: 0, actions: 0 }, Squeeze: { opportunities: 0, actions: 0 },
        Limp: { opportunities: 0, actions: 0 },
        Steal: { opportunities: 0, actions: 0 }, FoldToSteal: { opportunities: 0, actions: 0 },
        FoldVs3Bet: { opportunities: 0, actions: 0 },

        // Post-flop
        CBetFlop: { opportunities: 0, actions: 0 }, CBetTurn: { opportunities: 0, actions: 0 }, CBetRiver: { opportunities: 0, actions: 0 },
        FoldToCBetFlop: { opportunities: 0, actions: 0 }, FoldToCBetTurn: { opportunities: 0, actions: 0 }, FoldToCBetRiver: { opportunities: 0, actions: 0 },
        CheckRaiseFlop: { opportunities: 0, actions: 0 }, DonkBetFlop: { opportunities: 0, actions: 0 },
        BetVsMissedCBet: { opportunities: 0, actions: 0 }, ProbeBetTurn: { opportunities: 0, actions: 0 },
        FloatBetFlop: { opportunities: 0, actions: 0 },
        
        // Showdown
        WTSD: { opportunities: 0, actions: 0 }, W$SD: { opportunities: 0, actions: 0 }, WWSF: { opportunities: 0, actions: 0 },
        
        // Aggression
        aggression: { flop: {b:0,r:0,c:0,ch:0}, turn: {b:0,r:0,c:0,ch:0}, river: {b:0,r:0,c:0,ch:0} }
    };
}

export function calculateStats(parsedHands) {
    const stats = initStatsObject();
    if (parsedHands.length === 0) return stats;
    
    // 必須先按時間排序，為 session 計算做準備
    const sortedHands = parsedHands.sort((a, b) => new Date(a.info.startTime) - new Date(b.info.startTime));
    stats.rawData = sortedHands;
    
    let cumulativeProfit = 0;
    
    // --- Session-based Duration Calculation ---
    let sessionStartTime = null;
    let lastHandTime = null;
    let totalDuration = 0;

    for (const hand of sortedHands) {
        const handStartTime = new Date(hand.info.startTime);
        if (!sessionStartTime) {
            sessionStartTime = handStartTime;
            lastHandTime = handStartTime;
        }

        const timeDiffMinutes = (handStartTime - lastHandTime) / (1000 * 60);

        if (timeDiffMinutes > SESSION_GAP_MINUTES) {
            // 結束上一個 session，累加時長
            totalDuration += (lastHandTime - sessionStartTime) / (1000 * 60);
            // 開始新 session
            sessionStartTime = handStartTime;
        }
        lastHandTime = handStartTime;

        if (!hand.hero || !hand.hero.position || hand.players.length < 2) continue;

        const heroSeat = hand.hero.seat;
        const heroPos = hand.hero.position;
        const preflopActions = hand.streets.preflop.actions;
        const heroPreflopActions = preflopActions.filter(a => a.seat === heroSeat);

        // --- 基本資訊 ---
        stats.totalHands++;
        stats.gameTypes.add(hand.info.gameType);
        stats.bbSize = hand.info.bb > 0 ? hand.info.bb : stats.bbSize;
        stats.totalProfit += hand.hero.result;
        const isHeroWon = hand.summary.winners.some(w => w.player.includes('Hero'));
        // **修正**: 總抽水和彩金只計算贏的牌局把jackpot也算到抽水裡面
        stats.totalRake += isHeroWon ? hand.info.rake+hand.info.jackpot||0:0;
        stats.totalJackpot += isHeroWon ? hand.info.jackpot||0:0;
        if (hand.hero.result!=0) console.log(hand.info.id,stats.totalProfit,hand.hero.result, stats.totalRake,hand.info.rake, hand.info.jackpot);

        cumulativeProfit += hand.hero.result;
        stats.profitHistory.push({ hand: stats.totalHands, profit: cumulativeProfit });

        // --- 維度數據 ---
        const dayKey = handStartTime.toISOString().split('T')[0];
        if (!stats.byTime.byDay[dayKey]) stats.byTime.byDay[dayKey] = { hands: 0, profit: 0 };
        stats.byTime.byDay[dayKey].hands++;
        stats.byTime.byDay[dayKey].profit += hand.hero.result;

        const dayOfWeek = handStartTime.getDay(); // 0 = Sunday
        stats.byTime.byDayOfWeek[dayOfWeek].hands++;
        stats.byTime.byDayOfWeek[dayOfWeek].profit += hand.hero.result;
        
        const hourOfDay = handStartTime.getHours();
        stats.byTime.byHourOfDay[hourOfDay].hands++;
        stats.byTime.byHourOfDay[hourOfDay].profit += hand.hero.result;
        
        const posCat = getPositionCategory(heroPos, hand.players.length);
        const posData = stats.byPosition[posCat];
        if (posData) {
            posData.hands++;
            posData.profit += hand.hero.result;
        }

        // --- 翻前 Pre-flop ---
        const firstActionIndex = preflopActions.findIndex(a => a.seat === heroSeat);
        const actionsBeforeHero = firstActionIndex > -1 ? preflopActions.slice(0, firstActionIndex) : [];
        const raisesBeforeHero = actionsBeforeHero.filter(a => a.action === 'raises');
        const facedPreflopRaise = raisesBeforeHero.length > 0;
        
        // **[核心修正] VPIP: Voluntarily Put Money In Pot**
        // 機會：只要不是大小盲，就有機會 VPIP。大盲位只有在面對加注時才有機會「自願」投錢。
        const isVpipOpportunity = (heroPos !== 'BB' && heroPos !== 'SB') || (heroPos === 'BB' && facedPreflopRaise) || (heroPos === 'SB' && facedPreflopRaise);
        if (isVpipOpportunity) {
            stats.VPIP.opportunities++;
            if(posData) posData.vpip.opportunities++;
        
            if (heroPreflopActions.some(a => a.action === 'calls' || a.action === 'raises')) {
                stats.VPIP.actions++;
                if(posData) posData.vpip.actions++;
            }
        }
        
        // PFR: Pre-Flop Raise
        // 機會：前面沒有人加注。
        if (!facedPreflopRaise) { 
            stats.PFR.opportunities++;
            if (posData) posData.pfr.opportunities++;
            if (heroPreflopActions.some(a => a.action === 'raises')) {
                stats.PFR.actions++;
                if (posData) posData.pfr.actions++;
            }
        }
        
        // 3-Bet
        // 機會：前面剛好有 1 個玩家加注。
        if (raisesBeforeHero.length === 1) {
            stats['3Bet'].opportunities++;
            if(posData) posData['3bet'].opportunities++;
            if (heroPreflopActions.some(a => a.action === 'raises')) {
                stats['3Bet'].actions++;
                if(posData) posData['3bet'].actions++;
            }
        }
        
        // Fold to Steal
        // 機會：Hero 在盲注位，且面對來自 CO 或 BTN 的唯一加注。
        const lastRaiserInfo = raisesBeforeHero.length === 1 ? hand.playersBySeat[raisesBeforeHero[0].seat] : null;
        if ((heroPos === 'SB' || heroPos === 'BB') && lastRaiserInfo && (lastRaiserInfo.position === 'CO' || lastRaiserInfo.position === 'BTN')) {
            stats.FoldToSteal.opportunities++;
            if (heroPreflopActions.some(a => a.action === 'folds')) {
                stats.FoldToSteal.actions++;
            }
        }

        // --- 翻後 Post-flop ---
        const sawFlop = hand.streets.flop.board.length > 0 && !heroPreflopActions.some(a => a.action === 'folds');
        if (sawFlop) {
            stats.WWSF.opportunities++; // Won When Saw Flop 機會
            if (hand.summary.winners.some(w => w.player.includes('Hero'))) {
                stats.WWSF.actions++;
            }

            const lastPfrSeat = [...preflopActions].filter(a => a.action === 'raises').pop()?.seat;
            const wasPfrAggressor = lastPfrSeat === heroSeat;
            let heroWasAggressorOnPrevStreet = wasPfrAggressor;

            const { flop, turn, river } = hand.streets;
            
            // CBetFlop
            if (wasPfrAggressor) {
                stats.CBetFlop.opportunities++;
                if (posData) posData.cbetFlop.opportunities++;
                if (flop.actions.some(a => a.seat === heroSeat && (a.action === 'bets' || a.action === 'raises'))) {
                    stats.CBetFlop.actions++;
                    if (posData) posData.cbetFlop.actions++;
                } else {
                    heroWasAggressorOnPrevStreet = false;
                }
            }

            // CBetTurn
            const sawTurn = turn.board.length > 0 && !flop.actions.some(a => a.seat === heroSeat && a.action === 'folds');
            if (sawTurn && heroWasAggressorOnPrevStreet) {
                stats.CBetTurn.opportunities++;
                if (turn.actions.some(a => a.seat === heroSeat && (a.action === 'bets' || a.action === 'raises'))) {
                    stats.CBetTurn.actions++;
                } else {
                    heroWasAggressorOnPrevStreet = false;
                }
            }
            
            // CBetRiver
            const sawRiver = river.board.length > 0 && !turn.actions.some(a => a.seat === heroSeat && a.action === 'folds');
            if (sawRiver && heroWasAggressorOnPrevStreet) {
                stats.CBetRiver.opportunities++;
                if (river.actions.some(a => a.seat === heroSeat && (a.action === 'bets' || a.action === 'raises'))) {
                    stats.CBetRiver.actions++;
                }
            }

            // **[核心修正] WTSD (Went To Showdown) & W$SD (Won at Showdown)**
            // 機會：看到翻牌就算一次機會
            stats.WTSD.opportunities++;
            
            // 行動：真正玩到河牌圈結束且未棄牌，就算一次行動 (即真正攤牌了)
            const reachedShowdown = sawRiver && !river.actions.some(a => a.seat === heroSeat && a.action === 'folds');
            if (reachedShowdown) {
                stats.WTSD.actions++;
                // 只有在攤牌時，才有機會贏得攤牌
                stats.W$SD.opportunities++;
                if (hand.summary.winners.some(w => w.player.includes('Hero'))) {
                   stats.W$SD.actions++;
                }
            }
            
            // AFq (Aggression Frequency)
            ['flop', 'turn', 'river'].forEach(s => {
                hand.streets[s].actions.forEach(a => {
                    if (a.seat === heroSeat) {
                        if (a.action === 'bets') stats.aggression[s].b++;
                        if (a.action === 'raises') stats.aggression[s].r++;
                        if (a.action === 'calls') stats.aggression[s].c++;
                        if (a.action === 'checks') stats.aggression[s].ch++;
                    }
                });
            });
        }
    }
    
    // **[核心修正] 加上最後一個 session 的時長**
    if(sessionStartTime && lastHandTime) {
         totalDuration += (lastHandTime - sessionStartTime) / (1000 * 60);
    }
    stats.actualPlayingDurationMinutes = totalDuration;

    return stats;
}

export function mergeStats(...statsObjects) {
    const merged = initStatsObject();
    for (const stats of statsObjects) {
        if (!stats || !stats.totalHands) continue;
        merged.rawData.push(...stats.rawData);
    }
    // 對合併後的所有 rawData 進行一次完整的重算
    return calculateStats(merged.rawData);
}

export function filterStatsByGameType(stats, gameType) {
    if (gameType === 'All' || !stats.rawData) return finalizeStats(stats);
    const filteredRawData = stats.rawData.filter(hand => hand.info.gameType === gameType);
    const calculated = calculateStats(filteredRawData);
    return finalizeStats(calculated);
}

export function finalizeStats(stats) {
    if (!stats || stats.totalHands === 0) return initStatsObject();
    
    // 使用深拷貝，避免修改原始計算後的 stats 物件
    const final = JSON.parse(JSON.stringify(stats)); 
    const toPercent = (a, o) => o > 0 ? ((a / o) * 100) : 0;
    
    // 計算所有 _P (百分比) 數據
    Object.keys(stats).forEach(key => {
        if (typeof stats[key] === 'object' && stats[key] !== null && 'opportunities' in stats[key]) {
            final[`${key}_P`] = toPercent(stats[key].actions, stats[key].opportunities);
        }
    });

    final.bb_per_100 = stats.totalHands > 0 ? (stats.totalProfit / stats.bbSize) / (stats.totalHands / 100) : 0;
    final.profitBB = stats.bbSize > 0 ? (stats.totalProfit / stats.bbSize) : 0;

    const durationInHours = stats.actualPlayingDurationMinutes / 60;
    final.handsPerHour = durationInHours > 0.01 ? (stats.totalHands / durationInHours) : 0;
    final.profitPerHour = durationInHours > 0.01 ? (stats.totalProfit / durationInHours) : 0;
    
    // 計算 AFq 百分比
    ['flop', 'turn', 'river'].forEach(s => {
        const agg = stats.aggression[s];
        const totalAgg = agg.b + agg.r;
        const totalActions = totalAgg + agg.c + agg.ch;
        final[`AFq_${s}`] = toPercent(totalAgg, totalActions);
    });
    
    // 計算各位置的百分比數據
    Object.keys(final.byPosition).forEach(pos => {
        const pData = stats.byPosition[pos];
        const pFinal = final.byPosition[pos];
        
        pFinal.vpip_p = toPercent(pData.vpip.actions, pData.vpip.opportunities);
        pFinal.pfr_p = toPercent(pData.pfr.actions, pData.pfr.opportunities);
        pFinal['3bet_p'] = toPercent(pData['3bet'].actions, pData['3bet'].opportunities);
        pFinal.cbetFlop_p = toPercent(pData.cbetFlop.actions, pData.cbetFlop.opportunities);
        pFinal.bb_per_100 = pData.hands > 0 ? (pData.profit / stats.bbSize) / (pData.hands / 100) : 0;
    });
    
    // 計算時間維度的 bb/100
    final.byTime.byDayOfWeek.forEach((d, i) => {
        const dayData = stats.byTime.byDayOfWeek[i];
        d.bb_per_100 = dayData.hands > 0 ? (dayData.profit / stats.bbSize) / (dayData.hands / 100) : 0;
    });
    final.byTime.byHourOfDay.forEach((h, i) => {
        const hourData = stats.byTime.byHourOfDay[i];
        h.bb_per_100 = hourData.hands > 0 ? (hourData.profit / stats.bbSize) / (hourData.hands / 100) : 0;
    });

    // 將所有數字轉為固定小數點格式，方便顯示
    const formatNumberFields = (obj) => {
        for(const key in obj){
            if (typeof obj[key] === 'number') {
                obj[key] = parseFloat(obj[key].toFixed(2));
            } else if (typeof obj[key] === 'string' && !isNaN(parseFloat(obj[key]))) {
                 obj[key] = parseFloat(parseFloat(obj[key]).toFixed(1));
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                formatNumberFields(obj[key]);
            }
        }
    }
    formatNumberFields(final);


    return final;
}
