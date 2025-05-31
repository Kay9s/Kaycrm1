import { 
  users, type User, type InsertUser,
  vehicles, type Vehicle, type InsertVehicle,
  customers, type Customer, type InsertCustomer,
  bookings, type Booking, type InsertBooking,
  supportTickets, type SupportTicket, type InsertSupportTicket,
  invoices, type Invoice, type InsertInvoice,
  n8nCalls, type N8nCall, type InsertN8nCall,
  pricing, type Pricing, type InsertPricing,
  reportTables, type ReportTable, type InsertReportTable
} from "@shared/schema";
import { db } from './db';
import { eq, and, or, gte, lte, desc, isNull, sql } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  hasAdminUser(): Promise<boolean>;
  
  // Vehicles
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicles(): Promise<Vehicle[]>;
  getAvailableVehicles(startDate: Date, endDate: Date): Promise<Vehicle[]>;
  getVehiclesByCategory(): Promise<Record<string, number>>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicleStatus(id: number, status: string): Promise<Vehicle | undefined>;
  updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle | undefined>;
  scheduleVehicleMaintenance(id: number, maintenanceData: any): Promise<Vehicle | undefined>;
  
  // Customers
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Bookings
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByRef(bookingRef: string): Promise<Booking | undefined>;
  getBookings(): Promise<Booking[]>;
  getRecentBookings(limit: number): Promise<Booking[]>;
  getBookingsStats(): Promise<{
    totalBookings: number;
    recentIncrease: number;
    todayBookings: number;
  }>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  updateBookingFromN8n(bookingData: any): Promise<Booking | undefined>;
  getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]>;
  
  // Support Tickets
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  getSupportTickets(): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicketStatus(id: number, status: string): Promise<SupportTicket | undefined>;
  
  // Invoices
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByCustomer(customerId: number): Promise<Invoice[]>;
  getInvoicesByBooking(bookingId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: InsertInvoice): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // N8n Call Data
  getN8nCall(id: number): Promise<N8nCall | undefined>;
  getN8nCalls(): Promise<N8nCall[]>;
  getN8nCallsByStatus(status: string): Promise<N8nCall[]>;
  createN8nCall(call: InsertN8nCall): Promise<N8nCall>;
  updateN8nCall(id: number, call: Partial<InsertN8nCall>): Promise<N8nCall | undefined>;
  deleteN8nCall(id: number): Promise<boolean>;
  
  // Vehicle Availability Management
  updateVehicleAvailability(vehicleId: number, startDate: string, endDate: string, bookingId: number, isAvailable: boolean): Promise<void>;
  checkVehicleAvailability(vehicleId: number, startDate: string, endDate: string): Promise<boolean>;
  getVehicleAvailabilityStatus(vehicleId: number): Promise<{ isAvailable: boolean; currentBooking?: any }>;
  
  // Pricing Management
  getPricing(vehicleId: number): Promise<Pricing | undefined>;
  getAllPricing(): Promise<Pricing[]>;
  createPricing(pricing: InsertPricing): Promise<Pricing>;
  updatePricing(vehicleId: number, pricing: Partial<InsertPricing>): Promise<Pricing | undefined>;
  deletePricing(vehicleId: number): Promise<boolean>;
  
  // Report Tables
  getReportTable(id: number): Promise<ReportTable | undefined>;
  getReportTables(): Promise<ReportTable[]>;
  createReportTable(table: InsertReportTable): Promise<ReportTable>;
  updateReportTable(id: number, table: Partial<InsertReportTable>): Promise<ReportTable | undefined>;
  deleteReportTable(id: number): Promise<boolean>;
  getReportTableData(id: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async hasAdminUser(): Promise<boolean> {
    const [result] = await db.select({
      count: sql`COUNT(*)`.mapWith(Number)
    })
    .from(users)
    .where(eq(users.role, 'admin'));
    
    return (result?.count || 0) > 0;
  }
  
  // Vehicles
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehicles(): Promise<Vehicle[]> {
    return db.select().from(vehicles);
  }

  async getAvailableVehicles(startDate: Date, endDate: Date): Promise<Vehicle[]> {
    // Find vehicles that don't have bookings in the date range
    const rentedVehicleIds = await db.select({ id: bookings.vehicleId })
      .from(bookings)
      .where(
        and(
          or(
            and(
              lte(bookings.startDate, startDate.toISOString()),
              gte(bookings.endDate, startDate.toISOString())
            ),
            and(
              lte(bookings.startDate, endDate.toISOString()),
              gte(bookings.endDate, endDate.toISOString())
            ),
            and(
              gte(bookings.startDate, startDate.toISOString()),
              lte(bookings.endDate, endDate.toISOString())
            )
          ),
          eq(bookings.status, 'active')
        )
      );
    
    const vehicleIdsToExclude = rentedVehicleIds.map(item => item.id);
    
    if (vehicleIdsToExclude.length === 0) {
      return this.getVehicles();
    }
    
    return db.select().from(vehicles).where(
      and(
        sql`${vehicles.id} NOT IN (${vehicleIdsToExclude.join(',')})`,
        eq(vehicles.isAvailable, true)
      )
    );
  }

  async getVehiclesByCategory(): Promise<Record<string, number>> {
    const result = await db.select({
      category: vehicles.category,
      count: sql`COUNT(*)`.mapWith(Number)
    })
    .from(vehicles)
    .groupBy(vehicles.category);
    
    return result.reduce((acc, item) => {
      acc[item.category] = item.count;
      return acc;
    }, {} as Record<string, number>);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values(insertVehicle)
      .returning();
    return vehicle;
  }

  async updateVehicleStatus(id: number, status: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .update(vehicles)
      .set({ status })
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle || undefined;
  }

  async updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .update(vehicles)
      .set(data)
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle || undefined;
  }

  async scheduleVehicleMaintenance(id: number, maintenanceData: any): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .update(vehicles)
      .set({
        maintenanceStatus: maintenanceData.maintenanceStatus,
      })
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle || undefined;
  }
  
  // Customers
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }
  
  // Bookings
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingByRef(bookingRef: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.bookingRef, bookingRef));
    return booking || undefined;
  }

  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings);
  }

  async getRecentBookings(limit: number): Promise<Booking[]> {
    return db.select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(limit);
  }

  async getBookingsStats(): Promise<{ totalBookings: number; recentIncrease: number; todayBookings: number; }> {
    // Get total bookings
    const [totalResult] = await db.select({
      count: sql`COUNT(*)`.mapWith(Number)
    }).from(bookings);
    
    const totalBookings = totalResult?.count || 0;
    
    // Get today's bookings (using current date)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const [todayResult] = await db.select({
      count: sql`COUNT(*)`.mapWith(Number)
    })
    .from(bookings)
    .where(gte(bookings.createdAt, sql`${startOfDay.toISOString()}`));
    
    const todayBookings = todayResult?.count || 0;
    
    // Get bookings from previous period for increase calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [recentResult] = await db.select({
      count: sql`COUNT(*)`.mapWith(Number)
    })
    .from(bookings)
    .where(gte(bookings.createdAt, sql`${thirtyDaysAgo.toISOString()}`));
    
    const recentBookings = recentResult?.count || 0;
    const oldPeriodBookings = totalBookings - recentBookings;
    
    let recentIncrease = 0;
    if (oldPeriodBookings > 0) {
      recentIncrease = Math.round((recentBookings - oldPeriodBookings) / oldPeriodBookings * 100);
    }
    
    return {
      totalBookings,
      recentIncrease,
      todayBookings
    };
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    // Ensure booking reference is never null by generating one if not provided
    const bookingWithRef = {
      ...insertBooking,
      bookingRef: insertBooking.bookingRef || `BK-${Math.floor(1000 + Math.random() * 9000)}`
    };
    
    // Insert with guaranteed booking reference
    const [booking] = await db
      .insert(bookings)
      .values(bookingWithRef)
      .returning();
    
    // Update vehicle availability when booking is created
    if (booking.vehicleId && booking.startDate && booking.endDate) {
      await this.updateVehicleAvailability(booking.vehicleId, booking.startDate, booking.endDate, booking.id, false);
    }
    
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async updateBookingFromN8n(bookingData: any): Promise<Booking | undefined> {
    console.log("Processing n8n webhook data:", JSON.stringify(bookingData, null, 2));
    
    // Extract booking reference from the data
    const bookingRef = bookingData.bookingRef || bookingData.booking_ref || bookingData.reference;
    
    if (!bookingRef) {
      console.error("No booking reference found in n8n data");
      return undefined;
    }
    
    // Look up the booking by reference
    const existingBooking = await this.getBookingByRef(bookingRef);
    
    if (!existingBooking) {
      console.log(`No booking found with reference: ${bookingRef}, creating new booking...`);
      
      // If no existing booking is found, create a new one if we have sufficient data
      try {
        if (bookingData.customerId && bookingData.vehicleId && bookingData.startDate && bookingData.endDate) {
          // We have minimum required fields to create a booking
          const newBookingData = {
            bookingRef: bookingRef,
            customerId: Number(bookingData.customerId),
            vehicleId: Number(bookingData.vehicleId),
            startDate: new Date(bookingData.startDate).toISOString(),
            endDate: new Date(bookingData.endDate).toISOString(),
            totalAmount: Number(bookingData.totalAmount || 0),
            status: bookingData.status || 'pending',
            paymentStatus: bookingData.paymentStatus || 'pending',
            source: 'n8n',
            notes: bookingData.notes || 'Created via n8n webhook',
            n8nWebhookData: bookingData
          };
          
          return this.createBooking(newBookingData);
        } else {
          console.error("Insufficient data to create booking from n8n");
          return undefined;
        }
      } catch (error) {
        console.error("Error creating booking from n8n data:", error);
        return undefined;
      }
    }
    
    console.log(`Updating booking with ID: ${existingBooking.id}`);
    
    // Prepare the update data, ensuring it conforms to our schema
    const updateData: any = {
      n8nWebhookData: bookingData
    };
    
    // Add fields from n8n that match our schema
    if (bookingData.status) updateData.status = bookingData.status;
    if (bookingData.paymentStatus) updateData.paymentStatus = bookingData.paymentStatus;
    if (bookingData.totalAmount) updateData.totalAmount = Number(bookingData.totalAmount);
    if (bookingData.startDate) updateData.startDate = new Date(bookingData.startDate);
    if (bookingData.endDate) updateData.endDate = new Date(bookingData.endDate);
    if (bookingData.notes) updateData.notes = bookingData.notes;
    if (bookingData.googleCalendarEventId) updateData.googleCalendarEventId = bookingData.googleCalendarEventId;
    
    try {
      // Update with data from n8n
      const [booking] = await db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, existingBooking.id))
        .returning();
      
      return booking || undefined;
    } catch (error) {
      console.error("Error updating booking from n8n data:", error);
      return undefined;
    }
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    return db.select()
      .from(bookings)
      .where(
        and(
          gte(bookings.startDate, startDate.toISOString()),
          lte(bookings.endDate, endDate.toISOString())
        )
      );
  }
  
  // Support Tickets
  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket || undefined;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return db.select().from(supportTickets);
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db
      .insert(supportTickets)
      .values(insertTicket)
      .returning();
    return ticket;
  }

  async updateSupportTicketStatus(id: number, status: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .update(supportTickets)
      .set({ status })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket || undefined;
  }

  // Invoices
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice || undefined;
  }

  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.customerId, customerId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByBooking(bookingId: number): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.bookingId, bookingId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(insertInvoice)
      .returning();
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: InsertInvoice): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ 
        ...invoiceData,
        updatedAt: new Date() 
      })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(invoices)
        .where(eq(invoices.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }
  
  // N8n Call Data Methods
  async getN8nCall(id: number): Promise<N8nCall | undefined> {
    const [call] = await db.select().from(n8nCalls).where(eq(n8nCalls.id, id));
    return call || undefined;
  }

  async getN8nCalls(): Promise<N8nCall[]> {
    return db.select().from(n8nCalls).orderBy(desc(n8nCalls.callTime));
  }

  async getN8nCallsByStatus(status: string): Promise<N8nCall[]> {
    return db
      .select()
      .from(n8nCalls)
      .where(eq(n8nCalls.status, status))
      .orderBy(desc(n8nCalls.callTime));
  }

  async createN8nCall(call: InsertN8nCall): Promise<N8nCall> {
    const [createdCall] = await db
      .insert(n8nCalls)
      .values(call)
      .returning();
    return createdCall;
  }

  async updateN8nCall(id: number, call: Partial<InsertN8nCall>): Promise<N8nCall | undefined> {
    const [updatedCall] = await db
      .update(n8nCalls)
      .set({ 
        ...call,
        updatedAt: new Date() 
      })
      .where(eq(n8nCalls.id, id))
      .returning();
    return updatedCall || undefined;
  }

  async deleteN8nCall(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(n8nCalls)
        .where(eq(n8nCalls.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting n8n call:', error);
      return false;
    }
  }

  // Vehicle Availability Management
  async updateVehicleAvailability(vehicleId: number, startDate: string, endDate: string, bookingId: number, isAvailable: boolean): Promise<void> {
    try {
      await db
        .update(vehicles)
        .set({
          isAvailable,
          currentBookingStartDate: isAvailable ? null : startDate,
          currentBookingEndDate: isAvailable ? null : endDate,
          currentBookingId: isAvailable ? null : bookingId,
        })
        .where(eq(vehicles.id, vehicleId));
    } catch (error) {
      console.error('Error updating vehicle availability:', error);
      throw error;
    }
  }

  async checkVehicleAvailability(vehicleId: number, startDate: string, endDate: string): Promise<boolean> {
    try {
      // Get the vehicle's current availability status
      const [vehicle] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId));

      if (!vehicle) {
        return false; // Vehicle doesn't exist
      }

      // If vehicle is not available, check if the dates conflict
      if (!vehicle.isAvailable && vehicle.currentBookingStartDate && vehicle.currentBookingEndDate) {
        const requestedStart = new Date(startDate);
        const requestedEnd = new Date(endDate);
        const bookedStart = new Date(vehicle.currentBookingStartDate);
        const bookedEnd = new Date(vehicle.currentBookingEndDate);

        // Check if the requested dates overlap with current booking
        const hasOverlap = requestedStart <= bookedEnd && requestedEnd >= bookedStart;
        
        return !hasOverlap; // Available if no overlap
      }

      // Vehicle is available or no current booking
      return vehicle.isAvailable;
    } catch (error) {
      console.error('Error checking vehicle availability:', error);
      return false;
    }
  }

  async getVehicleAvailabilityStatus(vehicleId: number): Promise<{ isAvailable: boolean; currentBooking?: any }> {
    try {
      const [vehicle] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId));

      if (!vehicle) {
        return { isAvailable: false };
      }

      let currentBooking = null;
      if (vehicle.currentBookingId) {
        currentBooking = await this.getBooking(vehicle.currentBookingId);
      }

      return {
        isAvailable: vehicle.isAvailable,
        currentBooking
      };
    } catch (error) {
      console.error('Error getting vehicle availability status:', error);
      return { isAvailable: false };
    }
  }

  // Pricing Management
  async getPricing(vehicleId: number): Promise<Pricing | undefined> {
    try {
      const [pricingData] = await db
        .select()
        .from(pricing)
        .where(eq(pricing.vehicleId, vehicleId));
      return pricingData;
    } catch (error) {
      console.error('Error getting pricing:', error);
      return undefined;
    }
  }

  async getAllPricing(): Promise<Pricing[]> {
    try {
      return await db.select().from(pricing);
    } catch (error) {
      console.error('Error getting all pricing:', error);
      return [];
    }
  }

  async createPricing(pricingData: InsertPricing): Promise<Pricing> {
    try {
      const [newPricing] = await db
        .insert(pricing)
        .values(pricingData)
        .returning();
      return newPricing;
    } catch (error) {
      console.error('Error creating pricing:', error);
      throw error;
    }
  }

  async updatePricing(vehicleId: number, pricingData: Partial<InsertPricing>): Promise<Pricing | undefined> {
    try {
      const [updatedPricing] = await db
        .update(pricing)
        .set({
          ...pricingData,
          updatedAt: new Date(),
        })
        .where(eq(pricing.vehicleId, vehicleId))
        .returning();
      return updatedPricing;
    } catch (error) {
      console.error('Error updating pricing:', error);
      return undefined;
    }
  }

  async deletePricing(vehicleId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(pricing)
        .where(eq(pricing.vehicleId, vehicleId))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting pricing:', error);
      return false;
    }
  }

  // Report Tables
  async getReportTable(id: number): Promise<ReportTable | undefined> {
    const [table] = await db.select().from(reportTables).where(eq(reportTables.id, id));
    return table;
  }

  async getReportTables(): Promise<ReportTable[]> {
    return await db.select().from(reportTables).orderBy(desc(reportTables.createdAt));
  }

  async createReportTable(tableData: InsertReportTable): Promise<ReportTable> {
    const [table] = await db
      .insert(reportTables)
      .values(tableData)
      .returning();
    return table;
  }

  async updateReportTable(id: number, tableData: Partial<InsertReportTable>): Promise<ReportTable | undefined> {
    const [table] = await db
      .update(reportTables)
      .set({ ...tableData, updatedAt: new Date() })
      .where(eq(reportTables.id, id))
      .returning();
    return table;
  }

  async deleteReportTable(id: number): Promise<boolean> {
    try {
      await db.delete(reportTables).where(eq(reportTables.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting report table:', error);
      return false;
    }
  }

  async getReportTableData(id: number): Promise<any[]> {
    const table = await this.getReportTable(id);
    if (!table) return [];

    const columns = table.columns as string[];
    const filters = table.filters as Record<string, any>;

    switch (table.type) {
      case 'bookings':
        return await this.getBookingReportData(columns, filters);
      case 'vehicles':
        return await this.getVehicleReportData(columns, filters);
      case 'customers':
        return await this.getCustomerReportData(columns, filters);
      case 'revenue':
        return await this.getRevenueReportData(columns, filters);
      default:
        return [];
    }
  }

  private async getBookingReportData(columns: string[], filters: Record<string, any>): Promise<any[]> {
    const query = db
      .select()
      .from(bookings)
      .leftJoin(customers, eq(bookings.customerId, customers.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id));

    const results = await query;
    
    return results.map(row => {
      const data: any = {};
      columns.forEach(col => {
        switch (col) {
          case 'bookingRef':
            data[col] = row.bookings.bookingRef;
            break;
          case 'customerName':
            data[col] = row.customers?.fullName;
            break;
          case 'customerEmail':
            data[col] = row.customers?.email;
            break;
          case 'vehicleMake':
            data[col] = row.vehicles?.make;
            break;
          case 'vehicleModel':
            data[col] = row.vehicles?.model;
            break;
          case 'vehicleLicense':
            data[col] = row.vehicles?.licensePlate;
            break;
          case 'startDate':
            data[col] = row.bookings.startDate;
            break;
          case 'endDate':
            data[col] = row.bookings.endDate;
            break;
          case 'totalAmount':
            data[col] = row.bookings.totalAmount;
            break;
          case 'status':
            data[col] = row.bookings.status;
            break;
          case 'createdAt':
            data[col] = row.bookings.createdAt;
            break;
        }
      });
      return data;
    });
  }

  private async getVehicleReportData(columns: string[], filters: Record<string, any>): Promise<any[]> {
    const vehicleData = await db.select().from(vehicles);
    
    const enrichedData = await Promise.all(vehicleData.map(async (vehicle) => {
      const vehicleBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.vehicleId, vehicle.id));
      
      const totalBookings = vehicleBookings.length;
      const totalRevenue = vehicleBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      
      const data: any = {};
      columns.forEach(col => {
        switch (col) {
          case 'make':
            data[col] = vehicle.make;
            break;
          case 'model':
            data[col] = vehicle.model;
            break;
          case 'licensePlate':
            data[col] = vehicle.licensePlate;
            break;
          case 'category':
            data[col] = vehicle.category;
            break;
          case 'status':
            data[col] = vehicle.status;
            break;
          case 'totalBookings':
            data[col] = totalBookings;
            break;
          case 'revenue':
            data[col] = totalRevenue;
            break;
          case 'utilizationRate':
            data[col] = totalBookings > 0 ? `${Math.round((totalBookings / 30) * 100)}%` : '0%';
            break;
          case 'maintenanceStatus':
            data[col] = vehicle.maintenanceStatus;
            break;
        }
      });
      return data;
    }));

    return enrichedData;
  }

  private async getCustomerReportData(columns: string[], filters: Record<string, any>): Promise<any[]> {
    const customerData = await db.select().from(customers);
    
    const enrichedData = await Promise.all(customerData.map(async (customer) => {
      const customerBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.customerId, customer.id));
      
      const totalBookings = customerBookings.length;
      const totalSpent = customerBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      const averageBookingValue = totalBookings > 0 ? totalSpent / totalBookings : 0;
      const lastBooking = customerBookings.length > 0 
        ? customerBookings.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0].createdAt
        : null;
      
      const data: any = {};
      columns.forEach(col => {
        switch (col) {
          case 'fullName':
            data[col] = customer.fullName;
            break;
          case 'email':
            data[col] = customer.email;
            break;
          case 'phone':
            data[col] = customer.phone;
            break;
          case 'totalBookings':
            data[col] = totalBookings;
            break;
          case 'totalSpent':
            data[col] = totalSpent;
            break;
          case 'averageBookingValue':
            data[col] = averageBookingValue;
            break;
          case 'lastBooking':
            data[col] = lastBooking;
            break;
          case 'preferredCategory':
            data[col] = 'Sedan'; // Could calculate from booking history
            break;
        }
      });
      return data;
    }));

    return enrichedData;
  }

  private async getRevenueReportData(columns: string[], filters: Record<string, any>): Promise<any[]> {
    const allBookings = await db.select().from(bookings);
    const monthlyData: Record<string, any> = {};

    allBookings.forEach(booking => {
      if (!booking.createdAt || !booking.totalAmount) return;
      
      const month = new Date(booking.createdAt).toISOString().slice(0, 7); // YYYY-MM format
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          totalRevenue: 0,
          bookingCount: 0,
          averageBookingValue: 0
        };
      }
      
      monthlyData[month].totalRevenue += booking.totalAmount;
      monthlyData[month].bookingCount += 1;
    });

    // Calculate average booking value for each month
    Object.values(monthlyData).forEach((monthData: any) => {
      monthData.averageBookingValue = monthData.bookingCount > 0 
        ? monthData.totalRevenue / monthData.bookingCount 
        : 0;
    });

    return Object.values(monthlyData);
  }
}

// Use the DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();