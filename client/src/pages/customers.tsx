import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ExportToSheets from "@/components/ExportToSheets";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Customer, Booking } from "@shared/schema";
import { Search, Plus, ArrowUpDown, Mail, Phone, User, Calendar, MapPin, Car, FileEdit } from "lucide-react";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const pageSize = 10;
  
  // Fetch customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      return await response.json();
    }
  });
  
  // Fetch bookings for customer data
  const { data: bookings } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return await response.json();
    }
  });
  
  // Function to get total bookings for a customer
  const getBookingsCount = (customerId: number) => {
    if (!bookings) return 0;
    return bookings.filter((booking: Booking) => booking.customerId === customerId).length;
  };
  
  // Filter customers based on search query
  const filteredCustomers = customers?.filter((customer: Customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.fullName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower) ||
      (customer.driverLicense && customer.driverLicense.toLowerCase().includes(searchLower))
    );
  }) || [];
  
  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Function to render pagination
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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Customers</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage your customer database and profiles</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new customer to your database.
                </DialogDescription>
              </DialogHeader>
              {/* Placeholder for customer form - would implement a proper form component in a real app */}
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input placeholder="e.g. John Smith" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="e.g. john@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input placeholder="e.g. (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input placeholder="Enter address" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Driver License</label>
                  <Input placeholder="e.g. DL12345678" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input placeholder="Additional notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Customer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>
            View and manage all your customers
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input 
                placeholder="Search by name, email, or phone..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <ExportToSheets 
                dataType="customers"
                data={customers || []}
                disabled={isLoading || !customers?.length}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">
                    <div className="flex items-center">
                      Customer
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Contact
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Driver License
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-neutral-500 dark:text-neutral-400">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-neutral-500 dark:text-neutral-400">
                      No customers found matching your search criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer: Customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.fullName}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {customer.createdAt && `Customer since ${new Date(customer.createdAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-neutral-400" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-neutral-400" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.driverLicense}</TableCell>
                      <TableCell className="text-right">{getBookingsCount(customer.id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowViewDialog(true);
                            }}
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowEditDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing {paginatedCustomers.length} of {filteredCustomers.length} customers
          </div>
          {totalPages > 1 && renderPagination()}
        </CardFooter>
      </Card>
      
      {/* View Customer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Detailed information about this customer
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="py-4">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mr-4">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{selectedCustomer.fullName}</h2>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    Customer since {selectedCustomer.createdAt ? new Date(String(selectedCustomer.createdAt)).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-lg mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-neutral-500" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Email</p>
                        <p>{selectedCustomer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-neutral-500" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Phone</p>
                        <p>{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    {selectedCustomer.address && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Address</p>
                          <p>{selectedCustomer.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-4">Customer Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FileEdit className="h-5 w-5 mr-3 text-neutral-500" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Driver License</p>
                        <p>{selectedCustomer.driverLicense || "Not provided"}</p>
                      </div>
                    </div>
                    {selectedCustomer.notes && (
                      <div className="flex items-start">
                        <div className="w-5 mr-3" />
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Notes</p>
                          <p>{selectedCustomer.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="font-medium text-lg mb-4">Booking History</h3>
                {bookings && bookings.filter((booking: Booking) => booking.customerId === selectedCustomer.id).length > 0 ? (
                  <div className="space-y-3">
                    {bookings
                      .filter((booking: Booking) => booking.customerId === selectedCustomer.id)
                      .slice(0, 3)
                      .map((booking: Booking) => (
                        <div key={booking.id} className="p-3 border rounded-md">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 mr-2 text-neutral-500" />
                              <div>
                                <p className="font-medium">Booking #{booking.bookingRef}</p>
                                <p className="text-sm text-neutral-500">
                                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant={booking.status === "completed" ? "default" : booking.status === "pending" ? "outline" : "secondary"}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400">This customer has no bookings yet.</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewDialog(false);
                    setShowEditDialog(true);
                  }}
                  className="mr-2"
                >
                  Edit Customer
                </Button>
                <Button onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="py-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  fullName: formData.get('fullName') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  address: formData.get('address') as string || null,
                  driverLicense: formData.get('driverLicense') as string || null,
                  notes: formData.get('notes') as string || null,
                };
                
                // Here you would typically call an API to update the customer
                alert("Update customer functionality will be implemented soon");
                setShowEditDialog(false);
              }}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input name="fullName" defaultValue={selectedCustomer.fullName} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input name="email" type="email" defaultValue={selectedCustomer.email} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input name="phone" defaultValue={selectedCustomer.phone} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input name="address" defaultValue={selectedCustomer.address || ''} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Driver License</label>
                    <Input name="driverLicense" defaultValue={selectedCustomer.driverLicense || ''} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea name="notes" defaultValue={selectedCustomer.notes || ''} />
                  </div>
                </div>
                
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                  <Button type="submit">Update Customer</Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
