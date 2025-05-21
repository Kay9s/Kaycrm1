import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  name: string;
  icon: string;
  status: "active" | "inactive" | "configuration_needed";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        status === "active" && "bg-success text-white",
        status === "inactive" && "bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200",
        status === "configuration_needed" && "bg-warning text-white"
      )}
    >
      {status === "active" && "Active"}
      {status === "inactive" && "Inactive"}
      {status === "configuration_needed" && "Configuration Needed"}
    </span>
  );
}

export default function IntegrationStatus() {
  const integrations: Integration[] = [
    {
      name: "Google Calendar",
      icon: "ri-calendar-line",
      status: "active"
    },
    {
      name: "n8n Integration",
      icon: "ri-flow-chart",
      status: "active"
    },
    {
      name: "Email Notifications",
      icon: "ri-mail-line",
      status: "configuration_needed"
    },
    {
      name: "SMS Alerts",
      icon: "ri-message-2-line",
      status: "inactive"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {integrations.map((integration, index) => (
            <li key={index} className="flex justify-between items-center">
              <div className="flex items-center">
                <i className={`${integration.icon} text-neutral-400 mr-2`}></i>
                <span className="text-sm">{integration.name}</span>
              </div>
              <StatusBadge status={integration.status} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
