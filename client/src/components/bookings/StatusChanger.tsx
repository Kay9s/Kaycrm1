import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BOOKING_STATUSES } from "@/lib/constants";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface StatusChangerProps {
  bookingId: number;
  currentStatus: string;
}

export default function StatusChanger({ bookingId, currentStatus }: StatusChangerProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isChanged, setIsChanged] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const statusMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      return apiRequest('PATCH', `/api/bookings/${bookingId}/status`, data);
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The booking status has been updated successfully",
      });
      
      setIsChanged(false);
      
      // Invalidate booking queries
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/recent'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleStatusChange = (value: string) => {
    setStatus(value);
    setIsChanged(value !== currentStatus);
  };
  
  const handleUpdateStatus = () => {
    if (isChanged) {
      statusMutation.mutate({ status });
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {BOOKING_STATUSES.map(status => (
            <SelectItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isChanged && (
        <Button 
          size="sm"
          onClick={handleUpdateStatus}
          disabled={statusMutation.isPending}
        >
          {statusMutation.isPending ? "Updating..." : "Update"}
        </Button>
      )}
    </div>
  );
}