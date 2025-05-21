import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Booking, Customer, Vehicle, SupportTicket } from "@shared/schema";
import StatusChanger from "@/components/bookings/StatusChanger";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Calendar, 
  Car, 
  User, 
  DollarSign, 
  Clock, 
  FileText,
  AlertTriangle,
  ArrowLeft,
  Phone
} from "lucide-react";

interface BookingDetailsProps {
  id: string;
}

export default function BookingDetails({ id }: BookingDetailsProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [supportMessage, setSupportMessage] = useState("");
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string | undefined>(undefined);
  
  // Fetch booking details
  const { data: booking, isLoading, error } = useQuery({
    queryKey: [`/api/bookings/${id}`],
    queryFn: async () => {
      // Since our API doesn't have a direct endpoint for a single booking,
      // we'll fetch all bookings and find the one with the matching ID
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const bookings = await response.json();
      const booking = bookings.find((b: Booking) => b.id === parseInt(id));
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      return booking;
    }
  });
  
  // Fetch customer details if booking is available
  const { data: customer } = useQuery({
    queryKey: [`/api/customers/${booking?.customerId}`],
    queryFn: async () => {
      // Since our API doesn't have a direct endpoint for a single customer,
      // we'll fetch all customers and find the one with the matching ID
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const customers = await response.json();
      return customers.find((c: Customer) => c.id === booking.customerId);
    },
    enabled: !!booking
  });
  
  // Fetch vehicle details if booking is available
  const { data: vehicle } = useQuery({
    queryKey: [`/api/vehicles/${booking?.vehicleId}`],
    queryFn: async () => {
      // Since our API doesn't have a direct endpoint for a single vehicle,
      // we'll fetch all vehicles and find the one with the matching ID
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      const vehicles = await response.json();
      return vehicles.find((v: Vehicle) => v.id === booking.vehicleId);
    },
    enabled: !!booking
  });
  
  // Fetch support tickets for this booking
  const { data: supportTickets } = useQuery({
    queryKey: [`/api/support-tickets`],
    queryFn: async () => {
      const response = await fetch('/api/support-tickets');
      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }
      const tickets = await response.json();
      return tickets.filter((t: SupportTicket) => t.bookingId === parseInt(id));
    },
    enabled: !!booking
  });
  
  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest('PATCH', `/api/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: `Booking status has been updated to ${newStatus}`,
      });
      
      // Refetch booking data to update UI
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setNewStatus(undefined);
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create emergency support ticket mutation
  const createSupportTicketMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/emergency-support', {
        customerId: customer?.id,
        description: supportMessage,
        subject: `Emergency support for booking ${booking?.bookingRef}`,
        bookingId: parseInt(id)
      });
    },
    onSuccess: () => {
      toast({
        title: "Support request submitted",
        description: "An agent will contact the customer shortly.",
      });
      
      setSupportMessage("");
      setShowEmergencyDialog(false);
      
      // Refetch support tickets
      queryClient.invalidateQueries({ queryKey: [`/api/support-tickets`] });
    },
    onError: (error) => {
      toast({
        title: "Error submitting support request",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Set the initial status value when booking is loaded
  useEffect(() => {
    if (booking && !newStatus) {
      setNewStatus(booking.status);
    }
  }, [booking]);
  
  // Handle navigation back to bookings list
  const handleBack = () => {
    navigate('/bookings');
  };
  
  // Handle booking status update
  const handleStatusUpdate = () => {
    if (newStatus && newStatus !== booking?.status) {
      updateStatusMutation.mutate(newStatus);
    }
  };
  
  // Handle emergency support submission
  const handleEmergencySupport = () => {
    if (supportMessage.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter a message describing the emergency",
        variant: "destructive",
      });
      return;
    }
    
    createSupportTicketMutation.mutate();
  };
  
  // Generate status badge based on current status
  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-warning text-warning-foreground",
      active: "bg-success text-success-foreground",
      completed: "bg-neutral-500 text-white",
      cancelled: "bg-destructive text-destructive-foreground"
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  // Generate payment status badge
  const getPaymentStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-warning text-warning-foreground",
      paid: "bg-success text-success-foreground",
      refunded: "bg-neutral-500 text-white"
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary rounded-full mb-4"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Booking Not Found</h2>
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">The booking you're looking for doesn't exist or has been removed.</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">
              Booking {booking?.bookingRef}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Created on {format(new Date(booking?.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Phone className="mr-2 h-4 w-4" />
                Emergency Support
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Emergency Support</DialogTitle>
                <DialogDescription>
                  Request immediate assistance from a support agent. Please provide details about the emergency.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea 
                  placeholder="Describe the emergency situation..."
                  className="min-h-[120px]" 
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEmergencyDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleEmergencySupport}
                  disabled={createSupportTicketMutation.isPending}
                >
                  {createSupportTicketMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Booking Details</CardTitle>
                  <CardDescription>Complete information about this booking</CardDescription>
                </div>
                {booking?.status && getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Booking Reference</p>
                  <p className="font-medium">{booking?.bookingRef}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Source</p>
                  <p className="font-medium capitalize">{booking?.source || "Direct"}</p>
                </div>
                <div className="space-y-1 flex items-start">
                  <Calendar className="h-5 w-5 text-neutral-400 dark:text-neutral-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Pickup Date</p>
                    <p className="font-medium">{format(new Date(booking?.startDate), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="space-y-1 flex items-start">
                  <Calendar className="h-5 w-5 text-neutral-400 dark:text-neutral-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Return Date</p>
                    <p className="font-medium">{format(new Date(booking?.endDate), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="space-y-1 flex items-start">
                  <DollarSign className="h-5 w-5 text-neutral-400 dark:text-neutral-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Amount</p>
                    <p className="font-medium">${booking?.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-1 flex items-start">
                  <Clock className="h-5 w-5 text-neutral-400 dark:text-neutral-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Payment Status</p>
                    <div className="font-medium">
                      {booking?.paymentStatus && getPaymentStatusBadge(booking.paymentStatus)}
                    </div>
                  </div>
                </div>
              </div>
              
              {booking?.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Notes</p>
                    <p>{booking.notes}</p>
                  </div>
                </>
              )}
              
              {/* Display external integrations if available */}
              {booking?.googleCalendarEventId && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">External Integrations</p>
                    <div className="flex items-center">
                      <i className="ri-calendar-line text-neutral-400 mr-2"></i>
                      <span>Google Calendar Event ID: {booking.googleCalendarEventId}</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* n8n webhook data if available */}
              {booking?.n8nWebhookData && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">n8n Integration Data</p>
                    <pre className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-md text-xs overflow-auto">
                      {JSON.stringify(booking.n8nWebhookData, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <div className="flex items-center gap-3 w-full justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mr-3">Update Status:</p>
                  {booking && (
                    <StatusChanger 
                      bookingId={booking.id} 
                      currentStatus={booking.status} 
                    />
                  )}
                </div>
                <Button 
                  variant="outline"
                  onClick={handleBack}
                >
                  Back to Bookings
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Support Tickets Card (if any) */}
          {supportTickets && supportTickets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Support tickets related to this booking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.map((ticket: SupportTicket) => (
                    <div 
                      key={ticket.id} 
                      className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                    >
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">{ticket.subject}</h3>
                        <Badge 
                          variant={ticket.priority === "high" ? "destructive" : 
                                  ticket.priority === "medium" ? "default" : "outline"}
                        >
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{ticket.description}</p>
                      <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Created on {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}</span>
                        <Badge variant={ticket.status === "open" ? "outline" : "secondary"}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          {/* Customer Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Customer</CardTitle>
                <Button variant="ghost" size="sm">
                  View Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customer ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{customer.fullName}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{customer.email}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Phone</p>
                      <p>{customer.phone}</p>
                    </div>
                    
                    {customer.address && (
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Address</p>
                        <p>{customer.address}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Driver License</p>
                      <p>{customer.driverLicense}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                  Customer information not available
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Vehicle Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Vehicle</CardTitle>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vehicle ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center mr-3">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{vehicle.year} • {vehicle.category}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">License Plate</p>
                      <p>{vehicle.licensePlate}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Daily Rate</p>
                      <p>${vehicle.dailyRate.toFixed(2)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Status</p>
                      <Badge className={
                        vehicle.status === "available" 
                          ? "bg-success text-success-foreground" 
                          : vehicle.status === "maintenance" 
                            ? "bg-warning text-warning-foreground"
                            : "bg-neutral-500 text-white"
                      }>
                        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Maintenance</p>
                      <Badge variant="outline">
                        {vehicle.maintenanceStatus.charAt(0).toUpperCase() + vehicle.maintenanceStatus.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                  Vehicle information not available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
