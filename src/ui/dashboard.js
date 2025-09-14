/**
 * @file dashboard.js (Refactored & Merged)
 * @description 儀表板渲染模組
 *
 * 這個重構後的版本將 UI 佈局與渲染邏輯分離，並整合了所有 UI 相關的功能。
 * 核心變化：
 * 1. 引入 `UI_CONFIG` 物件：此物件以配置的形式定義了每個分頁的結構。
 * 2. 數據驅動的渲染函數：`renderTab` 函數會讀取 `UI_CONFIG` 來動態生成 UI。
 * 3. 整合 `renderRecommendations` 和 `renderAboutTab`：所有分頁的渲染邏輯
 * 現在都集中在此檔案中，使其成為一個完整的視圖 (View) 層。
 *
 * 優點：
 * - 靈活性高: 調整儀表板佈局只需修改 `UI_CONFIG`。
 * - 程式碼簡潔: 消除重複的渲染程式碼，提高可維護性。
 * - 職責單一: 此檔案專注於所有和 DOM 渲染相關的任務。
 */
import { getLang, updateUIText } from './lang.js';
import { STAT_DEFINITIONS } from '../lib/stat-definitions.js';

const chartInstances = {};

// --- UI 組態設定 ---
const UI_CONFIG = {
    overview: {
        sections: [
            { titleKey: 'win_rate_stats', grid: 'grid-cols-2 md:grid-cols-4', statIds: ['total_profit', 'bb_per_100', 'profit_bb', 'total_rake',
                                                                                        'total_profit_with_rake','bb_with_rake_per_100','profit_with_rake_bb','total_jackpot'] },
            { titleKey: 'session_info', grid: 'grid-cols-2 md:grid-cols-4', statIds: ['total_hands', 'total_duration', 'hands_per_hour', 'profit_per_hour','profit_with_rake_per_hour'] },
            { titleKey: 'preflop_style', grid: 'grid-cols-2 md:grid-cols-4', statIds: ['vpip', 'pfr', '3bet', 'steal_attempt'] },
            { titleKey: 'postflop_play', grid: 'grid-cols-2 md:grid-cols-4', statIds: ['cbet_flop', 'wtsd', 'wtsd_won', 'afq_flop'] },
        ],
        charts: [
            { id: 'profitChart', titleKey: 'profit_chart_title', grid: 'xl:col-span-1' },
            { id: 'playerStyleRadarChart', titleKey: 'player_style_radar', grid: 'xl:col-span-1' }
        ]
    },
    preflop: {
        sections: [
            { titleKey: 'preflop_open', grid: 'grid-cols-3', statIds: ['vpip', 'pfr', 'limp'] },
            { titleKey: 'preflop_vs_raise', grid: 'grid-cols-3 md:grid-cols-4', statIds: ['3bet', '4bet', 'fold_vs_3bet', 'fold_vs_4bet', 'squeeze', 'cold_call'] },
            { titleKey: 'steal_dynamics', grid: 'grid-cols-2', statIds: ['steal_attempt', 'fold_to_steal'] },
        ]
    },
    postflop: {
        sections: [
            { titleKey: 'postflop_as_aggressor', grid: 'grid-cols-3', statIds: ['cbet_flop', 'cbet_turn', 'cbet_river'] },
            { titleKey: 'postflop_as_caller', grid: 'grid-cols-3 md:grid-cols-4', statIds: ['fold_to_cbet_flop', 'raise_cbet_flop', 'check_raise_flop', 'donk_bet_flop', 'bet_vs_missed_cbet', 'probe_bet_turn'] },
            { titleKey: 'showdown_stats', grid: 'grid-cols-3 md:grid-cols-5', statIds: ['wtsd', 'wtsd_won', 'wwsf', 'wtsd_after_cbet', 'wwsf_as_pfr', 'wwsf_as_caller'] },
            { titleKey: 'aggression_stats', grid: 'grid-cols-3', statIds: ['afq_flop', 'afq_turn', 'afq_river'] },
        ]
    },
    position: {
        charts: [
            { id: 'positionProfitChart', titleKey: 'positional_profit', grid: 'xl:col-span-1' },
            { id: 'positionStyleChart', titleKey: 'positional_style', grid: 'xl:col-span-1' }
        ],
        sections: [
             { titleKey: 'positional_aggression', grid: 'grid-cols-3 md:grid-cols-6', statIds: ['pos_ep_3bet', 'pos_mp_3bet', 'pos_co_3bet', 'pos_btn_3bet', 'pos_sb_3bet', 'pos_bb_3bet'] }
        ]
    },
    time: {
        charts: [
            { id: 'winrateByWeekdayChart', titleKey: 'winrate_by_weekday', grid: 'xl:col-span-1' },
            { id: 'winrateByHourChart', titleKey: 'winrate_by_hour', grid: 'xl:col-span-1' }
        ]
    },
};


// --- 通用輔助函數 ---

function showTooltip(titleKey, textKey) {
    const tooltipModal = document.getElementById('tooltip-modal');
    const tooltipModalTitle = document.getElementById('tooltip-modal-title');
    const tooltipModalText = document.getElementById('tooltip-modal-text');
    const tooltipModalClose = document.getElementById('tooltip-modal-close');

    if (tooltipModal && tooltipModalTitle && tooltipModalText) {
        tooltipModalTitle.textContent = getLang(titleKey) || titleKey;
        tooltipModalText.textContent = getLang(textKey) || textKey;
        tooltipModal.classList.remove('hidden');

        const closeModal = () => {
             tooltipModal.classList.add('hidden');
             tooltipModal.removeEventListener('click', closeModalOnClickOutside);
        }
        const closeModalOnClickOutside = (e) => (e.target === tooltipModal) && closeModal();
        
        tooltipModalClose.onclick = closeModal;
        tooltipModal.addEventListener('click', closeModalOnClickOutside);
    }
}

function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

function formatDuration(minutes) {
    if (minutes === undefined || minutes === null || isNaN(minutes) || minutes < 1) return '< 1m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function formatValue(value, type) {
    if (value === undefined || value === null || isNaN(value)) return '--';
    switch (type) {
        case 'money': return `$${(+value).toFixed(2)}`;
        case 'bb': return `${(+value).toFixed(1)} BB`;
        case 'percent': return `${(+value).toFixed(1)}%`;
        case 'int': return `${parseInt(value, 10)}`;
        case 'string': return formatDuration(value);
        default: return `${value}`;
    }
}


// --- 動態 UI 生成函數 ---

function createStatCard(statId, stats) {
    let definition, value;
    
    // 特殊處理位置數據 (e.g., 'pos_ep_3bet')
    if (statId.startsWith('pos_')) {
        const parts = statId.split('_');
        const pos = parts[1].toUpperCase();
        const key = parts.slice(2).join('_');
        definition = { ...STAT_DEFINITIONS[key], nameKey: pos };
        value = stats.byPosition[pos]?.[`${key}_p`];
    } else {
        definition = STAT_DEFINITIONS[statId];
        const valueKey = statId + (definition.type === 'percent' ? '_p' : '');
        value = stats[valueKey]?.value ?? stats[valueKey];
    }

    if (!definition) {
        console.warn(`Stat definition not found for: ${statId}`);
        return document.createDocumentFragment();
    }
    
    const card = document.createElement('div');
    card.className = 'surface p-3 rounded-lg text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200';
    card.innerHTML = `
        <div class="text-xs text-dim truncate" data-lang="${definition.nameKey}">${getLang(definition.nameKey)}</div>
        <div class="text-xl font-bold mt-1 text-primary">${formatValue(value, definition.type)}</div>
    `;
    card.addEventListener('click', () => showTooltip(definition.nameKey, definition.tooltipKey));
    return card;
}

function createSection(sectionConfig, stats) {
    const section = document.createElement('div');
    section.className = 'surface p-4 rounded-lg shadow-md';
    section.innerHTML = `<h3 class="text-lg font-semibold mb-4" data-lang="${sectionConfig.titleKey}">${getLang(sectionConfig.titleKey)}</h3>`;
    
    const grid = document.createElement('div');
    grid.className = `grid ${sectionConfig.grid || 'grid-cols-2 md:grid-cols-4'} gap-3`;
    sectionConfig.statIds.forEach(statId => grid.appendChild(createStatCard(statId, stats)));
    
    section.appendChild(grid);
    return section;
}

function createChartContainer(chartConfig) {
    const container = document.createElement('div');
    if (chartConfig.grid) container.className = chartConfig.grid;
    
    container.innerHTML = `
        <div class="surface p-4 rounded-lg shadow-md h-full">
            <h3 class="text-lg font-semibold mb-4" data-lang="${chartConfig.titleKey}">${getLang(chartConfig.titleKey)}</h3>
            <div class="chart-container relative h-64 md:h-80">
                <canvas id="${chartConfig.id}"></canvas>
            </div>
        </div>
    `;
    return container;
}


// --- 核心渲染函數 ---

function renderTab(tabId, stats) {
    const container = document.getElementById(`${tabId}-content`);
    const config = UI_CONFIG[tabId];
    if (!container || !config || !stats || !stats.total_hands || stats.total_hands.value === 0) return;
    
    container.innerHTML = '';
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'space-y-6';

    if (config.sections) {
        config.sections.forEach(sectionConfig => {
            contentWrapper.appendChild(createSection(sectionConfig, stats));
        });
    }

    if (config.charts) {
        const chartGrid = document.createElement('div');
        chartGrid.className = 'grid grid-cols-1 xl:grid-cols-2 gap-6';
        config.charts.forEach(chartConfig => {
            chartGrid.appendChild(createChartContainer(chartConfig));
        });
        contentWrapper.appendChild(chartGrid);
    }
    
    container.appendChild(contentWrapper);
}

// --- 特定分頁渲染器 ---
export const renderDashboard = (stats) => { 
    renderTab('overview', stats); 
    renderProfitChart(stats); 
    renderPlayerStyleRadarChart(stats);
};
export const renderPreflopTab = (stats) => renderTab('preflop', stats);
export const renderPostflopTab = (stats) => renderTab('postflop', stats);
export const renderPositionTab = (stats) => { renderTab('position', stats); renderPositionCharts(stats); };
export const renderTimeTab = (stats) => { renderTab('time', stats); renderWinrateByTimeCharts(stats); };

// --- 建議 & 關於頁面 (Merged) ---

export function renderRecommendations(stats) {
    const container = document.getElementById('recommendations-content');
    if (!container || !stats || !stats.total_hands || !stats.total_hands.value) return;

    const recKeys = [
        { key: 'limp_p', threshold: 10, type: '>', rec: 'rec_limp_high' },
        { key: 'vpip_p', threshold: 28, type: '>', rec: 'rec_vpip_high' },
        { key: 'vpip_p', threshold: 20, type: '<', rec: 'rec_vpip_low' },
        { key: 'vpip_pfr_gap', threshold: 10, type: '>', rec: 'rec_vpip_pfr_gap' },
        { key: '3bet_p', threshold: 7, type: '<', rec: 'rec_3bet_low' },
        { key: '4bet_p', threshold: 2, type: '<', rec: 'rec_4bet_low' },
        { key: 'fold_vs_3bet_p', threshold: 55, type: '>', rec: 'rec_fold_vs_3bet_high' },
        { key: 'steal_attempt_p', threshold: 35, type: '<', rec: 'rec_steal_low' },
        { key: 'fold_to_steal_p', threshold: 70, type: '>', rec: 'rec_fold_to_steal_high' },
        { key: 'cbet_flop_p', threshold: 50, type: '<', rec: 'rec_cbet_low' },
        { key: 'cbet_flop_p', threshold: 75, type: '>', rec: 'rec_cbet_high' },
        { key: 'fold_to_cbet_flop_p', threshold: 60, type: '>', rec: 'rec_fold_to_cbet_high' },
        { key: 'wtsd_p', threshold: 24, type: '<', rec: 'rec_wtsd_low' },
        { key: 'wtsd_high_won_low', threshold: true, type: 'eval', rec: 'rec_wtsd_high_wtsd_won_low' },
        { key: 'afq_flop_p', threshold: 35, type: '<', rec: 'rec_afq_low' }
    ];

    const finalRecs = recKeys.filter(r => {
        const getStat = (key) => (typeof stats[key] === 'number' ? stats[key] : -1);

        if (r.type === 'eval') {
            if (r.key === 'wtsd_high_won_low') {
                return getStat('wtsd_p') > 32 && getStat('wtsd_won_p') < 50;
            }
            return false;
        }
        
        let value;
        if (r.key === 'vpip_pfr_gap') {
            const vpip = getStat('vpip_p');
            const pfr = getStat('pfr_p');
            if (vpip === -1 || pfr === -1) return false;
            value = vpip - pfr;
        } else {
            value = getStat(r.key);
        }
        
        if (value === -1) return false;
        return r.type === '>' ? value > r.threshold : value < r.threshold;

    }).map(r => getLang(r.rec));
    
    let contentHTML = `<h3 class="text-xl font-bold mb-6" data-lang="rec_title"></h3>`;

    if (finalRecs.length === 0) {
        contentHTML += `<div class="text-center p-6 bg-emerald-500/10 rounded-lg">
            <span class="text-4xl">🎉</span>
            <p class="mt-2 font-semibold text-emerald-400" data-lang="rec_good"></p>
        </div>`;
    } else {
        contentHTML += `<div class="space-y-5">` + finalRecs.map(recText => {
            const processedText = recText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-inherit">$1</strong>');
            const [title, ...rest] = processedText.split('：');
            return `<div class="surface p-4 rounded-lg shadow-md"><h4 class="font-bold text-md text-primary">${title}</h4><p class="text-sm text-dim mt-1">${rest.join('：')}</p></div>`;
        }).join('') + `</div>`;
    }
    
    container.innerHTML = contentHTML;
    updateUIText();
}

export function renderAboutTab() {
    const container = document.getElementById('about-content');
    if (!container) return;
    container.innerHTML = `
        <div class="surface p-6 rounded-lg shadow-md prose prose-neutral dark:prose-invert max-w-none">
            <h2 data-lang="about_title"></h2>
            <p data-lang="about_p1"></p>
            <p data-lang="about_p2"></p>
            <h4 class="text-xl font-semibold mt-6" data-lang="report_strengths_title">工具優勢 (Strengths)</h4>
            <ul>
                <li data-lang="report_strength1"><strong>完全免費且開源：</strong> 無任何使用成本，程式碼透明，具備高度信任感。</li>
                <li data-lang="report_strength2"><strong>高度隱私保護：</strong> 所有運算均在使用者本機端完成，手牌數據不經過任何伺服器，無數據外洩風險。</li>
                <li data-lang="report_strength3"><strong>跨平台、免安裝：</strong> 只需要瀏覽器即可運作，方便在任何裝置上使用。</li>
                <li data-lang="report_strength4"><strong>數據可攜與累積：</strong> 分析結果可匯出成 JSON 檔案，方便使用者自行備份，並可在下次合併分析，實現長期數據追蹤。</li>
                 <li data-lang="report_strength5"><strong>直觀的數據視覺化：</strong> 提供圖表化呈現，比單純閱讀文字檔更易於理解自己的表現趨勢。</li>
            </ul>
            <h4 class="text-xl font-semibold mt-6" data-lang="report_weaknesses_title">工具劣勢 (Weaknesses)</h4>
            <ul>
                <li data-lang="report_weakness1"><strong>無即時 HUD 功能：</strong> 與專業軟體 (如 PT4, HM3) 相比，無法在牌桌上即時顯示對手數據。</li>
                <li data-lang="report_weakness2"><strong>依賴手動上傳：</strong> 需要手動從 GGPoker 客戶端導出紀錄並上傳，操作上不如自動匯入的軟體便利。</li>
                <li data-lang="report_weakness3"><strong>數據維度較基礎：</strong> 目前提供的數據指標雖然核心，但與專業軟體相比仍不夠細緻 (例如：缺少特定牌型組合的獲利分析)。</li>
                <li data-lang="report_weakness4"><strong>前端計算效能瓶頸：</strong> 當手牌數量達到數十萬甚至百萬級別時，純前端 JavaScript 計算可能遇到效能瓶頸，導致分析時間過長或瀏覽器卡頓。</li>
                <li data-lang="report_weakness5"><strong>缺乏對手分析功能：</strong> 工具完全聚焦在使用者 (Hero) 本身的數據，無法建立對手資料庫進行針對性分析。</li>
            </ul>
            <h4 class="text-xl font-semibold mt-6" data-lang="report_future_title">未來 10 個優化與新增方向</h4>
            <ol class="list-decimal list-inside space-y-2">
                <li data-lang="report_future1"><strong>雲端後端整合 (Firebase/Netlify)：</strong> 將計算密集型的解析與統計工作移至後端 Functions 處理，解決前端效能瓶頸，並為使用者帳號系統做準備。</li>
                <li data-lang="report_future2"><strong>使用者帳號與數據同步：</strong> 引入 Firebase Authentication 與 Firestore，讓使用者可以註冊帳號，並將分析結果自動儲存於雲端，實現跨裝置數據同步。</li>
                <li data-lang="report_future3"><strong>手牌視覺化重播功能：</strong> 增加一個功能，可以點擊單一手牌紀錄，以圖形介面重播該手牌的完整過程。</li>
                <li data-lang="report_future4"><strong>進階數據篩選器：</strong> 允許使用者根據位置、起手牌、牌局結果等多維度篩選數據，進行更深入的專項分析。</li>
                <li data-lang="report_future5"><strong>起手牌矩陣 (Matrix) 熱圖：</strong> 以 13x13 的矩陣圖顯示所有起手牌的 VPIP、PFR、獲利等數據，一目了然地看出自己的起手牌選擇策略與漏洞。</li>
                <li data-lang="report_future6"><strong>特定賽事/盲注等級分析：</strong> 增加篩選功能，讓使用者可以只分析特定盲注等級或特定賽事類型 (如 Rush & Cash) 的手牌。</li>
                <li data-lang="report_future7"><strong>更豐富的圖表類型：</strong> 除了現有的線性圖與長條圖，可以增加圓餅圖 (例如：各位置行動分佈)、雷達圖 (評估玩家風格的全面性) 等。</li>
                <li data-lang="report_future8"><strong>簡易對手數據標記：</strong> 雖然無法做到完整 HUD，但可以讓使用者在分析時，針對特定對手 ID 加上標籤 (例如：魚、緊兇)，並在未來的手牌中顯示這些標籤。</li>
                <li data-lang="report_future9"><strong>目標導向的學習模組：</strong> 根據分析出的數據弱點，自動推薦相關的撲克學習資源或文章連結，例如「如何應對 3-Bet」、「偷盲與反偷盲策略」等。</li>
                <li data-lang="report_future10"><strong>與社群分享報告：</strong> 產生一個可分享的唯讀報告頁面連結 (不包含敏感手牌細節)，讓使用者可以方便地與教練或朋友討論自己的數據。</li>
            </ol>
        </div>
    `;
    updateUIText();
}


// --- 圖表渲染 (與原版類似，保持不變) ---
const getChartOptions = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    return {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false, labels: { color: textColor } }, tooltip: { /* ... */ } },
        scales: { x: { ticks: { color: textColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, grid: { color: gridColor, drawOnChartArea: false } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } },
        elements: { line: { tension: 0.3 }, bar: { borderRadius: 4 } }
    };
};

export function updateChartsForTheme() {
    Object.values(chartInstances).forEach(chart => {
        const newOptions = getChartOptions();
        Object.assign(chart.options.plugins.legend.labels, { color: newOptions.plugins.legend.labels.color });
        Object.assign(chart.options.scales.x.ticks, { color: newOptions.scales.x.ticks.color });
        Object.assign(chart.options.scales.x.grid, { color: newOptions.scales.x.grid.color });
        Object.assign(chart.options.scales.y.ticks, { color: newOptions.scales.y.ticks.color });
        Object.assign(chart.options.scales.y.grid, { color: newOptions.scales.y.grid.color });
        
        if (chart.config.type === 'radar') {
            Object.assign(chart.options.scales.r.angleLines, { color: newOptions.scales.x.grid.color });
            Object.assign(chart.options.scales.r.grid, { color: newOptions.scales.x.grid.color });
            Object.assign(chart.options.scales.r.pointLabels, { color: newOptions.scales.x.ticks.color });
            Object.assign(chart.options.scales.r.ticks, { color: newOptions.scales.x.ticks.color });
        }
        
        chart.update();
    });
}

function renderProfitChart(stats) {
    const chartId = 'profitChart';
    destroyChart(chartId);
    const ctx = document.getElementById(chartId)?.getContext('2d');
    if (!ctx) return;

    chartInstances[chartId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.profitHistory.map(p => p.hand),
            datasets: [{
                label: getLang('total_profit'),
                data: stats.profitHistory.map(p => p.profit.toFixed(2)),
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                borderColor: '#14b8a6',
                fill: true,
                pointRadius: 0,
            }, {
                label: getLang('total_profit_with_rake'),
                data: stats.profitHistory.map(p => p.profit_with_rake.toFixed(2)),
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: '#3b82f6',
                fill: true,
                pointRadius: 0,
            }]
        },
        options: getChartOptions()
    });
}

function renderWinrateByTimeCharts(stats) {
    const chartIdWeekday = 'winrateByWeekdayChart';
    destroyChart(chartIdWeekday);
    const ctxWeekday = document.getElementById(chartIdWeekday)?.getContext('2d');
    if (ctxWeekday) {
        const lang = localStorage.getItem('language') || 'zh';
        const weekdayLabels = lang === 'zh' 
            ? ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const weekdayData = stats.byTime.byDayOfWeek.map(d => d.bb_per_100);
        chartInstances[chartIdWeekday] = new Chart(ctxWeekday, {
            type: 'bar',
            data: {
                labels: weekdayLabels,
                datasets: [{
                    label: getLang('bb_per_100'),
                    data: weekdayData,
                    backgroundColor: weekdayData.map(d => d >= 0 ? 'rgba(20, 184, 166, 0.6)' : 'rgba(244, 63, 94, 0.6)'),
                }]
            },
            options: getChartOptions()
        });
    }

    const chartIdHour = 'winrateByHourChart';
    destroyChart(chartIdHour);
    const ctxHour = document.getElementById(chartIdHour)?.getContext('2d');
    if (ctxHour) {
        const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const hourData = stats.byTime.byHourOfDay.map(h => h.bb_per_100);
        chartInstances[chartIdHour] = new Chart(ctxHour, {
            type: 'bar',
            data: {
                labels: hourLabels,
                datasets: [{
                    label: getLang('bb_per_100'),
                    data: hourData,
                    backgroundColor: hourData.map(d => d >= 0 ? 'rgba(20, 184, 166, 0.6)' : 'rgba(244, 63, 94, 0.6)'),
                }]
            },
             options: getChartOptions()
        });
    }
}

function renderPositionCharts(stats) {
    const chartIdProfit = 'positionProfitChart';
    const chartIdStyle = 'positionStyleChart';
    destroyChart(chartIdProfit);
    destroyChart(chartIdStyle);

    const ctxProfit = document.getElementById(chartIdProfit)?.getContext('2d');
    const ctxStyle = document.getElementById(chartIdStyle)?.getContext('2d');
    if (!ctxProfit || !ctxStyle) return;

    const positions = ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    const profitData = positions.map(p => stats.byPosition[p]?.bb_per_100 ?? 0);

    chartInstances[chartIdProfit] = new Chart(ctxProfit, {
        type: 'bar',
        data: {
            labels: positions,
            datasets: [{
                label: getLang('bb_per_100'),
                data: profitData,
                backgroundColor: profitData.map(d => d >= 0 ? 'rgba(20, 184, 166, 0.6)' : 'rgba(244, 63, 94, 0.6)'),
            }]
        },
        options: getChartOptions()
    });
    
    const optionsStyle = getChartOptions();
    optionsStyle.plugins.legend.display = true; 

    chartInstances[chartIdStyle] = new Chart(ctxStyle, {
        type: 'bar',
        data: {
            labels: positions,
            datasets: [
                {
                    label: 'VPIP',
                    data: positions.map(p => stats.byPosition[p]?.vpip_p ?? 0),
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                },
                {
                    label: 'PFR',
                    data: positions.map(p => stats.byPosition[p]?.pfr_p ?? 0),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                }
            ]
        },
        options: optionsStyle,
    });
}

function renderPlayerStyleRadarChart(stats) {
    const chartId = 'playerStyleRadarChart';
    destroyChart(chartId);
    const ctx = document.getElementById(chartId)?.getContext('2d');
    if (!ctx) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    const angleLineColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    // console.log("stats for radar chart:")
    // console.log(stats)
    const vpip = stats.vpip_p ?? 0;
    const bb_with_rake_per_100 = stats.bb_with_rake_per_100 ?? 0;
    const pfr = stats.pfr_p ?? 0;
    const afq = stats.afq_flop_p ?? 0;
    const wtsd = stats.wtsd_p ?? 0;
    const threeBet = stats['3bet_p'] ?? 0;

    const data = {
        labels: [
            getLang('bb_with_rake_per_100'),
            getLang('preflop_aggression'),
            getLang('3bet'),
            getLang('afq_flop'),
            getLang('wtsd'),
        ],
        datasets: [{
            label: 'Player Style',
            data: [
                bb_with_rake_per_100? Math.max(bb_with_rake_per_100.value, 0) : 0,
                vpip > 0 ? (pfr / vpip) * 100 : 0,
                threeBet * 5, // Scale 3bet to be more visible (common values are 5-15)
                afq,
                wtsd
            ],
            backgroundColor: 'rgba(20, 184, 166, 0.2)',
            borderColor: '#14b8a6',
            pointBackgroundColor: '#14b8a6',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#14b8a6'
        }]
    };
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            r: {
                angleLines: { color: angleLineColor },
                grid: { color: gridColor },
                pointLabels: { color: textColor, font: { size: 12 } },
                ticks: { color: textColor, backdropColor: 'transparent', stepSize: 25 },
                min: 0,
                max: 100,
            }
        },
        elements: { line: { borderWidth: 2 } }
    };

    chartInstances[chartId] = new Chart(ctx, { type: 'radar', data: data, options: options });
}

export function clearAllTabs() {
    document.querySelectorAll('.main-tab-pane').forEach(pane => {
        pane.innerHTML = `<div class="text-center p-8 text-dim" data-lang="no_data_to_display">${getLang('no_data_to_display')}</div>`;
    });
    Object.keys(chartInstances).forEach(id => destroyChart(id));
}

window.addEventListener('themeChanged', updateChartsForTheme);
