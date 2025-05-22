import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, Calendar, Sheet, Webhook } from "lucide-react";

type IntegrationType = "n8n" | "googleCalendar" | "googleSheets";

export default function IntegrationStatus() {
  const { toast } = useToast();
  const [n8nUrl, setN8nUrl] = useState("");
  const [integrationStatuses, setIntegrationStatuses] = useState({
    n8n: "untested",
    googleCalendar: "untested",
    googleSheets: "untested"
  });

  // Test n8n webhook connection
  const testN8nMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/webhooks/send-to-n8n", { 
        url: n8nUrl,
        data: { 
          test: true,
          timestamp: new Date().toISOString(),
          source: "CarFlow CRM" 
        }
      });
    },
    onSuccess: () => {
      setIntegrationStatuses(prev => ({ ...prev, n8n: "connected" }));
      toast({
        title: "n8n connection successful",
        description: "Your CRM is successfully connected to n8n",
      });
    },
    onError: (error: any) => {
      setIntegrationStatuses(prev => ({ ...prev, n8n: "error" }));
      toast({
        title: "n8n connection failed",
        description: error.message || "Could not connect to n8n. Please check the URL and try again.",
        variant: "destructive",
      });
    }
  });

  // Test Google Calendar connection
  const testGoogleCalendarMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("GET", "/api/google/calendar/test");
    },
    onSuccess: () => {
      setIntegrationStatuses(prev => ({ ...prev, googleCalendar: "connected" }));
      toast({
        title: "Google Calendar connection successful",
        description: "Your CRM is successfully connected to Google Calendar",
      });
    },
    onError: (error: any) => {
      setIntegrationStatuses(prev => ({ ...prev, googleCalendar: "error" }));
      toast({
        title: "Google Calendar connection failed",
        description: error.message || "Could not connect to Google Calendar. Please check authentication.",
        variant: "destructive",
      });
    }
  });

  // Test Google Sheets connection
  const testGoogleSheetsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("GET", "/api/google/sheets/test");
    },
    onSuccess: () => {
      setIntegrationStatuses(prev => ({ ...prev, googleSheets: "connected" }));
      toast({
        title: "Google Sheets connection successful",
        description: "Your CRM is successfully connected to Google Sheets",
      });
    },
    onError: (error: any) => {
      setIntegrationStatuses(prev => ({ ...prev, googleSheets: "error" }));
      toast({
        title: "Google Sheets connection failed",
        description: error.message || "Could not connect to Google Sheets. Please check authentication.",
        variant: "destructive",
      });
    }
  });

  const handleTestIntegration = (type: IntegrationType) => {
    setIntegrationStatuses(prev => ({ ...prev, [type]: "testing" }));
    
    switch (type) {
      case "n8n":
        if (!n8nUrl) {
          toast({
            title: "n8n URL required",
            description: "Please enter the n8n webhook URL",
            variant: "destructive",
          });
          setIntegrationStatuses(prev => ({ ...prev, n8n: "error" }));
          return;
        }
        testN8nMutation.mutate();
        break;
      case "googleCalendar":
        testGoogleCalendarMutation.mutate();
        break;
      case "googleSheets":
        testGoogleSheetsMutation.mutate();
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      untested: { component: AlertTriangle, label: "Untested", className: "bg-neutral-500 text-white" },
      testing: { component: AlertTriangle, label: "Testing...", className: "bg-amber-500 text-white" },
      connected: { component: Check, label: "Connected", className: "bg-success text-success-foreground" },
      error: { component: X, label: "Connection Error", className: "bg-destructive text-destructive-foreground" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.untested;
    const IconComponent = config.component;

    return (
      <Badge className={config.className}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
        <CardDescription>Test and view the status of your CRM integrations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* n8n Integration */}
        <div className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                <Webhook className="h-4 w-4 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="font-medium">n8n Integration</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Connect with n8n for automated workflows</p>
              </div>
            </div>
            {getStatusBadge(integrationStatuses.n8n)}
          </div>
          <div className="space-y-2">
            <Input 
              placeholder="Enter n8n webhook URL" 
              value={n8nUrl}
              onChange={(e) => setN8nUrl(e.target.value)}
            />
            <Button 
              onClick={() => handleTestIntegration("n8n")}
              disabled={testN8nMutation.isPending}
              className="w-full"
            >
              {testN8nMutation.isPending ? "Testing Connection..." : "Test Connection"}
            </Button>
          </div>
        </div>

        {/* Google Calendar Integration */}
        <div className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                <Calendar className="h-4 w-4 text-red-700 dark:text-red-300" />
              </div>
              <div>
                <h3 className="font-medium">Google Calendar</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Sync bookings with Google Calendar</p>
              </div>
            </div>
            {getStatusBadge(integrationStatuses.googleCalendar)}
          </div>
          <Button 
            onClick={() => handleTestIntegration("googleCalendar")}
            disabled={testGoogleCalendarMutation.isPending}
            className="w-full"
          >
            {testGoogleCalendarMutation.isPending ? "Testing Connection..." : "Test Connection"}
          </Button>
        </div>

        {/* Google Sheets Integration */}
        <div className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                <Sheet className="h-4 w-4 text-green-700 dark:text-green-300" />
              </div>
              <div>
                <h3 className="font-medium">Google Sheets</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Export data to Google Sheets</p>
              </div>
            </div>
            {getStatusBadge(integrationStatuses.googleSheets)}
          </div>
          <Button 
            onClick={() => handleTestIntegration("googleSheets")}
            disabled={testGoogleSheetsMutation.isPending}
            className="w-full"
          >
            {testGoogleSheetsMutation.isPending ? "Testing Connection..." : "Test Connection"}
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          You can access integration settings and manage API credentials in the Settings page.
        </p>
      </CardFooter>
    </Card>
  );
}