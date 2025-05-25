import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
};

const NavLink = ({ href, icon, label, active }: NavLinkProps) => {
  const baseClasses = "flex items-center p-2.5 rounded transition-colors my-1";
  const activeClasses = "bg-[#4448c5] text-white font-medium";
  const inactiveClasses = "hover:bg-[#182456] text-white hover:text-white";
  
  return (
    <Link href={href}>
      <div className={cn(baseClasses, active ? activeClasses : inactiveClasses)}>
        <i className={`${icon} mr-3 text-lg`}></i>
        <span>{label}</span>
        {active && <div className="ml-auto w-1.5 h-5 bg-white rounded-full"></div>}
      </div>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#1e2c6b] text-white h-screen sticky top-0 shadow-lg">
      <div className="p-4 border-b border-[#2a3880] flex items-center">
        <h1 className="text-xl font-bold flex items-center">
          <i className="ri-car-line mr-2 text-[#4448c5]"></i> 
          <span className="text-white">CarFlow</span>
        </h1>
      </div>
      
      <div className="p-3 mb-2">
        <h2 className="px-3 py-2 text-xs uppercase tracking-wider text-gray-400 font-semibold">APPLICATION</h2>
      </div>
      
      <nav className="flex-grow px-3">
        <ul className="space-y-0.5">
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
              href="/customers" 
              icon="ri-user-line" 
              label="Customer" 
              active={location === "/customers"} 
            />
          </li>
          <li>
            <NavLink 
              href="/fleet" 
              icon="ri-car-line" 
              label="Vehicle" 
              active={location === "/fleet"} 
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
              href="/reports" 
              icon="ri-bar-chart-line" 
              label="Reports" 
              active={location === "/reports"} 
            />
          </li>
          <li>
            <NavLink 
              href="/invoices" 
              icon="ri-file-list-3-line" 
              label="Invoices" 
              active={location === "/invoices"} 
            />
          </li>
          <li>
            <NavLink 
              href="/pickup-meetings" 
              icon="ri-calendar-check-line" 
              label="Pickup Meetings" 
              active={location === "/pickup-meetings"} 
            />
          </li>
        </ul>
      </nav>
      
      <div className="p-3 mt-2">
        <h2 className="px-3 py-2 text-xs uppercase tracking-wider text-gray-400 font-semibold">PAGES</h2>
        <ul className="space-y-0.5">
          <li>
            <NavLink 
              href="/settings" 
              icon="ri-settings-line" 
              label="Settings" 
              active={location === "/settings"} 
            />
          </li>
        </ul>
      </div>
      
      <div className="p-4 mt-auto border-t border-[#2a3880]">
        <div className="flex items-center p-2">
          <div className="w-10 h-10 rounded-full bg-[#4448c5] text-white flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
