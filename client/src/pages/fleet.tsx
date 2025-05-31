import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Vehicle } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter, Check, X, AlertTriangle, Car } from "lucide-react";
import ExportToSheets from "@/components/ExportToSheets";
import AddVehicleForm from "@/components/vehicles/AddVehicleForm";

export default function Fleet() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentTab, setCurrentTab] = useState("all");
  
  // Fetch vehicles
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['/api/vehicles'],
    queryFn: async () => {
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      return await response.json();
    }
  });
  
  // Create a map of vehicle counts by category
  const getCategoryCounts = () => {
    if (!vehicles) return {};
    
    const counts: Record<string, number> = {};
    vehicles.forEach((vehicle: Vehicle) => {
      if (counts[vehicle.category]) {
        counts[vehicle.category]++;
      } else {
        counts[vehicle.category] = 1;
      }
    });
    
    return counts;
  };
  
  // Get total vehicles count
  const totalVehicles = vehicles?.length || 0;
  
  // Calculate category percentages
  const getCategoryPercentage = (category: string) => {
    const counts = getCategoryCounts();
    return counts[category] ? Math.round((counts[category] / totalVehicles) * 100) : 0;
  };
  
  // Filter vehicles based on search query and filters
  const getFilteredVehicles = () => {
    if (!vehicles) return [];
    
    return vehicles.filter((vehicle: Vehicle) => {
      // Filter by tab (status)
      if (currentTab !== "all" && vehicle.status !== currentTab) {
        return false;
      }
      
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        vehicle.make.toLowerCase().includes(searchLower) ||
        vehicle.model.toLowerCase().includes(searchLower) ||
        vehicle.licensePlate.toLowerCase().includes(searchLower);
      
      // Filter by category
      const matchesCategory = categoryFilter === "all" || vehicle.category === categoryFilter;
      
      // Filter by status
      const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  };
  
  // Get all unique categories
  const getCategories = () => {
    if (!vehicles) return [];
    
    const categories = new Set<string>();
    vehicles.forEach((vehicle: Vehicle) => {
      categories.add(vehicle.category);
    });
    
    return Array.from(categories);
  };
  
  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      available: "bg-success text-success-foreground",
      rented: "bg-primary text-primary-foreground",
      maintenance: "bg-warning text-warning-foreground",
      repair: "bg-destructive text-destructive-foreground",
      inactive: "bg-neutral-500 text-white"
    };
    
    return (
      <Badge className={statusClasses[status as keyof typeof statusClasses] || "bg-neutral-500 text-white"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Fleet Management</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage your vehicles and track their status</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <AddVehicleForm />
        </div>
      </div>
      
      {/* Fleet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <CardDescription>Vehicle distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getCategories().map((category, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">{category}</span>
                    <span className="text-xs font-medium">{getCategoryPercentage(category)}%</span>
                  </div>
                  <Progress value={getCategoryPercentage(category)} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <div className="flex justify-between w-full">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Vehicles</p>
                <p className="font-medium">{totalVehicles}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Available</p>
                <p className="font-medium text-success">
                  {vehicles?.filter(v => v.status === 'available').length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">In Maintenance</p>
                <p className="font-medium text-warning">
                  {vehicles?.filter(v => v.status === 'maintenance').length || 0}
                </p>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Availability Alerts</CardTitle>
            <CardDescription>Status updates for your fleet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-30 rounded-md flex items-start">
              <div className="w-8 h-8 rounded-full bg-warning bg-opacity-20 flex items-center justify-center text-warning mr-3 mt-0.5">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-800 dark:text-neutral-100 text-sm">Low SUV Availability</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">Only 3 SUVs available for the upcoming weekend. Consider adjusting pricing or activating reserve vehicles.</p>
              </div>
            </div>
            
            <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-30 rounded-md flex items-start">
              <div className="w-8 h-8 rounded-full bg-success bg-opacity-20 flex items-center justify-center text-success mr-3 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-800 dark:text-neutral-100 text-sm">Sedan Availability Good</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">Current sedan availability at 85% with projected demand at 60%. No action required.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <div className="flex flex-wrap gap-2">
              <Button>
                Schedule Maintenance
              </Button>
              <Button variant="outline">
                View All Alerts
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Fleet Listing */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory</CardTitle>
          <CardDescription>View and manage all vehicles in your fleet</CardDescription>
        </CardHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <div className="px-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="rented">Rented</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value={currentTab} className="m-0">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  <Input 
                    placeholder="Search by make, model, or license plate..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <ExportToSheets 
                    dataType="vehicles"
                    data={vehicles || []}
                    disabled={isLoading || !vehicles?.length}
                  />
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {getCategories().map((category, index) => (
                        <SelectItem key={index} value={category || `category-${index}`}>{category || `Category ${index}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {currentTab === "all" && (
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">In Repair</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  <p className="text-center col-span-3 py-12 text-neutral-500 dark:text-neutral-400">
                    Loading vehicles...
                  </p>
                ) : getFilteredVehicles().length === 0 ? (
                  <p className="text-center col-span-3 py-12 text-neutral-500 dark:text-neutral-400">
                    No vehicles found matching your search criteria
                  </p>
                ) : (
                  getFilteredVehicles().map((vehicle: Vehicle) => (
                    <Card key={vehicle.id} className="overflow-hidden">
                      <div className="h-40 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Car className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
                      </div>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{vehicle.make} {vehicle.model}</h3>
                          {getStatusBadge(vehicle.status)}
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{vehicle.year} • {vehicle.category}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div>
                            <p className="text-neutral-500 dark:text-neutral-400">License</p>
                            <p>{vehicle.licensePlate}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500 dark:text-neutral-400">Daily Rate</p>
                            <p>${vehicle.dailyRate}/day</p>
                          </div>
                          {vehicle.maintenanceStatus !== "ok" && (
                            <div className="col-span-2">
                              <p className="text-neutral-500 dark:text-neutral-400">Maintenance</p>
                              <p className="text-warning">{vehicle.maintenanceStatus}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => navigate(`/fleet/${vehicle.id}`)}
                          >
                            Details
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => navigate(`/fleet/${vehicle.id}`)}
                          >
                            Schedule
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
