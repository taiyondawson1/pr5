
const StatsGrid = () => {
  const stats = [
    { label: "Win Rate", value: "68%", amount: "$1,234.56" },
    { label: "Profit Factor", value: "2.4", amount: "$1,234.56" },
    { label: "Max Drawdown", value: "-12%", amount: "$1,234.56" },
    { label: "Sharpe Ratio", value: "1.8", amount: "$1,234.56" },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className="w-full bg-darkBlue/40 !rounded-none p-4 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.1),inset_0px_-2px_4px_rgba(0,0,0,0.2)]"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="text-lg text-softWhite/70 font-medium">{stat.label}</div>
            <div className="text-2xl font-bold text-softWhite mt-1">{stat.value}</div>
            <div className="text-sm text-softWhite/50 mt-1">{stat.amount}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
