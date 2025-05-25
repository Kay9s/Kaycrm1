import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  customerId: z.string().min(1, "Customer is required"),
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
type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: number;
  bookingId?: number | null;
  status: 'pending' | 'paid' | 'canceled';
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt?: string;
};

export default function InvoicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Fetch invoices from database
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });
  
  // Fetch customers for dropdown
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });
  
  // Fetch bookings for dropdown
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<any[]>({
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
    
    // Get customer and booking details
    const customer = Array.isArray(customers) ? 
      customers.find((c: any) => c.id === invoice.customerId) : null;
    
    const booking = invoice.bookingId && Array.isArray(bookings) ? 
      bookings.find((b: any) => b.id === invoice.bookingId) : null;
    
    setSelectedCustomer(customer);
    setSelectedBooking(booking);
    
    // Parse invoice items from JSON string if needed
    let items = invoice.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items as string);
      } catch (e) {
        console.error('Failed to parse invoice items:', e);
        items = [{ description: "", quantity: 1, unitPrice: 0 }];
      }
    }
    
    setInvoiceItems(items as InvoiceItem[]);
    
    form.reset({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: format(new Date(invoice.invoiceDate), "yyyy-MM-dd"),
      dueDate: format(new Date(invoice.dueDate), "yyyy-MM-dd"),
      customerId: invoice.customerId.toString(),
      bookingId: invoice.bookingId ? invoice.bookingId.toString() : "none",
      items: items as InvoiceItem[],
      notes: invoice.notes || "",
      paymentTerms: invoice.paymentTerms || "",
      taxRate: invoice.taxRate,
    });
    
    setActiveTab("edit");
  };
  
  // Handle deleting an invoice
  const handleDeleteInvoice = async (id: number) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }
      
      // Invalidate and refetch invoices
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete the invoice. Please try again.",
        variant: "destructive",
      });
    }
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
      
      // Get customer details
      const customer = Array.isArray(customers) ? 
        customers.find((c: any) => c.id === invoice.customerId) : null;
      
      // Parse invoice items from JSON string if needed
      let items = invoice.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items as string);
        } catch (e) {
          console.error('Failed to parse invoice items:', e);
          items = [];
        }
      }
      
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
              <p style="font-weight: 500; margin: 0 0 5px 0;">${customer?.fullName || 'Customer'}</p>
              <p style="margin: 0 0 5px 0;">${customer?.email || ''}</p>
              <p style="margin: 0 0 5px 0;">${customer?.phone || ''}</p>
              ${customer?.address ? `<p style="margin: 0;">${customer.address}</p>` : ''}
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
              ${items.map((item: any) => `
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
            <p style="margin: 0 0 20px 0;">${invoice.notes || ''}</p>
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
  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      // Calculate financial values
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal();
      
      // Prepare invoice data for API
      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        invoiceDate: new Date(data.invoiceDate).toISOString().split('T')[0],
        dueDate: new Date(data.dueDate).toISOString().split('T')[0],
        customerId: parseInt(data.customerId),
        bookingId: data.bookingId && data.bookingId !== "none" ? parseInt(data.bookingId) : null,
        status: "pending",
        subtotal,
        taxRate: data.taxRate,
        tax,
        total,
        notes: data.notes || "",
        paymentTerms: data.paymentTerms || "Net 30",
        items: JSON.stringify(data.items)
      };
      
      if (selectedInvoice) {
        // Update existing invoice
        const response = await fetch(`/api/invoices/${selectedInvoice.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            ...invoiceData,
            status: selectedInvoice.status 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update invoice');
        }
        
        toast({
          title: "Invoice updated",
          description: `Invoice ${data.invoiceNumber} has been updated successfully.`,
        });
      } else {
        // Create new invoice
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create invoice');
        }
        
        toast({
          title: "Invoice created",
          description: `Invoice ${data.invoiceNumber} has been created successfully.`,
        });
      }
      
      // Invalidate and refetch invoices
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
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
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: "Failed to save the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Create and manage customer invoices</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">Invoice List</TabsTrigger>
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
          {selectedInvoice && <TabsTrigger value="edit">Edit Invoice</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="list">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoice List</CardTitle>
                <CardDescription>Manage your customer invoices</CardDescription>
              </div>
              <Button onClick={() => { setActiveTab("create"); setSelectedInvoice(null); }}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Invoice
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingInvoices ? (
                <div className="py-8 text-center">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                  <p className="text-neutral-500 dark:text-neutral-400">No invoices found</p>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-4">Create your first invoice to get started</p>
                  <Button onClick={() => setActiveTab("create")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Invoice #</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Customer</th>
                        <th className="text-right py-3 px-4">Amount</th>
                        <th className="text-center py-3 px-4">Status</th>
                        <th className="text-right py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice: any) => {
                        // Find customer name
                        const customer = Array.isArray(customers) ? 
                          customers.find((c: any) => c.id === invoice.customerId) : null;
                        
                        return (
                          <tr key={invoice.id} className="border-b">
                            <td className="py-3 px-4">{invoice.invoiceNumber}</td>
                            <td className="py-3 px-4">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                            <td className="py-3 px-4">{customer?.fullName || 'Unknown'}</td>
                            <td className="py-3 px-4 text-right">${invoice.total?.toFixed(2)}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge 
                                variant={
                                  invoice.status === 'paid' ? 'default' : 
                                  invoice.status === 'pending' ? 'outline' : 
                                  'destructive'
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditInvoice(invoice)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generatePDF(invoice)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
              <CardTitle>Create New Invoice</CardTitle>
              <CardDescription>Create a new invoice for your customer</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                              ) : Array.isArray(customers) && customers.length > 0 ? (
                                customers.map((customer: any) => (
                                  <SelectItem key={customer.id} value={customer.id.toString()}>
                                    {customer.fullName}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="empty" disabled>No customers found</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bookingId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking (Optional)</FormLabel>
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
                              <SelectItem value="none">No booking</SelectItem>
                              {isLoadingBookings ? (
                                <SelectItem value="loading" disabled>Loading bookings...</SelectItem>
                              ) : Array.isArray(bookings) && bookings.length > 0 ? (
                                bookings.map((booking: any) => (
                                  <SelectItem key={booking.id} value={booking.id.toString()}>
                                    {booking.bookingRef} - {booking.vehicleDetails?.make} {booking.vehicleDetails?.model}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="empty" disabled>No bookings found</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Invoice Items</h3>
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
                    
                    <div className="border rounded-md">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-neutral-50 dark:bg-neutral-800 border-b">
                            <th className="text-left py-2 px-4">Description</th>
                            <th className="text-center py-2 px-4 w-24">Quantity</th>
                            <th className="text-center py-2 px-4 w-32">Unit Price</th>
                            <th className="text-right py-2 px-4 w-32">Amount</th>
                            <th className="text-center py-2 px-4 w-16">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceItems.map((item, index) => (
                            <tr key={index} className="border-b last:border-b-0">
                              <td className="py-2 px-4">
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                                  placeholder="Item description"
                                  className="border-0 p-0 h-auto focus-visible:ring-0"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  min={1}
                                  className="text-center border-0 p-0 h-auto focus-visible:ring-0"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  min={0}
                                  step={0.01}
                                  className="text-center border-0 p-0 h-auto focus-visible:ring-0"
                                />
                              </td>
                              <td className="py-2 px-4 text-right">
                                ${(item.quantity * item.unitPrice).toFixed(2)}
                              </td>
                              <td className="py-2 px-4 text-center">
                                {invoiceItems.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeInvoiceItem(index)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter any additional notes or terms"
                                className="resize-none h-32"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Terms</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Net 30, Due on Receipt" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Invoice Summary</h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-600 dark:text-neutral-400">Subtotal:</span>
                          <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-neutral-600 dark:text-neutral-400">Tax:</span>
                            <FormField
                              control={form.control}
                              name="taxRate"
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      min={0}
                                      max={100}
                                      step={0.1}
                                      className="w-16 h-7 text-center p-0"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <span className="text-neutral-600 dark:text-neutral-400">%</span>
                          </div>
                          <span className="font-medium">${calculateTax().toFixed(2)}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-bold">Total:</span>
                          <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        setInvoiceItems([{ description: "", quantity: 1, unitPrice: 0 }]);
                        setActiveTab("list");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
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
              <CardTitle>Edit Invoice: {selectedInvoice?.invoiceNumber}</CardTitle>
              <CardDescription>Update invoice details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                              ) : Array.isArray(customers) && customers.length > 0 ? (
                                customers.map((customer: any) => (
                                  <SelectItem key={customer.id} value={customer.id.toString()}>
                                    {customer.fullName}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="empty" disabled>No customers found</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bookingId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking (Optional)</FormLabel>
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
                              <SelectItem value="none">No booking</SelectItem>
                              {isLoadingBookings ? (
                                <SelectItem value="loading" disabled>Loading bookings...</SelectItem>
                              ) : Array.isArray(bookings) && bookings.length > 0 ? (
                                bookings.map((booking: any) => (
                                  <SelectItem key={booking.id} value={booking.id.toString()}>
                                    {booking.bookingRef} - {booking.vehicleDetails?.make} {booking.vehicleDetails?.model}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="empty" disabled>No bookings found</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Invoice Items</h3>
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
                    
                    <div className="border rounded-md">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-neutral-50 dark:bg-neutral-800 border-b">
                            <th className="text-left py-2 px-4">Description</th>
                            <th className="text-center py-2 px-4 w-24">Quantity</th>
                            <th className="text-center py-2 px-4 w-32">Unit Price</th>
                            <th className="text-right py-2 px-4 w-32">Amount</th>
                            <th className="text-center py-2 px-4 w-16">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceItems.map((item, index) => (
                            <tr key={index} className="border-b last:border-b-0">
                              <td className="py-2 px-4">
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                                  placeholder="Item description"
                                  className="border-0 p-0 h-auto focus-visible:ring-0"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  min={1}
                                  className="text-center border-0 p-0 h-auto focus-visible:ring-0"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  min={0}
                                  step={0.01}
                                  className="text-center border-0 p-0 h-auto focus-visible:ring-0"
                                />
                              </td>
                              <td className="py-2 px-4 text-right">
                                ${(item.quantity * item.unitPrice).toFixed(2)}
                              </td>
                              <td className="py-2 px-4 text-center">
                                {invoiceItems.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeInvoiceItem(index)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter any additional notes or terms"
                                className="resize-none h-32"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Terms</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Net 30, Due on Receipt" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Invoice Summary</h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-600 dark:text-neutral-400">Subtotal:</span>
                          <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-neutral-600 dark:text-neutral-400">Tax:</span>
                            <FormField
                              control={form.control}
                              name="taxRate"
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      min={0}
                                      max={100}
                                      step={0.1}
                                      className="w-16 h-7 text-center p-0"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <span className="text-neutral-600 dark:text-neutral-400">%</span>
                          </div>
                          <span className="font-medium">${calculateTax().toFixed(2)}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-bold">Total:</span>
                          <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        setInvoiceItems([{ description: "", quantity: 1, unitPrice: 0 }]);
                        setActiveTab("list");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
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