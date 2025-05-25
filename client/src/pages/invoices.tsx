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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, 
  FileText, 
  Save, 
  Download, 
  Edit, 
  Trash2
} from "lucide-react";

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

// Define type for invoice record
type Invoice = InvoiceFormValues & {
  id: number;
  createdAt: string;
  updatedAt?: string;
  status: 'pending' | 'paid' | 'canceled';
  subtotal: number;
  tax: number;
  total: number;
  customerDetails?: any;
  bookingDetails?: any;
};

export default function InvoicesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
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
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
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
  
  // Load stored invoices from localStorage on mount
  useEffect(() => {
    const storedInvoices = localStorage.getItem('carflow_invoices');
    if (storedInvoices) {
      try {
        setInvoices(JSON.parse(storedInvoices));
      } catch (e) {
        console.error('Failed to parse stored invoices', e);
      }
    }
  }, []);
  
  // Save invoices to localStorage when they change
  useEffect(() => {
    if (invoices.length > 0) {
      localStorage.setItem('carflow_invoices', JSON.stringify(invoices));
    }
  }, [invoices]);
  
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
  
  // Handle editing an existing invoice
  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSelectedCustomer(invoice.customerDetails);
    setSelectedBooking(invoice.bookingDetails);
    setInvoiceItems(invoice.items);
    
    form.reset({
      ...invoice
    });
    
    setActiveTab("edit");
  };
  
  // Handle deleting an invoice
  const handleDeleteInvoice = (id: number) => {
    const updatedInvoices = invoices.filter(inv => inv.id !== id);
    setInvoices(updatedInvoices);
    localStorage.setItem('carflow_invoices', JSON.stringify(updatedInvoices));
    
    toast({
      title: "Invoice deleted",
      description: "The invoice has been deleted successfully.",
    });
  };
  
  // Generate PDF function
  const generatePDF = async (invoice: Invoice) => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      // Create a temporary container for the invoice preview
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '800px';
      container.style.background = 'white';
      container.style.padding = '20px';
      document.body.appendChild(container);
      
      // Fill the container with invoice HTML
      container.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 5px 0;">INVOICE</h1>
              <p style="font-size: 18px; margin: 0;">${invoice.invoiceNumber}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; font-weight: bold; margin: 0 0 5px 0;">CarFlow Rental</h2>
              <p style="margin: 0; font-size: 14px;">123 Business Street</p>
              <p style="margin: 0; font-size: 14px;">City, State 12345</p>
              <p style="margin: 0; font-size: 14px;">support@carflowrental.com</p>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <h3 style="text-transform: uppercase; font-size: 12px; color: #777; margin: 0 0 10px 0;">Bill To:</h3>
              <p style="font-weight: 500; margin: 0 0 5px 0;">${invoice.customerDetails?.fullName || 'Customer'}</p>
              <p style="margin: 0 0 5px 0;">${invoice.customerDetails?.email || ''}</p>
              <p style="margin: 0 0 5px 0;">${invoice.customerDetails?.phone || ''}</p>
              ${invoice.customerDetails?.address ? `<p style="margin: 0;">${invoice.customerDetails.address}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 5px 0;"><span style="font-size: 12px; text-transform: uppercase; color: #777; font-weight: bold;">Invoice Date:</span> <span>${new Date(invoice.invoiceDate).toLocaleDateString()}</span></p>
              <p style="margin: 0 0 5px 0;"><span style="font-size: 12px; text-transform: uppercase; color: #777; font-weight: bold;">Due Date:</span> <span>${new Date(invoice.dueDate).toLocaleDateString()}</span></p>
              <p style="margin: 0;"><span style="font-size: 12px; text-transform: uppercase; color: #777; font-weight: bold;">Status:</span> <span style="font-weight: 500;">${invoice.status.toUpperCase()}</span></p>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #ddd;">
                <th style="text-align: left; padding: 10px 5px;">Description</th>
                <th style="text-align: right; padding: 10px 5px;">Quantity</th>
                <th style="text-align: right; padding: 10px 5px;">Unit Price</th>
                <th style="text-align: right; padding: 10px 5px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item) => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px 5px;">${item.description}</td>
                  <td style="text-align: right; padding: 10px 5px;">${item.quantity}</td>
                  <td style="text-align: right; padding: 10px 5px;">$${item.unitPrice.toFixed(2)}</td>
                  <td style="text-align: right; padding: 10px 5px;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 33%;">
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
                <span style="font-weight: 500;">Subtotal:</span>
                <span>$${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
                <span style="font-weight: 500;">Tax (${invoice.taxRate}%):</span>
                <span>$${invoice.tax.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; font-size: 18px;">
                <span>Total:</span>
                <span>$${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3 style="font-weight: bold; margin: 0 0 10px 0;">Notes:</h3>
            <p style="margin: 0 0 20px 0;">${invoice.notes}</p>
            <p style="text-align: center; font-size: 14px; color: #777;">Thank you for your business!</p>
          </div>
        </div>
      `;
      
      // Show loading toast
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your invoice PDF...",
      });
      
      // Create canvas from the container
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });
      
      // Remove the temporary container
      document.body.removeChild(container);
      
      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoice.invoiceNumber} has been downloaded.`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle form submission
  const onSubmit = (data: InvoiceFormValues) => {
    // Format the data for invoice creation/update
    const currentDate = new Date().toISOString();
    const invoiceData: Invoice = {
      ...data,
      id: selectedInvoice ? selectedInvoice.id : Math.floor(Math.random() * 100000),
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      status: "pending",
      customerDetails: selectedCustomer,
      bookingDetails: selectedBooking,
      createdAt: selectedInvoice ? selectedInvoice.createdAt : currentDate,
      updatedAt: selectedInvoice ? currentDate : undefined
    };
    
    console.log("Invoice data:", invoiceData);
    
    // Update invoices state based on whether we're editing or creating
    if (selectedInvoice) {
      // Updating existing invoice
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => inv.id === selectedInvoice.id ? invoiceData : inv)
      );
      
      toast({
        title: "Invoice updated",
        description: `Invoice ${data.invoiceNumber} has been updated successfully.`,
      });
    } else {
      // Creating new invoice
      setInvoices(prevInvoices => [...prevInvoices, invoiceData]);
      
      toast({
        title: "Invoice created",
        description: `Invoice ${data.invoiceNumber} has been created successfully.`,
      });
    }
    
    // Reset form and state for next invoice
    form.reset({
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      customerId: "",
      bookingId: "none",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
      notes: "Thank you for your business!",
      paymentTerms: "Net 30",
      taxRate: 10,
    });
    
    // Reset component state
    setInvoiceItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    setSelectedCustomer(null);
    setSelectedBooking(null);
    setSelectedInvoice(null);
    setActiveTab("list");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Create and manage customer invoices</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Invoice List</TabsTrigger>
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
          {selectedInvoice && <TabsTrigger value="edit">Edit Invoice</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Invoice List</CardTitle>
                  <CardDescription>Manage and view all customer invoices</CardDescription>
                </div>
                <Button onClick={() => setActiveTab("create")}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Invoices Yet</h3>
                  <p className="text-neutral-500 mb-4">Create your first invoice to get started</p>
                  <Button onClick={() => setActiveTab("create")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Invoice
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="text-left py-3 px-4">Invoice #</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Customer</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-right py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(invoice => (
                        <tr 
                          key={invoice.id} 
                          className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                          <td className="py-3 px-4 font-medium">{invoice.invoiceNumber}</td>
                          <td className="py-3 px-4">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{invoice.customerDetails?.fullName || 'Unknown'}</td>
                          <td className="py-3 px-4">${invoice.total.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={
                              invoice.status === 'paid' ? 'default' : 
                              invoice.status === 'pending' ? 'outline' : 'secondary'
                            }>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditInvoice(invoice)}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => generatePDF(invoice)}
                            >
                              <Download className="h-4 w-4 mr-1" /> PDF
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:text-red-300"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
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
                            value={field.value}
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
                            value={field.value}
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
                      onClick={() => setActiveTab("list")}
                    >
                      Cancel
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
        </TabsContent>
        
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Invoice</CardTitle>
              <CardDescription>
                {selectedInvoice && `Editing Invoice ${selectedInvoice.invoiceNumber}`}
              </CardDescription>
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
                            value={field.value}
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
                            value={field.value}
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
                      onClick={() => setActiveTab("list")}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Update Invoice
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}