import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { bookingFormSchema } from "@shared/schema";

export default function BookingForm() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() + 3)));
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      return await response.json();
    }
  });
  
  // Get vehicles
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['/api/vehicles'],
    queryFn: async () => {
      const response = await fetch('/api/vehicles');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      return await response.json();
    }
  });
  
  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerId: undefined,
      vehicleId: undefined,
      startDate: startDate,
      endDate: endDate,
      totalAmount: 0,
      paymentStatus: "pending",
      status: "pending",
      notes: "",
      source: "direct",
      bookingRef: `BK-${Math.floor(Math.random() * 1000) + 8000}`,
      customerName: "",
      vehicleName: ""
    }
  });
  
  const bookingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookingFormSchema>) => {
      // Remove the extra fields we added for the form
      const { customerName, vehicleName, ...bookingData } = data;
      
      // Format dates as strings for API
      const formattedData = {
        ...bookingData,
        startDate: bookingData.startDate.toISOString().split('T')[0],
        endDate: bookingData.endDate.toISOString().split('T')[0]
      };
      
      return apiRequest('POST', '/api/bookings', formattedData);
    },
    onSuccess: () => {
      toast({
        title: "Booking created",
        description: "The booking has been created successfully",
      });
      
      // Reset form
      form.reset();
      
      // Invalidate booking queries
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error creating booking",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const calculateTotalAmount = (vehicleId: number, start: Date, end: Date) => {
    if (!vehicles) return 0;
    
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return 0;
    
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return vehicle.dailyRate * days;
  };
  
  const handleCustomerChange = (customerId: string) => {
    if (!customers) return;
    
    const customer = customers.find(c => c.id === parseInt(customerId));
    if (customer) {
      form.setValue("customerName", customer.fullName);
    }
  };
  
  const handleVehicleChange = (vehicleId: string) => {
    if (!vehicles) return;
    
    const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
    if (vehicle) {
      form.setValue("vehicleName", `${vehicle.make} ${vehicle.model} (${vehicle.year})`);
      
      // Calculate total amount
      const start = form.getValues("startDate");
      const end = form.getValues("endDate");
      if (start && end) {
        const totalAmount = calculateTotalAmount(parseInt(vehicleId), start, end);
        form.setValue("totalAmount", totalAmount);
      }
    }
  };
  
  const onSubmit = (data: z.infer<typeof bookingFormSchema>) => {
    bookingMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    handleCustomerChange(value);
                  }}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingCustomers ? (
                      <SelectItem value="loading">Loading customers...</SelectItem>
                    ) : (
                      customers?.map(customer => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.fullName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Vehicle Selection */}
          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    handleVehicleChange(value);
                  }}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingVehicles ? (
                      <SelectItem value="loading">Loading vehicles...</SelectItem>
                    ) : (
                      vehicles?.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Booking Reference */}
          <FormField
            control={form.control}
            name="bookingRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booking Reference</FormLabel>
                <FormControl>
                  <Input {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Booking Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Pickup Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button 
                        variant="outline" 
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setStartDate(date);
                        
                        // Recalculate total if vehicle is selected
                        const vehicleId = form.getValues("vehicleId");
                        const endDate = form.getValues("endDate");
                        if (vehicleId && date && endDate) {
                          const totalAmount = calculateTotalAmount(vehicleId, date, endDate);
                          form.setValue("totalAmount", totalAmount);
                        }
                      }}
                      disabled={(date) => date < new Date() || date > (endDate || new Date(2100, 0, 1))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* End Date */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Return Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button 
                        variant="outline" 
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setEndDate(date);
                        
                        // Recalculate total if vehicle is selected
                        const vehicleId = form.getValues("vehicleId");
                        const startDate = form.getValues("startDate");
                        if (vehicleId && startDate && date) {
                          const totalAmount = calculateTotalAmount(vehicleId, startDate, date);
                          form.setValue("totalAmount", totalAmount);
                        }
                      }}
                      disabled={(date) => date < (startDate || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Total Amount */}
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">$</div>
                    <Input {...field} type="number" className="pl-6" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Payment Status */}
          <FormField
            control={form.control}
            name="paymentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter any additional notes about this booking" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full md:w-auto"
          disabled={bookingMutation.isPending}
        >
          {bookingMutation.isPending ? "Creating..." : "Create Booking"}
        </Button>
      </form>
    </Form>
  );
}
