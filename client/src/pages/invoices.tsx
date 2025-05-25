import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Separator } from "@/components/ui/separator";
import { PlusCircle, FileText, Save, Printer, Download } from "lucide-react";

// Define form schema
const invoiceFormSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  customerId: z.string(),
  bookingId: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unitPrice: z.number().min(0, "Price must be a positive number"),
    })
  ),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  taxRate: z.number().min(0, "Tax rate must be a positive number"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export default function InvoicesPage() {
  const { toast } = useToast();
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState(1000);
  
  // Fetch customers for dropdown
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
  });
  
  // Fetch bookings for dropdown
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['/api/bookings'],
  });
  
  // Initialize form with default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: `INV-${lastInvoiceNumber + 1}`,
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      customerId: "",
      bookingId: "none",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
      notes: "Thank you for your business!",
      paymentTerms: "Net 30",
      taxRate: 10,
    },
  });
  
  // Add a new invoice item row
  const addInvoiceItem = () => {
    const newItems = [...invoiceItems, { description: "", quantity: 1, unitPrice: 0 }];
    setInvoiceItems(newItems);
    form.setValue("items", newItems);
  };
  
  // Remove an invoice item row
  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      const newItems = [...invoiceItems];
      newItems.splice(index, 1);
      setInvoiceItems(newItems);
      form.setValue("items", newItems);
    }
  };
  
  // Update an invoice item field
  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceItems(newItems);
    form.setValue("items", newItems);
  };
  
  // Calculate subtotal
  const calculateSubtotal = () => {
    return invoiceItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };
  
  // Calculate tax
  const calculateTax = () => {
    const taxRate = form.getValues("taxRate") || 0;
    return calculateSubtotal() * (taxRate / 100);
  };
  
  // Calculate total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };
  
  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    form.setValue("customerId", customerId);
    const customer = Array.isArray(customers) ? 
      customers.find((c: any) => c.id.toString() === customerId) : null;
    setSelectedCustomer(customer);
  };
  
  // Handle booking selection
  const handleBookingChange = (bookingId: string) => {
    form.setValue("bookingId", bookingId);
    
    if (bookingId === "none") {
      setSelectedBooking(null);
      return;
    }
    
    const booking = Array.isArray(bookings) ? 
      bookings.find((b: any) => b.id.toString() === bookingId) : null;
    setSelectedBooking(booking);
    
    if (booking) {
      // Auto-populate invoice items based on booking
      const newItems = [
        {
          description: `Car Rental: ${booking.vehicleDetails?.make || ""} ${booking.vehicleDetails?.model || ""} (${booking.bookingRef})`,
          quantity: 1,
          unitPrice: booking.totalAmount || 0,
        }
      ];
      setInvoiceItems(newItems);
      form.setValue("items", newItems);
    }
  };
  
  // Handle form submission
  const onSubmit = (data: InvoiceFormValues) => {
    // Format the data for storage or API call
    const invoiceData = {
      ...data,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      status: "pending",
      customerDetails: selectedCustomer,
      bookingDetails: selectedBooking,
    };
    
    console.log("Invoice data:", invoiceData);
    
    // Here you would typically call an API to save the invoice
    // For now, just show a success message
    toast({
      title: "Invoice created",
      description: `Invoice ${data.invoiceNumber} has been created successfully.`,
    });
    
    // Increment the invoice number for next time
    setLastInvoiceNumber(prevNum => prevNum + 1);
    
    // Set a new invoice number
    const nextNumber = lastInvoiceNumber + 1;
    form.setValue("invoiceNumber", `INV-${nextNumber}`);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Create and manage customer invoices</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Create Invoice</CardTitle>
          <CardDescription>Generate a new invoice for a customer</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Invoice Number */}
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Invoice Date */}
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Selection */}
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={handleCustomerChange}
                        defaultValue={field.value}
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
                            Array.isArray(customers) ? customers.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.fullName}
                              </SelectItem>
                            )) : null
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Booking Selection (Optional) */}
                <FormField
                  control={form.control}
                  name="bookingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Booking (Optional)</FormLabel>
                      <Select
                        onValueChange={handleBookingChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a booking" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {isLoadingBookings ? (
                            <SelectItem value="loading">Loading bookings...</SelectItem>
                          ) : (
                            Array.isArray(bookings) && selectedCustomer ? 
                              bookings
                                .filter((booking: any) => booking.customerId === selectedCustomer.id)
                                .map((booking: any) => (
                                  <SelectItem key={booking.id} value={booking.id.toString()}>
                                    {booking.bookingRef} - {new Date(booking.startDate).toLocaleDateString()}
                                  </SelectItem>
                                ))
                              : null
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Customer Details */}
              {selectedCustomer && (
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Customer Details:</h3>
                  <div className="text-sm">
                    <p><strong>Name:</strong> {selectedCustomer.fullName}</p>
                    <p><strong>Email:</strong> {selectedCustomer.email}</p>
                    <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                    {selectedCustomer.address && (
                      <p><strong>Address:</strong> {selectedCustomer.address}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Invoice Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Invoice Items</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addInvoiceItem}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 font-medium text-sm text-neutral-500 dark:text-neutral-400 px-2">
                    <div className="col-span-6 md:col-span-6">Description</div>
                    <div className="col-span-2 md:col-span-2">Quantity</div>
                    <div className="col-span-3 md:col-span-3">Unit Price</div>
                    <div className="col-span-1 md:col-span-1"></div>
                  </div>
                  
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-6 md:col-span-6">
                        <Input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2 md:col-span-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3 md:col-span-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateInvoiceItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-1 flex justify-center">
                        {invoiceItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInvoiceItem(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                  <div className="flex justify-end">
                    <div className="w-full md:w-1/3 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Tax Rate:</span>
                        <div className="w-20">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={form.watch("taxRate")}
                            onChange={(e) => form.setValue("taxRate", parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                          />
                        </div>
                        <span>%</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${calculateTax().toFixed(2)}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Additional notes to the customer"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Payment Terms */}
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Net 30, Due on Receipt" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Invoice
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Invoice Preview Modal would go here */}
    </div>
  );
}