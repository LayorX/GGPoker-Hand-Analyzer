/**
 * 根據位置名稱和玩家數量，返回位置的分類。
 * EP (Early Position), MP (Middle Position), CO (Cutoff), BTN (Button), SB (Small Blind), BB (Big Blind)
 * @param {string} position - 'UTG', 'MP', 'CO', 'BTN', 'SB', 'BB' etc.
 * @param {number} playerCount - 牌桌上的玩家數量
 * @returns {string} - 分類後的位置
 */
export function getPositionCategory(position, playerCount) {
    if (position === 'SB' || position === 'BB' || position === 'BTN' || position === 'CO') {
        return position;
    }
    
    // 6-max positions: UTG(EP), MP, CO, BTN, SB, BB
    if (playerCount >= 6) {
        if (position === 'UTG') return 'EP';
        if (position === 'MP') return 'MP';
    }
    // 5-max positions: UTG(EP), CO, BTN, SB, BB
    if (playerCount === 5) {
        if (position === 'UTG') return 'EP';
    }
    // For heads-up or small tables, specific positions are already handled.
    // Fallback for other cases.
    return position;
}

/**
 * 下載 JSON 物件為檔案。
 * @param {object} objectData - 要下載的 JSON 物件。
 * @param {string} filename - 下載的檔案名稱。
 */
export function downloadJson(objectData, filename) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(objectData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

