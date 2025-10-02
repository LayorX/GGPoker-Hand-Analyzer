# GGPoker Hand Analyzer v1.0.0 - 首次公開發行版

**發行日期:** 2025年10月2日

我們非常榮幸地宣布 **GGPoker Hand Analyzer v1.0.0** 的首次公開發行！這是一個完全免費、注重隱私、專注於輕量化網頁體驗的 GGPoker 手牌分析工具，旨在幫助玩家隨時隨地覆盤，提升撲克技巧。

---

## 繁體中文

### ✨ 主要亮點 (Key Features)

*   **🔐 絕對隱私，本地處理**: 您的所有手牌紀錄 **只在您的瀏覽器中進行解析和計算**，絕不經過任何網路伺服器。您的數據 100% 安全，完全由您掌控。
*   **📊 全方位統計儀表板**: 提供超過 40 項關鍵撲克數據，包括 VPIP, PFR, 3-Bet, C-Bet, WTSD% 等，並以 BB/100 hands、時薪等維度進行綜合評估。
*   **📈 互動式圖表視覺化**:
    *   **盈利走勢圖**: 清晰展示您的累積盈利曲線（包含/不含 rake）。
    *   **位置數據分析**: 視覺化比較您在不同位置（EP, MP, CO, BTN, SB, BB）的表現差異。
    *   **時間維度分析**: 分析您在一周中的哪幾天或一天中的哪些時段表現最佳。
*   **🚀 輕量高效，免安裝**: 無需安裝任何軟體，只需下載 `dist` 資料夾，用瀏覽器打開 `index.html` 即可開始使用。同時支援 PWA (漸進式網頁應用)，可「安裝」到桌面以獲得更佳體驗。
*   **💾 數據可攜與合併**: 分析結果可以匯出為 `.json` 檔案，方便您備份和轉移。您也可以在上傳新手牌紀錄時，同時匯入舊的 `.json` 報告，實現長期數據的合併與追蹤。
*   **🌐 多語言支援**: 內建繁體中文與英文介面，滿足不同地區玩家的需求。

### 🚀 如何開始 (Getting Started)

1.  從本 Release 頁面下載 `GGPoker-Hand-Analyzer-v1.0.0.zip` 檔案。
2.  解壓縮該檔案。
3.  在解壓縮後的資料夾中，使用您的網頁瀏覽器（建議使用 Chrome, Firefox, Edge）打開 `index.html` 檔案。
4.  點擊上傳區域，選擇您從 GGPoker Pokercraft 下載的手牌歷史 `.txt` 檔案。
5.  立即查看您的個人化數據報告！

或者，您也可以直接訪問我們的 **[線上 DEMO](https://layorx.github.io/ggpokerAnalyzer/index.html)** 來快速體驗。

### 🛠️ 技術棧 (Tech Stack)

*   **建構工具**: Vite
*   **核心邏輯**: Vanilla JavaScript (ESM)
*   **樣式框架**: Tailwind CSS
*   **圖表庫**: Chart.js

### 🗺️ 未來藍圖 (What's Next)

這只是我們的第一步。我們計劃在未來的版本中加入更多強大的功能，例如：
*   **Web Worker 效能優化**: 將密集計算移至背景執行緒，流暢分析數十萬手牌。
*   **IndexedDB 本地資料庫**: 自動儲存分析結果，免去手動匯入匯出的麻煩。
*   **手牌視覺化重播 (Hand Replayer)**: 以圖形介面重播任一手牌的完整過程。
*   **進階數據篩選器**: 根據位置、起手牌、行動等多維度篩選數據。

### 💖 貢獻與反饋 (Contributing & Feedback)

本專案為開源專案，我們歡迎任何形式的貢獻。如果您發現任何問題或有功能建議，請不要猶豫，立即在 [GitHub Issues](https://github.com/Layorx/GGPoker-Hand-Analyzer/issues) 頁面告訴我們！

---
---

## English

### ✨ Key Features

*   **🔐 Absolute Privacy, Local Processing**: All your hand history files are **processed and analyzed directly in your browser**. No data is ever sent over the network. Your data is 100% secure and under your control.
*   **📊 Comprehensive Stats Dashboard**: Get insights from over 40 key poker statistics, including VPIP, PFR, 3-Bet, C-Bet, WTSD%, and evaluate your performance with metrics like BB/100 hands and profit per hour.
*   **📈 Interactive & Visual Charts**:
    *   **Profit Graph**: Clearly visualize your cumulative profit trend (with and without rake).
    *   **Positional Analysis**: Compare your performance across different positions (EP, MP, CO, BTN, SB, BB).
    *   **Time-based Analysis**: Discover which days of the week or hours of the day you play best.
*   **🚀 Lightweight, No Installation**: No software installation is required. Simply download the `dist` folder and open `index.html` in your browser to get started. It also supports PWA (Progressive Web App), allowing you to "install" it to your desktop for a better experience.
*   **💾 Data Portability & Merging**: Export your analysis results as a `.json` file for backup and portability. You can also merge old `.json` reports when uploading new hand histories to track your long-term performance.
*   **🌐 Multi-language Support**: Built-in support for Traditional Chinese and English to cater to players from different regions.

### 🚀 Getting Started

1.  Download the `GGPoker-Hand-Analyzer-v1.0.0.zip` file from this release page.
2.  Unzip the downloaded file.
3.  Inside the unzipped folder, open the `index.html` file with your web browser (Chrome, Firefox, or Edge is recommended).
4.  Click the upload area and select the hand history `.txt` files you downloaded from GGPoker's Pokercraft.
5.  Instantly view your personalized data report!

Alternatively, you can try our **[Live DEMO](https://layorx.github.io/ggpokerAnalyzer/index.html)** for a quick experience.

### 🛠️ Tech Stack

*   **Build Tool**: Vite
*   **Core Logic**: Vanilla JavaScript (ESM)
*   **Styling**: Tailwind CSS
*   **Charts**: Chart.js

### 🗺️ What's Next

This is just the beginning. We plan to introduce more powerful features in future releases, such as:
*   **Web Worker Performance Boost**: Moving heavy computations to a background thread for smooth analysis of hundreds of thousands of hands.
*   **IndexedDB Local Database**: Automatically saving analysis results to eliminate the hassle of manual import/export.
*   **Visual Hand Replayer**: Replaying the full course of any hand in a graphical interface.
*   **Advanced Data Filters**: Filtering data based on multiple dimensions like position, starting hands, and actions.

### 💖 Contributing & Feedback

This is an open-source project, and we welcome all forms of contribution. If you encounter any bugs or have feature suggestions, please don't hesitate to let us know on the [GitHub Issues](https://github.com/Layorx/GGPoker-Hand-Analyzer/issues) page!
