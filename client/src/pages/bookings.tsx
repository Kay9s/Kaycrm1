import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent,

  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Booking, Customer, Vehicle } from "@shared/schema";
import BookingForm from "@/components/bookings/BookingForm";
import { 
  ArrowUpDown, 
  Plus, 
  Calendar, 
  Search, 
  FileText, 
  Filter, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

type BookingWithDetails = Booking & {
  customer?: Customer;
  vehicle?: Vehicle;
};

export default function Bookings() {
  const [location] = useLocation();
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Check URL for new booking parameter
  const params = new URLSearchParams(location.split("?")[1]);
  if (params.get("new") === "true" && !showNewBookingDialog) {
    setShowNewBookingDialog(true);
  }

  // Fetch bookings
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return await response.json();
    }
  });

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      return await response.json();
    }
  });

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['/api/vehicles'],
    queryFn: async () => {
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      return await response.json();
    }
  });

  // Process bookings with customer and vehicle details
  const processedBookings: BookingWithDetails[] = bookings?.map((booking: Booking) => {
    const customer = customers?.find((c: Customer) => c.id === booking.customerId);
    const vehicle = vehicles?.find((v: Vehicle) => v.id === booking.vehicleId);
    
    return {
      ...booking,
      customer,
      vehicle
    };
  }) || [];

  // Filter bookings
  const filteredBookings = processedBookings.filter((booking: BookingWithDetails) => {
    const matchesSearch = 
      booking.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${booking.vehicle?.make} ${booking.vehicle?.model}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / pageSize);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const renderPagination = () => {
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            let pageNum = i + 1;
            
            // If we have many pages, show ellipsis in the middle
            if (totalPages > 5 && i >= 2 && i < 4 && currentPage > 3 && currentPage < totalPages - 2) {
              if (i === 2) {
                return (
                  <PaginationItem key={i}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              } else if (i === 3) {
                pageNum = currentPage;
              }
            } else if (totalPages > 5 && currentPage > totalPages - 3) {
              // When near the end
              pageNum = totalPages - (4 - i);
            } else if (totalPages > 5 && currentPage > 3 && i >= 2) {
              // When in the middle
              if (i === 2) pageNum = currentPage - 1;
              else if (i === 3) pageNum = currentPage;
              else pageNum = currentPage + 1;
            }
            
            return (
              <PaginationItem key={i}>
                <PaginationLink 
                  isActive={currentPage === pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          
          {totalPages > 5 && (
            <PaginationItem>
              <PaginationLink 
                isActive={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderStatusBadge = (status: string) => {
    const badgeClasses = {
      pending: "bg-warning bg-opacity-10 text-warning",
      active: "bg-success bg-opacity-10 text-success",
      completed: "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300",
      cancelled: "bg-destructive bg-opacity-10 text-destructive"
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badgeClasses[status as keyof typeof badgeClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Bookings</h1>
          <p className="text-neutral-500 dark:text-neutral-400">View and manage all car rental bookings</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Dialog open={showNewBookingDialog} onOpenChange={setShowNewBookingDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new car rental booking.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <BookingForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            Manage and view the details of all car rental bookings
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input 
                placeholder="Search by booking ID, customer, or vehicle..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        Booking ID
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        Customer
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        Vehicle
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        Pickup Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        Return Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {isLoadingBookings ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                        Loading bookings...
                      </td>
                    </tr>
                  ) : paginatedBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                        No bookings found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((booking: BookingWithDetails) => (
                      <tr key={booking.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-800 dark:text-neutral-100">
                          {booking.bookingRef}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                          {booking.customer?.fullName || "Unknown"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                          {booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})` : "Unknown"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                          {format(new Date(booking.startDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                          {format(new Date(booking.endDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {renderStatusBadge(booking.status)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Link href={`/bookings/${booking.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing {paginatedBookings.length} of {filteredBookings.length} bookings
          </div>
          {totalPages > 1 && renderPagination()}
        </CardFooter>
      </Card>
    </div>
  );
}
