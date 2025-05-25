import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const CarBookingChart = () => {
  const [selectedView, setSelectedView] = useState<'monthly' | 'yearly'>('monthly');
  
  // Sample data - in production, this would come from an API
  const { data: bookingData = [] } = useQuery({
    queryKey: ['/api/bookings/stats/chart'],
    queryFn: async () => {
      // This would be a real API call in production
      // For now, generate sample data
      return Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        completed: Math.floor(Math.random() * 5) + 1,
        processing: Math.floor(Math.random() * 3),
        pending: Math.floor(Math.random() * 2)
      }));
    }
  });
  
  // Filter data based on view (monthly/yearly)
  const chartData = selectedView === 'monthly' 
    ? bookingData.slice(0, 30) 
    : bookingData.filter((_, i) => i % 3 === 0).slice(0, 12);
  
  // Calculate the maximum value for scaling
  const maxValue = Math.max(
    ...chartData.map(d => d.completed + d.processing + d.pending)
  );

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Booking Activity</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-7 px-3 text-xs font-medium rounded-full ${selectedView === 'monthly' ? 'bg-primary/10 border-primary/20 text-primary' : ''}`}
              onClick={() => setSelectedView('monthly')}
            >
              Monthly
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-7 px-3 text-xs font-medium rounded-full ${selectedView === 'yearly' ? 'bg-primary/10 border-primary/20 text-primary' : ''}`}
              onClick={() => setSelectedView('yearly')}
            >
              Yearly
            </Button>
          </div>
        </div>
        <CardDescription>Booking status over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between pt-6">
          {chartData.map((data, index) => {
            const totalHeight = (data.completed + data.processing + data.pending) / maxValue * 100;
            const completedHeight = data.completed / maxValue * 100;
            const processingHeight = data.processing / maxValue * 100;
            const pendingHeight = data.pending / maxValue * 100;
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div className="relative h-[200px] w-2 mx-1">
                  {/* Completed bar */}
                  <div 
                    className="absolute bottom-0 w-full rounded-t-sm bg-[#6366f1]" 
                    style={{ height: `${completedHeight}%` }}
                  />
                  
                  {/* Processing bar, positioned above completed */}
                  <div 
                    className="absolute w-full rounded-t-sm bg-[#4ade80]" 
                    style={{ 
                      height: `${processingHeight}%`,
                      bottom: `${completedHeight}%`
                    }}
                  />
                  
                  {/* Pending bar, positioned above processing */}
                  <div 
                    className="absolute w-full rounded-t-sm bg-[#f59e0b]" 
                    style={{ 
                      height: `${pendingHeight}%`,
                      bottom: `${completedHeight + processingHeight}%`
                    }}
                  />
                </div>
                <span className="text-xs text-neutral-500 mt-2">
                  {selectedView === 'monthly' ? data.day : `M${data.day}`}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center space-x-6 mt-6">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#6366f1] mr-2"></div>
            <span className="text-xs text-neutral-500">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#4ade80] mr-2"></div>
            <span className="text-xs text-neutral-500">Processing</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b] mr-2"></div>
            <span className="text-xs text-neutral-500">Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarBookingChart;