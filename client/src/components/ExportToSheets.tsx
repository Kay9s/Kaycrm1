import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExportToSheetsProps {
  dataType: "customers" | "vehicles" | "bookings";
  data: any[];
  disabled?: boolean;
}

export default function ExportToSheets({ dataType, data, disabled = false }: ExportToSheetsProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Export - ${new Date().toLocaleDateString()}`);
  
  // Create Google Sheet mutation
  const createSheetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/google/sheets/bookings", { title });
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Google Sheet created",
        description: "Sheet was successfully created. Exporting data...",
      });

      // Now export the data to the sheet
      return await exportDataMutation.mutateAsync({ spreadsheetId: data.spreadsheetId });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating Google Sheet",
        description: error.message || "Failed to create Google Sheet. Check authentication.",
        variant: "destructive",
      });
    },
  });
  
  // Export data to sheet mutation
  const exportDataMutation = useMutation({
    mutationFn: async ({ spreadsheetId }: { spreadsheetId: string }) => {
      return apiRequest("POST", `/api/google/sheets/bookings/${spreadsheetId}`, { 
        bookings: dataType === "bookings" ? data : adaptDataToBookingsFormat(),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Export successful",
        description: "Data was successfully exported to Google Sheets",
      });
      
      // Open the Google Sheet in a new tab
      if (data.url) {
        window.open(data.url, "_blank");
      }
      
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export data to Google Sheet",
        variant: "destructive",
      });
    },
  });
  
  // Helper to adapt different data types to the bookings format expected by the API
  const adaptDataToBookingsFormat = () => {
    if (dataType === "customers") {
      // Transform customers data to have the expected fields for the sheet export
      return data.map((customer: any) => ({
        bookingRef: `CUST-${customer.id}`,
        customerId: customer.id,
        customerName: customer.fullName,
        vehicleId: null,
        vehicleInfo: "N/A",
        startDate: customer.createdAt,
        endDate: customer.createdAt,
        status: "customer_record",
        paymentStatus: "N/A",
        totalAmount: 0,
        createdAt: customer.createdAt,
        notes: `Email: ${customer.email}, Phone: ${customer.phone || 'N/A'}`
      }));
    } else if (dataType === "vehicles") {
      // Transform vehicles data to have the expected fields for the sheet export
      return data.map((vehicle: any) => ({
        bookingRef: `VEH-${vehicle.id}`,
        customerId: null,
        customerName: "N/A",
        vehicleId: vehicle.id,
        vehicleInfo: `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
        startDate: vehicle.createdAt || new Date().toISOString(),
        endDate: vehicle.createdAt || new Date().toISOString(),
        status: vehicle.status,
        paymentStatus: "N/A",
        totalAmount: vehicle.dailyRate,
        createdAt: vehicle.createdAt || new Date().toISOString(),
        notes: `License: ${vehicle.licensePlate}, Category: ${vehicle.category}`
      }));
    }
    
    return data;
  };
  
  const handleExport = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the Google Sheet",
        variant: "destructive",
      });
      return;
    }
    
    createSheetMutation.mutate();
  };
  
  const isPending = createSheetMutation.isPending || exportDataMutation.isPending;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          disabled={disabled || data.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export to Sheets
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export to Google Sheets</DialogTitle>
          <DialogDescription>
            Export your {dataType} data to a new Google Sheet. This will create a new spreadsheet in your Google Drive.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Label htmlFor="sheet-title">Sheet Title</Label>
          <Input 
            id="sheet-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your Google Sheet"
            className="mt-2"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? "Exporting..." : "Export to Google Sheets"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}