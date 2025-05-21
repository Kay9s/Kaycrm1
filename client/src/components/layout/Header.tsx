import { useState } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Mobile Logo & Menu Button */}
          <div className="flex items-center md:hidden">
            <button id="menu-toggle" className="text-neutral-600 dark:text-neutral-300 mr-2">
              <i className="ri-menu-line text-xl"></i>
            </button>
            <h1 className="text-xl font-semibold text-primary">
              <i className="ri-car-line mr-1"></i> CarFlow
            </h1>
          </div>
          
          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"></i>
              <input 
                type="search" 
                placeholder="Search bookings, customers, vehicles..." 
                className="w-full pl-10 pr-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="mr-2" 
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>
            
            <button className="relative p-2 text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary" aria-label="Notifications">
              <i className="ri-notification-3-line text-xl"></i>
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full text-white text-xs flex items-center justify-center">3</span>
            </button>
            
            <button 
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary md:hidden" 
              aria-label="Search"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <i className="ri-search-line text-xl"></i>
            </button>
            
            <div className="hidden md:flex items-center ml-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
              <span className="ml-2 text-sm font-medium hidden md:inline">John Doe</span>
              <i className="ri-arrow-down-s-line ml-1 text-neutral-400"></i>
            </div>
          </div>
        </div>
        
        {/* Mobile Search (conditionally rendered) */}
        {isSearchOpen && (
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 md:hidden">
            <div className="relative w-full">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"></i>
              <input 
                type="search" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
