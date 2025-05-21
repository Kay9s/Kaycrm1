import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/dashboard/StatCard";
import BookingActivityChart from "@/components/dashboard/BookingActivityChart";
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
import { CalendarPlus } from "lucide-react";

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

  // Fetch other stats
  const { data: carsStats } = useQuery({
    queryKey: ['/api/vehicles/stats'],
    queryFn: async () => {
      // This would be a real API call in production
      return Promise.resolve({
        availableCars: 42,
        availableCarsTrend: -3
      });
    }
  });

  const { data: customerStats } = useQuery({
    queryKey: ['/api/customer-satisfaction'],
    queryFn: async () => {
      // This would be a real API call in production
      return Promise.resolve({
        satisfaction: "4.8/5",
        trend: "+0.2"
      });
    }
  });

  const { data: revenueStats } = useQuery({
    queryKey: ['/api/revenue-stats'],
    queryFn: async () => {
      // This would be a real API call in production
      return Promise.resolve({
        amount: "$24,500",
        trend: "+8%"
      });
    }
  });

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
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Bookings"
          value={isLoadingStats ? "-" : bookingStats?.totalBookings || "0"}
          trend={isLoadingStats ? undefined : `+${bookingStats?.recentIncrease || 0}%`}
          trendDirection="up"
          icon="ri-calendar-check-line"
        />
        
        <StatCard
          title="Available Cars"
          value={carsStats?.availableCars || "0"}
          trend={carsStats?.availableCarsTrend || "0"}
          trendDirection="down"
          icon="ri-car-line"
          iconBgColor="bg-secondary bg-opacity-10"
          iconColor="text-secondary"
          comparisonPeriod="since yesterday"
        />
        
        <StatCard
          title="Customer Satisfaction"
          value={customerStats?.satisfaction || "0"}
          trend={customerStats?.trend || "0"}
          trendDirection="up"
          icon="ri-emotion-happy-line"
          iconBgColor="bg-accent bg-opacity-10"
          iconColor="text-accent"
        />
        
        <StatCard
          title="Revenue"
          value={revenueStats?.amount || "$0"}
          trend={revenueStats?.trend || "0"}
          trendDirection="up"
          icon="ri-money-dollar-circle-line"
          iconBgColor="bg-success bg-opacity-10"
          iconColor="text-success"
        />
      </div>
      
      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <EmergencySupport />
        <QuickActions />
        <IntegrationStatus />
      </div>
      
      {/* Charts and Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BookingActivityChart />
        <CalendarView />
      </div>
      
      {/* Recent Bookings Table */}
      <BookingsTable />
      
      {/* Fleet Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <FleetCategoryChart />
        <AvailabilityAlerts />
      </div>
    </div>
  );
}
