import { getLang, updateUIText } from './lang.js';

const chartInstances = {};

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

        const closeModalOnClickOutside = (e) => {
            if(e.target === tooltipModal) {
                closeModal();
            }
        }
        
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
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (mins > 0 || hours === 0) result += `${mins}m`;
    return result.trim();
}

function formatValue(val, type, unit = '') {
    if (val === undefined || val === null || isNaN(val)) return '--';
    switch (type) {
        case 'money': return `$${(+val).toFixed(2)}`;
        case 'bb': return `${(+val).toFixed(1)} BB`;
        case 'percent': return `${(+val).toFixed(1)}%`;
        case 'int': return `${parseInt(val, 10)}`;
        default: return `${val}${unit}`;
    }
}

function createStatCard(labelKey, value, tooltipKey, type = '', unit = '') {
    const card = document.createElement('div');
    card.className = 'surface p-3 rounded-lg text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200';
    card.innerHTML = `
        <div class="text-xs text-dim truncate" data-lang="${labelKey}">${getLang(labelKey)}</div>
        <div class="text-xl font-bold mt-1 text-primary">${formatValue(value, type, unit)}</div>
    `;
    card.addEventListener('click', () => showTooltip(labelKey, tooltipKey));
    return card;
}

function createSection(titleKey, cards, gridCols = 'grid-cols-2 md:grid-cols-4') {
    const section = document.createElement('div');
    section.className = 'surface p-4 rounded-lg shadow-md';
    section.innerHTML = `<h3 class="text-lg font-semibold mb-4" data-lang="${titleKey}">${getLang(titleKey)}</h3>`;
    const grid = document.createElement('div');
    grid.className = `grid ${gridCols} gap-3`;
    cards.forEach(card => grid.appendChild(card));
    section.appendChild(grid);
    return section;
}

function createChartContainer(chartId, titleKey) {
    return `
        <div class="surface p-4 rounded-lg shadow-md">
            <h3 class="text-lg font-semibold mb-4" data-lang="${titleKey}">${getLang(titleKey)}</h3>
            <div class="chart-container">
                <canvas id="${chartId}"></canvas>
            </div>
        </div>
    `;
}

const getChartOptions = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const primaryColor = '#14b8a6';

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: textColor, boxWidth: 12, padding: 20 },
                display: false
            },
            tooltip: {
                backgroundColor: isDark ? '#374151' : '#fff',
                titleColor: isDark ? '#e5e7eb' : '#374151',
                bodyColor: isDark ? '#e5e7eb' : '#374151',
                borderColor: gridColor,
                borderWidth: 1,
                padding: 10,
                caretSize: 6,
                cornerRadius: 6,
            }
        },
        scales: {
            x: { 
                ticks: { color: textColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, 
                grid: { color: gridColor, drawOnChartArea: false } 
            },
            y: { 
                ticks: { color: textColor, callback: (value) => `${value}`}, 
                grid: { color: gridColor } 
            }
        },
        animation: { duration: 400, easing: 'easeInOutQuad' },
        elements: {
            line: {
                borderColor: primaryColor,
                tension: 0.3,
            },
            point: {
                radius: 0,
                hoverRadius: 5,
                backgroundColor: primaryColor,
            },
            bar: {
                borderRadius: 4,
            }
        }
    };
};


export function updateChartsForTheme() {
    Object.values(chartInstances).forEach(chart => {
        const newOptions = getChartOptions();
        chart.options.plugins.legend.labels.color = newOptions.plugins.legend.labels.color;
        chart.options.scales.x.ticks.color = newOptions.scales.x.ticks.color;
        chart.options.scales.x.grid.color = newOptions.scales.x.grid.color;
        chart.options.scales.y.ticks.color = newOptions.scales.y.ticks.color;
        chart.options.scales.y.grid.color = newOptions.scales.y.grid.color;
        chart.update();
    });
}

// --- RENDER FUNCTIONS ---

export function renderDashboard(stats) {
    const container = document.getElementById('overview-content');
    if (!container || !stats || !stats.totalHands) return;
    container.innerHTML = '';

    const winRateStats = [
        createStatCard('total_profit', stats.totalProfit, 'tooltip_total_profit', 'money'),
        createStatCard('bb_per_100', stats.bb_per_100, 'tooltip_bb_per_100', 'bb'),
        createStatCard('profit_bb', stats.profitBB, 'tooltip_profit_bb', 'bb'),
        createStatCard('total_rake', stats.totalRake, 'tooltip_total_rake', 'money'),
    ];

    const sessionInfo = [
        createStatCard('total_hands', stats.totalHands, 'tooltip_total_hands', 'int'),
        createStatCard('total_duration', formatDuration(stats.actualPlayingDurationMinutes), 'tooltip_total_duration'),
        createStatCard('hands_per_hour', stats.handsPerHour, 'tooltip_hands_per_hour', 'int'),
        createStatCard('profit_per_hour', stats.profitPerHour, 'tooltip_profit_per_hour', 'money'),
    ];

    const preflopOverview = [
        createStatCard('vpip', stats.VPIP_P, 'tooltip_vpip', 'percent'),
        createStatCard('pfr', stats.PFR_P, 'tooltip_pfr', 'percent'),
        createStatCard('3bet', stats['3Bet_P'], 'tooltip_3bet', 'percent'),
        createStatCard('steal_attempt', stats.Steal_P, 'tooltip_steal_attempt', 'percent'),
    ];

    const postflopOverview = [
        createStatCard('cbet_flop', stats.CBetFlop_P, 'tooltip_cbet_flop', 'percent'),
        createStatCard('wtsd', stats.WTSD_P, 'tooltip_wtsd', 'percent'),
        createStatCard('wtsd_won', stats.W$SD_P, 'tooltip_wtsd_won', 'percent'),
        createStatCard('afq_flop', stats.AFq_flop, 'tooltip_afq_flop', 'percent'),
    ];

    const overviewGrid = document.createElement('div');
    overviewGrid.className = 'grid grid-cols-1 xl:grid-cols-2 gap-6';
    overviewGrid.appendChild(createSection('win_rate_stats', winRateStats, 'grid-cols-2'));
    overviewGrid.appendChild(createSection('session_info', sessionInfo, 'grid-cols-2'));
    overviewGrid.appendChild(createSection('preflop_style', preflopOverview, 'grid-cols-2'));
    overviewGrid.appendChild(createSection('postflop_play', postflopOverview, 'grid-cols-2'));

    container.appendChild(overviewGrid);
    const chartHTML = document.createElement('div');
    chartHTML.className = 'mt-6';
    chartHTML.innerHTML = createChartContainer('profitChart', 'profit_chart_title');
    container.appendChild(chartHTML);

    renderProfitChart(stats);
    updateUIText();
}

export function renderPreflopTab(stats) {
    const container = document.getElementById('preflop-content');
    if (!container || !stats || !stats.totalHands) return;
    container.innerHTML = '';

    const cards = [
        createSection('preflop_open', [
            createStatCard('vpip', stats.VPIP_P, 'tooltip_vpip', 'percent'),
            createStatCard('pfr', stats.PFR_P, 'tooltip_pfr', 'percent'),
            createStatCard('limp', stats.Limp_P, 'tooltip_limp', 'percent'),
        ], 'grid-cols-3'),
        createSection('preflop_vs_raise', [
            createStatCard('3bet', stats['3Bet_P'], 'tooltip_3bet', 'percent'),
            createStatCard('4bet', stats['4Bet_P'], 'tooltip_4bet', 'percent'),
            createStatCard('fold_vs_3bet', stats.FoldVs3Bet_P, 'tooltip_fold_vs_3bet', 'percent'),
            createStatCard('squeeze', stats.Squeeze_P, 'tooltip_squeeze', 'percent'),
            createStatCard('cold_call', stats.ColdCall_P, 'tooltip_cold_call', 'percent'),
        ], 'grid-cols-2 md:grid-cols-5'),
        createSection('steal_dynamics', [
            createStatCard('steal_attempt', stats.Steal_P, 'tooltip_steal_attempt', 'percent'),
            createStatCard('fold_to_steal', stats.FoldToSteal_P, 'tooltip_fold_to_steal', 'percent'),
        ], 'grid-cols-2')
    ];

    cards.forEach(c => container.appendChild(c));
    updateUIText();
}

export function renderPostflopTab(stats) {
    const container = document.getElementById('postflop-content');
    if (!container || !stats || !stats.totalHands) return;
    container.innerHTML = '';

    const cards = [
        createSection('postflop_as_aggressor', [
            createStatCard('cbet_flop', stats.CBetFlop_P, 'tooltip_cbet_flop', 'percent'),
            createStatCard('cbet_turn', stats.CBetTurn_P, 'tooltip_cbet_turn', 'percent'),
            createStatCard('cbet_river', stats.CBetRiver_P, 'tooltip_cbet_river', 'percent'),
        ], 'grid-cols-3'),
        createSection('postflop_as_caller', [
            createStatCard('fold_to_cbet_flop', stats.FoldToCBetFlop_P, 'tooltip_fold_to_cbet_flop', 'percent'),
            createStatCard('check_raise_flop', stats.CheckRaiseFlop_P, 'tooltip_check_raise_flop', 'percent'),
            createStatCard('donk_bet_flop', stats.DonkBetFlop_P, 'tooltip_donk_bet_flop', 'percent'),
            createStatCard('bet_vs_missed_cbet', stats.BetVsMissedCBet_P, 'tooltip_bet_vs_missed_cbet', 'percent'),
            createStatCard('probe_bet_turn', stats.ProbeBetTurn_P, 'tooltip_probe_bet_turn', 'percent'),
            createStatCard('float_bet_flop', stats.FloatBetFlop_P, 'tooltip_float_bet_flop', 'percent'),
        ], 'grid-cols-2 md:grid-cols-3'),
        createSection('showdown_stats', [
            createStatCard('wtsd', stats.WTSD_P, 'tooltip_wtsd', 'percent'),
            createStatCard('wtsd_won', stats.W$SD_P, 'tooltip_wtsd_won', 'percent'),
            createStatCard('wwsf', stats.WWSF_P, 'tooltip_wwsf', 'percent'),
            createStatCard('afq_flop', stats.AFq_flop, 'tooltip_afq_flop', 'percent'),
            createStatCard('afq_turn', stats.AFq_turn, 'tooltip_afq_turn', 'percent'),
            createStatCard('afq_river', stats.AFq_river, 'tooltip_afq_river', 'percent'),
        ], 'grid-cols-2 md:grid-cols-3')
    ];
    cards.forEach(c => container.appendChild(c));
    updateUIText();
}

export function renderPositionTab(stats) {
    const container = document.getElementById('position-content');
    if (!container || !stats || !stats.totalHands) return;

    container.innerHTML = `
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            ${createChartContainer('positionProfitChart', 'positional_profit')}
            ${createChartContainer('positionStyleChart', 'positional_style')}
        </div>
        <div id="position-aggression-cards" class="mt-6"></div>
    `;
    renderPositionCharts(stats);

    const posAggContainer = document.getElementById('position-aggression-cards');
    const positions = ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    const cards = [
        createSection('positional_aggression', positions.map(p =>
            createStatCard(p, stats.byPosition[p]?.['3bet_p'], `tooltip_3bet`, 'percent')
        ), 'grid-cols-3 md:grid-cols-6'),
    ];
    cards.forEach(c => posAggContainer.appendChild(c));
    updateUIText();
}

export function renderTimeTab(stats) {
    const container = document.getElementById('time-content');
    if (!container || !stats || !stats.totalHands) return;
    container.innerHTML = `
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            ${createChartContainer('winrateByWeekdayChart', 'winrate_by_weekday')}
            ${createChartContainer('winrateByHourChart', 'winrate_by_hour')}
        </div>
    `;
    renderWinrateByTimeCharts(stats);
    updateUIText();
}

export function renderRecommendations(stats) {
    const container = document.getElementById('recommendations-content');
    if (!container || !stats || !stats.totalHands) return;

    const recKeys = [
        { key: 'Limp_P', threshold: 10, type: '>', rec: 'rec_limp_high' },
        { key: 'VPIP_P', threshold: 28, type: '>', rec: 'rec_vpip_high' },
        { key: 'VPIP_P', threshold: 20, type: '<', rec: 'rec_vpip_low' },
        { key: 'vpip_pfr_gap', threshold: 10, type: '>', rec: 'rec_vpip_pfr_gap' },
        { key: '3Bet_P', threshold: 7, type: '<', rec: 'rec_3bet_low' },
        { key: '4Bet_P', threshold: 2, type: '<', rec: 'rec_4bet_low' },
        { key: 'FoldVs3Bet_P', threshold: 55, type: '>', rec: 'rec_fold_vs_3bet_high' },
        { key: 'Steal_P', threshold: 35, type: '<', rec: 'rec_steal_low' },
        { key: 'FoldToSteal_P', threshold: 70, type: '>', rec: 'rec_fold_to_steal_high' },
        { key: 'CBetFlop_P', threshold: 50, type: '<', rec: 'rec_cbet_low' },
        { key: 'CBetFlop_P', threshold: 75, type: '>', rec: 'rec_cbet_high' },
        { key: 'FoldToCBetFlop_P', threshold: 60, type: '>', rec: 'rec_fold_to_cbet_high' },
        { key: 'WTSD_P', threshold: 24, type: '<', rec: 'rec_wtsd_low' },
        { key: 'wtsd_high_won_low', threshold: true, type: 'eval', rec: 'rec_wtsd_high_wtsd_won_low' },
        { key: 'AFq_flop', threshold: 35, type: '<', rec: 'rec_afq_low' }
    ];

    const finalRecs = recKeys.filter(r => {
        if (r.type === 'eval') {
            if (r.key === 'wtsd_high_won_low') return parseFloat(stats.WTSD_P) > 32 && parseFloat(stats['W$SD_P']) < 50;
            return false;
        }
        const value = r.key === 'vpip_pfr_gap' ? (parseFloat(stats.VPIP_P) - parseFloat(stats.PFR_P)) : parseFloat(stats[r.key]);
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


// --- CHART RENDERING FUNCTIONS ---

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
                data: stats.profitHistory.map(p => p.profit),
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                fill: true,
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
    optionsStyle.plugins.legend.display = true; // Show legend for this chart

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

export function clearAllTabs() {
    document.querySelectorAll('.main-tab-pane').forEach(pane => {
        pane.innerHTML = '';
    });
    Object.keys(chartInstances).forEach(id => destroyChart(id));
}

window.addEventListener('themeChanged', updateChartsForTheme);

