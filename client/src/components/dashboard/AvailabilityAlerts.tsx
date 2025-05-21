import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

type AlertType = "warning" | "success" | "error";

interface AvailabilityAlert {
  type: AlertType;
  title: string;
  message: string;
  icon: React.ReactNode;
}

function AlertItem({ alert }: { alert: AvailabilityAlert }) {
  const getBgColor = (type: AlertType) => {
    switch(type) {
      case 'warning': return 'bg-warning/10 border-warning/30';
      case 'success': return 'bg-success/10 border-success/30';
      case 'error': return 'bg-destructive/10 border-destructive/30';
    }
  };
  
  const getIconBgColor = (type: AlertType) => {
    switch(type) {
      case 'warning': return 'bg-warning/20 text-warning';
      case 'success': return 'bg-success/20 text-success';
      case 'error': return 'bg-destructive/20 text-destructive';
    }
  };

  return (
    <div className={`p-3 ${getBgColor(alert.type)} border rounded-md flex items-start`}>
      <div className={`w-8 h-8 rounded-full ${getIconBgColor(alert.type)} flex items-center justify-center mr-3 mt-0.5`}>
        {alert.icon}
      </div>
      <div>
        <h4 className="font-medium text-neutral-800 dark:text-neutral-100 text-sm">{alert.title}</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{alert.message}</p>
      </div>
    </div>
  );
}

export default function AvailabilityAlerts() {
  const alerts: AvailabilityAlert[] = [
    {
      type: "warning",
      title: "Low SUV Availability",
      message: "Only 3 SUVs available for the upcoming weekend. Consider adjusting pricing or activating reserve vehicles.",
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      type: "success",
      title: "Sedan Availability Good",
      message: "Current sedan availability at 85% with projected demand at 60%. No action required.",
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      type: "error",
      title: "High Demand Alert",
      message: "Bookings for luxury vehicles are 35% higher than average for the upcoming holiday weekend.",
      icon: <AlertCircle className="h-4 w-4" />
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => (
          <AlertItem key={index} alert={alert} />
        ))}
      </CardContent>
      <CardFooter className="border-t border-neutral-200 dark:border-neutral-700 pt-5">
        <div className="w-full">
          <h4 className="font-medium text-neutral-800 dark:text-neutral-100 text-sm mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button>
              Manage Fleet
            </Button>
            <Button variant="outline">
              Adjust Pricing
            </Button>
            <Button variant="outline">
              Maintenance Schedule
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
