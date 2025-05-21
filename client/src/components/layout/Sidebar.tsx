import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
};

const NavLink = ({ href, icon, label, active }: NavLinkProps) => {
  const baseClasses = "flex items-center p-2 rounded-md transition-colors";
  const activeClasses = "bg-primary bg-opacity-10 text-primary dark:bg-primary/20";
  const inactiveClasses = "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary";
  
  return (
    <Link href={href}>
      <div className={cn(baseClasses, active ? activeClasses : inactiveClasses)}>
        <i className={`${icon} mr-3`}></i>
        <span>{label}</span>
      </div>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 h-screen sticky top-0">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h1 className="text-xl font-semibold text-primary flex items-center">
          <i className="ri-car-line mr-2"></i> CarFlow
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Rental Management System</p>
      </div>
      
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          <li>
            <NavLink 
              href="/" 
              icon="ri-dashboard-line" 
              label="Dashboard" 
              active={location === "/"} 
            />
          </li>
          <li>
            <NavLink 
              href="/bookings" 
              icon="ri-calendar-event-line" 
              label="Bookings" 
              active={location.startsWith("/bookings")} 
            />
          </li>
          <li>
            <NavLink 
              href="/fleet" 
              icon="ri-car-line" 
              label="Fleet" 
              active={location === "/fleet"} 
            />
          </li>
          <li>
            <NavLink 
              href="/customers" 
              icon="ri-user-line" 
              label="Customers" 
              active={location === "/customers"} 
            />
          </li>
          <li>
            <NavLink 
              href="/reports" 
              icon="ri-bar-chart-line" 
              label="Reports" 
              active={location === "/reports"} 
            />
          </li>
          <li>
            <NavLink 
              href="/settings" 
              icon="ri-settings-line" 
              label="Settings" 
              active={location === "/settings"} 
            />
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <a href="#" className="flex items-center p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors">
          <i className="ri-question-line mr-3"></i>
          <span>Help & Support</span>
        </a>
        <div className="flex items-center mt-4 p-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div className="ml-2">
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
