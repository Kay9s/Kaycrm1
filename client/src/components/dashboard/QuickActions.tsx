import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActionButton = {
  icon: string;
  label: string;
  onClick: () => void;
};

export default function QuickActions() {
  const actions: ActionButton[] = [
    {
      icon: "ri-car-line",
      label: "Add Car",
      onClick: () => console.log("Add car clicked")
    },
    {
      icon: "ri-user-add-line",
      label: "Add Customer",
      onClick: () => console.log("Add customer clicked")
    },
    {
      icon: "ri-file-list-3-line",
      label: "New Report",
      onClick: () => console.log("New report clicked")
    },
    {
      icon: "ri-settings-line",
      label: "Settings",
      onClick: () => console.log("Settings clicked")
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
            <button 
              key={index}
              className="flex flex-col items-center justify-center p-3 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
              onClick={action.onClick}
            >
              <i className={`${action.icon} text-primary text-xl mb-2`}></i>
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
