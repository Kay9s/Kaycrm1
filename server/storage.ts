import { 
  users, type User, type InsertUser,
  vehicles, type Vehicle, type InsertVehicle,
  customers, type Customer, type InsertCustomer,
  bookings, type Booking, type InsertBooking,
  supportTickets, type SupportTicket, type InsertSupportTicket
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
      or(
        sql`${vehicles.id} NOT IN (${vehicleIdsToExclude.join(',')})`,
        eq(vehicles.status, 'available')
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
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
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
}

// Use the DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();