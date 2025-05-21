// Vehicle categories
export const VEHICLE_CATEGORIES = [
  "Sedan",
  "SUV",
  "Luxury",
  "Electric",
  "Compact",
  "Van"
];

// Vehicle statuses
export const VEHICLE_STATUSES = [
  "available",
  "rented",
  "maintenance",
  "repair",
  "inactive"
];

// Booking statuses
export const BOOKING_STATUSES = [
  "pending",
  "active",
  "completed",
  "cancelled"
];

// Payment statuses
export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "refunded"
];

// Customer sources
export const CUSTOMER_SOURCES = [
  "direct",
  "referral",
  "google",
  "social_media",
  "partner"
];

// Booking sources
export const BOOKING_SOURCES = [
  "direct",
  "n8n",
  "api",
  "web",
  "partner"
];

// Support ticket priorities
export const SUPPORT_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical"
];

// Support ticket statuses
export const SUPPORT_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed"
];

// Integration statuses
export const INTEGRATION_STATUSES = [
  "active",
  "inactive",
  "configuration_needed",
  "error"
];

// Date filter options
export const DATE_FILTER_OPTIONS = [
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "customRange", label: "Custom range" }
];

// URLs
export const API_URLS = {
  BOOKINGS: "/api/bookings",
  VEHICLES: "/api/vehicles",
  CUSTOMERS: "/api/customers",
  SUPPORT: "/api/support-tickets",
  EMERGENCY: "/api/emergency-support",
  N8N_WEBHOOK: "/api/n8n/webhook",
  STATS: {
    BOOKINGS: "/api/bookings/stats",
    VEHICLES: "/api/vehicles/stats",
  }
};

// Chart colors (matching tailwind theme)
export const CHART_COLORS = {
  PRIMARY: "hsl(var(--chart-1))",
  SECONDARY: "hsl(var(--chart-2))",
  ACCENT: "hsl(var(--chart-3))",
  DESTRUCTIVE: "hsl(var(--chart-4))",
  PURPLE: "hsl(var(--chart-5))"
};

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 10;
