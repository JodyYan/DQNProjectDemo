# AI Smart Asset Allocation & DQN Pricing System

基於深度 Q 網路 (DQN) 的無後端智能投資組合與定價系統

這是一個結合強化學習 (Reinforcement Learning) 與前端邊緣運算 (Edge Computing) 的金融科技概念驗證 (PoC) 專案。

本專案突破了傳統 AI 應用依賴龐大後端伺服器的限制，將訓練好的 Deep Q-Network (DQN) 模型直接部署至瀏覽器端運行，實現了零伺服器成本、毫秒級延遲、且 100% 保護使用者隱私的智能投資輔助系統。

## 核心特色 (Key Features)

1. 邊緣運算 AI 推論 (Serverless Edge AI)

無後端架構：摒棄傳統 Client-Server 模型，使用 onnxruntime-web (WebAssembly) 將神經網路矩陣運算完全下放至使用者的瀏覽器端執行。

隱私保護：使用者的風險偏好、本金與資產配置等敏感資訊皆不需上傳雲端，徹底解決資安疑慮。

2. DQN 動態邊界定價演算法 (Boundary Inference)

逆向推論：有別於傳統時間序列預測，本系統將投資視為馬可夫決策過程 (MDP)。前端撰寫了專屬的掃描演算法，將價格變動百分比以迴圈方式動態輸入模型，找出 $Q_{buy} > Q_{hold}$ 與 $Q_{sell} > Q_{hold}$ 的「黃金交叉點」，從而產出具體的「建議承接價」與「建議賣出價」。

動態安全邊際：當使用者拉動「風險偏好滑桿」時，AI 會即時重新評估，保守型使用者將獲得更嚴格的安全邊際 (更低的建議買價)。

3. 雙重保險資料流與快取機制 (CORS Proxy & Caching)

純前端架構突破 CORS 限制：本系統捨棄傳統後端伺服器或 Vite 開發代理，直接在前端使用第三方 CORS Proxy (`corsproxy.io`) 去請求 TWSE (台灣證交所) 與 MIS 盤中即時 API。
智慧快取設計：系統將取得的全市場資料整理後存入瀏覽器的 `LocalStorage`，並設定 15 分鐘的 TTL (Time-To-Live)，大幅減少重複請求。若遭遇極端斷線情況，將無縫切換讀取預載的 `stocks.json` 靜態庫，確保 Demo 環境的絕對穩定。

## 系統架構 (System Architecture)

專案分為「離線訓練」與「線上服務」兩個階段：

[Offline] Model Training (Google Colab / PyTorch)

建構具有 Replay Buffer 與 $\epsilon$-Greedy 策略的 DQN 代理人。

定義效用函數 $R = \mu - \lambda\sigma^2$ 作為 Reward Function。

訓練收斂後，使用 torch.onnx.export 將模型輸出為靜態計算圖 (dqn_policy.onnx & dqn_policy.onnx.data)。

[Online] Web Inference (React + ONNX Runtime Web)

前端 UI (React) 捕捉使用者的 State ($S_t$: 風險等級、市場趨勢、股價)。

將 State 轉換為 Tensor 送入 ONNX Runtime Web 進行本地推論。

解析模型輸出的 Q-Values ($A_t$: Buy/Hold/Sell) 並即時渲染至儀表板。

## 本地端運行 (Local Development)

先決條件

Node.js (建議 v18+)

npm 或 yarn

安裝步驟

複製專案

git clone https://github.com/你的帳號/你的專案名稱.git
cd 你的專案名稱


安裝依賴套件

npm install


確認靜態資源
請確保以下檔案已正確放置於專案的 public/ 資料夾中：

dqn_policy.onnx (DQN 模型結構檔)

dqn_policy.onnx.data (DQN 模型權重檔)

stocks.json (全市場股票靜態資料庫)

啟動開發伺服器

npm run dev


打開瀏覽器訪問 http://localhost:5173 即可體驗。
## 技術堆疊 (Tech Stack)

Frontend Framework: React 18, Vite

Styling: Tailwind CSS (透過 Inline Tailwind classes 與樣式封裝)

AI & Inference: PyTorch, ONNX, onnxruntime-web

Data Processing: Python (TWSE Open API Crawler)

## 數學模型定義 (Mathematical Formulation)

馬可夫決策過程 (MDP)

State Space ($S$): $[ \lambda, Trend, \Delta P ]$

$\lambda$: 風險懲罰係數 (Risk Tolerance)

$Trend$: 市場狀態指標

$\Delta P$: 價格變動百分比

Action Space ($A$): $\{ 0: \text{Buy}, 1: \text{Hold}, 2: \text{Sell} \}$

貝爾曼方程式 (Bellman Equation)

模型透過計算均方誤差 (MSE) 逼近最佳策略：


$$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha \left[ R_{t+1} + \gamma \max_{a} Q(S_{t+1}, a) - Q(S_t, A_t) \right]$$

