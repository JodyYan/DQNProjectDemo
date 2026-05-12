import React from 'react';

const PricingChart = ({ stockId, currentPrice, buyPrice, sellPrice }) => {
  const buyTarget = buyPrice;
  const sellTarget = sellPrice;

  // === Task 1: Real Data Calculations ===
  const buyGap  = ((currentPrice - buyTarget) / currentPrice * 100).toFixed(2);
  const sellGap = ((sellTarget - currentPrice) / currentPrice * 100).toFixed(2);

  // === 數學比例計算 ===
  // 計算總區間長度
  const priceRange = sellTarget - buyTarget;
  // 計算市價在區間中的相對百分比 (0% ~ 100%)
  // 若市價跌破買價或突破賣價，將其限制在 -10% 到 110% 之間避免跑出版面
  let currentPositionPercent = ((currentPrice - buyTarget) / priceRange) * 100;
  currentPositionPercent = Math.max(-10, Math.min(110, currentPositionPercent));

  return (
    <div className="flex flex-col space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-lg">📊</span>
          <span className="text-sm font-bold text-slate-200 tracking-wide">
            Q-Value 動作空間視覺化 (Action Space)
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500 border border-slate-700 px-2 py-0.5 rounded">
          {stockId}
        </span>
      </div>

      {/* === 動態游標水平軌道 === */}
      <div className="relative w-full h-2 bg-slate-700/50 rounded-full mt-12 mb-16">
        {/* 左邊界：買入觸發線 (0%) */}
        <div className="absolute top-0 left-0 w-1 h-8 bg-emerald-500 -translate-y-3">
          <div className="absolute -bottom-6 left-0 translate-x-0 text-xs text-emerald-400 font-mono whitespace-nowrap">
            買 $ {buyTarget.toFixed(2)}
          </div>
        </div>

        {/* 右邊界：賣出觸發線 (100%) */}
        <div className="absolute top-0 right-0 w-1 h-8 bg-red-500 -translate-y-3">
          <div className="absolute -bottom-6 right-0 translate-x-0 text-xs text-red-400 font-mono whitespace-nowrap text-right">
            賣 $ {sellTarget.toFixed(2)}
          </div>
        </div>

        {/* 視覺化連結線 (選配：畫出從買入點到市價的距離條) */}
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500/30 rounded-full"
          style={{ width: `${Math.max(0, currentPositionPercent)}%` }}
        ></div>

        {/* 動態游標：當前市價 */}
        <div 
          className="absolute top-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-500 z-10"
          style={{ 
            left: `${currentPositionPercent}%`, 
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
            市價 $ {currentPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* === Dynamic data labels + DQN theory terms === */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        {/* Buy gap card */}
        <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold">安全邊際 (Margin of Safety)</span>
          </div>
          <p className="text-slate-300 text-xs font-mono leading-snug">
            距離觸發動作 A(Buy) 尚需跌幅：
          </p>
          <p className="text-emerald-300 text-xl font-bold font-mono">▼ {buyGap}%</p>
          <p className="text-slate-400 text-[11px] font-sans mt-2">
            <span className="bg-emerald-900/50 text-emerald-400 px-1 rounded font-mono">Q_buy &gt; Q_hold</span><br/>
            (買入價值大於持有價值，建議進場)<br/>
            交叉點：${buyTarget.toFixed(2)}
          </p>
        </div>

        {/* Sell gap card */}
        <div className="bg-red-950/60 border border-red-700/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-red-400 text-xs font-bold">風險溢酬耗盡 (Risk Premium Exhausted)</span>
          </div>
          <p className="text-slate-300 text-xs font-mono leading-snug">
            距離觸發動作 A(Sell) 尚需漲幅：
          </p>
          <p className="text-red-300 text-xl font-bold font-mono">▲ {sellGap}%</p>
          <p className="text-slate-400 text-[11px] font-sans mt-2">
            <span className="bg-red-900/50 text-red-400 px-1 rounded font-mono">Q_sell &gt; Q_hold</span><br/>
            (賣出價值大於持有價值，建議出場)<br/>
            交叉點：${sellTarget.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Bottom inference text */}
      <div className="bg-slate-800/50 p-3.5 rounded-lg text-xs text-slate-300 leading-relaxed font-mono border-l-4 border-blue-500/50">
        🤖 <span className="font-bold text-blue-400">邊界推論視覺化：</span>
        當前市價 <span className="text-blue-300">${currentPrice.toFixed(2)}</span> 位於觀望區間 (Hold Zone)。
        需再下跌 <span className="text-emerald-300 font-bold">{buyGap}%</span> 至 ${buyTarget.toFixed(2)} 元，
        動作 A(Buy) 的 Q 函數將發生黃金交叉，達到最佳進場安全邊際。
      </div>
    </div>
  );
};

export default PricingChart;
