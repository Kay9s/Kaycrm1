import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

type PeriodType = "weekly" | "monthly" | "yearly";

type ChartDataPoint = {
  name: string;
  value: number;
};

// This would normally come from the API
const mockData = {
  weekly: [
    { name: "Mon", value: 4 },
    { name: "Tue", value: 6 },
    { name: "Wed", value: 5 },
    { name: "Thu", value: 8 },
    { name: "Fri", value: 9 },
    { name: "Sat", value: 7 },
    { name: "Sun", value: 4 }
  ],
  monthly: [
    { name: "Week 1", value: 20 },
    { name: "Week 2", value: 28 },
    { name: "Week 3", value: 30 },
    { name: "Week 4", value: 25 }
  ],
  yearly: [
    { name: "Jan", value: 80 },
    { name: "Feb", value: 75 },
    { name: "Mar", value: 90 },
    { name: "Apr", value: 85 },
    { name: "May", value: 95 },
    { name: "Jun", value: 100 },
    { name: "Jul", value: 110 },
    { name: "Aug", value: 120 },
    { name: "Sep", value: 110 },
    { name: "Oct", value: 105 },
    { name: "Nov", value: 95 },
    { name: "Dec", value: 85 }
  ]
};

export default function BookingActivityChart() {
  const [period, setPeriod] = useState<PeriodType>("weekly");
  
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["/api/bookings/activity", period],
    queryFn: () => Promise.resolve(mockData[period]), // This would fetch from API in a real app
  });
  
  const getTotalBookings = () => {
    if (!chartData) return 0;
    return chartData.reduce((sum, item) => sum + item.value, 0);
  };
  
  const getAverageDailyBookings = () => {
    const total = getTotalBookings();
    if (!chartData || chartData.length === 0) return 0;
    return (total / chartData.length).toFixed(1);
  };
  
  const getPeakDay = () => {
    if (!chartData || chartData.length === 0) return "N/A";
    const peak = chartData.reduce((max, item) => item.value > max.value ? item : max, chartData[0]);
    return peak.name;
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2">
        <CardTitle>Booking Activity</CardTitle>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <Button 
            variant={period === "weekly" ? "default" : "outline"} 
            size="sm"
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </Button>
          <Button 
            variant={period === "monthly" ? "default" : "outline"} 
            size="sm"
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </Button>
          <Button 
            variant={period === "yearly" ? "default" : "outline"} 
            size="sm"
            onClick={() => setPeriod("yearly")}
          >
            Yearly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 w-full flex items-center justify-center">
            <p>Loading chart data...</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  name="Bookings" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Bookings</p>
            <p className="text-lg font-medium">{getTotalBookings()}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Average Bookings</p>
            <p className="text-lg font-medium">{getAverageDailyBookings()}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Peak Day</p>
            <p className="text-lg font-medium">{getPeakDay()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
