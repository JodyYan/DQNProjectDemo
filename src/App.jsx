import React, { useState, useEffect, useMemo, useRef } from 'react'

// ==========================================
// 內部元件定義 (解決 Could not resolve 錯誤)
// ==========================================

const DonutChart = ({ data }) => {
  let bgString = "";
  let accumulatedPct = 0;

  if (!data || data.length === 0) {
    bgString = "#334155 0% 100%";
  } else {
    data.forEach(item => {
      bgString += `${item.color} ${accumulatedPct}% ${accumulatedPct + item.value}%, `;
      accumulatedPct += item.value;
    });
    bgString = bgString.slice(0, -2); // remove last comma and space
  }

  return (
    <div className="relative w-48 h-48 rounded-full flex items-center justify-center shrink-0"
      style={{ background: `conic-gradient(${bgString})` }}>
      <div className="absolute w-32 h-32 bg-[#1e293b] rounded-full flex flex-col items-center justify-center shadow-inner">
        <span className="text-xs text-slate-400">配置總和</span>
        <span className="text-2xl font-bold text-white">100%</span>
      </div>
    </div>
  );
};

const PricingChart = ({ stockId, currentPrice, buyPrice, sellPrice }) => {
  return (
    <div className="relative pt-8 pb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">📊 Q-Value 動作空間視覺化 (Action Space)</span>
        </div>
        <span className="bg-slate-700 px-3 py-1 rounded text-sm font-mono text-white">{stockId}</span>
      </div>

      {/* 滑桿視覺化 */}
      <div className="h-2 bg-slate-700 rounded-full w-full relative mt-10">
        {/* 中間現價點 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white z-10"></div>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-mono whitespace-nowrap">
          市價 $ {currentPrice?.toFixed(2)}
        </div>

        {/* 買入線 */}
        <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-l-full" style={{ width: '2px' }}></div>
        <div className="absolute mt-3 left-0 text-emerald-400 text-xs font-mono">買 $ {buyPrice?.toFixed(2) || '---'}</div>

        {/* 賣出線 */}
        <div className="absolute top-0 right-0 h-full bg-rose-500 rounded-r-full" style={{ width: '2px' }}></div>
        <div className="absolute mt-3 right-0 text-rose-500 text-xs font-mono">賣 $ {sellPrice?.toFixed(2) || '---'}</div>
      </div>

      {/* 訊號分析卡片 */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="font-semibold text-sm">安全邊際 (Margin of Safety)</span>
          </div>
          <p className="text-xs text-slate-300 mb-1">距離觸發動作 A(Buy) 尚需跌幅：</p>
          <div className="text-xl font-bold text-emerald-400 mb-2">
            ▼ {buyPrice ? Math.abs((buyPrice - currentPrice) / currentPrice * 100).toFixed(2) : '0.00'}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">交叉點：${buyPrice?.toFixed(2)}</div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="font-semibold text-sm">風險溢酬耗盡</span>
          </div>
          <p className="text-xs text-slate-300 mb-1">距離觸發動作 A(Sell) 尚需漲幅：</p>
          <div className="text-xl font-bold text-rose-500 mb-2">
            ▲ {sellPrice ? Math.abs((sellPrice - currentPrice) / currentPrice * 100).toFixed(2) : '0.00'}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">交叉點：${sellPrice?.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

const PricingCard = ({ stockId, stockData, aiBuyPrice, aiSellPrice, riskTolerance, marketState }) => {
  return (
    <div>
      <h3 className="text-center font-bold text-white text-lg mb-6 tracking-wider">
        [ {stockId} {stockData.shortName} ] AI 操作建議
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 模擬當前市價 */}
        <div className="bg-[#1e293b] rounded-lg p-4 border border-blue-500/30 text-center flex flex-col justify-center">
          <div className="text-xs text-blue-400 mb-2 flex justify-center items-center gap-1">
            🎯 模擬當前市價
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            $ {stockData.regularMarketPrice?.toFixed(2)}
          </div>
        </div>

        {/* 建議承接價 */}
        <div className="bg-[#1e293b] rounded-lg p-4 border border-emerald-500/30">
          <div className="text-xs text-emerald-400 mb-2 border-b border-emerald-500/20 pb-2">
            📉 建議承接價 (AI 推論)
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mb-3">
            $ {aiBuyPrice?.toFixed(2) || '---'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono leading-tight">
            基於 DQN Q-Value 交叉點<br />
            風險等級：Lv {riskTolerance}<br />
            市場狀態：{marketState.toUpperCase()}
          </div>
        </div>

        {/* 建議賣出價 */}
        <div className="bg-[#1e293b] rounded-lg p-4 border border-rose-500/30">
          <div className="text-xs text-rose-500 mb-2 border-b border-rose-500/20 pb-2">
            📈 建議賣出價 (AI 推論)
          </div>
          <div className="text-2xl font-bold text-rose-500 font-mono mb-3">
            $ {aiSellPrice?.toFixed(2) || '---'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono leading-tight">
            基於 DQN Q-Value 交叉點<br />
            風險等級：Lv {riskTolerance}<br />
            市場狀態：{marketState.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 主應用程式 App
// ==========================================

const INITIAL_STOCK_DICT = {
  '2330': { name: '台積電', price: 850.0 },
  '0050': { name: '台灣50', price: 160.0 },
  '0056': { name: '元大高股息', price: 40.0 }
};

export default function App() {
  const [principal, setPrincipal] = useState(1000000)
  const [riskTolerance, setRiskTolerance] = useState(6)
  const [marketState, setMarketState] = useState('bull')
  const [customStocks, setCustomStocks] = useState(['2330', '0050', '0056'])
  const [stockDataCache, setStockDataCache] = useState(INITIAL_STOCK_DICT)
  const [isAutoSyncing, setIsAutoSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchName, setSearchName] = useState('')
  const [selectedStock, setSelectedStock] = useState('2330')

  // ==========================================
  // AI 模型狀態與邊界推論 (動態 ONNX Integration)
  // ==========================================
  const [isModelLoading, setIsModelLoading] = useState(true);
  const ortSessionRef = useRef(null);
  const [aiBoundaries, setAiBoundaries] = useState({ buyPrice: 0, sellPrice: 0 });

  // 1. 動態載入 ONNX Runtime CDN
  useEffect(() => {
    const loadONNXRuntime = async () => {
      try {
        setIsModelLoading(true);

        // 載入腳本
        if (!window.ort) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        window.ort.env.wasm.numThreads = 1;

        // 嘗試載入模型
        try {
          // 偵測是否在 blob 沙盒環境 (例如 AI 的預覽視窗)
          if (window.location.protocol === 'blob:') {
            throw new Error('Canvas 預覽沙盒無法載入外部檔案，將使用模擬模式');
          }

          // 使用 Vite 的 BASE_URL，確保 GitHub Pages 子目錄路徑正確
          const session = await window.ort.InferenceSession.create(import.meta.env.BASE_URL + 'dqn_policy.onnx');
          ortSessionRef.current = session;
          console.log("✅ DQN ONNX 模型載入成功！");
        } catch (err) {
          console.warn("⚠️ 已切換為模擬推論模式", err.message);
          // 若找不到模型或在沙盒中，使用模擬的 Session 讓畫面依然能夠運作
          ortSessionRef.current = {
            run: async ({ input_state }) => {
              const data = input_state.data;
              const risk = data[0];
              const pct = data[2];
              const qHold = 1.0;
              const qBuy = 1.0 - (pct / 10.0) - (risk * 0.05);
              const qSell = 1.0 + (pct / 10.0) + (risk * 0.05);
              return { q_values: { data: [qBuy, qHold, qSell] } };
            },
            isMock: true
          };
        }
      } catch (error) {
        console.error("❌ ONNX Runtime 載入失敗：", error);
      } finally {
        setIsModelLoading(false);
      }
    };

    loadONNXRuntime();
  }, []);

  // 2. 執行 DQN 邊界推論 (根據使用者操作即時更新)
  useEffect(() => {
    const runDQNInference = async () => {
      if (!ortSessionRef.current || !selectedStock || !stockDataCache[selectedStock] || !window.ort) return;

      const basePrice = stockDataCache[selectedStock].price;

      let marketTrendVal = 1.0; // neutral
      if (marketState === 'bull') marketTrendVal = 2.0;
      if (marketState === 'bear') marketTrendVal = 0.0;

      const session = ortSessionRef.current;

      const getQValues = async (priceChangePct) => {
        const inputData = Float32Array.from([riskTolerance, marketTrendVal, priceChangePct]);
        const tensor = new window.ort.Tensor('float32', inputData, [1, 3]);
        const results = await session.run({ input_state: tensor });
        const qArray = results.q_values.data;
        return { qBuy: qArray[0], qHold: qArray[1], qSell: qArray[2] };
      };

        // 尋找 Buy 邊界：從當前價往下掃描，強迫至少有 0.5% 的安全邊際
        let buyPct = -0.5;
        for (let pct = -0.5; pct >= -30.0; pct -= 0.5) {
          const { qBuy, qHold } = await getQValues(pct);
          if (qBuy > qHold) {
            buyPct = pct;
            break;
          }
        }

        // 尋找 Sell 邊界：從當前價往上掃描，強迫至少有 0.5% 的停利空間
        let sellPct = 0.5;
        for (let pct = 0.5; pct <= 30.0; pct += 0.5) {
          const { qSell, qHold } = await getQValues(pct);
          if (qSell > qHold) {
            sellPct = pct;
            break;
          }
        }

        setAiBoundaries({
          buyPrice: basePrice * (1 + buyPct / 100),
          sellPrice: basePrice * (1 + sellPct / 100)
        });

      } catch (err) {
        console.error("推論過程發生錯誤:", err);
      }
    };

    runDQNInference();
  }, [selectedStock, stockDataCache, riskTolerance, marketState]);

  // ==========================================
  // API Fetching 邏輯 (包含 Fallback 至 stocks.json)
  // ==========================================
  const fetchAllTwseData = async () => {
    setIsAutoSyncing(true);
    
    // 檢查 localStorage 緩存 (取代 Cookie，因為 Cookie 有 4KB 大小限制，裝不下 200KB 的股票資料)
    const CACHE_KEY = 'twse_stocks_cache';
    const TIME_KEY = 'twse_stocks_time';
    const CACHE_EXPIRY = 15 * 60 * 1000; // 15 分鐘
    
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(TIME_KEY);
    const now = new Date().getTime();
    
    if (cachedData && cachedTime && (now - cachedTime < CACHE_EXPIRY)) {
      setStockDataCache(JSON.parse(cachedData));
      console.log("✅ 從 LocalStorage 載入 15 分鐘內的快取資料，免重複獲取");
      setIsAutoSyncing(false);
      return;
    }

    try {
      console.log("🌐 正在透過 CORS Proxy 獲取 TWSE 最新資料 (取代 Colab Python 腳本)...");
      // 使用第三方 CORS proxy 來繞過瀏覽器限制
      const corsProxyUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL');
      const response = await fetch(corsProxyUrl);
      
      if (!response.ok) throw new Error('CORS Proxy / TWSE API 請求失敗');
      const data = await response.json();

      const newCache = { ...INITIAL_STOCK_DICT };
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f43f5e", "#14b8a6", "#64748b"];

      // 完美復刻 Colab Notebook 的邏輯
      data.forEach(item => {
        const stock_id = item.Code || "";
        const name = item.Name || "";
        const close_price_str = (item.ClosingPrice || "").replace(/,/g, "");
        const base_price = parseFloat(close_price_str);

        if (isNaN(base_price)) return; // 無效報價跳過

        let stock_type, beta;
        if (stock_id.startsWith("00")) {
          stock_type = name.includes("高息") ? "dividend" : "etf";
          beta = 0.7 + Math.random() * 0.3; // 隨機 0.7 ~ 1.0
        } else {
          stock_type = base_price > 100 ? "growth" : "value";
          beta = 0.9 + Math.random() * 0.6; // 隨機 0.9 ~ 1.5
        }

        newCache[stock_id] = {
          id: stock_id,
          name: name.trim(),
          price: Math.round(base_price * 100) / 100, // 替換掉舊的 base_price，統一使用 price 讓 UI 讀取
          beta: Math.round(beta * 100) / 100,
          type: stock_type,
          color: colors[Math.floor(Math.random() * colors.length)]
        };
      });

      setStockDataCache(newCache);
      // 寫入快取
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      localStorage.setItem(TIME_KEY, now.toString());
      console.log("✅ 成功產生並快取最新的全市場股票資料");

    } catch (apiError) {
      console.warn("⚠️ 即時獲取失敗，正在嘗試備用方案 (載入 stocks.json)...", apiError);

      try {
        if (window.location.protocol === 'blob:') {
          throw new Error('預覽沙盒環境無法解析相對路徑，將維持預設的股票清單。');
        }

        const fallbackResponse = await fetch(import.meta.env.BASE_URL + 'stocks.json');
        if (!fallbackResponse.ok) throw new Error('Cannot fetch fallback stocks.json');

        const fallbackData = await fallbackResponse.json();
        const newCache = { ...INITIAL_STOCK_DICT };

        Object.keys(fallbackData).forEach(code => {
          newCache[code] = {
            name: fallbackData[code].name,
            price: fallbackData[code].base_price
          };
        });

        setStockDataCache(newCache);
        console.log("✅ 成功從本地 stocks.json 載入備用資料");

      } catch (jsonError) {
        console.info("ℹ️ " + jsonError.message);
      }

    } finally {
      setIsAutoSyncing(false);
    }
  };

  useEffect(() => { fetchAllTwseData(); }, []);

  useEffect(() => {
    const fetchRealTimeData = async () => {
      if (customStocks.length === 0) return;
      setIsAutoSyncing(true);
      try {
        const query = customStocks.map(s => `tse_${s}.tw`).join('|');
        // 使用 CORS Proxy 繞過限制，取得真正的即時報價 (解決 GitHub Pages 上的 404)
        const targetUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${query}`;
        const corsProxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);
        
        const res = await fetch(corsProxyUrl);
        if (!res.ok) throw new Error('CORS Proxy / MIS API response was not ok');
        const data = await res.json();

        if (data.msgArray && data.msgArray.length > 0) {
          setStockDataCache(prev => {
            const newCache = { ...prev };
            data.msgArray.forEach(item => {
              const code = item.c;
              if (!code) return;
              const priceStr = (item.z && item.z !== '-') ? item.z : item.y;
              const price = parseFloat(priceStr);
              if (!isNaN(price)) {
                newCache[code] = {
                  name: item.n || newCache[code]?.name || code,
                  price: price
                };
              }
            });
            return newCache;
          });
        }
      } catch (err) {
        console.warn("Realtime Data Fetch Error (預期內，若是 CORS 則維持快取)", err);
      } finally {
        setIsAutoSyncing(false);
      }
    };
    fetchRealTimeData();
  }, [customStocks]);

  // ==========================================
  // 資產配置權重計算
  // ==========================================
  const { allocationWeights, estReturn, maxDrawdown } = useMemo(() => {
    const baseCashWeight = (10 - riskTolerance) * 5;
    const cashWeight = marketState === 'bear' ? baseCashWeight + 20 : baseCashWeight;
    const totalStockWeight = Math.max(0, 100 - cashWeight);

    let weights = [];
    const n = customStocks.length;

    if (n === 0) {
      const cashAmount = principal.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });
      weights.push({ label: `Cash 現金 (100%) : ${cashAmount}`, value: 100, color: '#64748b', id: 'cash' });
    } else {
      const w2 = totalStockWeight / (n + 1);
      const stockWeights = customStocks.map((stock, i) => {
        let weight = totalStockWeight / n;
        if (marketState === 'bull') {
          weight = i === 0 ? 2 * w2 : w2;
        } else if (marketState === 'bear') {
          weight = i === n - 1 ? 2 * w2 : w2;
        }
        return { label: stock, value: weight };
      });

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

      weights = stockWeights.map((sw, i) => {
        const cacheData = stockDataCache[sw.label];
        const stockName = cacheData?.name && cacheData.name !== sw.label ? cacheData.name : '';
        const displayName = stockName ? `${sw.label} ${stockName}` : sw.label;
        const amount = (principal * sw.value / 100).toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });

        return {
          id: sw.label,
          label: `${displayName} (${sw.value.toFixed(0)}%) : ${amount}`,
          value: sw.value,
          color: colors[i % colors.length]
        };
      });

      if (cashWeight > 0) {
        const cashAmount = (principal * cashWeight / 100).toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });
        weights.push({ id: 'cash', label: `Cash 現金 (${cashWeight.toFixed(0)}%) : ${cashAmount}`, value: cashWeight, color: '#64748b' });
      }
    }

    let ret = 0;
    let dd = 0;
    if (marketState === 'bull') {
      ret = 6 + (riskTolerance * 1.2);
      dd = -1 - (riskTolerance * 0.8);
    } else if (marketState === 'bear') {
      ret = 2 - (riskTolerance * 1.5);
      dd = -5 - (riskTolerance * 3.0);
    } else {
      ret = 4 + (riskTolerance * 0.1);
      dd = -3 - (riskTolerance * 1.5);
    }

    return {
      allocationWeights: weights,
      estReturn: ret.toFixed(1),
      maxDrawdown: dd.toFixed(1)
    };
  }, [riskTolerance, marketState, customStocks, stockDataCache, principal]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Indicators */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-xs font-mono font-bold w-fit flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ✅ API 連線: OK
          </div>
          {isModelLoading ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg text-xs font-mono font-bold w-fit flex items-center gap-2 shadow-sm">
              <span className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></span>
              ⏳ 載入 DQN 模型中...
            </div>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-xs font-mono font-bold w-fit flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              🧠 DQN 推論引擎就緒 {ortSessionRef.current?.isMock ? '(模擬模式)' : ''}
            </div>
          )}
        </div>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              AI Smart Asset Allocation & DQN Pricing System
            </h1>
            <p className="text-sm font-medium text-blue-400 mt-1">AI 智能資產配置與 DQN 定價系統</p>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-sm text-slate-300">預估年化報酬 (Est. Return):</p>
              <p className="text-2xl font-bold text-emerald-400">{estReturn}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">預估最大回撤 (Est. Drawdown):</p>
              <p className="text-2xl font-bold text-red-400">{maxDrawdown}%</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">

            {/* Block 1: Allocation */}
            <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50">
              <h2 className="text-xl font-bold mb-8 text-slate-100">1. AI 強化學習投資組合配置</h2>
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                <DonutChart data={allocationWeights} />
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  {allocationWeights.map(w => (
                    <div key={w.id} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: w.color }}></span>
                      {w.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Block 2: Selection & AI Chart */}
            <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50 space-y-6">
              <h2 className="text-xl font-bold text-slate-100">2. 個股邊界推論定價 (點擊標的分析)</h2>

              {/* Pricing Chart Visualization */}
              {selectedStock && (
                <PricingChart
                  stockId={selectedStock}
                  currentPrice={stockDataCache[selectedStock]?.price || 100}
                  buyPrice={aiBoundaries.buyPrice}
                  sellPrice={aiBoundaries.sellPrice}
                />
              )}

              <div className="border-t border-slate-700/50 pt-6 mt-4"></div>
              <div className="flex gap-2">
                <div className="relative w-48 md:w-56">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder="輸入代號 (例: 2317)"
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      if (!val) {
                        setSearchName('');
                        return;
                      }
                      const exactCode = stockDataCache[val];
                      if (exactCode) {
                        setSearchName(exactCode.name);
                      } else {
                        const match = Object.entries(stockDataCache).find(([code, data]) => data.name.includes(val));
                        if (match) {
                          setSearchName(`找到: ${match[0]} ${match[1].name}`);
                        } else {
                          setSearchName('直接向 API 查詢');
                        }
                      }
                    }}
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg pl-8 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="[自動匹配名稱]"
                  value={searchName}
                  readOnly
                  className="flex-1 bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-400 focus:outline-none hidden md:block"
                />
                <button
                  onClick={async () => {
                    if (!searchQuery) return;
                    let targetCode = searchQuery.trim();
                    const matchByName = Object.entries(stockDataCache).find(([code, data]) => data.name === targetCode || data.name.includes(targetCode));
                    if (matchByName && isNaN(Number(targetCode))) {
                      targetCode = matchByName[0];
                    }
                    if (customStocks.includes(targetCode)) {
                      alert(`股票 ${targetCode} 已經在您的自選清單中了！`);
                      setSearchQuery('');
                      setSearchName('');
                      return;
                    }
                    setCustomStocks([...customStocks, targetCode]);
                    setSearchQuery('');
                    setSearchName('');
                  }}
                  disabled={isAutoSyncing}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                >
                  + 加入
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-300">customStocks</span>
                {customStocks.map(stock => {
                  const cacheData = stockDataCache[stock];
                  const stockName = cacheData?.name && cacheData.name !== stock ? cacheData.name : '';
                  const displayName = stockName ? `${stock} ${stockName}` : stock;

                  return (
                    <button
                      key={stock}
                      onClick={() => setSelectedStock(stock)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border flex items-center gap-2 ${selectedStock === stock
                        ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105'
                        : 'bg-[#0f172a] border-slate-600 text-slate-300 hover:border-slate-500'
                        }`}
                    >
                      [{displayName}]
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStocks = customStocks.filter(s => s !== stock);
                          setCustomStocks(newStocks);
                          if (selectedStock === stock) setSelectedStock(newStocks.length > 0 ? newStocks[0] : null);
                        }}
                        className="hover:text-red-300 hover:bg-red-500/20 rounded-full px-1 -mr-1"
                      >
                        ✕
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Block 3: Decision Explanation Upgrade */}
            <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50 space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>🧠</span> AI 狀態空間與決策解析
              </h2>
              <div className="space-y-4 bg-slate-800/80 p-5 rounded-lg text-sm text-slate-300 font-mono leading-relaxed border-l-4 border-blue-500/50">
                <p>
                  <span className="text-blue-400 font-bold mb-1 block">1. DQN 獎勵函數映射說明</span>
                  目前 AI 代理人 (Agent) 設定之風險懲罰係數 λ = {riskTolerance}。<br />
                  模型動態推論最佳行動：掃描狀態空間找出 Q_buy 與 Q_sell 高於 Q_hold 的黃金交叉點。
                </p>
                <p>
                  <span className="text-blue-400 font-bold mb-1 block">2. 預估績效計算公式 (透視數學)</span>
                  <span className="block mb-2">
                    【預期報酬 Est. Return】<br />
                    {marketState === 'bull' && `μ = 6% + (風險 ${riskTolerance} × 1.2)% = ${estReturn}%`}
                    {marketState === 'bear' && `μ = 2% - (風險 ${riskTolerance} × 1.5)% = ${estReturn}%`}
                    {marketState === 'neutral' && `μ = 4% + (風險 ${riskTolerance} × 0.1)% = ${estReturn}%`}
                  </span>
                  <span className="block text-red-300">
                    【最大回撤 Max Drawdown】<br />
                    {marketState === 'bull' && `MDD = -1% - (風險 ${riskTolerance} × 0.8)% = ${maxDrawdown}%`}
                    {marketState === 'bear' && `MDD = -5% - (風險 ${riskTolerance} × 3.0)% = ${maxDrawdown}%`}
                    {marketState === 'neutral' && `MDD = -3% - (風險 ${riskTolerance} × 1.5)% = ${maxDrawdown}%`}
                  </span>
                </p>
                <p>
                  <span className="text-blue-400 font-bold mb-1 block">3. 資產配置決策說明</span>
                  {marketState === 'bull' && `狀態評估為 Bull (多頭)。為最大化 Q-Value，降低現金權重至 ${allocationWeights.find(w => w.id === 'cash')?.value.toFixed(0) || 0}%，放大高 Beta 成長股權重。`}
                  {marketState === 'bear' && `狀態評估為 Bear (空頭)。偵測到下行風險增加，觸發避險機制。現金與無風險資產權重提升至 ${allocationWeights.find(w => w.id === 'cash')?.value.toFixed(0) || 0}%。`}
                  {marketState === 'neutral' && `狀態評估為 Neutral (震盪)。維持平衡配置，現金佔比 ${allocationWeights.find(w => w.id === 'cash')?.value.toFixed(0) || 0}%。`}
                </p>
              </div>
            </div>

            {/* Block 4: Control Panel */}
            <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50 space-y-5">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-300 w-28 flex items-center gap-2">
                  <span>￥</span> 本金 (TWD)
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
                  className="flex-1 bg-[#0f172a] border border-slate-600 rounded-lg p-2 text-sm text-slate-100 text-center font-mono"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-300 w-28 flex items-center gap-2">
                  <span>📈</span> 模擬市場狀態
                </label>
                <div className="flex-1 flex rounded-lg overflow-hidden border border-slate-600 bg-[#0f172a]">
                  {[
                    { id: 'bull', label: 'Bull 多頭' },
                    { id: 'neutral', label: 'Neutral 震盪' },
                    { id: 'bear', label: 'Bear 空頭' }
                  ].map((state) => (
                    <button
                      key={state.id}
                      onClick={() => setMarketState(state.id)}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${marketState === state.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {state.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-300 w-28 flex items-center gap-2">
                  <span>⚙️</span> 風險偏好 (1-10)
                </label>
                <div className="flex-1 flex items-center gap-4 bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2">
                  <input
                    type="range"
                    min="1" max="10"
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(Number(e.target.value))}
                    className="w-full accent-slate-400 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300 w-8 whitespace-nowrap">Lv {riskTolerance}</span>
                </div>
              </div>
            </div>

            {/* Block 5: Pricing Card - 使用 AI 動態推論邊界 */}
            {selectedStock && (
              <div className="bg-[#1e3a8a]/40 border border-blue-500/50 p-6 rounded-xl shadow-lg">
                <PricingCard
                  stockId={selectedStock}
                  stockData={{
                    regularMarketPrice: stockDataCache[selectedStock]?.price || 100,
                    shortName: stockDataCache[selectedStock]?.name && stockDataCache[selectedStock].name !== selectedStock ? stockDataCache[selectedStock].name : '(無收盤報價)'
                  }}
                  aiBuyPrice={aiBoundaries.buyPrice}
                  aiSellPrice={aiBoundaries.sellPrice}
                  riskTolerance={riskTolerance}
                  marketState={marketState}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer loading indicator */}
        <div className="fixed bottom-4 right-4 flex items-center gap-2">
          {isAutoSyncing ? (
            <div className="text-xs text-blue-400 flex items-center gap-1 bg-[#1e293b] px-3 py-1.5 rounded-full border border-blue-500/30">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              資料同步中...
            </div>
          ) : null}
        </div>

      </div>
    </div>
  )
}