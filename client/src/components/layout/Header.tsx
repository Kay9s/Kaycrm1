import { useState } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, Search, Menu, Bell, ChevronDown } from "lucide-react";

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10 h-16 shadow-sm">
      <div className="h-full px-4 md:px-6">
        <div className="flex items-center justify-between h-full">
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="search" 
                placeholder="Search..." 
                className="w-full h-9 pl-9 pr-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-1">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" 
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>
            
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">3</span>
            </Button>
            
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* User Profile or Login Button */}
            <div className="hidden md:flex items-center ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              {localStorage.getItem('carflow_token') ? (
                <div className="flex items-center relative group">
                  <img 
                    src="https://ui-avatars.com/api/?name=John+Doe&background=4448c5&color=fff" 
                    alt="John Doe" 
                    className="w-8 h-8 rounded-full cursor-pointer"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline">
                    {JSON.parse(localStorage.getItem('carflow_user') || '{"fullName":"John Doe"}').fullName}
                  </span>
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Settings
                      </a>
                      <a href="#" onClick={(e) => {
                        e.preventDefault();
                        localStorage.removeItem('carflow_token');
                        localStorage.removeItem('carflow_user');
                        window.location.href = '/login';
                      }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Logout
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="border-blue-500 text-blue-500 hover:bg-blue-50"
                  onClick={() => window.location.href = '/login'}
                >
                  Login / Register
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Search (conditionally rendered) */}
        {isSearchOpen && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 md:hidden absolute left-0 right-0 bg-white dark:bg-gray-900">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="search" 
                placeholder="Search..." 
                className="w-full h-9 pl-9 pr-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
