import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmergencySupportParams {
  customerId: number;
  description: string;
  bookingId?: number;
  subject?: string;
}

interface EmergencySupportResponse {
  success: boolean;
  message: string;
  ticketId: number;
}

export function useEmergencySupport() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  
  const mutation = useMutation({
    mutationFn: async (params: EmergencySupportParams) => {
      const response = await apiRequest<EmergencySupportResponse>(
        "POST", 
        "/api/emergency-support", 
        {
          customerId: params.customerId,
          description: params.description,
          bookingId: params.bookingId,
          subject: params.subject || "Emergency Support Request"
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit emergency support request");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Emergency Support Requested",
        description: data.message || "An agent will contact you shortly.",
      });
      setStatus("success");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request emergency support. Please try again.",
        variant: "destructive",
      });
      setStatus("error");
    }
  });
  
  const initiateEmergencySupport = (params: EmergencySupportParams) => {
    setStatus("idle");
    mutation.mutate(params);
  };
  
  return {
    initiateEmergencySupport,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    status
  };
}
