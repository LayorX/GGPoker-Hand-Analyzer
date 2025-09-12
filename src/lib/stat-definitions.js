/**
 * @file stat-definitions.js
 * @description 數據統計定義檔
 * * 這個檔案是整個統計系統的核心。它將每一個數據指標（如 VPIP, PFR）
 * 都定義成一個獨立的物件，包含了計算和顯示它所需的所有資訊。
 * 這種模式使得新增、刪除或修改數據指標變得極為簡單，
 * 只需修改此檔案，而無需更動核心的計算引擎 (stats.js)。
 * * 每個數據定義物件包含以下屬性：
 * - nameKey: (string) 用於多國語言翻譯的鍵值 (對應 lang.js)。
 * - tooltipKey: (string) 數據提示的翻譯鍵值。
 * - type: (string) 數據的格式化類型 ('percent', 'money', 'bb', 'int', 'string')。
 * - category: (string) 數據分類，用於在 UI 上分組。
 * - init: (function) 回傳該數據的初始狀態物件，通常是 { opportunities: 0, actions: 0 }。
 * - process: (function) 核心處理函數，接收 (handContext, stat) 兩個參數。
 * - handContext: 預先計算好的單手牌上下文，包含 Hero 資訊、各街道資訊等。
 * - stat: 該數據目前的統計物件。
 * 此函數根據 handContext 的內容來更新 stat 的值。
 */

// --- 輔助函數 ---

/**
 * 檢查 Hero 是否為翻牌前的最後一個加注者 (攻擊者)
 * @param {object} preflopContext - 翻前上下文
 * @param {number} heroSeat - Hero 的座位號
 * @returns {boolean}
 */
const wasHeroPreflopAggressor = (preflopContext, heroSeat) => {
    const lastRaiser = [...preflopContext.actions].filter(a => a.action === 'raises').pop();
    return lastRaiser?.seat === heroSeat;
};

/**
 * 檢查 Hero 是否為翻牌前的跟注者並看到了翻牌
 * @param {object} handContext - 完整的手牌上下文
 * @returns {boolean}
 */
const wasHeroPreflopCaller = (handContext) => {
    return handContext.hero.isPreflopCaller;
};


// --- 數據定義 ---

export const STAT_DEFINITIONS = {
    // --- 核心勝率指標 ---
    total_profit: {
        nameKey: 'total_profit',
        tooltipKey: 'tooltip_total_profit',
        type: 'money',
        category: 'win_rate',
        init: () => ({ value: 0 }),
        process: (handContext, stat) => {
            stat.value += handContext.hero.result;
        }
    },
    bb_per_100: {
        nameKey: 'bb_per_100',
        tooltipKey: 'tooltip_bb_per_100',
        type: 'bb',
        category: 'win_rate',
    },
    profit_bb: {
        nameKey: 'profit_bb',
        tooltipKey: 'tooltip_profit_bb',
        type: 'bb',
        category: 'win_rate',
    },
    total_rake: {
        nameKey: 'total_rake',
        tooltipKey: 'tooltip_total_rake',
        type: 'money',
        category: 'win_rate',
        init: () => ({ value: 0 }),
        process: (handContext, stat) => {
            if (handContext.isHeroWinner) {
                stat.value += (handContext.hand.info.rake || 0) + (handContext.hand.info.jackpot || 0);
            }
        }
    },

    // --- Session 資訊 ---
    total_hands: {
        nameKey: 'total_hands',
        tooltipKey: 'tooltip_total_hands',
        type: 'int',
        category: 'session'
    },
    total_duration: {
        nameKey: 'total_duration',
        tooltipKey: 'tooltip_total_duration',
        type: 'string',
        category: 'session'
    },
    hands_per_hour: {
        nameKey: 'hands_per_hour',
        tooltipKey: 'tooltip_hands_per_hour',
        type: 'int',
        category: 'session'
    },
    profit_per_hour: {
        nameKey: 'profit_per_hour',
        tooltipKey: 'tooltip_profit_per_hour',
        type: 'money',
        category: 'session'
    },

    // --- 翻前 Pre-flop ---
    vpip: {
        nameKey: 'vpip',
        tooltipKey: 'tooltip_vpip',
        type: 'percent',
        category: 'preflop_open',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (handContext.hero.isVpipOpportunity) {
                stat.opportunities++;
                if (handContext.preflop.heroActions.some(a => a.action === 'calls' || a.action === 'raises')) {
                    stat.actions++;
                }
            }
        }
    },
    pfr: {
        nameKey: 'pfr',
        tooltipKey: 'tooltip_pfr',
        type: 'percent',
        category: 'preflop_open',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (!handContext.preflop.facedRaise) {
                stat.opportunities++;
                if (handContext.preflop.heroActions.some(a => a.action === 'raises')) {
                    stat.actions++;
                }
            }
        }
    },
    '3bet': {
        nameKey: '3bet',
        tooltipKey: 'tooltip_3bet',
        type: 'percent',
        category: 'preflop_vs_raise',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (handContext.preflop.raisesBeforeHero.length === 1) {
                stat.opportunities++;
                if (handContext.preflop.heroActions.some(a => a.action === 'raises')) {
                    stat.actions++;
                }
            }
        }
    },
    '4bet': {
        nameKey: '4bet',
        tooltipKey: 'tooltip_4bet',
        type: 'percent',
        category: 'preflop_vs_raise',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
             if (handContext.preflop.raisesBeforeHero.length === 2 || handContext.preflop.faced3Bet) {
                stat.opportunities++;
                if (handContext.preflop.heroActions.some(a => a.action === 'raises')) {
                    stat.actions++;
                }
            }
        }
    },
    fold_vs_3bet: {
        nameKey: 'fold_vs_3bet',
        tooltipKey: 'tooltip_fold_vs_3bet',
        type: 'percent',
        category: 'preflop_vs_raise',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            const { preflop } = handContext;
            if (preflop.heroActions.some(a => a.action === 'raises') && preflop.faced3Bet) {
                stat.opportunities++;
                 if (preflop.heroActions.some(a => a.action === 'folds')) {
                    stat.actions++;
                }
            }
        }
    },
    fold_vs_4bet: {
        nameKey: 'fold_vs_4bet',
        tooltipKey: 'tooltip_fold_vs_4bet',
        type: 'percent',
        category: 'preflop_vs_raise',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            const { preflop, hero } = handContext;
            const hero3Bet = preflop.heroActions.some(a => a.action === 'raises') && preflop.raisesBeforeHero.length === 1;
            if (hero3Bet) {
                 const heroActionIndex = preflop.actions.map(a => a.seat).lastIndexOf(hero.seat);
                 const faced4Bet = preflop.actions.slice(heroActionIndex + 1).some(a => a.action === 'raises');
                if (faced4Bet) {
                     stat.opportunities++;
                     const heroFinalAction = [...preflop.heroActions].pop();
                     if (heroFinalAction && heroFinalAction.action === 'folds') {
                        stat.actions++;
                    }
                }
            }
        }
    },
    cold_call: {
        nameKey: 'cold_call',
        tooltipKey: 'tooltip_cold_call',
        type: 'percent',
        category: 'preflop_vs_raise',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            const { raisesBeforeHero, callsBeforeHero } = handContext.preflop;
            if (raisesBeforeHero.length === 1 && callsBeforeHero.length === 0) {
                stat.opportunities++;
                if (handContext.preflop.heroActions.some(a => a.action === 'calls')) {
                    stat.actions++;
                }
            }
        }
    },
    squeeze: {
        nameKey: 'squeeze',
        tooltipKey: 'tooltip_squeeze',
        type: 'percent',
        category: 'preflop_vs_raise',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            const { raisesBeforeHero, callsBeforeHero } = handContext.preflop;
            if (raisesBeforeHero.length === 1 && callsBeforeHero.length > 0) {
                stat.opportunities++;
                 if (handContext.preflop.heroActions.some(a => a.action === 'raises')) {
                    stat.actions++;
                }
            }
        }
    },
    limp: {
        nameKey: 'limp',
        tooltipKey: 'tooltip_limp',
        type: 'percent',
        category: 'preflop_open',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (!handContext.preflop.facedRaise) {
                stat.opportunities++;
                if (handContext.preflop.heroActions.some(a => a.action === 'calls')) {
                    stat.actions++;
                }
            }
        }
    },
    steal_attempt: {
        nameKey: 'steal_attempt',
        tooltipKey: 'tooltip_steal_attempt',
        type: 'percent',
        category: 'steal_dynamics',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            const { hero, preflop } = handContext;
            if (['CO', 'BTN'].includes(hero.position) && !preflop.facedRaise) {
                stat.opportunities++;
                if (preflop.heroActions.some(a => a.action === 'raises')) {
                    stat.actions++;
                }
            }
        }
    },
    fold_to_steal: {
        nameKey: 'fold_to_steal',
        tooltipKey: 'tooltip_fold_to_steal',
        type: 'percent',
        category: 'steal_dynamics',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            const { hero, preflop, hand } = handContext;
            const lastRaiser = preflop.raisesBeforeHero.length === 1 ? preflop.raisesBeforeHero[0] : null;
            if (lastRaiser && ['SB', 'BB'].includes(hero.position)) {
                const raiserInfo = hand.playersBySeat[lastRaiser.seat];
                if (raiserInfo && ['CO', 'BTN'].includes(raiserInfo.position)) {
                    stat.opportunities++;
                    if (preflop.heroActions.some(a => a.action === 'folds')) {
                        stat.actions++;
                    }
                }
            }
        }
    },

    // --- 翻後 Post-flop ---
    cbet_flop: {
        nameKey: 'cbet_flop',
        tooltipKey: 'tooltip_cbet_flop',
        type: 'percent',
        category: 'postflop_aggressor',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (handContext.hero.isPreflopAggressor) {
                stat.opportunities++;
                if (handContext.flop.heroActions.some(a => a.action === 'bets')) {
                    stat.actions++;
                }
            }
        }
    },
    cbet_turn: {
        nameKey: 'cbet_turn',
        tooltipKey: 'tooltip_cbet_turn',
        type: 'percent',
        category: 'postflop_aggressor',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            const { hero, turn } = handContext;
            const wasFlopCbetter = handContext.flop.heroActions.some(a => a.action === 'bets');
            if (handContext.sawTurn && hero.isPreflopAggressor && wasFlopCbetter) {
                stat.opportunities++;
                if (turn.heroActions.some(a => a.action === 'bets')) {
                    stat.actions++;
                }
            }
        }
    },
    cbet_river: {
        nameKey: 'cbet_river',
        tooltipKey: 'tooltip_cbet_river',
        type: 'percent',
        category: 'postflop_aggressor',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            const { hero, turn, river } = handContext;
            const wasFlopCbetter = handContext.flop.heroActions.some(a => a.action === 'bets');
            const wasTurnCbetter = turn.heroActions.some(a => a.action === 'bets');
            if (handContext.sawRiver && hero.isPreflopAggressor && wasFlopCbetter && wasTurnCbetter) {
                stat.opportunities++;
                if (river.heroActions.some(a => a.action === 'bets')) {
                    stat.actions++;
                }
            }
        }
    },
    fold_to_cbet_flop: {
        nameKey: 'fold_to_cbet_flop',
        tooltipKey: 'tooltip_fold_to_cbet_flop',
        type: 'percent',
        category: 'postflop_caller',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (wasHeroPreflopCaller(handContext) && handContext.flop.aggressorCBet) {
                stat.opportunities++;
                if (handContext.flop.heroActions.some(a => a.action === 'folds')) {
                    stat.actions++;
                }
            }
        }
    },
    raise_cbet_flop: {
        nameKey: 'raise_cbet_flop',
        tooltipKey: 'tooltip_raise_cbet_flop',
        type: 'percent',
        category: 'postflop_caller',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (wasHeroPreflopCaller(handContext) && handContext.flop.aggressorCBet) {
                stat.opportunities++;
                if (handContext.flop.heroActions.some(a => a.action === 'raises')) {
                    stat.actions++;
                }
            }
        }
    },
    check_raise_flop: {
        nameKey: 'check_raise_flop',
        tooltipKey: 'tooltip_check_raise_flop',
        type: 'percent',
        category: 'postflop_caller',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (!wasHeroPreflopCaller(handContext) || handContext.flop.isHeroInPosition) return;
            const heroChecked = handContext.flop.heroActions.some(a => a.action === 'checks');
            if (heroChecked && handContext.flop.aggressorCBet) {
                 stat.opportunities++;
                if (handContext.flop.heroActions.some(a => a.action === 'raises')) {
                    stat.actions++;
                }
            }
        }
    },
    donk_bet_flop: {
        nameKey: 'donk_bet_flop',
        tooltipKey: 'tooltip_donk_bet_flop',
        type: 'percent',
        category: 'postflop_caller',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (wasHeroPreflopCaller(handContext) && !handContext.flop.isHeroInPosition) {
                stat.opportunities++;
                if (handContext.flop.heroActions.some(a => a.action === 'bets')) {
                    stat.actions++;
                }
            }
        }
    },
    bet_vs_missed_cbet: {
        nameKey: 'bet_vs_missed_cbet',
        tooltipKey: 'tooltip_bet_vs_missed_cbet',
        type: 'percent',
        category: 'postflop_caller',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (wasHeroPreflopCaller(handContext) && handContext.flop.aggressorMissedCBet) {
                stat.opportunities++;
                if (handContext.flop.heroActions.some(a => a.action === 'bets')) {
                    stat.actions++;
                }
            }
        }
    },
    probe_bet_turn: {
        nameKey: 'probe_bet_turn',
        tooltipKey: 'tooltip_probe_bet_turn',
        type: 'percent',
        category: 'postflop_caller',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (wasHeroPreflopCaller(handContext) && handContext.sawTurn && handContext.flop.wasCheckedThrough) {
                stat.opportunities++;
                if (handContext.turn.heroActions.some(a => a.action === 'bets')) {
                    stat.actions++;
                }
            }
        }
    },
    
    // --- 攤牌 Showdown ---
    wtsd: {
        nameKey: 'wtsd',
        tooltipKey: 'tooltip_wtsd',
        type: 'percent',
        category: 'showdown',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (handContext.sawFlop) {
                stat.opportunities++;
                if (handContext.reachedShowdown) {
                    stat.actions++;
                }
            }
        }
    },
    wtsd_won: {
        nameKey: 'wtsd_won',
        tooltipKey: 'tooltip_wtsd_won',
        type: 'percent',
        category: 'showdown',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (handContext.reachedShowdown) {
                stat.opportunities++;
                if (handContext.isHeroWinner) {
                    stat.actions++;
                }
            }
        }
    },
    wwsf: {
        nameKey: 'wwsf',
        tooltipKey: 'tooltip_wwsf',
        type: 'percent',
        category: 'showdown',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (handContext.sawFlop) {
                stat.opportunities++;
                if (handContext.isHeroWinner) {
                    stat.actions++;
                }
            }
        }
    },
    wtsd_after_cbet: {
        nameKey: 'wtsd_after_cbet',
        tooltipKey: 'tooltip_wtsd_after_cbet',
        type: 'percent',
        category: 'showdown',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (handContext.hero.isPreflopAggressor && handContext.flop.heroActions.some(a => a.action === 'bets')) {
                stat.opportunities++;
                if (handContext.reachedShowdown) {
                    stat.actions++;
                }
            }
        }
    },
    wwsf_as_pfr: {
        nameKey: 'wwsf_as_pfr',
        tooltipKey: 'tooltip_wwsf_as_pfr',
        type: 'percent',
        category: 'showdown',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (handContext.hero.isPreflopAggressor) {
                stat.opportunities++;
                if (handContext.isHeroWinner) {
                    stat.actions++;
                }
            }
        }
    },
    wwsf_as_caller: {
        nameKey: 'wwsf_as_caller',
        tooltipKey: 'tooltip_wwsf_as_caller',
        type: 'percent',
        category: 'showdown',
        init: () => ({ opportunities: 0, actions: 0 }),
        process: (handContext, stat) => {
            if (wasHeroPreflopCaller(handContext)) {
                stat.opportunities++;
                if (handContext.isHeroWinner) {
                    stat.actions++;
                }
            }
        }
    },

    // --- 攻擊性 Aggression ---
    afq_flop: {
        nameKey: 'afq_flop',
        tooltipKey: 'tooltip_afq_flop',
        type: 'percent',
        category: 'showdown',
        init: () => ({ bets: 0, raises: 0, calls: 0, checks: 0 }),
        process: (handContext, stat) => {
            handContext.flop.heroActions.forEach(a => {
                if (a.action === 'bets') stat.bets++;
                if (a.action === 'raises') stat.raises++;
                if (a.action === 'calls') stat.calls++;
                if (a.action === 'checks') stat.checks++;
            });
        }
    },
    afq_turn: {
        nameKey: 'afq_turn',
        tooltipKey: 'tooltip_afq_turn',
        type: 'percent',
        category: 'showdown',
        init: () => ({ bets: 0, raises: 0, calls: 0, checks: 0 }),
        process: (handContext, stat) => {
            handContext.turn.heroActions.forEach(a => {
                if (a.action === 'bets') stat.bets++;
                if (a.action === 'raises') stat.raises++;
                if (a.action === 'calls') stat.calls++;
                if (a.action === 'checks') stat.checks++;
            });
        }
    },
    afq_river: {
        nameKey: 'afq_river',
        tooltipKey: 'tooltip_afq_river',
        type: 'percent',
        category: 'showdown',
        init: () => ({ bets: 0, raises: 0, calls: 0, checks: 0 }),
        process: (handContext, stat) => {
            handContext.river.heroActions.forEach(a => {
                if (a.action === 'bets') stat.bets++;
                if (a.action === 'raises') stat.raises++;
                if (a.action === 'calls') stat.calls++;
                if (a.action === 'checks') stat.checks++;
            });
        }
    }
};
