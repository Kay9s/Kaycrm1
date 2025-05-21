import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

type EventMarker = {
  date: Date;
  type: "success" | "warning" | "error" | "primary";
  count: number;
};

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad the beginning of the calendar with days from previous month
  const startDayOfWeek = monthStart.getDay();
  let prevMonthDays = [];
  if (startDayOfWeek > 0) {
    const prevMonth = subMonths(monthStart, 1);
    const prevMonthEnd = endOfMonth(prevMonth);
    const prevMonthStart = new Date(prevMonthEnd);
    prevMonthStart.setDate(prevMonthEnd.getDate() - startDayOfWeek + 1);
    prevMonthDays = eachDayOfInterval({ start: prevMonthStart, end: prevMonthEnd });
  }
  
  // Pad the end of the calendar with days from next month
  const endDayOfWeek = monthEnd.getDay();
  let nextMonthDays = [];
  if (endDayOfWeek < 6) {
    const nextMonth = addMonths(monthStart, 1);
    const nextMonthStart = startOfMonth(nextMonth);
    const daysToAdd = 6 - endDayOfWeek;
    const nextMonthEnd = new Date(nextMonthStart);
    nextMonthEnd.setDate(nextMonthStart.getDate() + daysToAdd);
    nextMonthDays = eachDayOfInterval({ start: nextMonthStart, end: nextMonthEnd });
  }
  
  const fullCalendarDays = [...prevMonthDays, ...calendarDays, ...nextMonthDays];
  
  // Fetch events for calendar
  const { data: bookings } = useQuery({
    queryKey: ['/api/bookings/calendar', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () => Promise.resolve([
      // This would be replaced with actual API call
      { date: new Date(2023, 4, 11), count: 6, type: "primary" },
      { date: new Date(2023, 4, 12), count: 3, type: "success" },
      { date: new Date(2023, 4, 15), count: 4, type: "warning" },
      { date: new Date(2023, 4, 19), count: 2, type: "error" },
      { date: new Date(2023, 4, 24), count: 5, type: "success" }
    ] as EventMarker[]),
  });
  
  const getEventForDay = (day: Date) => {
    return bookings?.find(booking => isSameDay(booking.date, day));
  };
  
  const gotoPrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const gotoNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-3">
        <CardTitle>Calendar</CardTitle>
        <div className="flex items-center space-x-1">
          <button 
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            onClick={gotoPrevMonth}
          >
            <i className="ri-arrow-left-s-line text-neutral-500"></i>
          </button>
          <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
          <button 
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            onClick={gotoNextMonth}
          >
            <i className="ri-arrow-right-s-line text-neutral-500"></i>
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Days Header */}
        <div className="calendar-grid mb-2">
          <div className="text-xs text-center font-medium text-neutral-500 dark:text-neutral-400">Su</div>
          <div className="text-xs text-center font-medium text-neutral-500 dark:text-neutral-400">Mo</div>
          <div className="text-xs text-center font-medium text-neutral-500 dark:text-neutral-400">Tu</div>
          <div className="text-xs text-center font-medium text-neutral-500 dark:text-neutral-400">We</div>
          <div className="text-xs text-center font-medium text-neutral-500 dark:text-neutral-400">Th</div>
          <div className="text-xs text-center font-medium text-neutral-500 dark:text-neutral-400">Fr</div>
          <div className="text-xs text-center font-medium text-neutral-500 dark:text-neutral-400">Sa</div>
        </div>
        
        {/* Calendar Grid */}
        <div className="calendar-grid">
          {fullCalendarDays.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const event = getEventForDay(day);
            
            return (
              <div 
                key={i} 
                className={cn(
                  "calendar-day", 
                  isCurrentMonth 
                    ? "hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer" 
                    : "text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-900",
                  isCurrentDay && "bg-primary/10 border border-primary text-primary font-medium",
                  event && event.type === "primary" && "bg-primary/10 border border-primary text-primary font-medium",
                )}
              >
                {day.getDate()}
                {event && (
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full absolute bottom-1",
                    event.type === "success" && "bg-success",
                    event.type === "warning" && "bg-warning",
                    event.type === "error" && "bg-destructive",
                    event.type === "primary" && "bg-primary",
                  )}></span>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <h4 className="text-sm font-medium mb-2">Upcoming Bookings</h4>
          <ul className="space-y-2">
            {bookings?.slice(0, 3).map((booking, index) => (
              <li key={index} className="flex items-center text-sm p-2 bg-neutral-50 dark:bg-neutral-900 rounded">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  booking.type === "primary" && "bg-primary",
                  booking.type === "success" && "bg-success",
                  booking.type === "warning" && "bg-warning",
                  booking.type === "error" && "bg-destructive",
                )}></div>
                <span className="font-medium mr-2">{format(booking.date, 'd MMM')}:</span>
                <span className="text-neutral-600 dark:text-neutral-400 text-xs">{booking.count} bookings</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
