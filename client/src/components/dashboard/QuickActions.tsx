import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type ActionButton = {
  icon: string;
  label: string;
  path?: string;
  onClick?: () => void;
};

export default function QuickActions() {
  const actions: ActionButton[] = [
    {
      icon: "ri-car-line",
      label: "Add Car",
      path: "/fleet"
    },
    {
      icon: "ri-user-add-line",
      label: "Add Customer",
      path: "/customers"
    },
    {
      icon: "ri-file-list-3-line",
      label: "New Report",
      path: "/reports"
    },
    {
      icon: "ri-settings-line",
      label: "Settings",
      path: "/settings"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.path || "#"}>
              <Button 
                variant="outline" 
                className="w-full h-auto flex flex-col items-center justify-center p-3 hover:bg-primary/5 dark:hover:bg-primary/10"
              >
                <i className={`${action.icon} text-primary text-xl mb-2`}></i>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}