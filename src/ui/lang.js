const translations = {
    zh: {
        // --- 通用 UI ---
        title: "GGPoker 手牌分析儀",
        subtitle: "數據驅動決策，洞悉致勝之道",
        upload_title: "上傳牌譜",
        analyze_data: "開始分析",
        download_data: "下載原始數據",
        clear_all: "全部清除",
        loading: "正在分析您的數據...",
        welcome_title: "歡迎使用GGPoker 手牌分析儀",
        welcome_p1: "上傳您的 GGPoker .txt 牌譜文件，即可深入洞察您的遊戲風格、盈利能力與潛在漏洞。",
        upload_click: "點擊或拖曳檔案到此處",
        upload_drag: "支援 .txt, .json 格式",
        upload_supported: "所有數據均在您的瀏覽器本地處理，確保隱私安全。",
        analysis_options: "分析選項",
        uploaded_files: "已上傳的檔案",
        no_files_uploaded: "尚未上傳任何檔案",
        game_type_all: "所有遊戲類型",
        game_type_holdem: "德州撲克",
        game_type_omaha: "奧馬哈",
        error_no_data: "未找到有效的牌譜數據，請檢查文件內容。",
        error_no_data_in_filter: "在此遊戲類型下沒有數據，請嘗試選擇 '所有遊戲類型'。",
        error_generic: "分析過程中發生錯誤，請檢查您的文件或稍後再試。",
        
        // --- 分頁 ---
        tab_overview: "儀表總覽", tab_preflop: "翻前", tab_postflop: "翻後",
        tab_position: "位置", tab_time: "時間", tab_recommendations: "建議", tab_about: "關於",

        // --- 區塊標題 ---
        win_rate_stats: "盈利能力", preflop_style: "翻前風格", postflop_play: "翻後打法",
        session_info: "會話資訊", profit_chart_title: "總營利走勢圖 ($)",
        preflop_open: "翻前開局", preflop_vs_raise: "面對加注", steal_dynamics: "偷盲動態",
        postflop_as_aggressor: "作為翻前攻擊者", postflop_as_caller: "作為翻前跟注者",
        showdown_stats: "攤牌數據", aggression_stats: "各街道攻擊性",
        positional_profit: "各位置盈利能力 (BB/100)",
        positional_style: "各位置遊戲風格", positional_aggression: "各位置 3-Bet 頻率",
        winrate_by_weekday: "按星期分析勝率 (BB/100)", winrate_by_hour: "按小時分析勝率 (BB/100)",
        player_style_radar: "玩家風格雷達圖",

        // --- 數據指標 & 提示 ---
        total_hands: "總手牌", tooltip_total_hands: "分析的總手牌數量。",
        total_profit: "總營利", tooltip_total_profit: "您的總盈利或虧損金額。",
        bb_per_100: "BB/100", tooltip_bb_per_100: "每100手牌的平均盈利（以大盲為單位）。這是衡量您真實勝率的核心指標。",
        profit_bb: "總盈虧(BB)", tooltip_profit_bb: "以大盲注為單位的總盈利或虧損。",
        total_rake: "總水錢", tooltip_total_rake: "您在此會話中貢獻的總水錢金額(包含基本抽水加上Jackpot抽水)。",
        total_profit_with_rake: "總營利 (含水錢)", tooltip_total_profit_with_rake: "您的總營利或虧損金額，包含您贏得的底池和貢獻的水錢。",
        bb_with_rake_per_100: "BB/100 (含水錢)", tooltip_bb_with_rake_per_100: "每100手牌的平均盈利（以大盲為單位），已將水錢計入。這是衡量您真實勝率的核心指標。",
        profit_with_rake_bb: "總盈虧 (含水錢，BB)", tooltip_profit_with_rake_bb: "以大盲注為單位的總盈利或虧損，包含水錢。",
        total_jackpot: "總Jackpot", tooltip_total_jackpot: "您在牌局中累積的 Jackpot 總金額。",
        profit_with_rake_per_hour: "時薪 (含水錢, $)", tooltip_profit_with_rake_per_hour: "以美金計算的平均每小時盈利，已將水錢計入。",

        vpip: "VPIP", tooltip_vpip: "自願投錢入池率 (Voluntarily Put in Pot)。衡量您玩牌鬆緊的關鍵指標。理想範圍約在 20-28%。",
        pfr: "PFR", tooltip_pfr: "翻前加注率 (Pre-Flop Raise)。衡量您翻前攻擊性的指標。理想範圍約在 15-23%。",
        limp: "溜入率", tooltip_limp: "在無人加注的情況下，您第一個入池的方式是跟注而非加注的頻率。高水平玩家此數據趨近於0。",

        "3bet": "3Bet PF", tooltip_3bet: "翻前再加注率。面對一個開局加注時，您再加注的頻率。理想範圍約在 7-12%。",
        "4bet": "4Bet PF", tooltip_4bet: "翻前4Bet率。面對一個3-Bet時，您再加注的頻率。",
        fold_vs_3bet: "棄牌給3Bet", tooltip_fold_vs_3bet: "您在開局加注後，面對3-Bet時棄牌的頻率。過高 (>65%) 表示您的開局範圍易受攻擊。",
        fold_vs_4bet: "棄牌給4Bet", tooltip_fold_vs_4bet: "您在3-Bet之後，面對對手4-Bet時棄牌的頻率。",
        cold_call: "冷跟注", tooltip_cold_call: "當您前面有玩家開局加注，而您選擇跟注時的比率。",
        squeeze: "擠壓", tooltip_squeeze: "當有開局加注和至少一個跟注玩家時，您再加注的頻率。",

        steal_attempt: "偷盲率", tooltip_steal_attempt: "您在CO或BTN位置，前面玩家都棄牌時，您開局加注的頻率。理想值應高於 35%。",
        fold_to_steal: "棄牌給偷盲", tooltip_fold_to_steal: "您在盲注位，面對來自CO或BTN的開局加注時，您棄牌的頻率。理想值應低於 75%。",
        
        cbet_flop: "CBet翻牌", tooltip_cbet_flop: "您作為翻前攻擊者，在翻牌圈下注的頻率。理想範圍約在 50-75%。",
        cbet_turn: "CBet轉牌", tooltip_cbet_turn: "在翻牌圈CBet後，您在轉牌圈繼續下注的頻率。",
        cbet_river: "CBet河牌", tooltip_cbet_river: "在轉牌圈CBet後，您在河牌圈繼續下注的頻率。",

        fold_to_cbet_flop: "棄牌給CBet", tooltip_fold_to_cbet_flop: "面臨對手持續下注時，您在翻牌圈棄牌的頻率。過高 (>60%) 表示您在翻後過於輕易放棄。",
        raise_cbet_flop: "加注CBet", tooltip_raise_cbet_flop: "您在翻牌圈面對對手的持續下注時，選擇加注的頻率。",
        check_raise_flop: "過牌-加注", tooltip_check_raise_flop: "您在翻牌圈先過牌，然後在對手下注後再加注的頻率。",
        donk_bet_flop: "領先下注", tooltip_donk_bet_flop: "您在不利位置，搶在翻前攻擊者之前首先下注的頻率。此數據通常應非常低。",
        bet_vs_missed_cbet: "反主動下注", tooltip_bet_vs_missed_cbet: "當翻前攻擊者在翻牌圈過牌時，您下注的頻率。",
        probe_bet_turn: "轉牌探測下注", tooltip_probe_bet_turn: "翻牌圈所有人都過牌後，您在轉牌圈首先下注的頻率。",
        
        wtsd: "攤牌率", tooltip_wtsd: "看到翻牌後，堅持到攤牌的頻率。理想範圍約 25-32%。",
        wtsd_won: "攤牌贏率", tooltip_wtsd_won: "在攤牌時獲勝的頻率。理想值應高於 50%。",
        wwsf: "看到翻牌贏率", tooltip_wwsf: "只要看到翻牌，最終贏得底池的頻率。",
        wtsd_after_cbet: "CBet後攤牌率", tooltip_wtsd_after_cbet: "您在翻牌圈C-Bet之後，最終進到攤牌的頻率。",
        wwsf_as_pfr: "作為PFR的WWSF", tooltip_wwsf_as_pfr: "您作為翻前加注者時，只要看到翻牌就贏得底池的頻率。",
        wwsf_as_caller: "作為跟注者的WWSF", tooltip_wwsf_as_caller: "您作為翻前跟注者時，只要看到翻牌就贏得底池的頻率。",

        afq_flop: "AFq翻牌", tooltip_afq_flop: "翻牌圈攻擊頻率: (Bets + Raises) / (Bets + Raises + Calls + Checks)。衡量您翻後攻擊性的指標。",
        afq_turn: "AFq轉牌", tooltip_afq_turn: "轉牌圈攻擊頻率。",
        afq_river: "AFq河牌", tooltip_afq_river: "河牌圈攻擊頻率。",
        preflop_aggression: "翻前攻擊性",
        
        total_duration: "總時長", tooltip_total_duration: "所有獨立遊戲Session的總時長。相鄰牌局間隔超過45分鐘即視為新的Session。",
        hands_per_hour: "手牌/小時", tooltip_hands_per_hour: "平均每小時玩的手牌數量。",
        profit_per_hour: "時薪 ($)", tooltip_profit_per_hour: "以美金計算的平均每小時盈利。",
        tooltip_delete_file: "刪除此檔案",
        
        // --- 優化建議 ---
        rec_title: "📈 您的專屬優化建議",
        rec_good: "表現出色！您的數據顯示出紮實且均衡的策略。繼續保持！",
        rec_limp_high: "🐠 **減少溜入 (Limp)**：溜入是個被動且虧損的打法。嘗試用加注來代替溜入，即使是中等牌力的手牌，這樣能讓你掌握主動權。",
        rec_vpip_high: "🎰 **收緊遊戲範圍 (VPIP)**：您的入池率過高，意味著玩了太多弱牌。請收緊您的起手牌範圍，特別是在前面位置時要更有紀律。",
        rec_vpip_low: "🗿 **放寬遊戲範圍 (VPIP)**：您玩得太緊，可能錯失了很多有利可圖的機會。嘗試在後面位置(CO, BTN)用更寬的範圍來開局和3-Bet。",
        rec_vpip_pfr_gap: "🤔 **提升翻前攻擊性**：VPIP和PFR的差距過大，意味著您跟注太多，打法被動。優秀的玩家更傾向於用加注或棄牌來代替跟注。",
        rec_3bet_low: "💣 **增加 3-Bet 頻率**：您的3-Bet頻率偏低。增加3-Bet不僅能贏得更多死錢，還能孤立弱玩家，並讓您的強牌得到更多價值。",
        rec_4bet_low: "🚀 **建立 4-Bet 威懾**：過低的4-Bet率會讓激進的對手肆無忌憚地3-Bet您。在面對3-Bet時，除了頂級強牌，也應該混入一些詐唬的4-Bet。",
        rec_fold_vs_3bet_high: "🛡️ **加強 3-Bet 防禦**：面對3-Bet時棄牌過多，會讓對手輕易剝削您的開局加注。您需要用一個更平衡的範圍來跟注或4-Bet反擊。",
        rec_steal_low: "🏴‍☠️ **更積極地偷盲**：盲注是桌上的無主寶藏！在CO和BTN位置時，更積極地偷取盲注是穩定盈利的關鍵。您的偷盲率應提升至35%以上。",
        rec_fold_to_steal_high: "💰 **加強盲注防守**：您輕易放棄了太多盲注。面對偷盲，您應該用一個更寬的範圍進行3-Bet或跟注來保衛您的盲注。",
        rec_cbet_low: "📉 **增加持續下注 (C-Bet)**：您在翻前掌握了主動權，但沒有在翻牌圈繼續施壓。在有利的牌面結構上，您應該更頻繁地進行持續下注。",
        rec_cbet_high: "💥 **優化 C-Bet 頻率**：您的持續下注太頻繁了。在多人底池、不利的牌面或面對難纏的對手時，學會用過牌來控制底池，這會讓您更難被預測。",
        rec_fold_to_cbet_high: "✋ **減少對 C-Bet 的棄牌**：對手的C-Bet不總是代表強牌。學會用聽牌、後門聽牌或對子來「漂浮」(Float)對手，或用加注來反擊。",
        rec_wtsd_low: "⏳ **不要過早放棄底池**：您在攤牌前棄牌太頻繁，可能被對手輕易詐唬。請評估底池賠率，用您有攤牌價值的牌跟注到底。",
        rec_wtsd_high_wtsd_won_low: "💸 **避免成為跟注站**：您的攤牌率過高，但攤牌贏率卻很低。這表示您用太多弱牌跟注到底了。學會做出艱難的棄牌，能為您省下大筆資金。",
        rec_afq_low: "🕊️ **提升翻後攻擊性 (AFq)**：您的翻後攻擊頻率偏低，打法過於和平。在有利可圖的時機，多用下注和加注來代替被動的過牌和跟注。",

        // --- About Page (Updated) ---
        about_github_link: "查看 GitHub 專案",
        about_title: "關於本專案",
        about_p1: "與市面上需要複雜設定和訂閱費的專業追蹤軟體（如 PokerTracker, Hold'em Manager）不同，本工具的目標是提供一個<strong>輕量、快速、免費且安全</strong>的替代方案。我們專注於<strong>網頁體驗</strong>，讓您不需要安裝任何軟體，只需打開瀏覽器，無論是在電腦前還是在移動裝置上，都能隨時隨地快速覆盤，找到自己的優勢與待改進之處。",
        report_strengths_title: "優勢 (Strengths)",
        report_strength1: "<strong>完全免費且開源：</strong> 無任何使用成本，程式碼透明，具備高度信任感。",
        report_strength2: "<strong>高度隱私保護：</strong> 所有運算均在使用者本機端完成，手牌數據不經過任何伺服器，無數據外洩風險。",
        report_strength3: "<strong>跨平台、免安裝：</strong> 只需要瀏覽器即可運作，方便在任何裝置上使用。",
        report_strength4: "<strong>數據可攜與累積：</strong> 分析結果可匯出成 JSON 檔案，方便使用者自行備份，並可在下次合併分析，實現長期數據追蹤。",
        report_strength5: "<strong>直觀的數據視覺化：</strong> 提供圖表化呈現，比單純閱讀文字檔更易於理解自己的表現趨勢。",
        report_weaknesses_title: "挑戰 (Challenges)",
        report_weakness1: "<strong>無即時 HUD 功能：</strong> 與專業軟體相比，無法在牌桌上即時顯示對手數據。",
        report_weakness2: "<strong>依賴手動上傳：</strong> 需要手動從 GGPoker 客戶端導出紀錄並上傳，操作上不如自動匯入的軟體便利。",
        report_weakness3: "<strong>數據維度較基礎：</strong> 目前提供的數據指標雖然核心，但與專業軟體相比仍不夠細緻 (例如：缺少特定牌型組合的獲利分析)。",
        report_weakness4: "<strong>前端計算效能瓶頸：</strong> 當手牌數量達到數十萬級別時，純前端 JavaScript 計算可能遇到效能瓶頸。",
        report_weakness5: "<strong>缺乏對手分析功能：</strong> 工具完全聚焦在使用者 (Hero) 本身的數據，無法建立對手資料庫進行針對性分析。",
        report_future_title: "未來藍圖 (Future Roadmap)",
        report_future1: "<strong>雲端後端整合：</strong> 將計算密集型的解析與統計工作移至後端，解決前端效能瓶頸。",
        report_future2: "<strong>使用者帳號系統：</strong> 引入帳號系統，讓使用者可以將分析結果自動儲存於雲端，實現跨裝置數據同步。",
        report_future3: "<strong>手牌視覺化重播：</strong> 點擊單一手牌紀錄，以圖形介面重播該手牌的完整過程。",
        report_future4: "<strong>進階數據篩選器：</strong> 允許使用者根據位置、起手牌、牌局結果等多維度篩選數據。",
        report_future5: "<strong>起手牌矩陣熱圖：</strong> 以 13x13 的矩陣圖顯示所有起手牌的 VPIP、PFR、獲利等數據。",
        report_future6: "<strong>特定賽事/盲注分析：</strong> 增加篩選功能，可只分析特定盲注等級或賽事類型 (如 Rush & Cash)。",
        report_future7: "<strong>更豐富的圖表類型：</strong> 增加圓餅圖 (行動分佈)、雷達圖 (玩家風格評估) 等。",
        report_future8: "<strong>簡易對手數據標記：</strong> 允許使用者在分析時，針對特定對手 ID 加上標籤 (如：魚、緊兇)。",
        report_future9: "<strong>目標導向學習模組：</strong> 根據數據弱點，自動推薦相關的撲克學習資源或文章連結。",
        report_future10: "<strong>社群分享報告：</strong> 產生一個可分享的唯讀報告頁面連結，方便與教練或朋友討論數據。",
    },
    en: {
        // --- General UI ---
        title: "GGPoker Hand Analyzer",
        subtitle: "Data-Driven Decisions, Insights to Victory",
        upload_title: "Upload Hand History",
        analyze_data: "Start Analysis",
        download_data: "Download Raw Data",
        clear_all: "Clear All",
        loading: "Analyzing your data...",
        welcome_title: "Welcome to GGPoker Hand Analyzer",
        welcome_p1: "Upload your GGPoker .txt hand history files to get deep insights into your play style, profitability, and potential leaks.",
        upload_click: "Click or drag file to this area to upload",
        upload_drag: "Supports .txt, .json formats",
        upload_supported: "All data is processed locally in your browser for your privacy.",
        analysis_options: "Analysis Options",
        uploaded_files: "Uploaded Files",
        no_files_uploaded: "No files uploaded yet",
        game_type_all: "All Game Types",
        game_type_holdem: "Hold'em",
        game_type_omaha: "Omaha",
        error_no_data: "No valid hand history data found. Please check the file content.",
        error_no_data_in_filter: "No data available for this game type. Try selecting 'All Game Types'.",
        error_generic: "An error occurred during analysis. Please check your files or try again later.",
        
        // --- Tabs ---
        tab_overview: "Dashboard", tab_preflop: "Preflop", tab_postflop: "Postflop",
        tab_position: "Position", tab_time: "Time", tab_recommendations: "Recommendations", tab_about: "About",

        // --- Block Titles ---
        win_rate_stats: "Profitability", preflop_style: "Preflop Style", postflop_play: "Postflop Play",
        session_info: "Session Info", profit_chart_title: "Total Profit Chart ($)",
        preflop_open: "Preflop Open", preflop_vs_raise: "Vs. Raise", steal_dynamics: "Steal Dynamics",
        postflop_as_aggressor: "As Preflop Aggressor", postflop_as_caller: "As Preflop Caller",
        showdown_stats: "Showdown Stats", aggression_stats: "Aggression by Street",
        positional_profit: "Positional Profitability (BB/100)",
        positional_style: "Positional Play Style", positional_aggression: "Positional 3-Bet Freq.",
        winrate_by_weekday: "Win Rate by Day of the Week (BB/100)", winrate_by_hour: "Win Rate by Hour (BB/100)",
        player_style_radar: "Player Style Radar Chart",


        // --- Metrics & Tooltips ---
        total_hands: "Total Hands", tooltip_total_hands: "The total number of hands analyzed.",
        total_profit: "Total Profit", tooltip_total_profit: "Your total profit or loss amount.",
        bb_per_100: "BB/100", tooltip_bb_per_100: "Average profit per 100 hands in big blinds. This is a core metric for your true win rate.",
        profit_bb: "Total Profit (BB)", tooltip_profit_bb: "Total profit or loss in terms of big blinds.",
        total_rake: "Total Rake", tooltip_total_rake: "The total amount of rake you contributed(w/ Rake & Jackpot).",
        total_profit_with_rake: "Total Profit (w/ Rake)", tooltip_total_profit_with_rake: "Your total profit or loss, including pots won and rake contributed.",
        bb_with_rake_per_100: "BB/100 (w/ Rake)", tooltip_bb_with_rake_per_100: "Average profit per 100 hands in big blinds, with rake considered. This is a core metric for your true win rate.",
        profit_with_rake_bb: "Total Profit (w/ Rake, BB)", tooltip_profit_with_rake_bb: "Your total profit or loss in big blinds, including rake.",
        total_jackpot: "Total Jackpot", tooltip_total_jackpot: "The total jackpot amount you've accumulated in your hands.",
        
        vpip: "VPIP", tooltip_vpip: "Voluntarily Put in Pot. Measures how loose/tight you play. Ideal range is around 20-28%.",
        pfr: "PFR", tooltip_pfr: "Pre-Flop Raise. Measures your preflop aggression. Ideal range is around 15-23%.",
        limp: "Limp %", tooltip_limp: "Frequency of entering the pot by calling instead of raising. High-level players have this stat close to 0.",

        "3bet": "3Bet PF", tooltip_3bet: "Preflop 3-Bet percentage. Frequency of re-raising an open-raise. Ideal range is around 7-12%.",
        "4bet": "4Bet PF", tooltip_4bet: "Preflop 4-Bet percentage. Frequency of re-raising a 3-bet.",
        fold_vs_3bet: "Fold to 3-Bet", tooltip_fold_vs_3bet: "Frequency of folding to a 3-bet after you open-raised. Too high (>65%) is exploitable.",
        fold_vs_4bet: "Fold to 4-Bet", tooltip_fold_vs_4bet: "Frequency of folding to a 4-bet after you have 3-bet.",
        cold_call: "Cold Call", tooltip_cold_call: "Frequency of calling a raise when you haven't yet invested money in the pot.",
        squeeze: "Squeeze", tooltip_squeeze: "Frequency of re-raising when there has been a raise and one or more callers before you.",

        steal_attempt: "Steal Attempt", tooltip_steal_attempt: "Frequency of open-raising from CO or BTN. Should be above 35%.",
        fold_to_steal: "Fold to Steal", tooltip_fold_to_steal: "Frequency of folding from the blinds to a steal attempt. Should be below 75%.",
        
        cbet_flop: "C-Bet Flop", tooltip_cbet_flop: "Continuation Bet on the flop as the preflop aggressor. Ideal range is 50-75%.",
        cbet_turn: "C-Bet Turn", tooltip_cbet_turn: "Continuation Bet on the turn after c-betting the flop.",
        cbet_river: "C-Bet River", tooltip_cbet_river: "Continuation Bet on the river after c-betting the turn.",

        fold_to_cbet_flop: "Fold to C-Bet", tooltip_fold_to_cbet_flop: "Frequency of folding to a flop C-Bet. Too high (>60%) means you're over-folding postflop.",
        raise_cbet_flop: "Raise C-Bet", tooltip_raise_cbet_flop: "Frequency of raising versus an opponent's continuation bet on the flop.",
        check_raise_flop: "Check-Raise", tooltip_check_raise_flop: "Frequency of checking then raising an opponent's bet on the flop.",
        donk_bet_flop: "Donk Bet", tooltip_donk_bet_flop: "Frequency of betting out of position before the preflop aggressor has acted. Should be very low.",
        bet_vs_missed_cbet: "Bet vs Missed C-Bet", tooltip_bet_vs_missed_cbet: "Frequency of betting when the preflop aggressor checks back on the flop.",
        probe_bet_turn: "Probe Bet Turn", tooltip_probe_bet_turn: "Frequency of betting on the turn when the flop was checked through.",
        
        wtsd: "WTSD", tooltip_wtsd: "Went To Showdown. Frequency of reaching showdown after seeing the flop. Ideal range is 25-32%.",
        wtsd_won: "W$SD", tooltip_wtsd_won: "Won at Showdown. Frequency of winning the pot at showdown. Should be above 50%.",
        wwsf: "WWSF", tooltip_wwsf: "Won When Saw Flop. Frequency of winning the pot anytime after seeing the flop.",
        wtsd_after_cbet: "WTSD After C-Bet", tooltip_wtsd_after_cbet: "Frequency of going to showdown after you make a continuation bet on the flop.",
        wwsf_as_pfr: "WWSF as PFR", tooltip_wwsf_as_pfr: "Won When Saw Flop frequency when you were the pre-flop aggressor.",
        wwsf_as_caller: "WWSF as Caller", tooltip_wwsf_as_caller: "Won When Saw Flop frequency when you were a pre-flop caller.",
        
        afq_flop: "AFq Flop", tooltip_afq_flop: "Aggression Frequency on the Flop: (Bets + Raises) / (Bets + Raises + Calls + Checks).",
        afq_turn: "AFq Turn", tooltip_afq_turn: "Aggression Frequency on the Turn.",
        afq_river: "AFq River", tooltip_afq_river: "Aggression Frequency on the River.",
        preflop_aggression: "Preflop Aggression",
        
        total_duration: "Total Duration", tooltip_total_duration: "Total duration of all sessions. A new session starts after a 45-minute break.",
        hands_per_hour: "Hands/Hour", tooltip_hands_per_hour: "Average number of hands played per hour.",
        profit_per_hour: "Profit/Hour ($)", tooltip_profit_per_hour: "Average profit per hour in USD.",
        profit_with_rake_per_hour: "Profit/Hour (w/ Rake, $)", tooltip_profit_with_rake_per_hour: "Average profit per hour in USD, with rake considered.",

        tooltip_delete_file: "Delete this file",

        // --- Recommendations ---
        rec_title: "📈 Your Personalized Recommendations",
        rec_good: "Excellent Play! Your stats show a solid and balanced strategy. Keep it up!",
        rec_limp_high: "🐠 **Reduce Limping**: Limping is a passive and generally losing play. Try replacing limps with raises to take control of the pot.",
        rec_vpip_high: "🎰 **Tighten Your Range (VPIP)**: Your VPIP is too high, meaning you're playing too many weak hands. Tighten your starting hand selection, especially from early positions.",
        rec_vpip_low: "🗿 **Loosen Your Range (VPIP)**: You're playing too tight and may be missing profitable opportunities. Try opening up your range, especially from late positions (CO, BTN).",
        rec_vpip_pfr_gap: "🤔 **Increase Preflop Aggression**: A large gap between VPIP and PFR indicates passive play (too much calling). Profitable players prefer to either raise or fold preflop.",
        rec_3bet_low: "💣 **Increase 3-Bet Frequency**: Your 3-bet frequency is low. 3-betting more often wins dead money, isolates weaker players, and gets more value for your strong hands.",
        rec_4bet_low: "🚀 **Establish a 4-Bet Threat**: A low 4-bet rate allows aggressive opponents to 3-bet you relentlessly. You should be 4-betting a balanced range of value and bluffs.",
        rec_fold_vs_3bet_high: "🛡️ **Defend Against 3-Bets More**: You're folding too much to 3-bets, which makes your opens easily exploitable. You need to defend by calling and 4-betting with a wider, balanced range.",
        rec_steal_low: "🏴‍☠️ **Steal More Blinds**: The blinds are free money on the table! Stealing them aggressively from the CO and BTN is crucial for your win rate. Aim for over 35%.",
        rec_fold_to_steal_high: "💰 **Defend Your Blinds More**: You are giving up your blinds too easily. You should defend your blinds against steals more often with 3-bets and calls.",
        rec_cbet_low: "📉 **Increase C-Bet Frequency**: You're taking initiative preflop but not following through. You should be continuation betting more frequently on favorable board textures.",
        rec_cbet_high: "💥 **Optimize C-Bet Frequency**: You are c-betting too often. Learn to check-back on wet boards, in multi-way pots, or against tough opponents to make your game less predictable.",
        rec_fold_to_cbet_high: "✋ **Fold Less to C-Bets**: Opponents' c-bets aren't always strong. Learn to 'float' their bets with draws or pairs, or even raise as a bluff to counter-attack.",
        rec_wtsd_low: "⏳ **Don't Give Up Pots Too Early**: You are folding before showdown too often and can be bluffed easily. Consider pot odds and your hand's equity to make better calls.",
        rec_wtsd_high_wtsd_won_low: "💸 **Avoid Being a Calling Station**: Your WTSD is high, but your W$SD is low. This indicates you're calling down with too many weak hands. Learn to make tough folds to save money.",
        rec_afq_low: "🕊️ **Increase Postflop Aggression (AFq)**: Your postflop aggression is low. Look for more opportunities to bet and raise instead of passively checking and calling.",

        // --- About Page (Updated) ---
        about_github_link: "View Project on GitHub",
        about_title: "About This Project",
        about_p1: "Unlike professional tracking software like PokerTracker or Hold'em Manager, which require complex setups and subscriptions, this tool aims to be a <strong>lightweight, fast, free, and secure</strong> alternative. We focus on the <strong>web experience</strong>, so you don't need to install anything. Just open your browser—on your desktop or mobile device—to quickly review your sessions anytime, anywhere, and find your edge.",
        report_strengths_title: "Strengths",
        report_strength1: "<strong>Completely Free & Open-Source:</strong> No costs involved. The code is transparent and trustworthy.",
        report_strength2: "<strong>High Privacy Protection:</strong> All computations are done locally on your device. Hand data never touches a server, eliminating the risk of data leaks.",
        report_strength3: "<strong>Cross-Platform & No Installation:</strong> Works in any modern browser, making it accessible on any device.",
        report_strength4: "<strong>Data Portability & Accumulation:</strong> Analysis results can be exported as a JSON file for personal backup and can be re-imported to merge with new sessions for long-term tracking.",
        report_strength5: "<strong>Intuitive Visualization:</strong> Charts and graphs make it easier to understand your performance trends than reading raw text files.",
        report_weaknesses_title: "Challenges",
        report_weakness1: "<strong>No Real-time HUD:</strong> Unlike professional software, it cannot display opponent stats on the table in real-time.",
        report_weakness2: "<strong>Manual Upload Required:</strong> You need to manually export hand histories from the GGPoker client and upload them.",
        report_weakness3: "<strong>Basic Metrics:</strong> While covering core stats, the level of detail is less granular than professional tools (e.g., no profit analysis by specific holdings).",
        report_weakness4: "<strong>Frontend Performance Bottleneck:</strong> With hundreds of thousands of hands, client-side JavaScript calculation might slow down or cause the browser to lag.",
        report_weakness5: "<strong>No Opponent Analysis:</strong> The tool is entirely focused on 'Hero's' data and does not build a database for analyzing specific opponents.",
        report_future_title: "Future Roadmap",
        report_future1: "<strong>Cloud Backend Integration:</strong> Move computation-heavy tasks to a backend service to resolve frontend performance issues.",
        report_future2: "<strong>User Accounts & Data Sync:</strong> Introduce user accounts to automatically save analysis results to the cloud, enabling cross-device data synchronization.",
        report_future3: "<strong>Visual Hand Replayer:</strong> Add a feature to replay a selected hand graphically from start to finish.",
        report_future4: "<strong>Advanced Data Filters:</strong> Allow users to filter data by position, starting hands, pot size, and more for deeper analysis.",
        report_future5: "<strong>Starting Hand Matrix Heatmap:</strong> Display VPIP, PFR, and profit data for all starting hands on a 13x13 grid.",
        report_future6: "<strong>Specific Game/Stake Analysis:</strong> Add filters for specific stake levels or game types (e.g., Rush & Cash).",
        report_future7: "<strong>More Chart Types:</strong> Introduce pie charts (e.g., action distribution by position) and radar charts (for a holistic view of a player's style).",
        report_future8: "<strong>Simple Opponent Tagging:</strong> While not a full HUD, allow users to add tags (e.g., Fish, TAG) to opponent IDs during review.",
        report_future9: "<strong>Goal-Oriented Learning Modules:</strong> Recommend relevant poker learning resources based on identified statistical weaknesses.",
        report_future10: "<strong>Shareable Reports:</strong> Generate a shareable, read-only link to a report page (excluding sensitive details) for discussions with coaches or friends.",
    }
};

let currentLanguage = 'en';

export function setLanguage(lang) {
    return new Promise((resolve) => {
        if (translations[lang]) {
            currentLanguage = lang;
        } else {
            currentLanguage = 'en'; // Fallback to English
        }
        localStorage.setItem('language', currentLanguage);
        updateUIText();
        resolve();
    });
}


export function getLang(key, fallback = '') {
    return translations[currentLanguage]?.[key] || translations.en?.[key] || fallback || key;
}

export function updateUIText() {
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        const translation = getLang(key);
        if (translation) {
             // Handle specific elements like title
            if (element.tagName === 'TITLE') {
                element.textContent = translation;
            } else {
                 element.innerHTML = translation;
            }
        }
    });
    document.querySelectorAll('[data-lang-tab]').forEach(element => {
        const key = element.getAttribute('data-lang-tab');
        element.textContent = getLang(key);
    });
}
