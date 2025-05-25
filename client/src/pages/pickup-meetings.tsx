import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addHours } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  CalendarCheck,
  Clock,
  Users,
  MapPin,
  Check,
  X,
  Video,
  Calendar as CalendarIcon
} from "lucide-react";

// Define form schema
const pickupMeetingSchema = z.object({
  bookingId: z.string(),
  meetingTitle: z.string().min(5, "Title must be at least 5 characters"),
  meetingDate: z.string(),
  meetingTime: z.string(),
  duration: z.string(),
  meetingLocation: z.string().min(3, "Location is required"),
  additionalNotes: z.string().optional(),
  sendNotification: z.boolean().default(true)
});

type PickupMeetingFormValues = z.infer<typeof pickupMeetingSchema>;

export default function PickupMeetings() {
  const { toast } = useToast();
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  
  // Fetch bookings
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<any[]>({
    queryKey: ['/api/bookings'],
  });
  
  // Check Google Calendar connection status
  const { data: googleStatus, isLoading: isLoadingGoogleStatus } = useQuery<{ connected: boolean }>({
    queryKey: ['/api/google/calendar/test'],
  });
  
  // Update connection status when data changes
  useEffect(() => {
    if (googleStatus) {
      setIsGoogleConnected(googleStatus.connected);
    }
  }, [googleStatus]);

  // Form setup
  const form = useForm<PickupMeetingFormValues>({
    resolver: zodResolver(pickupMeetingSchema),
    defaultValues: {
      bookingId: "",
      meetingTitle: "Car Pickup Meeting",
      meetingDate: format(new Date(), "yyyy-MM-dd"),
      meetingTime: format(new Date(), "HH:mm"),
      duration: "30",
      meetingLocation: "Main Office",
      additionalNotes: "Please bring your driver's license and payment method.",
      sendNotification: true
    }
  });

  // Handle booking selection
  const handleBookingChange = (bookingId: string) => {
    const booking = bookings.find((b: any) => b.id.toString() === bookingId);
    setSelectedBooking(booking);

    if (booking) {
      // Update form values based on booking
      form.setValue("bookingId", bookingId);
      form.setValue("meetingTitle", `Car Pickup: ${booking.bookingRef || "Meeting"}`);
      
      // If there's a customer, update the notes
      if (booking.customerDetails) {
        form.setValue("additionalNotes", 
          `Meeting with ${booking.customerDetails.fullName || "Customer"} for vehicle pickup.\n` +
          `Booking Reference: ${booking.bookingRef || "N/A"}\n` +
          `Please bring your driver's license and payment method.`
        );
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data: PickupMeetingFormValues) => {
    if (!isGoogleConnected) {
      toast({
        title: "Google Calendar not connected",
        description: "Please connect Google Calendar to schedule meetings.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedBooking) {
      toast({
        title: "No booking selected",
        description: "Please select a booking for this pickup meeting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format the date and time for the API
      const meetingDateTime = `${data.meetingDate}T${data.meetingTime}:00`;
      const durationMinutes = parseInt(data.duration);
      
      // Prepare the meeting data
      const meetingData = {
        bookingId: data.bookingId,
        title: data.meetingTitle,
        startDateTime: meetingDateTime,
        durationMinutes: durationMinutes,
        location: data.meetingLocation,
        description: data.additionalNotes,
        attendees: [
          selectedBooking.customerDetails?.email || ''
        ],
        sendNotification: data.sendNotification
      };
      
      // Send the data to the API
      const response = await fetch('/api/calendar/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule meeting');
      }
      
      const result = await response.json();
      
      toast({
        title: "Meeting scheduled",
        description: "The pickup meeting has been added to Google Calendar.",
      });
      
      // Reset the form
      form.reset({
        bookingId: "",
        meetingTitle: "Car Pickup Meeting",
        meetingDate: format(new Date(), "yyyy-MM-dd"),
        meetingTime: format(new Date(), "HH:mm"),
        duration: "30",
        meetingLocation: "Main Office",
        additionalNotes: "Please bring your driver's license and payment method.",
        sendNotification: true
      });
      
      setSelectedBooking(null);
      
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast({
        title: "Failed to schedule meeting",
        description: "There was an error scheduling the pickup meeting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pickup Meetings</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Schedule pickup meetings with customers via Google Calendar</p>
        </div>
        
        {!isGoogleConnected && !isLoadingGoogleStatus && (
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/google/auth/calendar/url'}
            className="flex items-center"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Connect Google Calendar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Pickup Meeting</CardTitle>
              <CardDescription>Create a meeting and send Google Calendar invites to the customer</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Booking Selection */}
                  <FormField
                    control={form.control}
                    name="bookingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking</FormLabel>
                        <Select
                          onValueChange={handleBookingChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a booking" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingBookings ? (
                              <SelectItem value="loading">Loading bookings...</SelectItem>
                            ) : (
                              bookings.map((booking: any) => (
                                <SelectItem key={booking.id} value={booking.id.toString()}>
                                  {booking.bookingRef} - {booking.customerDetails?.fullName || 'Unknown customer'}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Meeting Title */}
                  <FormField
                    control={form.control}
                    name="meetingTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Car Pickup Meeting" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Meeting Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="meetingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="meetingTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="90">1.5 hours</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Meeting Location */}
                  <FormField
                    control={form.control}
                    name="meetingLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Main Office, Online, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Notes */}
                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Additional information for the meeting"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Send Notification Checkbox */}
                  <FormField
                    control={form.control}
                    name="sendNotification"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                            />
                          </div>
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Send calendar notification</FormLabel>
                          <p className="text-sm text-neutral-500">
                            Send an email notification to the customer about this meeting
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full md:w-auto" 
                    disabled={isSubmitting || !isGoogleConnected}
                  >
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Schedule Meeting
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          {/* Meeting Preview Card */}
          {selectedBooking && (
            <Card>
              <CardHeader>
                <CardTitle>Meeting Preview</CardTitle>
                <CardDescription>How the meeting will appear in Google Calendar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{form.watch("meetingTitle")}</h3>
                    <div className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                      {form.watch("duration")} min
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-2 text-sm">
                    <CalendarIcon className="h-4 w-4 mr-2 text-neutral-500" />
                    <span>
                      {form.watch("meetingDate") ? new Date(form.watch("meetingDate")).toLocaleDateString() : "Date"}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-2 text-sm">
                    <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                    <span>{form.watch("meetingTime") || "Time"}</span>
                  </div>
                  
                  <div className="flex items-center mb-2 text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
                    <span>{form.watch("meetingLocation") || "Location"}</span>
                  </div>
                  
                  <div className="flex items-center mb-2 text-sm">
                    <Users className="h-4 w-4 mr-2 text-neutral-500" />
                    <span>
                      You, {selectedBooking.customerDetails?.fullName || 'Customer'}
                      {selectedBooking.customerDetails?.email && ` (${selectedBooking.customerDetails.email})`}
                    </span>
                  </div>
                  
                  {selectedBooking.bookingRef && (
                    <div className="text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      Booking Reference: {selectedBooking.bookingRef}
                    </div>
                  )}
                </div>
                
                {/* Google Calendar Status */}
                <div className="flex items-center mt-2">
                  {isGoogleConnected ? (
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4 mr-1" />
                      Google Calendar connected
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                      <X className="h-4 w-4 mr-1" />
                      Google Calendar not connected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Google Calendar Connection Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Calendar Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${isGoogleConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">Google Calendar</span>
                </div>
                
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {isGoogleConnected 
                    ? "Your Google Calendar is connected. You can schedule pickup meetings and send invites to customers."
                    : "Connect your Google Calendar to schedule pickup meetings and send invites to customers."}
                </p>
                
                {!isGoogleConnected && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={() => window.location.href = '/api/google/auth/calendar/url'}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Connect Google Calendar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Meeting Tips Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Meeting Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                  <span>Schedule meetings during business hours for better customer satisfaction</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                  <span>Include clear instructions on what documents customers need to bring</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                  <span>Allow at least 30 minutes for each pickup meeting</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                  <span>Send a reminder 24 hours before the scheduled meeting</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}