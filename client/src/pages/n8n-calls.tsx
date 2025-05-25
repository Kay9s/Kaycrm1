import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Form,
  FormControl,
  FormDescription,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  User, 
  Calendar, 
  Clock, 
  MessageSquare, 
  FileText, 
  Edit, 
  Trash2, 
  Plus,
  Filter,
  Search
} from "lucide-react";

// Define n8n call record type
type N8nCall = {
  id: number;
  callerId: string;
  callerName: string | null;
  callerPhone: string;
  callTime: string;
  callDuration: number | null;
  status: string;
  reason: string | null;
  notes: string | null;
  bookingId: number | null;
  agentNotes: string | null;
  transcription: string | null;
  createdAt: string;
  updatedAt: string | null;
};

// Define form schema for creating/editing calls
const callFormSchema = z.object({
  callerId: z.string().min(1, "Caller ID is required"),
  callerName: z.string().optional().nullable(),
  callerPhone: z.string().min(1, "Phone number is required"),
  callTime: z.string().min(1, "Call time is required"),
  callDuration: z.coerce.number().optional().nullable(),
  status: z.string().min(1, "Status is required"),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  bookingId: z.coerce.number().optional().nullable(),
  agentNotes: z.string().optional().nullable(),
  transcription: z.string().optional().nullable(),
});

type CallFormValues = z.infer<typeof callFormSchema>;

export default function N8nCalls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<N8nCall | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch n8n calls
  const { data: calls = [], isLoading } = useQuery<N8nCall[]>({
    queryKey: ['/api/n8n-calls'],
  });

  // Form for creating new calls
  const createForm = useForm<CallFormValues>({
    resolver: zodResolver(callFormSchema),
    defaultValues: {
      callerId: "",
      callerName: "",
      callerPhone: "",
      callTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      callDuration: null,
      status: "new",
      reason: "",
      notes: "",
      bookingId: null,
      agentNotes: "",
      transcription: "",
    },
  });

  // Form for editing existing calls
  const editForm = useForm<CallFormValues>({
    resolver: zodResolver(callFormSchema),
    defaultValues: {
      callerId: "",
      callerName: "",
      callerPhone: "",
      callTime: "",
      callDuration: null,
      status: "",
      reason: "",
      notes: "",
      bookingId: null,
      agentNotes: "",
      transcription: "",
    },
  });

  // Handle creating a new call
  const handleCreateCall = async (data: CallFormValues) => {
    try {
      const response = await fetch('/api/n8n-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          callTime: new Date(data.callTime).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create call');
      }

      // Close dialog and refresh data
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/n8n-calls'] });
      
      // Reset form
      createForm.reset();
      
      toast({
        title: "Call Created",
        description: "The call record has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating call:', error);
      toast({
        title: "Error",
        description: "Failed to create the call record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle editing an existing call
  const handleEditCall = async (data: CallFormValues) => {
    if (!selectedCall) return;

    try {
      const response = await fetch(`/api/n8n-calls/${selectedCall.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          callTime: new Date(data.callTime).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update call');
      }

      // Close dialog and refresh data
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/n8n-calls'] });
      
      toast({
        title: "Call Updated",
        description: "The call record has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating call:', error);
      toast({
        title: "Error",
        description: "Failed to update the call record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a call
  const handleDeleteCall = async (id: number) => {
    if (!confirm("Are you sure you want to delete this call record? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/n8n-calls/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete call');
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/n8n-calls'] });
      
      toast({
        title: "Call Deleted",
        description: "The call record has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting call:', error);
      toast({
        title: "Error",
        description: "Failed to delete the call record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Edit dialog open handler
  const handleEditDialogOpen = (call: N8nCall) => {
    setSelectedCall(call);
    
    // Format call time for the form
    const formattedCallTime = format(new Date(call.callTime), "yyyy-MM-dd'T'HH:mm");
    
    // Set form values
    editForm.reset({
      callerId: call.callerId,
      callerName: call.callerName,
      callerPhone: call.callerPhone,
      callTime: formattedCallTime,
      callDuration: call.callDuration,
      status: call.status,
      reason: call.reason,
      notes: call.notes,
      bookingId: call.bookingId,
      agentNotes: call.agentNotes,
      transcription: call.transcription,
    });
    
    setIsEditDialogOpen(true);
  };

  // Filter calls based on active tab and search query
  const filteredCalls = calls.filter(call => {
    // First, filter by status tab
    if (activeTab !== "all" && call.status !== activeTab) {
      return false;
    }
    
    // Then, apply search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        call.callerId.toLowerCase().includes(query) ||
        (call.callerName?.toLowerCase() || "").includes(query) ||
        call.callerPhone.toLowerCase().includes(query) ||
        (call.reason?.toLowerCase() || "").includes(query) ||
        (call.notes?.toLowerCase() || "").includes(query)
      );
    }
    
    return true;
  });

  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">New</Badge>;
      case "booked":
        return <Badge variant="default" className="bg-green-500">Booked</Badge>;
      case "canceled":
        return <Badge variant="destructive">Canceled</Badge>;
      case "followup":
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Follow Up</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">n8n Call Data</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage call data received from n8n AI agent
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Call
        </Button>
      </div>
      
      {/* Search and filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
          <Input
            placeholder="Search calls..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-neutral-500 dark:text-neutral-400" />
          <span className="text-sm mr-2">Filter:</span>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="booked">Booked</TabsTrigger>
              <TabsTrigger value="followup">Follow Up</TabsTrigger>
              <TabsTrigger value="canceled">Canceled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Call Records</CardTitle>
          <CardDescription>
            Manage and view all call data received from n8n
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
              <p className="text-neutral-500 dark:text-neutral-400">No call records found</p>
              {searchQuery && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
                  Try adjusting your search or filters
                </p>
              )}
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Call Record
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caller</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div className="font-medium">{call.callerName || "Unknown"}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          ID: {call.callerId}
                        </div>
                      </TableCell>
                      <TableCell>{call.callerPhone}</TableCell>
                      <TableCell>
                        <div>{format(new Date(call.callTime), "MMM d, yyyy")}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {format(new Date(call.callTime), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {call.reason || "Not specified"}
                        </div>
                      </TableCell>
                      <TableCell>{renderStatusBadge(call.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDialogOpen(call)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCall(call.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create Call Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Call Record</DialogTitle>
            <DialogDescription>
              Enter the details of the call received from n8n
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateCall)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="callerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caller ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter caller ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="callerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caller Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter caller name" 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="callerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="callTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="callDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="Enter call duration" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="followup">Follow Up</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="bookingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="Enter booking ID if applicable" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Call</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="Enter reason for call" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="Enter call notes" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="agentNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="Enter agent notes" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="transcription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Transcription</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="Enter call transcription" 
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Call Record</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Call Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Call Record</DialogTitle>
            <DialogDescription>
              Update the details of the call record
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditCall)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="callerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caller ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter caller ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="callerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caller Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter caller name" 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="callerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="callTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="callDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="Enter call duration" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="followup">Follow Up</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="bookingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="Enter booking ID if applicable" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Call</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="Enter reason for call" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="Enter call notes" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="agentNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="Enter agent notes" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="transcription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Transcription</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="Enter call transcription" 
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Call Record</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}