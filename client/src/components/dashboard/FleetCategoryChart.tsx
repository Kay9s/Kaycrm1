import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

type CategoryData = {
  name: string;
  percentage: number;
};

export default function FleetCategoryChart() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/vehicles/categories'],
    queryFn: async () => {
      // This would be a real API call in production
      return Promise.resolve({
        Sedan: 45,
        SUV: 30,
        Luxury: 15,
        Electric: 10
      });
    },
  });
  
  const { data: fleetStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/vehicles/stats'],
    queryFn: async () => {
      // This would be a real API call in production
      return Promise.resolve({
        totalVehicles: 68,
        availableVehicles: 42,
        maintenanceVehicles: 5
      });
    },
  });
  
  const getCategoryData = (): CategoryData[] => {
    if (!categories) return [];
    
    return Object.entries(categories).map(([name, count]) => {
      return {
        name,
        percentage: count
      };
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">Loading categories...</div>
        ) : (
          <div className="space-y-4">
            {getCategoryData().map((category, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">{category.name}</span>
                  <span className="text-xs font-medium">{category.percentage}%</span>
                </div>
                <Progress value={category.percentage} className="h-2 bg-neutral-200 [&>div]:bg-purple-500" />
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-5 pt-5 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Vehicles</p>
              <p className="font-medium">{isLoadingStats ? "-" : fleetStats?.totalVehicles}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Available</p>
              <p className="font-medium text-success">{isLoadingStats ? "-" : fleetStats?.availableVehicles}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">In Maintenance</p>
              <p className="font-medium text-warning">{isLoadingStats ? "-" : fleetStats?.maintenanceVehicles}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
