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

// --- UI 組態設定 (優化後) ---
const UI_CONFIG = {
    overview: {
        sections: [
            { titleKey: 'win_rate_stats', grid: 'grid-cols-2 md:grid-cols-4', statIds: ['total_profit', 'bb_per_100', 'profit_bb', 'total_rake',
                    'total_profit_with_rake', 'bb_with_rake_per_100', 'profit_with_rake_bb', 'total_jackpot']
            },
            { titleKey: 'session_info', grid: 'grid-cols-2 md:grid-cols-4', statIds: ['total_hands', 'total_duration', 'hands_per_hour', 'total_rake'] },
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
    if (hours > 0) return `${hours}hr ${mins}min`;
    return `${mins}min`;
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

/**
 * 根據數據值和預設範圍決定顏色
 * @param {number} value - 數據值
 * @param {object} ranges - 顏色範圍定義，包含 good, acceptable, warn
 * @returns {string} - Tailwind CSS 顏色 class
 */
function getValueColorClass(value, ranges) {
    if (!ranges || typeof value !== 'number' || isNaN(value)) {
        return 'text-primary'; // 預設顏色
    }

    const { good, acceptable, warn } = ranges;

    // 檢查 "優秀" 範圍
    if (good) {
        const isGood = good.length === 1
            ? (good[0] < 0 ? value <= good[0] : value >= good[0])
            : (value >= good[0] && value <= good[1]);
        if (isGood) return 'text-green-500';
    }

    // 檢查 "良好" 範圍
    if (acceptable) {
        const isAcceptable = acceptable.length === 1
            ? (acceptable[0] < 0 ? value <= acceptable[0] : value >= acceptable[0])
            : (value >= acceptable[0] && value <= acceptable[1]);
        if (isAcceptable) return 'text-emerald-500';
    }

    // 檢查 "警告" 範圍
    if (warn) {
        const isWarn = warn.length === 1
            ? (warn[0] < 0 ? value <= warn[0] : value >= warn[0])
            : (value >= warn[0] && value <= warn[1]);
        if (isWarn) return 'text-amber-400';
    }

    // 如果不屬於任何定義的範圍，則歸為 "糟糕"
    return 'text-rose-500';
}

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
    
    const valueColorClass = getValueColorClass(value, definition.ranges);
    
    const card = document.createElement('div');
    card.className = 'surface p-3 rounded-lg text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200';
    card.innerHTML = `
        <div class="text-xs text-dim truncate" data-lang="${definition.nameKey}">${getLang(definition.nameKey)}</div>
        <div class="text-xl font-bold mt-1 ${valueColorClass}">${formatValue(value, definition.type)}</div>
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
        const getStat = (key) => (typeof stats[key] === 'number' ? stats[key] : (stats[key]?.value ?? -1));

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
            <a href="https://github.com/Layorx/GGPoker-Hand-Analyzer" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-dim hover:text-inherit no-underline mb-6 not-prose">
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 fill-current"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z"/></svg>
                <span data-lang="about_github_link"></span>
            </a>
            <h2 data-lang="about_title"></h2>
            <p data-lang="about_p1"></p>
            <h4 class="text-xl font-semibold mt-6" data-lang="report_strengths_title"></h4>
            <ul>
                <li data-lang="report_strength1"></li>
                <li data-lang="report_strength2"></li>
                <li data-lang="report_strength3"></li>
                <li data-lang="report_strength4"></li>
                <li data-lang="report_strength5"></li>
            </ul>
            <h4 class="text-xl font-semibold mt-6" data-lang="report_weaknesses_title"></h4>
            <ul>
                <li data-lang="report_weakness1"></li>
                <li data-lang="report_weakness2"></li>
                <li data-lang="report_weakness3"></li>
                <li data-lang="report_weakness4"></li>
                <li data-lang="report_weakness5"></li>
            </ul>
            <h4 class="text-xl font-semibold mt-6" data-lang="report_future_title"></h4>
            <ol class="list-decimal list-inside space-y-2">
                <li data-lang="report_future1"></li>
                <li data-lang="report_future2"></li>
                <li data-lang="report_future3"></li>
                <li data-lang="report_future4"></li>
                <li data-lang="report_future5"></li>
                <li data-lang="report_future6"></li>
                <li data-lang="report_future7"></li>
                <li data-lang="report_future8"></li>
                <li data-lang="report_future9"></li>
                <li data-lang="report_future10"></li>
            </ol>
        </div>
    `;
    updateUIText();
}


// --- 圖表渲染 (優化後) ---
const getChartOptions = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    return {
        responsive: true, maintainAspectRatio: false,
        plugins: { 
            legend: { 
                display: false, // 預設關閉，在需要時開啟
                labels: { color: textColor } 
            }, 
            tooltip: { // 優化 Tooltip
                mode: 'index',
                intersect: false,
                backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: gridColor,
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                boxPadding: 4,
             } 
        },
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
    
    const options = getChartOptions();
    options.plugins.legend.display = true; // 明確開啟此圖的圖例

    chartInstances[chartId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.profitHistory.map(p => p.hand),
            datasets: [{
                label: getLang('total_profit'),
                data: stats.profitHistory.map(p => p.profit.toFixed(2)),
                backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red-ish
                borderColor: '#ef4444',
                fill: true,
                pointRadius: 0,
            }, {
                label: getLang('total_profit_with_rake'),
                data: stats.profitHistory.map(p => p.profit_with_rake.toFixed(2)),
                backgroundColor: 'rgba(20, 184, 166, 0.1)', // Teal
                borderColor: '#14b8a6',
                fill: true,
                pointRadius: 0,
            }]
        },
        options: options
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
    console.log('renderPlayerStyleRadarChart');
    console.log(stats);
    const chartId = 'playerStyleRadarChart';
    destroyChart(chartId);
    const ctx = document.getElementById(chartId)?.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    const angleLineColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';

    // --- 數據計算與標準化 (0-100) ---
    const vpip = stats.vpip_p ?? 0;
    const pfr = stats.pfr_p ?? 0;
    const three_bet_p = stats['3bet_p'] ?? 0;
    const afq_all_p = (stats.afq_river_p + stats.afq_turn_p + stats.afq_flop_p)/3?? 0;
    const wtsd_p = stats.wtsd_p ?? 0;
    const wtsd_won_p = stats.wtsd_won_p ?? 0;
    const bb_per_100 = stats.bb_with_rake_per_100.value ?? 0;

    // 1. 勝率分數: 將 BB/100 從 [-10, 40] 映射到 [0, 100]
    const win_rate_score = Math.min(Math.max(bb_per_100, -15), 60)*4/3  + 20;
    // 2. 翻前攻擊性: PFR / VPIP
    const preflop_agg_score = vpip > 0 ? (pfr / vpip) * 100 : 0;
    // 3. 3Bet 頻率: best 7~12
    const three_bet_score = three_bet_p*5;
    // 4. 翻後攻擊性: 三條街 AFq 
    const postflop_agg_score = Math.min(afq_all_p/2.5,20)*5 ;
    // 5. 攤牌率 best:25~32
    const wtsd_score =Math.min(wtsd_p*2,100); 
    const wtsd_won_score =  Math.min(wtsd_won_p*9/7,100);

    const data = {
        labels: [
            getLang('bb_with_rake_per_100'),
            getLang('preflop_aggression'),
            getLang('3bet'),
            getLang('afq_all'),
            getLang('wtsd'),
            getLang('wtsd_won'),
        ],
        datasets: [{
            label: getLang('player_style_radar'),
            data: [
                win_rate_score,
                preflop_agg_score,
                three_bet_score,
                postflop_agg_score,
                wtsd_score,
                wtsd_won_score
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
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const originalLabel = context.label;
                        let rawValueText;

                        // 根據標籤顯示原始數據，而不是標準化後的分數
                        if (originalLabel === getLang('bb_with_rake_per_100')) {
                            rawValueText = bb_per_100.toFixed(2) + ' BB';
                        } else if (originalLabel === getLang('preflop_aggression')) {
                            rawValueText = preflop_agg_score.toFixed(2) + '%';
                        } else if (originalLabel === getLang('3bet')) {
                            rawValueText = three_bet_p.toFixed(2) + '%';
                        } else if (originalLabel === getLang('afq_all')) {
                            rawValueText = afq_all_p.toFixed(2) + '%';
                        } else if (originalLabel === getLang('wtsd')) {
                            rawValueText = wtsd_p.toFixed(2) + '%';
                        } else if (originalLabel === getLang('wtsd_won')) {
                            rawValueText = wtsd_won_p.toFixed(2) + '%';
                        } else {
                            rawValueText = context.raw.toFixed(2);
                        }
                        
                        return `${context.label}: ${rawValueText}`;
                    },
                    afterLabel: function(context) {
                        const labelKey = context.label;
                        let tooltipKey;
                        if (labelKey === getLang('bb_with_rake_per_100')) tooltipKey = 'tooltip_bb_with_rake_per_100';
                        else if (labelKey === getLang('preflop_aggression')) tooltipKey = 'tooltip_preflop_aggression';
                        else if (labelKey === getLang('3bet')) tooltipKey = 'tooltip_3bet';
                        else if (labelKey === getLang('afq_all')) tooltipKey = 'tooltip_afq_all';
                        else if (labelKey === getLang('wtsd')) tooltipKey = 'tooltip_wtsd';
                        else if (labelKey === getLang('wtsd_won')) tooltipKey = 'tooltip_wtsd_won';
                        
                        if (tooltipKey) {
                            // 將說明文字按中英文句號分割成多行，以獲得更好的可讀性
                            return getLang(tooltipKey).split(/[.。]/).map(s => s.trim()).filter(s => s);
                        }
                        return '';
                    }
                }
            }
        },
        scales: {
            r: {
                angleLines: { color: angleLineColor },
                grid: { color: gridColor },
                pointLabels: { color: textColor, font: { size: 12 } },
                ticks: {
                    display: false, // 隱藏刻度數字，讓圖表更簡潔
                    stepSize: 25
                },
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
