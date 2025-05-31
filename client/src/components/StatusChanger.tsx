import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusChangerProps {
  bookingId: number;
  currentStatus: string;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];

export default function StatusChanger({ bookingId, currentStatus }: StatusChangerProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest('PATCH', `/api/bookings/${bookingId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: `Booking status has been updated to ${selectedStatus}`,
      });
      
      // Refetch booking data to update UI
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleStatusUpdate = () => {
    if (selectedStatus && selectedStatus !== currentStatus) {
      updateStatusMutation.mutate(selectedStatus);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        onClick={handleStatusUpdate}
        disabled={updateStatusMutation.isPending || selectedStatus === currentStatus}
        size="sm"
      >
        {updateStatusMutation.isPending ? "Updating..." : "Update"}
      </Button>
    </div>
  );
}