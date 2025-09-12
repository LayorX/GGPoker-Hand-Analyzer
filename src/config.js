
/* * Poker Position Permutations
 * Defines position names based on table size and button position.
 * This is a crucial configuration for correctly assigning player positions.
 * The structure is: [tableSize][buttonSeatIndex_in_sorted_seats] -> positionName array
 * Example: For a 6-max table, the positions relative to the button are always BTN, SB, BB, EP, MP, CO.
 * We rotate this array based on the button's actual seat position.
 *
 * 撲克位置排列
 * 根據牌桌人數和按鈕位置定義位置名稱。
 * 這是正確分配玩家位置的關鍵設定。
 */

export const POSITIONS_PERMUTATIONS = {
    // 2人桌 (Heads-up)
    2: {
        1: ['BTN', 'BB'],
        2: ['BB', 'BTN'],
    },
    // 3人桌
    3: {
        1: ['BTN', 'BB', 'UTG'],
        2: ['UTG', 'BTN', 'BB'],
        3: ['BB', 'UTG', 'BTN'],
    },
    // 4人桌
    4: {
        1: ['BTN', 'BB', 'UTG', 'CO'],
        2: ['CO', 'BTN', 'BB', 'UTG'],
        3: ['UTG', 'CO', 'BTN', 'BB'],
        4: ['BB', 'UTG', 'CO', 'BTN'],
    },
    // 5人桌
    5: {
        1: ['BTN', 'BB', 'UTG', 'MP', 'CO'],
        2: ['CO', 'BTN', 'BB', 'UTG', 'MP'],
        3: ['MP', 'CO', 'BTN', 'BB', 'UTG'],
        4: ['UTG', 'MP', 'CO', 'BTN', 'BB'],
        5: ['BB', 'UTG', 'MP', 'CO', 'BTN'],
    },
    // 6人桌
    6: {
        1: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'],
        2: ['CO', 'BTN', 'SB', 'BB', 'UTG', 'MP'],
        3: ['MP', 'CO', 'BTN', 'SB', 'BB', 'UTG'],
        4: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
        5: ['BB', 'UTG', 'MP', 'CO', 'BTN', 'SB'],
        6: ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'],
    },
    // 7人桌
    7: {
        1: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'],
        2: ['CO', 'BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ'],
        3: ['HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG', 'MP'],
        4: ['MP', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG'],
        5: ['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
        6: ['BB', 'UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB'],
        7: ['SB', 'BB', 'UTG', 'MP', 'HJ', 'CO', 'BTN'],
    },
    // 8人桌
    8: {
        1: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'],
        2: ['CO', 'BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ'],
        3: ['HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP'],
        4: ['MP', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG', 'UTG+1'],
        5: ['UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG'],
        6: ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
        7: ['BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB'],
        8: ['SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN'],
    },
    // 9人桌
    9: {
        1: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'],
        2: ['CO', 'BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ'],
        3: ['HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ'],
        4: ['LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP'],
        5: ['MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG', 'UTG+1'],
        6: ['UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG'],
        7: ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
        8: ['BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB'],
        9: ['SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN'],
    },
};