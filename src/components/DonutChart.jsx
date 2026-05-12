import React from 'react';

const DonutChart = ({ data }) => {
  // data: [{ label: '2330', value: 45, color: '#3b82f6' }]
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;
  const radius = 15.91549430918954; // so circumference is 100

  return (
    <div className="relative w-64 h-64 shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90 drop-shadow-lg">
        {data.map((item) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0;
          const strokeDasharray = `${percent} ${100 - percent}`;
          const strokeDashoffset = -cumulativePercent;
          cumulativePercent += percent;
          
          return (
            <circle
              key={item.label}
              r={radius}
              cx="21"
              cy="21"
              fill="transparent"
              stroke={item.color}
              strokeWidth="6"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          );
        })}
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xs text-slate-400 font-medium tracking-wider">配置總和</span>
        <span className="text-2xl font-bold text-slate-100 mt-1">100%</span>
      </div>
    </div>
  );
};

export default DonutChart;
