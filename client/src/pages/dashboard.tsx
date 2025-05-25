import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/dashboard/StatCard";
import NewStatCard from "@/components/dashboard/NewStatCard";
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
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Order Overview Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">Order Overview</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs font-medium rounded-full">Monthly</Button>
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs font-medium rounded-full bg-primary/10 border-primary/20 text-primary">Yearly</Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
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
          
          {/* Chart placeholder - We'll keep the existing chart component */}
          <div className="h-48">
            <BookingActivityChart />
          </div>
        </div>
        
        {/* Budget Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">Budget</h3>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{yearlyBudget}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">YEARLY BUDGET</span>
            </div>
          </div>
          
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            You have spent about {budgetSpent} of your annual budget.
          </p>
          
          {/* Bar chart placeholder */}
          <div className="h-40 mb-6">
            <div className="flex items-end justify-between h-full">
              {[0.6, 0.8, 0.5, 0.9, 0.4, 0.7].map((height, i) => (
                <div key={i} className="relative w-8 rounded-t-md bg-blue-500" style={{ height: `${height * 100}%` }}></div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Income</h4>
                <button className="text-neutral-400 hover:text-neutral-500">...</button>
              </div>
              <p className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{totalIncome2}</p>
              <div className="h-16 mt-2">
                <svg viewBox="0 0 100 20" className="w-full h-full">
                  <path d="M0,10 Q30,5 50,10 T100,10" fill="none" stroke="#22c55e" strokeWidth="2" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Expense</h4>
                <button className="text-neutral-400 hover:text-neutral-500">...</button>
              </div>
              <p className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{totalExpense}</p>
              <div className="h-16 mt-2">
                <svg viewBox="0 0 100 20" className="w-full h-full">
                  <path d="M0,10 Q30,15 50,10 T100,15" fill="none" stroke="#ef4444" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
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