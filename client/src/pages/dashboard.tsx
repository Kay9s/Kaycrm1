import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/dashboard/StatCard";
import NewStatCard from "@/components/dashboard/NewStatCard";
import BookingActivityChart from "@/components/dashboard/BookingActivityChart";
import CarBookingChart from "@/components/dashboard/CarBookingChart";
import VehicleAvailabilityChart from "@/components/dashboard/VehicleAvailabilityChart";
import CalendarView from "@/components/dashboard/CalendarView";
import BookingsTable from "@/components/dashboard/BookingsTable";
import FleetCategoryChart from "@/components/dashboard/FleetCategoryChart";
import AvailabilityAlerts from "@/components/dashboard/AvailabilityAlerts";
import EmergencySupport from "@/components/dashboard/EmergencySupport";
import QuickActions from "@/components/dashboard/QuickActions";
import IntegrationStatus from "@/components/dashboard/IntegrationStatus";
import { Booking } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarPlus, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Users
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState("last7days");

  // Fetch booking stats
  const { data: bookingStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/bookings/stats'],
    queryFn: async () => {
      const response = await fetch('/api/bookings/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch booking stats');
      }
      return await response.json();
    }
  });

  // Calculate stats for new dashboard cards
  const totalBookings = isLoadingStats ? 0 : bookingStats?.totalBookings || 0;
  const totalIncome = "$67.6k";
  const completedBookings = "7.6k";
  const processingBookings = "1.4k";
  const pendingBookings = "345";
  
  // Budget stats
  const yearlyBudget = "$67.4k";
  const budgetSpent = "25%";
  
  // Income & expense
  const totalIncome2 = "$169.6k";
  const totalExpense = "$34.6k";

  const handleNewBooking = () => {
    // Navigate to booking form
    window.location.href = "/bookings?new=true";
  };

  return (
    <div>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Welcome back! Here's what's happening with your fleet today.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative flex items-center w-full sm:w-auto">
            <i className="ri-calendar-line absolute left-3 text-neutral-400"></i>
            <select 
              className="pl-9 pr-8 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer w-full"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="thisMonth">This month</option>
              <option value="lastMonth">Last month</option>
              <option value="customRange">Custom range</option>
            </select>
            <i className="ri-arrow-down-s-line absolute right-3 text-neutral-400"></i>
          </div>
          
          <Button 
            onClick={handleNewBooking} 
            className="flex items-center justify-center"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>
      
      {/* Stats Cards - New layout similar to the Tailux UI */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-6">
        <div className="lg:col-span-6 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">Booking Overview</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <NewStatCard
              title="Income"
              value={totalIncome}
              icon={<DollarSign className="h-4 w-4" />}
              iconColor="bg-red-100 text-red-500"
              trend="8.5%"
              trendDirection="up"
            />
            
            <NewStatCard
              title="Completed"
              value={completedBookings}
              icon={<CheckCircle className="h-4 w-4" />}
              iconColor="bg-green-100 text-green-500"
              trend="4.2%"
              trendDirection="up"
            />
            
            <NewStatCard
              title="Processing"
              value={processingBookings}
              icon={<Clock className="h-4 w-4" />}
              iconColor="bg-blue-100 text-blue-500"
              trend="2.1%"
              trendDirection="down"
            />
            
            <NewStatCard
              title="Pending"
              value={pendingBookings}
              icon={<AlertCircle className="h-4 w-4" />}
              iconColor="bg-amber-100 text-amber-500"
              trend="1.5%"
              trendDirection="up"
            />
          </div>
        </div>
      </div>
      
      {/* Booking Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Car Booking Chart */}
        <div className="lg:col-span-1">
          <CarBookingChart />
        </div>
        
        {/* Vehicle Availability Chart */}
        <div className="lg:col-span-1">
          <VehicleAvailabilityChart />
        </div>
      </div>
      
      {/* Calendar View and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <CalendarView />
        </div>
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
      
      {/* Recent Bookings Table */}
      <div className="mb-6">
        <BookingsTable />
      </div>
      
      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-1">
          <EmergencySupport />
        </div>
        <div className="md:col-span-1">
          <FleetCategoryChart />
        </div>
        <div className="md:col-span-1">
          <AvailabilityAlerts />
        </div>
      </div>
    </div>
  );
}