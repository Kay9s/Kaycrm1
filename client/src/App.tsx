import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Bookings from "@/pages/bookings";
import BookingDetails from "@/pages/booking-details";
import Fleet from "@/pages/fleet";
import Customers from "@/pages/customers";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Login from "@/pages/login";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-neutral-100 dark:bg-neutral-900 p-4">
          {children}
        </main>
        
        {/* Footer (desktop) */}
        <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-4 px-6 hidden md:block">
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">© 2023 CarFlow Rental Management. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary">Privacy Policy</a>
              <a href="#" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary">Terms of Service</a>
              <a href="#" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary">Support</a>
            </div>
          </div>
        </footer>
        
        <MobileNav />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AppLayout>
          <Dashboard />
        </AppLayout>
      )} />
      <Route path="/bookings" component={() => (
        <AppLayout>
          <Bookings />
        </AppLayout>
      )} />
      <Route path="/bookings/:id" component={({ params }) => (
        <AppLayout>
          <BookingDetails id={params.id} />
        </AppLayout>
      )} />
      <Route path="/fleet" component={() => (
        <AppLayout>
          <Fleet />
        </AppLayout>
      )} />
      <Route path="/customers" component={() => (
        <AppLayout>
          <Customers />
        </AppLayout>
      )} />
      <Route path="/reports" component={() => (
        <AppLayout>
          <Reports />
        </AppLayout>
      )} />
      <Route path="/settings" component={() => (
        <AppLayout>
          <Settings />
        </AppLayout>
      )} />
      {/* Login page - no AppLayout */}
      <Route path="/login" component={() => (
        <Login />
      )} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="carflow-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
