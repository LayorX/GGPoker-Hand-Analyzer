export function initializeTheme() {
    const themeSwitcher = document.getElementById('theme-switcher');
    
    // 優先從 localStorage 讀取，若無則跟隨系統
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    
    themeSwitcher.addEventListener('click', () => {
        // 【修改】將目標改回 document.documentElement (<html>)
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // 監聽系統主題變化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // 只有在用戶沒有手動設定主題時才跟隨系統
        if (!localStorage.getItem('theme')) {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            setTheme(newSystemTheme, false); // false 表示不儲存到 localStorage
        }
    });
}

function setTheme(theme, saveToStorage = true) {
    // 【修改】將目標改回 document.documentElement (<html>)
    const htmlEl = document.documentElement;
    htmlEl.classList.remove('light', 'dark');
    htmlEl.classList.add(theme);
    
    if (saveToStorage) {
        localStorage.setItem('theme', theme);
    }
    
    updateThemeIcon(theme);
    
    // 發送一個自定義事件，讓 dashboard.js 可以監聽並更新圖表
    window.dispatchEvent(new Event('themeChanged'));
}


function updateThemeIcon(theme) {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (!themeSwitcher) return;

    if (theme === 'dark') {
        // Sun Icon
        themeSwitcher.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
        themeSwitcher.title = "Switch to Light Mode";
    } else {
        // Moon Icon
        themeSwitcher.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
        themeSwitcher.title = "Switch to Dark Mode";
    }
}

