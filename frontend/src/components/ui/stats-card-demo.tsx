import { StatsCard, StatsCardProps } from "@/components/ui/stats-card-1";

export default function StatsCardDemo() {
  
  const salesChartData: StatsCardProps['chartData'] = [
    { name: "Jan", value: 65 },
    { name: "Feb", value: 99, color: "bg-sky-500" }, 
    { name: "Mar", value: 40 },
    { name: "Apr", value: 50 },
    { name: "May", value: 65 },
    { name: "Jun", value: 60 }, 
    { name: "Jul", value: 50 },
    { name: "Aug", value: 50 },
  ];

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-background p-4 rounded-xl border border-border">
      <StatsCard
        title="Sales Revenue"
        currentValue={5832}
        valuePrefix="$"
        chartData={salesChartData}
        description={
          <>
            Your revenue decreased this month by about{" "}
            <span className="font-semibold text-destructive">$421</span>
          </>
        }
        onActionClick={() => alert("Action triggered!")}
        defaultBarColor="bg-primary/30"
        highlightedBarColor="bg-amber-500"
      />
    </div>
  );
}
