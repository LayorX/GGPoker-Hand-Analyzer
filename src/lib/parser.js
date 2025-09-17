import { POSITIONS_PERMUTATIONS } from '../config.js';
/**
 * 定義不同玩家人數下的撲克位置
 * Provides position names for various table sizes.
 */


/**
 * 解析撲克牌譜歷史文件
 * @param {string[]} filesContent - 包含多個牌譜文件內容的字串陣列
 * @returns {object[]} - 解析後的牌局資料陣列
 */
export function parseHandHistories(filesContent) {
    const allHands = [];
    const content = filesContent.join('\n\n\n');
    // 分割符更穩健，可以處理文件開頭沒有分隔符的情況
    const handChunks = content.split('Poker Hand #').slice(1);

    for (const chunk of handChunks) {
        const handText = `Poker Hand #${chunk}`;
        try {
            // 只解析包含 Hero 的牌局，提高效率
            if (!handText.includes('Dealt to Hero')) continue;
            const hand = parseSingleHand(handText);
            if (hand) {
                allHands.push(hand);
            }
        } catch (e) {
            console.error('解析一手牌時發生嚴重錯誤:', e, `\n問題牌譜:\n${handText.substring(0, 300)}...`);
        }
    }
    return allHands;

}

/**
 * 解析單一一手牌的文本
 * @param {string} handText - 單手牌的完整文本
 * @returns {object|null} - 解析後的手牌物件，如果無效則返回 null
 */
function parseSingleHand(handText) {
    const lines = handText.split('\n').filter(line => line.trim() !== '');

    // --- 1. 初始化一個擴展性更強的數據結構 ---
    const hand = {
        rawText: handText,
        info: {
            id: null,
            gameType: 'Hold\'em', // 預設為德州撲克
            limitType: 'No Limit',
            startTime: null,
            sb: 0,
            bb: 0,
            totalPot: 0,
            rake: 0,
            jackpot:0,
        },
        hero: {
            seat: null,
            cards: [],
            initialStack: 0,
            position: null,
            result: 0,
            uncalledBetReturned: 0,
        },
        players: [], // 儲存所有玩家的詳細資訊
        playersBySeat: {}, // 方便通過座位號快速查找 O(1)
        playersByName: {}, // **新增**: 方便通過玩家名稱快速查找 O(1)
        buttonSeat: null,
        streets: { // 按街道劃分行動和公共牌
            preflop: { actions: [], board: [] },
            flop: { actions: [], board: [] },
            turn: { actions: [], board: [] },
            river: { actions: [], board: [] },
        },
        summary: {
            winners: [],
        },
        preflopRaiserSeat: null, // 首位加注者 (PFR) 的座位
    };

    // --- 2. 統一定義所有正則表達式 (優化版本) ---
    const regex = {
        header: /^Poker Hand #(\w+): (Hold'em|Omaha) (No Limit|Pot Limit) \(\$([\d.]+)\/\$([\d.]+)\) - (\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/,
        seatInfo: /^Seat (\d+): (.+?) \(\$([\d.]+) in chips\)/,
        button: /^Table '.+' \d+-max Seat #(\d+) is the button/,
        heroCards: /^Dealt to Hero \[(.+)]/,
        postBlind: /^(.+?): posts (small|big) blind \$([\d.]+)/,
        action: /^(.+?): (folds|checks|bets|calls|raises) ?\$?([\d.]*)?(?: to \$?([\d.]*))?( and is all-in)?/,
        uncalledBet: /^Uncalled bet \(\$([\d.]+)\) returned to Hero/,
        board: /^\*\*\* (FLOP|TURN|RIVER) \*\*\* \[(.+)]/,
        totalPot: /^Total pot \$([\d.]+) \| Rake \$([\d.]+) \| Jackpot \$([\d.]+)?/,
        winner: /^Seat \d+: (.+?) (won|collected) \(\$([\d.]+)\)/,
    };

    let currentStreet = 'preflop';
    let parsingStage = 'setup'; // 'setup', 'actions', 'summary'
    let isBigBlindPosted = false;
    let isSmallBlindPosted = false;
    // --- 3. 逐行解析 ---
    for (const line of lines) {


        // 解析標題行
        const headerMatch = line.match(regex.header);
        if (headerMatch) {
            hand.info.id = headerMatch[1];
            hand.info.gameType = headerMatch[2];
            hand.info.limitType = headerMatch[3];
            hand.info.sb = parseFloat(headerMatch[4]);
            hand.info.bb = parseFloat(headerMatch[5]);
            hand.info.startTime = new Date(headerMatch[6]);
            continue;
        }

        // 解析按鈕位
        const buttonMatch = line.match(regex.button);
        if (buttonMatch) {
            hand.buttonSeat = parseInt(buttonMatch[1]);
            continue;
        }

        // 解析玩家座位資訊
        const seatMatch = line.match(regex.seatInfo);
        if (seatMatch && parsingStage === 'setup') {
            const player = {
                seat: parseInt(seatMatch[1]),
                playerName: seatMatch[2],
                initialStack: parseFloat(seatMatch[3]),
                isHero: seatMatch[2].includes('Hero'),
                position: null,
            };
            hand.players.push(player);
            hand.playersBySeat[player.seat] = player;
            hand.playersByName[player.playerName] = player; // **優化**: 同時填充名稱查找對象
            if (player.isHero) {
                hand.hero.seat = player.seat;
                hand.hero.initialStack = player.initialStack;
            }
            continue;
        }

        // 狀態轉換
        if (line.startsWith('*** HOLE CARDS ***')) {
            parsingStage = 'actions';
            calculatePositions(hand);
            continue;
        } else if (line.startsWith('*** SUMMARY ***')) {
            parsingStage = 'summary';
            
            continue;
        }
        // --- 根據不同階段解析 ---
        if (parsingStage === 'actions') {
            const heroCardsMatch = line.match(regex.heroCards);
            if (heroCardsMatch) {
                hand.hero.cards = heroCardsMatch[1].split(' ');
                continue;
            }
            const actionMatch = line.match(regex.action);
            if (actionMatch) {
                const playerName = actionMatch[1];
                const player = hand.playersByName[playerName]; // **優化**: O(1) 查找
                if (player) {
                    let action = {
                        seat: player.seat,
                        player: playerName,
                        action: actionMatch[2],
                        bet: actionMatch[3] ? parseFloat(actionMatch[3]) : 0,
                        amount: actionMatch[4] ? parseFloat(actionMatch[4]) : parseFloat(actionMatch[3]) || 0,
                        isAllIn: !!actionMatch[5]
                    };
                    // 呼叫獨立的函數來處理前翻牌圈的特殊情況
                    if (currentStreet === "preflop") {
                        const blindUpdates = handlePreflopBlinds(action, player, hand.info, action.action, isSmallBlindPosted, isBigBlindPosted);
                        action = blindUpdates.updatedAction;
                        isSmallBlindPosted = blindUpdates.updatedIsSmallBlindPosted;
                        isBigBlindPosted = blindUpdates.updatedIsBigBlindPosted;
                    }
                    hand.streets[currentStreet].actions.push(action);

                    if (currentStreet === 'preflop' && action.action === 'raises' && !hand.preflopRaiserSeat) {
                        hand.preflopRaiserSeat = player.seat;
                    }
                }
                continue;
            }
            
            const uncalledBetMatch = line.match(regex.uncalledBet);
            if (uncalledBetMatch) {
                hand.hero.uncalledBetReturned = parseFloat(uncalledBetMatch[1]);
                continue;
            }

            const boardMatch = line.match(regex.board);
            if (boardMatch) {
                currentStreet = boardMatch[1].toLowerCase();
                hand.streets[currentStreet].board = boardMatch[2].split(' ');
                continue;
            }
        } else if (parsingStage === 'summary') {
            const potMatch = line.match(regex.totalPot);
            if (potMatch) {
                hand.info.totalPot = parseFloat(potMatch[1]);
                hand.info.rake = parseFloat(potMatch[2]);
                hand.info.jackpot = potMatch[3] ? parseFloat(potMatch[3]) : 0;
                if (!isBigBlindPosted && hand.info.totalPot === hand.info.sb*2) {
                    // 其他人都folds到大盲，直接收pot
                    if (hand.players.length>1&& !isBigBlindPosted) {
                        for (const player of hand.players) {
                            if (player.position === "BB" ) {
                                isBigBlindPosted = true;
                                const action = {
                                    seat: player.seat,
                                    player: player.playerName,
                                    action: "checks",
                                    bet: 0,
                                    amount: hand.info.bb
                                };
                                hand.streets['preflop'].actions.push(action);
                            }
                        }
                    }
                }
                continue;
            }

            const winnerMatch = line.match(regex.winner);
            if (winnerMatch) {
                hand.summary.winners.push({
                    player: winnerMatch[1],
                    amount: parseFloat(winnerMatch[3]),
                });
            }
                    
        }
    }

    
    // --- 4. 進行最終計算 ---
    calculateHeroResult(hand);
    return hand;
}

/**
 * 根據預先定義的表格計算所有玩家的位置
 * @param {object} hand - 正在處理的手牌物件
 */
function calculatePositions(hand) {
    if (!hand.buttonSeat || hand.players.length === 0) return;

    const tableSize = hand.players.length;
    const sortedPlayers = [...hand.players].sort((a, b) => a.seat - b.seat);
    // 根據桌子大小和發牌員座位號碼直接查找正確的排列
    const positions = POSITIONS_PERMUTATIONS[tableSize][hand.buttonSeat];
    // 如果找不到，則返回
    if (!positions) return;

    sortedPlayers.forEach((player, i) => {
        player.position = positions[i];
        if (player.isHero) {
            hand.hero.position = positions[i];
        }
    });
}

/**
 * **重構**: 計算 Hero 的最終淨輸贏 (採用更精確的累積計算邏輯)
 * @param {object} hand - 正在處理的手牌物件
 */
function calculateHeroResult(hand) {
    let totalInvestment = 0;
    const heroSeat = hand.hero.seat;
    let streetContribution;
    // 遍歷所有街道和所有行動，累加 Hero 的總投入
    for (const streetName of ['preflop', 'flop', 'turn', 'river']) {
        streetContribution = 0;
        const heroActions = hand.streets[streetName].actions.filter(
            a => a.seat === heroSeat
        );

        for (const action of heroActions) {
            if (action.action === 'raises') {
                streetContribution = action.amount;
            } else {
                streetContribution += action.amount;
            }
        }
        totalInvestment += streetContribution;
    }

    const heroWonAmount = hand.summary.winners
        .filter(w => w.player.includes('Hero'))
        .reduce((sum, w) => sum + w.amount, 0);
    // **修正**: 最終結果 = (贏得的 + 返還的) - 總投入
    const totalReturned = heroWonAmount + hand.hero.uncalledBetReturned;
    hand.hero.result = totalReturned - totalInvestment;
}



/**
 * 處理前翻牌圈 (preflop) 的盲注相關邏輯。
 * 這個函數會根據玩家位置和行動，更新行動物件的金額。
 * @param {object} action - 待更新的行動物件。
 * @param {object} player - 玩家物件。
 * @param {object} handInfo - 手牌資訊，包含 sb 和 bb 金額。
 * @param {string} actionType - 玩家的行動類型 (e.g., "checks", "calls", "folds")。
 * @param {boolean} isSmallBlindPosted - 小盲注是否已下注。
 * @param {boolean} isBigBlindPosted - 大盲注是否已下注。
 * @returns {object} - 返回更新後的行動物件和盲注標誌。
 */
function handlePreflopBlinds(action, player, handInfo, actionType, isSmallBlindPosted, isBigBlindPosted) {
    if (actionType === 'raises') {
        if (player.position === "SB" && !isSmallBlindPosted) {
            isSmallBlindPosted = true;
        }
        if (player.position === "BB" && !isBigBlindPosted) {
            isBigBlindPosted = true;
        }

    }
    // 處理大盲注玩家的過牌 (check)
    if (actionType === "checks" && player.position === "BB") {
        // 大盲注玩家在過牌時，若金額為 0，則加上大盲注的金額
        action.amount += action.amount === 0 ? handInfo.bb : 0;
    }

    // 處理小盲注或大盲注玩家的平注 (calls) 或蓋牌 (folds)
    if (actionType === "calls" || actionType === "folds") {
        // 若是小盲注玩家且小盲注尚未下注
        if (player.position === "SB" && !isSmallBlindPosted) {
            action.amount += handInfo.sb;
            isSmallBlindPosted = true;
        }
        // 若是大盲注玩家且大盲注尚未下注
        if (player.position === "BB" && !isBigBlindPosted) {
            action.amount += handInfo.bb;
            isBigBlindPosted = true;
        }
    }

    return { updatedAction: action, updatedIsSmallBlindPosted: isSmallBlindPosted, updatedIsBigBlindPosted: isBigBlindPosted };
}
