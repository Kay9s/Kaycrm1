import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

const VehicleAvailabilityChart = () => {
  // Define type for availability data
  interface AvailabilityData {
    available: number;
    rented: number;
    maintenance: number;
    upcoming: number;
    [key: string]: number;
  }
  
  // Sample data - in production, this would come from an API
  const { data: availabilityData = {
    available: 14,
    rented: 8,
    maintenance: 3,
    upcoming: 5
  } as AvailabilityData, isLoading } = useQuery<AvailabilityData>({
    queryKey: ['/api/vehicles/availability/chart'],
    queryFn: async () => {
      // This would be a real API call in production
      return {
        available: 14,
        rented: 8,
        maintenance: 3,
        upcoming: 5
      };
    }
  });
  
  // Calculate total vehicles and percentages
  const totalVehicles = Object.values(availabilityData).reduce((sum: number, val: any) => sum + val, 0);
  
  const categories = [
    { key: 'available', label: 'Available', color: '#4ade80', textColor: 'text-green-500' },
    { key: 'rented', label: 'Rented', color: '#6366f1', textColor: 'text-indigo-500' },
    { key: 'maintenance', label: 'Maintenance', color: '#f59e0b', textColor: 'text-amber-500' },
    { key: 'upcoming', label: 'Upcoming Bookings', color: '#94a3b8', textColor: 'text-slate-500' }
  ];

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Fleet Status</CardTitle>
        <CardDescription>Current availability of vehicles</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading vehicle data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Vehicle stats grid */}
            <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((category) => (
                <div key={category.key} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p className={`text-sm font-medium ${category.textColor}`}>{category.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {availabilityData[category.key] || 0}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {Math.round((availabilityData[category.key] || 0) / totalVehicles * 100)}% of fleet
                  </p>
                </div>
              ))}
            </div>
            
            {/* Vehicle availability chart */}
            <div className="col-span-2 mt-4">
              <div className="h-8 w-full flex rounded-full overflow-hidden">
                {categories.map((category) => {
                  const width = ((availabilityData[category.key] || 0) / totalVehicles) * 100;
                  return (
                    <div 
                      key={category.key}
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${width}%`, 
                        backgroundColor: category.color 
                      }}
                    ></div>
                  );
                })}
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category.key} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-xs text-neutral-600 dark:text-neutral-300">
                      {category.label} ({availabilityData[category.key] || 0})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleAvailabilityChart;