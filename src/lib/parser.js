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
        totalPot: /^Total pot \$([\d.]+) \| Rake \$([\d.]+)(?: | \| Jackpot \$([\d.]+))?/,
        winner: /^Seat \d+: (.+?) (won|collected) \(\$([\d.]+)\)/,
    };

    let currentStreet = 'preflop';
    let parsingStage = 'setup'; // 'setup', 'actions', 'summary'

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
                    if (currentStreet === "preflop" && (actionMatch[2] === "checks" || actionMatch[2] === "calls")) {
                        // 把大小忙計算進去
                        if (player.position === "SB") action.amount += hand.info.sb
                        if (player.position === "BB") action.amount += hand.info.bb
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
                // Jackpot amount is optional, and the regex needs to handle this.
                // The third capture group is for Jackpot
                hand.info.jackpot = potMatch[3] ? parseFloat(potMatch[3]) : 0;
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

    // 遍歷所有街道和所有行動，累加 Hero 的總投入
    for (const streetName of ['preflop', 'flop', 'turn', 'river']) {
        const heroActions = hand.streets[streetName].actions.filter(
            a => a.seat === heroSeat
        );

        for (const action of heroActions) {
            if (['checks', 'bets', 'calls', 'raises'].includes(action.action)) {
                totalInvestment += action.amount;
            }
        }
    }

    const heroWonAmount = hand.summary.winners
        .filter(w => w.player.includes('Hero'))
        .reduce((sum, w) => sum + w.amount, 0);
    // **修正**: 最終結果 = (贏得的 + 返還的) - 總投入
    const totalReturned = heroWonAmount + hand.hero.uncalledBetReturned;
    hand.hero.result = totalReturned - totalInvestment;
}

