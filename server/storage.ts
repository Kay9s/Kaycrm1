import {
  users, type User, type InsertUser,
  vehicles, type Vehicle, type InsertVehicle,
  customers, type Customer, type InsertCustomer,
  bookings, type Booking, type InsertBooking,
  supportTickets, type SupportTicket, type InsertSupportTicket
} from "@shared/schema";
import { format } from "date-fns";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private customers: Map<number, Customer>;
  private bookings: Map<number, Booking>;
  private supportTickets: Map<number, SupportTicket>;
  
  private userCurrentId: number;
  private vehicleCurrentId: number;
  private customerCurrentId: number;
  private bookingCurrentId: number;
  private supportTicketCurrentId: number;
  
  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.customers = new Map();
    this.bookings = new Map();
    this.supportTickets = new Map();
    
    this.userCurrentId = 1;
    this.vehicleCurrentId = 1;
    this.customerCurrentId = 1;
    this.bookingCurrentId = 1;
    this.supportTicketCurrentId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }
  
  private initializeData() {
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      email: "admin@carflow.com",
      role: "admin"
    });
    
    // Create sample vehicles
    const vehicleCategories = ["Sedan", "SUV", "Luxury", "Electric"];
    const vehicleMakes = [
      { make: "Toyota", model: "Camry", category: "Sedan", rate: 50 },
      { make: "Honda", model: "Civic", category: "Sedan", rate: 45 },
      { make: "Ford", model: "Explorer", category: "SUV", rate: 70 },
      { make: "Nissan", model: "Rogue", category: "SUV", rate: 65 },
      { make: "BMW", model: "5 Series", category: "Luxury", rate: 120 },
      { make: "Mercedes", model: "E-Class", category: "Luxury", rate: 130 },
      { make: "Tesla", model: "Model 3", category: "Electric", rate: 100 },
      { make: "Chevrolet", model: "Bolt", category: "Electric", rate: 80 }
    ];
    
    vehicleMakes.forEach((v, i) => {
      this.createVehicle({
        make: v.make,
        model: v.model,
        year: 2023,
        licensePlate: `ABC${1000 + i}`,
        category: v.category,
        status: i % 5 === 0 ? "maintenance" : "available",
        maintenanceStatus: i % 5 === 0 ? "scheduled" : "ok",
        imageUrl: null,
        dailyRate: v.rate
      });
    });
    
    // Create sample customers
    const customerNames = [
      { name: "Sarah Johnson", email: "sarah@example.com", phone: "555-1234" },
      { name: "Michael Chen", email: "michael@example.com", phone: "555-2345" },
      { name: "David Smith", email: "david@example.com", phone: "555-3456" },
      { name: "Emma Wilson", email: "emma@example.com", phone: "555-4567" },
      { name: "James Rodriguez", email: "james@example.com", phone: "555-5678" }
    ];
    
    customerNames.forEach((c, i) => {
      this.createCustomer({
        fullName: c.name,
        email: c.email,
        phone: c.phone,
        address: "123 Main St, Anytown, USA",
        driverLicense: `DL${10000 + i}`,
        notes: null
      });
    });
    
    // Create sample bookings
    const today = new Date();
    const bookingStatuses = ["pending", "active", "completed", "cancelled"];
    const paymentStatuses = ["pending", "paid", "refunded"];
    
    for (let i = 0; i < 20; i++) {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 10 + i);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5) + 1);
      
      const customerId = Math.floor(Math.random() * 5) + 1;
      const vehicleId = Math.floor(Math.random() * 8) + 1;
      const vehicle = this.vehicles.get(vehicleId);
      const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = vehicle ? vehicle.dailyRate * days : 100 * days;
      
      this.createBooking({
        bookingRef: `BK-${7800 + i}`,
        customerId,
        vehicleId,
        startDate,
        endDate,
        status: bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)],
        totalAmount: amount,
        paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        notes: null,
        source: Math.random() > 0.8 ? "n8n" : "direct",
        googleCalendarEventId: null,
        n8nWebhookData: null
      });
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }
  
  async getAvailableVehicles(startDate: Date, endDate: Date): Promise<Vehicle[]> {
    const allVehicles = await this.getVehicles();
    const activeBookings = Array.from(this.bookings.values()).filter(booking => 
      booking.status !== 'cancelled' && 
      (booking.endDate >= startDate && booking.startDate <= endDate)
    );
    
    const bookedVehicleIds = new Set(activeBookings.map(b => b.vehicleId));
    
    return allVehicles.filter(v => 
      v.status === 'available' && 
      v.maintenanceStatus === 'ok' && 
      !bookedVehicleIds.has(v.id)
    );
  }
  
  async getVehiclesByCategory(): Promise<Record<string, number>> {
    const allVehicles = await this.getVehicles();
    const categoryCounts: Record<string, number> = {};
    
    allVehicles.forEach(vehicle => {
      if (categoryCounts[vehicle.category]) {
        categoryCounts[vehicle.category]++;
      } else {
        categoryCounts[vehicle.category] = 1;
      }
    });
    
    return categoryCounts;
  }
  
  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleCurrentId++;
    const vehicle: Vehicle = { ...insertVehicle, id };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }
  
  async updateVehicleStatus(id: number, status: string): Promise<Vehicle | undefined> {
    const vehicle = await this.getVehicle(id);
    if (vehicle) {
      const updatedVehicle = { ...vehicle, status };
      this.vehicles.set(id, updatedVehicle);
      return updatedVehicle;
    }
    return undefined;
  }
  
  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.customerCurrentId++;
    const customer: Customer = { ...insertCustomer, id, createdAt: new Date() };
    this.customers.set(id, customer);
    return customer;
  }
  
  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }
  
  async getBookingByRef(bookingRef: string): Promise<Booking | undefined> {
    return Array.from(this.bookings.values()).find(
      (booking) => booking.bookingRef === bookingRef,
    );
  }
  
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }
  
  async getRecentBookings(limit: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getBookingsStats(): Promise<{ totalBookings: number; recentIncrease: number; todayBookings: number; }> {
    const allBookings = await this.getBookings();
    const totalBookings = allBookings.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    }).length;
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const lastMonthBookings = allBookings.filter(b => 
      b.createdAt >= oneMonthAgo && b.createdAt < today
    ).length;
    
    const previousMonthStart = new Date(oneMonthAgo);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    
    const previousMonthBookings = allBookings.filter(b => 
      b.createdAt >= previousMonthStart && b.createdAt < oneMonthAgo
    ).length;
    
    const recentIncrease = previousMonthBookings 
      ? Math.round(((lastMonthBookings - previousMonthBookings) / previousMonthBookings) * 100) 
      : 0;
    
    return {
      totalBookings,
      recentIncrease,
      todayBookings
    };
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingCurrentId++;
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date()
    };
    this.bookings.set(id, booking);
    return booking;
  }
  
  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = await this.getBooking(id);
    if (booking) {
      const updatedBooking = { ...booking, status };
      this.bookings.set(id, updatedBooking);
      return updatedBooking;
    }
    return undefined;
  }
  
  async updateBookingFromN8n(bookingData: any): Promise<Booking | undefined> {
    let booking: Booking | undefined;
    
    // Try to find existing booking by reference if provided
    if (bookingData.bookingRef) {
      booking = await this.getBookingByRef(bookingData.bookingRef);
    }
    
    // If booking exists, update it
    if (booking) {
      const updatedBooking = { 
        ...booking, 
        ...bookingData,
        n8nWebhookData: bookingData
      };
      this.bookings.set(booking.id, updatedBooking);
      return updatedBooking;
    } 
    // Otherwise create a new booking
    else {
      // Find or create customer
      let customerId = bookingData.customerId;
      if (!customerId && bookingData.customerEmail) {
        const existingCustomer = Array.from(this.customers.values()).find(
          c => c.email === bookingData.customerEmail
        );
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else if (bookingData.customerName) {
          const newCustomer = await this.createCustomer({
            fullName: bookingData.customerName,
            email: bookingData.customerEmail,
            phone: bookingData.customerPhone || "Unknown",
            driverLicense: bookingData.driverLicense || "Unknown",
            address: bookingData.customerAddress,
            notes: "Created from n8n webhook"
          });
          customerId = newCustomer.id;
        }
      }
      
      if (!customerId) {
        return undefined;
      }
      
      // Create new booking
      const bookingRef = bookingData.bookingRef || `BK-${this.bookingCurrentId + 7800}`;
      const vehicleId = bookingData.vehicleId || 1; // Default to first vehicle if not specified
      const startDate = bookingData.startDate ? new Date(bookingData.startDate) : new Date();
      const endDate = bookingData.endDate ? new Date(bookingData.endDate) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      
      return this.createBooking({
        bookingRef,
        customerId,
        vehicleId,
        startDate,
        endDate,
        status: bookingData.status || "pending",
        totalAmount: bookingData.totalAmount || 0,
        paymentStatus: bookingData.paymentStatus || "pending",
        notes: bookingData.notes || "Created from n8n webhook",
        source: "n8n",
        googleCalendarEventId: bookingData.googleCalendarEventId,
        n8nWebhookData: bookingData
      });
    }
  }
  
  async getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => 
      (booking.startDate <= endDate && booking.endDate >= startDate)
    );
  }
  
  // Support Ticket methods
  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    return this.supportTickets.get(id);
  }
  
  async getSupportTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values());
  }
  
  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.supportTicketCurrentId++;
    const ticket: SupportTicket = { 
      ...insertTicket, 
      id, 
      createdAt: new Date(),
      resolvedAt: null
    };
    this.supportTickets.set(id, ticket);
    return ticket;
  }
  
  async updateSupportTicketStatus(id: number, status: string): Promise<SupportTicket | undefined> {
    const ticket = await this.getSupportTicket(id);
    if (ticket) {
      const resolvedAt = status === "resolved" ? new Date() : ticket.resolvedAt;
      const updatedTicket = { ...ticket, status, resolvedAt };
      this.supportTickets.set(id, updatedTicket);
      return updatedTicket;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
