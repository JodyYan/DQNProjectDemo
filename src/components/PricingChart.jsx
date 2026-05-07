import React from 'react';

const PricingChart = ({ stockId, currentPrice, buyPrice, sellPrice }) => {
  const minPrice = Math.min(buyPrice, currentPrice) * 0.95;
  const maxPrice = Math.max(sellPrice, currentPrice) * 1.05;
  
  const width = 600;
  const height = 200;
  const padding = 30;

  const getY = (val) => {
    return height - padding - ((val - minPrice) / (maxPrice - minPrice)) * (height - padding * 2);
  };

  const sellY = getY(sellPrice);
  const buyY = getY(buyPrice);
  const currY = getY(currentPrice);

  // A simulated bezier curve representing price volatility
  // Start slightly above current, dip down to buy line, rise up to sell line, end at current
  const curvePath = `M ${padding} ${currY * 0.9} C ${width * 0.3} ${buyY + 20}, ${width * 0.6} ${sellY - 20}, ${width - padding} ${currY}`;

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="bg-[#0f172a] rounded-lg border border-slate-700/50 p-4 relative overflow-hidden">
        {/* Title */}
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <span className="text-blue-400">📊</span>
          <span className="text-xs font-bold text-slate-300 tracking-wider">AI 定價決策視覺化 (Q-Value 邊界圖)</span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto mt-6">
          {/* Background Grid */}
          <line x1={padding} y1={sellY} x2={width - padding} y2={sellY} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" className="opacity-50" />
          <line x1={padding} y1={buyY} x2={width - padding} y2={buyY} stroke="#10b981" strokeWidth="1" strokeDasharray="5,5" className="opacity-50" />
          <line x1={padding} y1={currY} x2={width - padding} y2={currY} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" className="opacity-50" />

          {/* Labels */}
          <text x={width - padding + 5} y={sellY + 4} fill="#ef4444" fontSize="10" className="font-mono">賣出: ${sellPrice.toFixed(2)}</text>
          <text x={width - padding + 5} y={buyY + 4} fill="#10b981" fontSize="10" className="font-mono">承接: ${buyPrice.toFixed(2)}</text>
          <text x={width - padding + 5} y={currY + 4} fill="#3b82f6" fontSize="10" className="font-mono">市價: ${currentPrice.toFixed(2)}</text>

          {/* Price Curve */}
          <path d={curvePath} fill="none" stroke="#60a5fa" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />

          {/* Intersection Points */}
          <circle cx={width * 0.3} cy={buyY} r="4" fill="#10b981" className="animate-pulse drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <text x={width * 0.3} y={buyY - 10} fill="#10b981" fontSize="10" textAnchor="middle" className="font-mono">Buy (Q-交叉)</text>

        </svg>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-lg text-xs text-slate-300 leading-relaxed font-mono border-l-4 border-blue-500/50 shadow-inner">
        🤖 <span className="font-bold text-blue-400">邊界推論視覺化：</span>如圖所示，當價格波動至綠色虛線 <strong>${buyPrice.toFixed(2)}</strong> 元時，動作 A(Buy) 的 Q 函數將發生交叉，為最佳進場節點。
      </div>
    </div>
  );
};

export default PricingChart;
