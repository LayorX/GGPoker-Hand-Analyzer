import { parseHandHistories } from './lib/parser.js';
import { calculateStats, mergeStats, filterStatsByGameType } from './lib/stats.js';
import { 
    renderDashboard, 
    renderRecommendations,
    renderPreflopTab,
    renderPostflopTab,
    renderPositionTab,
    renderTimeTab,
    renderAboutTab,
    clearAllTabs
} from './ui/dashboard.js';
import { setLanguage, updateUIText, getLang } from './ui/lang.js';
import { downloadJson } from './utils.js';
import { initializeTheme } from './ui/theme.js';

// --- 全域狀態管理 ---
const AppState = {
    files: [],
    rawStats: null,
    filteredStats: null,
    selectedGameType: 'All',
};

// --- DOM 元素 (延遲到 initialize 中賦值) ---
let fileUploadInput, analyzeButton, welcomeOrLoading, dashboardContent;
let fileListContainer, gameTypeSelector, downloadButton, clearAllButton, languageSwitcher;
let welcomeMessage, loadingSpinner;


function initialize() {
    // --- DOM 元素獲取 ---
    fileUploadInput = document.getElementById('file-upload');
    analyzeButton = document.getElementById('analyze-button');
    welcomeOrLoading = document.getElementById('welcome-or-loading');
    dashboardContent = document.getElementById('dashboard-content');
    fileListContainer = document.getElementById('file-list');
    gameTypeSelector = document.getElementById('game-type-selector');
    downloadButton = document.getElementById('download-data-button');
    clearAllButton = document.getElementById('clear-all-button');
    languageSwitcher = document.getElementById('language-switcher');
    welcomeMessage = document.getElementById('welcome-message');
    loadingSpinner = document.getElementById('loading-spinner');
    
    // --- 模組初始化 ---
    initializeTheme();
    setupEventListeners();
    initializeTabs();

    const savedLang = localStorage.getItem('language') || 'zh';
    languageSwitcher.value = savedLang;
    setLanguage(savedLang).then(() => {
        if (!AppState.filteredStats) {
             showWelcomeMessage();
        } else {
             rerenderAllTabs(AppState.filteredStats);
        }
    });
}

function showWelcomeMessage() {
    welcomeOrLoading.classList.remove('hidden');
    welcomeOrLoading.classList.add('flex');
    dashboardContent.classList.add('hidden');
    welcomeMessage.classList.remove('hidden');
    loadingSpinner.classList.add('hidden');
    updateUIText();
}

function showLoading() {
    welcomeOrLoading.classList.remove('hidden');
    welcomeOrLoading.classList.add('flex');
    dashboardContent.classList.add('hidden');
    welcomeMessage.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    updateUIText();
}

function setupEventListeners() {
    fileUploadInput.addEventListener('change', handleFileUpload);
    
    gameTypeSelector.addEventListener('change', (e) => {
        AppState.selectedGameType = e.target.value;
        if (AppState.rawStats) {
            runAnalysisAndRender();
        }
    });

    analyzeButton.addEventListener('click', handleAnalyzeAllFiles);
    downloadButton.addEventListener('click', handleDownloadData);
    clearAllButton.addEventListener('click', handleClearAll);

    languageSwitcher.addEventListener('change', (e) => {
        setLanguage(e.target.value).then(() => {
            if (AppState.filteredStats) {
                rerenderAllTabs(AppState.filteredStats);
            }
        });
    });
    
    fileListContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button.delete-file-btn');
        if (target) {
            handleDeleteFile(target.dataset.fileId);
        }
    });
    
    const mobileTabs = document.getElementById('mobile-tabs');
    if (mobileTabs) {
        mobileTabs.addEventListener('change', (e) => {
            const tabId = e.target.value;
            switchTab(tabId);
        });
    }
}

// --- 檔案處理 ---
async function handleFileUpload(event) {
    const newFiles = Array.from(event.target.files);
    if (newFiles.length === 0) return;

    for (const file of newFiles) {
        const fileId = `${file.name}-${file.lastModified}`;
        if (AppState.files.some(f => f.id === fileId)) continue;
        
        try {
            const content = await file.text();
            const type = file.name.endsWith('.txt') ? 'txt' : (file.name.endsWith('.json') ? 'json' : null);
            if (type) {
                AppState.files.push({ id: fileId, name: file.name, content, type });
            }
        } catch(e) {
            console.error(`Error reading file ${file.name}:`, e);
        }
    }
    renderFileList();
    analyzeButton.disabled = AppState.files.length === 0;
}

function renderFileList() {
    if (AppState.files.length === 0) {
        fileListContainer.innerHTML = `<p class="text-dim text-sm px-2" data-lang="no_files_uploaded"></p>`;
    } else {
        fileListContainer.innerHTML = AppState.files.map(file => `
            <div class="flex justify-between items-center bg-gray-500/10 p-2 rounded">
                <span class="truncate text-sm" title="${file.name}">${file.name}</span>
                <button class="delete-file-btn text-dim hover:text-inherit transition-colors" data-file-id="${file.id}" title="${getLang('tooltip_delete_file')}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        `).join('');
    }
    updateUIText();
}

function handleDeleteFile(fileId) {
    AppState.files = AppState.files.filter(f => f.id !== fileId);
    renderFileList();
    analyzeButton.disabled = AppState.files.length === 0;
}

function handleClearAll() {
    AppState.files = [];
    AppState.rawStats = null;
    AppState.filteredStats = null;
    fileUploadInput.value = '';
    renderFileList();
    
    downloadButton.classList.add('hidden');
    analyzeButton.disabled = true;
    showWelcomeMessage();
    clearAllTabs();
}

// --- 數據分析核心流程 ---
function handleAnalyzeAllFiles() {
    if (AppState.files.length === 0) return;

    showLoading();

    setTimeout(() => {
        try {
            const txtFiles = AppState.files.filter(f => f.type === 'txt');
            const jsonFiles = AppState.files.filter(f => f.type === 'json');

            let allStatsToMerge = [];

            if (txtFiles.length > 0) {
                const txtContents = txtFiles.map(f => f.content);
                const parsedHands = parseHandHistories(txtContents);
                console.dir(parsedHands);
                if (parsedHands.length > 0) {
                    AppState.rawStats = calculateStats(parsedHands);
                    allStatsToMerge.push(AppState.rawStats);
                }
            }

            jsonFiles.forEach(file => {
                try {
                    allStatsToMerge.push(JSON.parse(file.content));
                } catch (e) { console.error(`Error parsing JSON file ${file.name}:`, e); }
            });

            if (allStatsToMerge.length === 0) {
                alert(getLang('error_no_data'));
                showWelcomeMessage();
                return;
            }
            
            jsonFiles.length>0?AppState.rawStats = mergeStats(...allStatsToMerge):console.dir(allStatsToMerge);
            console.dir(AppState.rawStats);
            runAnalysisAndRender();

        } catch (error) {
            console.error("Analysis failed:", error);
            alert(getLang('error_generic'));
            showWelcomeMessage();
        }
    }, 100);
}

function runAnalysisAndRender() {
    if (!AppState.rawStats) return;
    AppState.filteredStats = filterStatsByGameType(AppState.rawStats, AppState.selectedGameType);
    
    if (AppState.filteredStats.totalHands === 0) {
        alert(getLang('error_no_data_in_filter'));
        return;
    }
    
    welcomeOrLoading.classList.add('hidden');
    dashboardContent.classList.remove('hidden');
    downloadButton.classList.remove('hidden');

    rerenderAllTabs(AppState.filteredStats);

    // 確保第一個分頁是 active 狀態
    const firstTabId = document.querySelector('.main-tab-link').getAttribute('data-tab');
    switchTab(firstTabId);
}

function rerenderAllTabs(stats) {
    clearAllTabs();
    renderDashboard(stats);
    renderPreflopTab(stats);
    renderPostflopTab(stats);
    renderPositionTab(stats);
    renderTimeTab(stats);
    renderRecommendations(stats);
    renderAboutTab();
    updateUIText();
}

// --- Tab 處理 ---
function switchTab(tabId) {
    const tabLinks = document.querySelectorAll('.main-tab-link');
    const tabPanes = document.querySelectorAll('.main-tab-pane');
    
    tabLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-tab') === tabId);
    });

    tabPanes.forEach(pane => {
        pane.classList.toggle('hidden', pane.id !== tabId);
    });
    
    const mobileTabs = document.getElementById('mobile-tabs');
    if (mobileTabs && mobileTabs.value !== tabId) {
        mobileTabs.value = tabId;
    }
}


function initializeTabs() {
    const tabContainer = document.querySelector('nav[aria-label="Tabs"]');
    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            e.preventDefault();
            const targetLink = e.target.closest('.main-tab-link');
            if(targetLink) {
                const tabId = targetLink.getAttribute('data-tab');
                switchTab(tabId);
            }
        });
    }
}

// --- 下載 ---
function handleDownloadData() {
    if (!AppState.rawStats) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const filename = `poker_analysis_raw_${dateStr}.json`;
    downloadJson(AppState.rawStats, filename);
}


// --- 啟動應用 ---
document.addEventListener('DOMContentLoaded', initialize);

