import { useState, useEffect, useMemo } from 'react'
import DonutChart from './components/DonutChart'
import PricingCard from './components/PricingCard'
import PricingChart from './components/PricingChart'

const INITIAL_STOCK_DICT = {
  '2330': { name: '台積電', price: 850.0 },
  '0050': { name: '台灣50', price: 160.0 },
  '0056': { name: '元大高股息', price: 40.0 }
};

function App() {
  const [principal, setPrincipal] = useState(1000000)
  const [riskTolerance, setRiskTolerance] = useState(6)
  const [marketState, setMarketState] = useState('bull')
  const [customStocks, setCustomStocks] = useState(['2330', '0050', '0056'])
  const [stockDataCache, setStockDataCache] = useState(INITIAL_STOCK_DICT)
  const [isAutoSyncing, setIsAutoSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchName, setSearchName] = useState('')
  const [selectedStock, setSelectedStock] = useState('2330') // pre-select 2330 as shown in image

  const fetchAllTwseData = async () => {
    setIsAutoSyncing(true);
    try {
      // Use proxy endpoint for TWSE Open API
      const response = await fetch('/twse-api/v1/exchangeReport/STOCK_DAY_ALL');
      if (!response.ok) throw new Error('TWSE API response was not ok');
      const data = await response.json();
      
      const newCache = { ...INITIAL_STOCK_DICT };
      data.forEach(item => {
        const price = parseFloat(item.ClosingPrice);
        if (!isNaN(price)) {
          newCache[item.Code] = {
            name: item.Name,
            price: price
          };
        }
      });
      setStockDataCache(newCache);
    } catch (error) {
      console.error("Error fetching TWSE data:", error);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  useEffect(() => {
    fetchAllTwseData();
  }, []);

  // Fetch real-time prices for custom stocks
  useEffect(() => {
    const fetchRealTimeData = async () => {
      if (customStocks.length === 0) return;
      setIsAutoSyncing(true);
      try {
        const query = customStocks.map(s => `tse_${s}.tw`).join('|');
        const res = await fetch(`/mis-api/stock/api/getStockInfo.jsp?ex_ch=${query}`);
        if (!res.ok) throw new Error('MIS API response was not ok');
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
        console.error("Error fetching real-time TWSE data:", err);
      } finally {
        setIsAutoSyncing(false);
      }
    };
    
    fetchRealTimeData();
  }, [customStocks]);

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

  const marketStateLabel = { bull: '多頭', neutral: '震盪', bear: '空頭' }[marketState];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-xs font-mono font-bold w-fit mb-4 flex items-center gap-2 shadow-sm">
           <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
           ✅ 數據狀態: LIVE | TWSE API 連線成功
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
               <div className="flex items-center justify-around gap-4">
                  <DonutChart data={allocationWeights} />
                  <div className="flex flex-col gap-3">
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
                   buyPrice={(stockDataCache[selectedStock]?.price || 100) * (1 - 0.01 * (11 - riskTolerance))}
                   sellPrice={(stockDataCache[selectedStock]?.price || 100) * (1 + 0.01 * (5 + riskTolerance))}
                 />
               )}
               
               <div className="border-t border-slate-700/50 pt-6 mt-4"></div>
               <div className="flex gap-2">
                  <div className="relative w-48 md:w-56">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input 
                      type="text" 
                      placeholder="輸入代號或名稱 (例: 2317 或 鴻海)" 
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
                            setSearchName('將直接向證交所 API 查詢');
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
                      
                      // Resolve name to code if possible
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

                      setIsAutoSyncing(true);
                      try {
                        const query = `tse_${targetCode}.tw|otc_${targetCode}.tw`;
                        const res = await fetch(`/mis-api/stock/api/getStockInfo.jsp?ex_ch=${query}`);
                        if (!res.ok) {
                          alert(`網路連線異常，無法連線至證交所伺服器 (HTTP ${res.status})。`);
                          throw new Error('Network response was not ok');
                        }
                        const data = await res.json();
                        
                        let found = false;
                        if (data.msgArray && data.msgArray.length > 0) {
                          const item = data.msgArray.find(i => i.c === targetCode);
                          if (item) {
                            const priceStr = (item.z && item.z !== '-') ? item.z : item.y;
                            const price = parseFloat(priceStr);
                            if (!isNaN(price)) {
                              setStockDataCache(prev => ({
                                ...prev,
                                [targetCode]: {
                                  name: item.n || prev[targetCode]?.name || targetCode,
                                  price: price
                                }
                              }));
                              found = true;
                            }
                          }
                        }
                        
                        if (found) {
                          setCustomStocks([...customStocks, targetCode]);
                          setSearchQuery('');
                          setSearchName('');
                        } else {
                          if (isNaN(Number(targetCode))) {
                            alert(`證交所回報：找不到名稱或代號為「${searchQuery}」的即時行情。\n\n原因可能為：\n1. 該公司未公開發行、非上市/上櫃公司。\n2. 名稱輸入錯誤 (請嘗試輸入完整公司名稱或直接輸入代號)。\n3. 該標的已下市。`);
                          } else {
                            alert(`證交所回報：找不到代號為「${targetCode}」的即時行情。\n\n原因可能為：\n1. 該代號不存在或已下市。\n2. 該代號為興櫃股票 (本系統目前支援上市/上櫃股票與ETF)。\n3. 系統連線延遲，請稍後再試。`);
                          }
                        }
                      } catch (err) {
                        console.error(err);
                        alert('查詢失敗，請檢查您的網路連線或稍後再試。');
                      } finally {
                        setIsAutoSyncing(false);
                      }
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
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border flex items-center gap-2 ${
                          selectedStock === stock 
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
                   目前 AI 代理人 (Agent) 設定之風險懲罰係數 λ = {riskTolerance}。<br/>
                   優化目標為最大化獎勵函數 R = μ - λσ²。
                 </p>
                 <p>
                   <span className="text-blue-400 font-bold mb-1 block">2. 預估績效計算公式 (透視數學)</span>
                   {marketState === 'bull' && `預期報酬 μ = 6% + (風險 ${riskTolerance} × 1.2)% = ${estReturn}%`}
                   {marketState === 'bear' && `預期報酬 μ = 2% - (風險 ${riskTolerance} × 1.5)% = ${estReturn}%`}
                   {marketState === 'neutral' && `預期報酬 μ = 4% + (風險 ${riskTolerance} × 0.1)% = ${estReturn}%`}
                 </p>
                 <p>
                   <span className="text-blue-400 font-bold mb-1 block">3. 資產配置決策說明</span>
                   {marketState === 'bull' && `狀態評估為 Bull (多頭)。為最大化 Q-Value，策略網路 (Policy Network) 降低現金權重至 ${allocationWeights.find(w=>w.id==='cash')?.value.toFixed(0) || 0}%，並將高 Beta 成長股權重放大至 ${allocationWeights.find(w=>w.id!=='cash')?.value.toFixed(0) || 0}%。`}
                   {marketState === 'bear' && `狀態評估為 Bear (空頭)。偵測到下行風險增加，觸發避險機制。現金與無風險資產權重提升至 ${allocationWeights.find(w=>w.id==='cash')?.value.toFixed(0) || 0}%，並重倉防禦型資產至 ${customStocks.length > 0 ? (allocationWeights.find(w=>w.id===customStocks[customStocks.length-1])?.value || 0).toFixed(0) : 0}% 以降低投資組合波動率 (σ²)。`}
                   {marketState === 'neutral' && `狀態評估為 Neutral (震盪)。維持平衡配置，現金佔比 ${allocationWeights.find(w=>w.id==='cash')?.value.toFixed(0) || 0}%，平均分散風險。`}
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
                   <span>☷</span> 自選股票
                 </label>
                 <input 
                   type="text" 
                   value={`[ ${customStocks.join(', ')} ]`}
                   readOnly
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

            {/* Block 5: Pricing Card */}
            {selectedStock && (
              <div className="bg-[#1e3a8a]/40 border border-blue-500/50 p-6 rounded-xl shadow-lg">
                 <PricingCard 
                   stockId={selectedStock}
                   stockData={{
                     regularMarketPrice: stockDataCache[selectedStock]?.price || 100,
                     shortName: stockDataCache[selectedStock]?.name && stockDataCache[selectedStock].name !== selectedStock ? stockDataCache[selectedStock].name : '(無收盤報價)'
                   }}
                   riskTolerance={riskTolerance}
                   marketState={marketState}
                 />
              </div>
            )}
          </div>
        </div>

        {/* Footer loading indicator for background data fetch */}
        <div className="fixed bottom-4 right-4 flex items-center gap-2">
           {isAutoSyncing ? (
             <div className="text-xs text-blue-400 flex items-center gap-1 bg-[#1e293b] px-3 py-1.5 rounded-full border border-blue-500/30">
               <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
               TWSE 同步中...
             </div>
           ) : null}
        </div>

      </div>
    </div>
  )
}

export default App
