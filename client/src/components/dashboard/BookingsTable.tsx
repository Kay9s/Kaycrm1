import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Booking, Customer, Vehicle } from "@shared/schema";

type BookingWithDetails = Booking & {
  customer: Customer;
  vehicle: Vehicle;
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "px-2 py-1 text-xs rounded-full",
      status === "active" && "bg-success bg-opacity-10 text-success",
      status === "pending" && "bg-warning bg-opacity-10 text-warning",
      status === "completed" && "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
      status === "cancelled" && "bg-destructive bg-opacity-10 text-destructive",
    )}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function BookingsTable() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['/api/bookings/recent'],
    queryFn: async () => {
      const response = await fetch('/api/bookings/recent');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent bookings');
      }
      
      return await response.json();
    },
  });
  
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      return await response.json();
    },
  });
  
  const { data: vehicles } = useQuery({
    queryKey: ['/api/vehicles'],
    queryFn: async () => {
      const response = await fetch('/api/vehicles');
      
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      
      return await response.json();
    },
  });
  
  const getCustomerById = (id: number) => {
    return customers?.find(c => c.id === id) || { fullName: 'Unknown Customer' };
  };
  
  const getVehicleById = (id: number) => {
    return vehicles?.find(v => v.id === id) || { make: 'Unknown', model: 'Vehicle' };
  };
  
  const getFormattedVehicle = (vehicle: Vehicle) => {
    return `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">Loading bookings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bookings</CardTitle>
        <Link href="/bookings">
          <Button variant="link">View All</Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Pickup Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Return Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {bookings?.map((booking: Booking) => (
                <tr key={booking.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-800 dark:text-neutral-100">
                    {booking.bookingRef}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                    {getCustomerById(booking.customerId).fullName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                    {getFormattedVehicle(getVehicleById(booking.vehicleId))}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                    {format(new Date(booking.startDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                    {format(new Date(booking.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <Link href={`/bookings/${booking.id}`}>
                      <Button variant="link" size="sm" className="text-primary hover:text-primary/80 p-0">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="border-t border-neutral-200 dark:border-neutral-700 py-4">
        <div className="flex items-center justify-between w-full">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing {bookings?.length || 0} of {bookings?.length > 5 ? bookings.length : 128} bookings
          </p>
          <div className="flex items-center space-x-2">
            <Button size="icon" variant="outline" disabled>
              <i className="ri-arrow-left-s-line"></i>
            </Button>
            <Button size="sm" variant="default" className="h-8 w-8 p-0">1</Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">2</Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">3</Button>
            <span className="text-neutral-500">...</span>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">26</Button>
            <Button size="icon" variant="outline">
              <i className="ri-arrow-right-s-line"></i>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
