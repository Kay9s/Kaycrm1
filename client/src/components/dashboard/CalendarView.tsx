import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Booking } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";

export default function CalendarView() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Get days in the month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Fetch bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return await response.json();
    }
  });
  
  // Sync with Google Calendar
  const syncWithGoogle = async () => {
    try {
      await apiRequest("POST", "/api/google/calendar/sync", {});
      toast({
        title: "Calendar synced",
        description: "Successfully synced with Google Calendar",
      });
      
      // Refresh bookings
      // This would ideally be done by invalidating the query cache
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync with Google Calendar",
        variant: "destructive",
      });
    }
  };
  
  // Current month and year
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  // Previous and next month handlers
  const goToPreviousMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  // Process bookings into calendar events
  useEffect(() => {
    if (bookings) {
      // Process bookings into events
      const calendarEvents = bookings.map((booking: any) => {
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        
        return {
          id: booking.id,
          title: `Booking #${booking.bookingRef}`,
          start: startDate,
          end: endDate,
          allDay: true,
          status: booking.status,
        };
      });
      
      setEvents(calendarEvents);
    }
  }, [bookings]);
  
  // Get days for the calendar grid
  const days = [];
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Check if a date has events
  const getEventsForDate = (day: number) => {
    if (!day) return [];
    
    const date = new Date(currentYear, currentMonth, day);
    
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check if the date is within the event range
      return date >= new Date(eventStart.setHours(0,0,0,0)) && 
             date <= new Date(eventEnd.setHours(23,59,59,999));
    });
  };
  
  // Render event indicators for a day
  const renderEventIndicators = (day: number) => {
    const dayEvents = getEventsForDate(day);
    if (dayEvents.length === 0) return null;
    
    // Only show up to 3 indicators
    return (
      <div className="mt-1 space-y-1">
        {dayEvents.slice(0, 3).map((event, index) => (
          <div 
            key={index} 
            className="w-full h-1 rounded-full bg-primary"
            style={{ 
              backgroundColor: event.status === 'confirmed' ? 'var(--success)' : 
                              event.status === 'pending' ? 'var(--warning)' : 
                              event.status === 'cancelled' ? 'var(--destructive)' : 
                              'var(--primary)'
            }}
          />
        ))}
        {dayEvents.length > 3 && (
          <div className="text-xs text-center text-neutral-500">
            +{dayEvents.length - 3} more
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>View upcoming bookings and events</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          onClick={syncWithGoogle}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Sync with Google
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <i className="ri-arrow-left-s-line text-lg"></i>
          </Button>
          <div className="text-lg font-medium">
            {months[currentMonth]} {currentYear}
          </div>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <i className="ri-arrow-right-s-line text-lg"></i>
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Days of week headers */}
          {daysOfWeek.map(day => (
            <div key={day} className="text-center text-sm font-medium text-neutral-500 py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, i) => {
            // Check if this day is today
            const isToday = day && 
              new Date().getDate() === day && 
              new Date().getMonth() === currentMonth && 
              new Date().getFullYear() === currentYear;
            
            return (
              <div 
                key={i} 
                className={`
                  h-20 p-1 border rounded-md
                  ${!day ? 'bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800' : ''}
                  ${isToday ? 'border-primary dark:border-primary' : 'border-neutral-200 dark:border-neutral-700'}
                `}
              >
                {day && (
                  <>
                    <div className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                      {day}
                    </div>
                    {renderEventIndicators(day)}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 text-sm text-neutral-500">
        {isLoading ? (
          <div className="flex items-center">
            <RefreshCw className="animate-spin h-3 w-3 mr-2" />
            Loading bookings...
          </div>
        ) : (
          <>
            {events.length} bookings this month
          </>
        )}
      </CardFooter>
    </Card>
  );
}