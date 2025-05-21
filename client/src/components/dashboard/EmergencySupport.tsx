import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEmergencySupport } from "@/lib/hooks/use-emergency-support";
import { Customer } from "@shared/schema";
import { AlertCircle, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function EmergencySupport() {
  const { initiateEmergencySupport, isPending, status } = useEmergencySupport();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  
  const { data: customers, isLoading } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      return await response.json();
    },
  });
  
  const handleEmergencySupport = () => {
    if (selectedCustomerId) {
      initiateEmergencySupport({
        customerId: selectedCustomerId,
        description: "Emergency support requested from dashboard"
      });
    }
  };
  
  return (
    <Card className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
      <CardContent className="pt-6">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mr-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-neutral-800 dark:text-neutral-100">Emergency Support</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">Connect with a human agent immediately</p>
            
            {status === "idle" && (
              <>
                {customers && customers.length > 0 && (
                  <div className="mb-3">
                    <select 
                      className="w-full p-2 border rounded mb-2 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
                      value={selectedCustomerId || ""}
                      onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer: Customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <Button 
                  className="bg-destructive hover:bg-destructive/90 text-white text-sm flex items-center"
                  disabled={!selectedCustomerId || isPending}
                  onClick={handleEmergencySupport}
                >
                  <Phone className="mr-1.5 h-4 w-4" />
                  Contact Support
                </Button>
              </>
            )}
            
            {status === "success" && (
              <div className="text-sm p-3 bg-success/10 border border-success/30 rounded-md text-success">
                Support request submitted. An agent will contact you shortly.
              </div>
            )}
            
            {status === "error" && (
              <div className="text-sm p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
                Failed to submit support request. Please try again or call directly.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
