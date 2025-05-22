import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertBookingSchema, insertCustomerSchema, insertSupportTicketSchema, insertVehicleSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import authRoutes from './routes/auth';
import googleRoutes from './routes/google';
import webhookRoutes from './routes/webhooks'; 
import { authenticate, requireAdmin } from './middleware/auth';
import * as authService from './services/auth';

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a default admin user if none exists
  try {
    await authService.createDefaultAdminIfNeeded();
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }

  // Register authentication routes
  app.use('/api/auth', authRoutes);
  
  // Register Google service routes
  app.use('/api/google', googleRoutes);
  
  // Register webhook/n8n routes
  app.use('/api/webhooks', webhookRoutes);

  // Error handler helper
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ error: validationError.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  };

  // API routes - all prefixed with /api
  
  // Vehicles
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });
  
  app.get("/api/vehicles/available", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const availableVehicles = await storage.getAvailableVehicles(start, end);
      res.json(availableVehicles);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch available vehicles" });
    }
  });
  
  app.get("/api/vehicles/categories", async (req, res) => {
    try {
      const categories = await storage.getVehiclesByCategory();
      res.json(categories);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch vehicle categories" });
    }
  });
  
  app.post("/api/vehicles", async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  app.patch("/api/vehicles/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const statusSchema = z.object({ status: z.string() });
      const { status } = statusSchema.parse(req.body);
      
      const vehicle = await storage.updateVehicleStatus(id, status);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  // Customers
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });
  
  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  // Bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });
  
  app.get("/api/bookings/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const recentBookings = await storage.getRecentBookings(limit);
      res.json(recentBookings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch recent bookings" });
    }
  });
  
  app.get("/api/bookings/stats", async (req, res) => {
    try {
      const stats = await storage.getBookingsStats();
      res.json(stats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch booking stats" });
    }
  });
  
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const statusSchema = z.object({ status: z.string() });
      const { status } = statusSchema.parse(req.body);
      
      const booking = await storage.updateBookingStatus(id, status);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.json(booking);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  app.get("/api/bookings/calendar", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const bookings = await storage.getBookingsByDateRange(start, end);
      res.json(bookings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch calendar bookings" });
    }
  });
  
  // n8n Webhook endpoint for receiving booking data
  app.post("/api/n8n/webhook", async (req, res) => {
    try {
      console.log("Received webhook from n8n:", req.body);
      const booking = await storage.updateBookingFromN8n(req.body);
      if (!booking) {
        return res.status(400).json({ error: "Invalid booking data from n8n" });
      }
      
      res.status(201).json({ success: true, booking });
    } catch (err) {
      console.error("n8n webhook error:", err);
      res.status(500).json({ error: "Failed to process n8n webhook data" });
    }
  });
  
  // Support Tickets
  app.get("/api/support-tickets", async (req, res) => {
    try {
      const tickets = await storage.getSupportTickets();
      res.json(tickets);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch support tickets" });
    }
  });
  
  app.post("/api/support-tickets", async (req, res) => {
    try {
      const ticketData = insertSupportTicketSchema.parse(req.body);
      const ticket = await storage.createSupportTicket(ticketData);
      res.status(201).json(ticket);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  app.post("/api/emergency-support", async (req, res) => {
    try {
      const { customerId, description, subject } = req.body;
      
      if (!customerId || !description) {
        return res.status(400).json({ error: "Customer ID and description are required" });
      }
      
      const customer = await storage.getCustomer(parseInt(customerId));
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      const ticket = await storage.createSupportTicket({
        customerId: parseInt(customerId),
        subject: subject || "Emergency Support Request",
        description,
        status: "open",
        priority: "high",
        bookingId: null,
        assignedTo: null
      });
      
      // In a real application, this would trigger notifications to support agents
      
      res.status(201).json({
        success: true,
        message: "Emergency support request received. An agent will contact you shortly.",
        ticketId: ticket.id
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create emergency support request" });
    }
  });
  
  app.patch("/api/support-tickets/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const statusSchema = z.object({ status: z.string() });
      const { status } = statusSchema.parse(req.body);
      
      const ticket = await storage.updateSupportTicketStatus(id, status);
      if (!ticket) {
        return res.status(404).json({ error: "Support ticket not found" });
      }
      
      res.json(ticket);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
