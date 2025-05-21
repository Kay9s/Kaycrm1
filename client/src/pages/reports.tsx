import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useState } from "react";
import { CHART_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

// Mock report data for demonstration
const bookingsByMonthData = [
  { name: "Jan", count: 12 },
  { name: "Feb", count: 18 },
  { name: "Mar", count: 15 },
  { name: "Apr", count: 22 },
  { name: "May", count: 30 },
  { name: "Jun", count: 28 },
  { name: "Jul", count: 35 },
  { name: "Aug", count: 32 },
  { name: "Sep", count: 27 },
  { name: "Oct", count: 24 },
  { name: "Nov", count: 20 },
  { name: "Dec", count: 25 },
];

const revenueByMonthData = [
  { name: "Jan", amount: 12500 },
  { name: "Feb", amount: 18200 },
  { name: "Mar", amount: 15800 },
  { name: "Apr", amount: 22100 },
  { name: "May", amount: 30500 },
  { name: "Jun", amount: 28300 },
  { name: "Jul", amount: 35200 },
  { name: "Aug", amount: 32100 },
  { name: "Sep", amount: 27400 },
  { name: "Oct", amount: 24600 },
  { name: "Nov", amount: 20800 },
  { name: "Dec", amount: 25300 },
];

const bookingsByVehicleTypeData = [
  { name: "Sedan", value: 35 },
  { name: "SUV", value: 25 },
  { name: "Luxury", value: 15 },
  { name: "Economy", value: 20 },
  { name: "Van", value: 5 },
];

const customerSourceData = [
  { name: "Direct", value: 40 },
  { name: "Online", value: 30 },
  { name: "Referral", value: 15 },
  { name: "Mobile App", value: 10 },
  { name: "Partner", value: 5 },
];

const topPerformingVehicles = [
  { rank: 1, model: "Toyota Camry", bookings: 45, revenue: 18500 },
  { rank: 2, model: "Honda CR-V", bookings: 38, revenue: 19200 },
  { rank: 3, model: "BMW 3 Series", bookings: 32, revenue: 28700 },
  { rank: 4, model: "Ford Escape", bookings: 30, revenue: 15300 },
  { rank: 5, model: "Tesla Model 3", bookings: 28, revenue: 32100 },
];

export default function Reports() {
  const [period, setPeriod] = useState("yearly");
  const [chartType, setChartType] = useState("bookings");
  
  // Placeholder for actual API query implementation
  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: false, // Disabled for now, will use mock data
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reports</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Analytics and insights for your rental business</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select defaultValue={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <i className="ri-download-line mr-2"></i>
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Bookings Overview</CardTitle>
                <CardDescription>Monthly booking trends</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bookingsByMonthData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke={CHART_COLORS.PRIMARY} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue trends</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByMonthData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                      <Legend />
                      <Bar dataKey="amount" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Bookings by Vehicle Type</CardTitle>
                <CardDescription>Distribution across vehicle categories</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Pie
                        data={bookingsByVehicleTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {bookingsByVehicleTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Customer Source</CardTitle>
                <CardDescription>Where your customers come from</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Pie
                        data={customerSourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {customerSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Top Performing Vehicles</CardTitle>
              <CardDescription>Vehicles with the most bookings and revenue</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="text-left py-3 px-4 font-medium">#</th>
                      <th className="text-left py-3 px-4 font-medium">Vehicle Model</th>
                      <th className="text-left py-3 px-4 font-medium">Total Bookings</th>
                      <th className="text-left py-3 px-4 font-medium">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformingVehicles.map((vehicle) => (
                      <tr key={vehicle.rank} className="border-b border-neutral-200 dark:border-neutral-700">
                        <td className="py-3 px-4">{vehicle.rank}</td>
                        <td className="py-3 px-4">{vehicle.model}</td>
                        <td className="py-3 px-4">{vehicle.bookings}</td>
                        <td className="py-3 px-4">{formatCurrency(vehicle.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Booking Analytics</CardTitle>
              <CardDescription>This section will contain detailed booking analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-500 dark:text-neutral-400">Detailed booking reports coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>This section will contain detailed revenue analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-500 dark:text-neutral-400">Detailed revenue reports coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Performance</CardTitle>
              <CardDescription>This section will contain detailed vehicle performance analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-500 dark:text-neutral-400">Detailed vehicle reports coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
              <CardDescription>This section will contain detailed customer analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-500 dark:text-neutral-400">Detailed customer reports coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}