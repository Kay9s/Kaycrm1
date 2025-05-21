import { db } from './db';
import { 
  users, insertUserSchema,
  vehicles, insertVehicleSchema,
  customers, insertCustomerSchema,
  bookings, insertBookingSchema,
  supportTickets, insertSupportTicketSchema
} from '../shared/schema';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('Starting database seeding...');
  
  // Add admin user
  console.log('Adding admin user...');
  await db.insert(users).values({
    username: "admin",
    password: "admin123", // In a real app, this would be hashed
    fullName: "Admin User",
    email: "admin@carflow.com",
    role: "admin"
  }).onConflictDoNothing();
  
  // Add sample vehicles
  console.log('Adding sample vehicles...');
  const vehiclesToAdd = [
    {
      make: "Toyota",
      model: "Camry",
      year: 2023,
      licensePlate: "ABC123",
      category: "Sedan",
      status: "available",
      maintenanceStatus: "ok",
      imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      dailyRate: 65
    },
    {
      make: "Honda",
      model: "CR-V",
      year: 2022,
      licensePlate: "DEF456",
      category: "SUV",
      status: "available",
      maintenanceStatus: "ok",
      imageUrl: "https://images.unsplash.com/photo-1675329595480-bdefd094e90c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      dailyRate: 75
    },
    {
      make: "BMW",
      model: "5 Series",
      year: 2022,
      licensePlate: "GHI789",
      category: "Luxury",
      status: "available",
      maintenanceStatus: "ok",
      imageUrl: "https://images.unsplash.com/photo-1583356322882-85e6e9136c17?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      dailyRate: 120
    },
    {
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      licensePlate: "JKL012",
      category: "Electric",
      status: "available",
      maintenanceStatus: "ok",
      imageUrl: "https://images.unsplash.com/photo-1563720223523-7cf3073cd807?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      dailyRate: 110
    },
    {
      make: "Ford",
      model: "Escape",
      year: 2021,
      licensePlate: "MNO345",
      category: "SUV",
      status: "rented",
      maintenanceStatus: "ok",
      imageUrl: "https://images.unsplash.com/photo-1609761237080-205d51a17adf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      dailyRate: 60
    },
    {
      make: "Chevrolet",
      model: "Malibu",
      year: 2021,
      licensePlate: "PQR678",
      category: "Sedan",
      status: "maintenance",
      maintenanceStatus: "Oil change needed",
      imageUrl: "https://images.unsplash.com/photo-1669646033683-92bc46ab77e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      dailyRate: 55
    },
    {
      make: "Nissan",
      model: "Rogue",
      year: 2022,
      licensePlate: "STU901",
      category: "SUV",
      status: "available",
      maintenanceStatus: "ok",
      imageUrl: "https://images.unsplash.com/photo-1669646033640-830716f6a3e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      dailyRate: 70
    },
    {
      make: "Audi",
      model: "A4",
      year: 2022,
      licensePlate: "VWX234",
      category: "Luxury",
      status: "available",
      maintenanceStatus: "ok",
      imageUrl: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2669&q=80",
      dailyRate: 110
    },
    {
      make: "Hyundai",
      model: "Elantra",
      year: 2021,
      licensePlate: "YZA567",
      category: "Compact",
      status: "available",
      maintenanceStatus: "ok",
      imageUrl: "https://images.unsplash.com/photo-1604054094723-3a949e4a8993?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      dailyRate: 50
    },
    {
      make: "Kia",
      model: "Sorento",
      year: 2022,
      licensePlate: "BCD890",
      category: "SUV",
      status: "available",
      maintenanceStatus: "ok",
      imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      dailyRate: 65
    }
  ];
  
  for (const vehicle of vehiclesToAdd) {
    await db.insert(vehicles).values(vehicle).onConflictDoNothing();
  }
  
  // Add sample customers
  console.log('Adding sample customers...');
  const customersToAdd = [
    {
      fullName: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "555-123-4567",
      address: "123 Main St, New York, NY",
      driverLicense: "DL12345678",
      notes: null
    },
    {
      fullName: "Michael Williams",
      email: "michael@example.com",
      phone: "555-987-6543",
      address: "456 Elm St, Los Angeles, CA",
      driverLicense: "DL87654321",
      notes: "Prefers SUVs"
    },
    {
      fullName: "Jessica Brown",
      email: "jessica@example.com",
      phone: "555-456-7890",
      address: "789 Oak St, Chicago, IL",
      driverLicense: "DL56781234",
      notes: null
    },
    {
      fullName: "David Miller",
      email: "david@example.com",
      phone: "555-321-6547",
      address: "101 Pine St, San Francisco, CA",
      driverLicense: "DL43215678",
      notes: "Corporate client"
    },
    {
      fullName: "Jennifer Garcia",
      email: "jennifer@example.com",
      phone: "555-789-4561",
      address: "202 Cedar St, Miami, FL",
      driverLicense: "DL98761234",
      notes: null
    }
  ];
  
  for (const customer of customersToAdd) {
    await db.insert(customers).values(customer).onConflictDoNothing();
  }
  
  // Get IDs for relationships
  const allVehicles = await db.select().from(vehicles);
  const allCustomers = await db.select().from(customers);
  
  if (allVehicles.length === 0 || allCustomers.length === 0) {
    console.log('Error: No vehicles or customers found. Skipping bookings creation.');
    return;
  }
  
  // Add sample bookings
  console.log('Adding sample bookings...');
  const bookingStatuses = ["pending", "active", "completed", "cancelled"];
  const paymentStatuses = ["pending", "paid", "refunded"];
  const sources = ["direct", "n8n", "api", "web", "partner"];
  
  // Generate some bookings in the past
  for (let i = 0; i < 15; i++) {
    const customerId = allCustomers[Math.floor(Math.random() * allCustomers.length)].id;
    const vehicleId = allVehicles[Math.floor(Math.random() * allVehicles.length)].id;
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90)); // Up to 90 days in the past
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days rental
    
    const status = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = days * (vehicle?.dailyRate || 50);
    
    const bookingRef = `BK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    await db.insert(bookings).values({
      customerId,
      vehicleId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalAmount,
      status,
      bookingRef,
      source,
      notes: null,
      paymentStatus,
      googleCalendarEventId: null
    }).onConflictDoNothing();
  }
  
  // Generate some current/future bookings
  for (let i = 0; i < 5; i++) {
    const customerId = allCustomers[Math.floor(Math.random() * allCustomers.length)].id;
    const vehicleId = allVehicles[Math.floor(Math.random() * allVehicles.length)].id;
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30)); // Up to 30 days in the future
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days rental
    
    const status = i < 2 ? "active" : "pending"; // Some active, some pending
    const paymentStatus = i < 2 ? "paid" : "pending"; // Some paid, some pending
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = days * (vehicle?.dailyRate || 50);
    
    const bookingRef = `BK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    await db.insert(bookings).values({
      customerId,
      vehicleId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalAmount,
      status,
      bookingRef,
      source,
      notes: null,
      paymentStatus,
      googleCalendarEventId: null
    }).onConflictDoNothing();
  }
  
  console.log('Database seeding completed!');
}

seed()
  .catch(e => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });