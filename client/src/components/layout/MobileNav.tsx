import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
};

const NavItem = ({ href, icon, label, active }: NavItemProps) => {
  return (
    <Link href={href}>
      <div className={cn(
        "flex flex-col items-center p-2", 
        active ? "text-primary" : "text-neutral-600 dark:text-neutral-400"
      )}>
        <i className={`${icon} text-xl`}></i>
        <span className="text-xs mt-1">{label}</span>
      </div>
    </Link>
  );
};

export default function MobileNav() {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-2 py-2 z-10">
      <div className="flex justify-around">
        <NavItem 
          href="/" 
          icon="ri-dashboard-line" 
          label="Dashboard" 
          active={location === "/"} 
        />
        <NavItem 
          href="/bookings" 
          icon="ri-calendar-event-line" 
          label="Bookings" 
          active={location.startsWith("/bookings")} 
        />
        <NavItem 
          href="/fleet" 
          icon="ri-car-line" 
          label="Fleet" 
          active={location === "/fleet"} 
        />
        <NavItem 
          href="/customers" 
          icon="ri-user-line" 
          label="Customers" 
          active={location === "/customers"} 
        />
        <NavItem 
          href="/more" 
          icon="ri-menu-line" 
          label="More" 
          active={location === "/more"} 
        />
      </div>
    </nav>
  );
}
