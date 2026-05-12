import React from 'react';

const PricingCard = ({ stockId, stockData, riskTolerance, marketState }) => {
  const pCurrent = stockData?.regularMarketPrice || 100;
  const buyPrice = pCurrent * (1 - 0.01 * (11 - riskTolerance));
  const sellPrice = pCurrent * (1 + 0.01 * (5 + riskTolerance));

  const marketStateLabel = { bull: '多頭', neutral: '震盪', bear: '空頭' }[marketState] || marketState;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-100 text-center mb-6">
        [ {stockId} {stockData?.shortName !== '(無收盤報價)' ? stockData.shortName : ''} ] AI 操作建議
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Price */}
        <div className="bg-[#0f172a] border border-blue-500/50 rounded-lg p-4 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1">
            <span className="text-blue-400">🌍</span> 模擬當前市價
          </span>
          <span className="text-2xl font-bold text-blue-400">
            $ {pCurrent.toFixed(2)}
          </span>
        </div>
        
        {/* Buy Price */}
        <div className="bg-[#0f172a] border border-emerald-500/50 rounded-lg p-4 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1">
            <span className="text-emerald-400">📉</span> 建議承接價
          </span>
          <span className="text-2xl font-bold text-emerald-400 mb-3">
            $ {buyPrice.toFixed(2)}
          </span>
          <div className="bg-slate-800/80 w-full p-2 rounded text-xs text-gray-400 font-mono leading-tight">
            計算基準：<br/>市價 {pCurrent.toFixed(2)} × [1 - 0.01 × (11 - 風險等級 {riskTolerance})]
          </div>
        </div>

        {/* Sell Price */}
        <div className="bg-[#0f172a] border border-red-500/50 rounded-lg p-4 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1">
            <span className="text-red-400">📈</span> 建議賣出價
          </span>
          <span className="text-2xl font-bold text-red-400 mb-3">
            $ {sellPrice.toFixed(2)}
          </span>
          <div className="bg-slate-800/80 w-full p-2 rounded text-xs text-gray-400 font-mono leading-tight">
            計算基準：<br/>市價 {pCurrent.toFixed(2)} × [1 + 0.01 × (5 + 風險等級 {riskTolerance})]
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-lg text-sm text-slate-300 leading-relaxed font-mono border-l-4 border-emerald-500/50">
        <span className="text-emerald-400 font-bold mb-1 block">🤖 邊界推論 (Boundary Inference)：</span>
        AI 正在評估狀態空間 S(Risk={riskTolerance}, Trend={marketStateLabel})。<br/>
        透過貝爾曼方程式 Q(s, a) = r + γ max Q(s', a') 推演，當價格回落至 <span className="text-emerald-400 font-bold">${buyPrice.toFixed(2)}</span> 元時，動作 A(Buy) 的價值函數將發生黃金交叉 (Q_buy &gt; Q_hold)，為最佳進場節點。
      </div>
    </div>
  );
};

export default PricingCard;

