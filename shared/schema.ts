import { pgTable, text, serial, integer, boolean, timestamp, date, json, numeric, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Vehicles
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate").notNull().unique(),
  category: text("category").notNull(),
  status: text("status").notNull().default("available"),
  maintenanceStatus: text("maintenance_status").default("ok"),
  imageUrl: text("image_url"),
  dailyRate: integer("daily_rate").notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  driverLicense: text("driver_license"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  source: text("source"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingRef: text("booking_ref"),
  customerId: integer("customer_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").default("pending"),
  totalAmount: integer("total_amount"),
  paymentStatus: text("payment_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  source: text("source").default("direct"),
  googleCalendarEventId: text("google_calendar_event_id"),
  n8nWebhookData: json("n8n_webhook_data"),
  hasPickupMeeting: boolean("has_pickup_meeting").default(false),
  pickupLocation: text("pickup_location"),
  specialRequests: text("special_requests"),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

// Emergency Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id"),
  customerId: integer("customer_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").default("open"),
  priority: text("priority").default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  assignedTo: integer("assigned_to"),
  attachments: text("attachments"),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

// Extended schemas for frontend validation
export const bookingFormSchema = insertBookingSchema.extend({
  customerName: z.string().min(1, "Customer name is required"),
  vehicleName: z.string().min(1, "Vehicle is required"),
  // Use special handling for dates to make them compatible with form and API
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const supportTicketFormSchema = insertSupportTicketSchema.extend({
  customerName: z.string().min(1, "Customer name is required"),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").unique(),
  invoiceDate: date("invoice_date"),
  dueDate: date("due_date"),
  customerId: integer("customer_id").references(() => customers.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  status: text("status").default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  tax: decimal("tax", { precision: 10, scale: 2 }),
  total: decimal("total", { precision: 10, scale: 2 }),
  notes: text("notes"),
  paymentTerms: text("payment_terms"),
  items: jsonb("items"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const invoiceFormSchema = insertInvoiceSchema.extend({
  customerName: z.string().min(1, "Customer name is required"),
  bookingRef: z.string().optional(),
});

// N8n Call Data
export const n8nCalls = pgTable("n8n_calls", {
  id: serial("id").primaryKey(),
  callerId: text("caller_id"),
  callerName: text("caller_name"),
  callerPhone: text("caller_phone"),
  callTime: timestamp("call_time").defaultNow(),
  callDuration: integer("call_duration"),
  status: text("status").default("new"),  // new, booked, canceled, followup
  reason: text("reason"),
  notes: text("notes"),
  bookingId: integer("booking_id").references(() => bookings.id),
  agentNotes: text("agent_notes"),
  transcription: text("transcription"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertN8nCallSchema = createInsertSchema(n8nCalls).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertN8nCall = z.infer<typeof insertN8nCallSchema>;
export type N8nCall = typeof n8nCalls.$inferSelect;
