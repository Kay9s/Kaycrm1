import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Vehicle, Booking } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, DollarSign, Settings, Car, Clock, ArrowLeft, Wrench, MapPin } from "lucide-react";

interface VehicleDetailsProps {
  id: string;
}

export default function VehicleDetails({ id }: VehicleDetailsProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for maintenance scheduling
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [maintenanceNotes, setMaintenanceNotes] = useState("");
  
  // State for vehicle editing
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    status: "",
    dailyRate: "",
    maintenanceStatus: ""
  });

  // Fetch vehicle details
  const { data: vehicle, isLoading } = useQuery({
    queryKey: [`/api/vehicles/${id}`],
    queryFn: async () => {
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      const vehicles = await response.json();
      return vehicles.find((v: Vehicle) => v.id === parseInt(id));
    }
  });

  // Fetch active bookings for this vehicle
  const { data: activeBookings } = useQuery({
    queryKey: [`/api/bookings/vehicle/${id}`],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const bookings = await response.json();
      return bookings.filter((b: Booking) => 
        b.vehicleId === parseInt(id) && 
        (b.status === 'active' || b.status === 'pending')
      );
    }
  });

  // Schedule maintenance mutation
  const scheduleMaintenanceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/vehicles/${id}/maintenance`, {
        maintenanceStatus: 'scheduled',
        maintenanceType,
        maintenanceDate,
        maintenanceNotes
      });
    },
    onSuccess: () => {
      toast({
        title: "Maintenance scheduled",
        description: "Vehicle maintenance has been scheduled successfully.",
      });
      
      setShowMaintenanceDialog(false);
      setMaintenanceType("");
      setMaintenanceDate("");
      setMaintenanceNotes("");
      
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
    },
    onError: (error) => {
      toast({
        title: "Error scheduling maintenance",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update vehicle mutation
  const updateVehicleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/vehicles/${id}`, editData);
    },
    onSuccess: () => {
      toast({
        title: "Vehicle updated",
        description: "Vehicle information has been updated successfully.",
      });
      
      setShowEditDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating vehicle",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Set initial edit data when vehicle loads
  useEffect(() => {
    if (vehicle) {
      setEditData({
        status: vehicle.status || "",
        dailyRate: vehicle.dailyRate?.toString() || "",
        maintenanceStatus: vehicle.maintenanceStatus || ""
      });
    }
  }, [vehicle]);

  // Handle navigation back
  const handleBack = () => {
    navigate('/fleet');
  };

  // Handle maintenance scheduling
  const handleScheduleMaintenance = () => {
    if (!maintenanceType || !maintenanceDate) {
      toast({
        title: "Missing information",
        description: "Please select maintenance type and date.",
        variant: "destructive",
      });
      return;
    }
    
    scheduleMaintenanceMutation.mutate();
  };

  // Handle vehicle update
  const handleUpdateVehicle = () => {
    updateVehicleMutation.mutate();
  };

  // Generate status badge
  const getStatusBadge = (status: string) => {
    const statusColors = {
      available: "bg-green-500 text-white",
      rented: "bg-blue-500 text-white",
      maintenance: "bg-yellow-500 text-black",
      unavailable: "bg-red-500 text-white"
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-500 text-white"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Generate maintenance status badge
  const getMaintenanceStatusBadge = (status: string) => {
    const statusColors = {
      good: "bg-green-500 text-white",
      scheduled: "bg-yellow-500 text-black",
      overdue: "bg-red-500 text-white",
      in_progress: "bg-blue-500 text-white"
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-500 text-white"}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Car className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vehicle Not Found</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            The vehicle you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fleet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Management</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage and maintain your vehicle
          </p>
        </div>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fleet
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Information Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </CardTitle>
                  <CardDescription>License Plate: {vehicle.licensePlate}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(vehicle.status)}
                  {vehicle.maintenanceStatus && getMaintenanceStatusBadge(vehicle.maintenanceStatus)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Category</p>
                  <p className="font-medium capitalize">{vehicle.category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Daily Rate</p>
                  <p className="font-medium">${vehicle.dailyRate?.toFixed(2) || 'N/A'}</p>
                </div>
                {vehicle.transmission && (
                  <div className="space-y-1">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Transmission</p>
                    <p className="font-medium capitalize">{vehicle.transmission}</p>
                  </div>
                )}
                {vehicle.fuelType && (
                  <div className="space-y-1">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Fuel Type</p>
                    <p className="font-medium capitalize">{vehicle.fuelType}</p>
                  </div>
                )}
                {vehicle.seats && (
                  <div className="space-y-1">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Seats</p>
                    <p className="font-medium">{vehicle.seats}</p>
                  </div>
                )}
                {vehicle.doors && (
                  <div className="space-y-1">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Doors</p>
                    <p className="font-medium">{vehicle.doors}</p>
                  </div>
                )}
              </div>

              {vehicle.features && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Features</p>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.features.split(',').map((feature: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {feature.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Vehicle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Vehicle</DialogTitle>
                    <DialogDescription>
                      Update vehicle information and settings.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dailyRate">Daily Rate ($)</Label>
                      <Input
                        id="dailyRate"
                        type="number"
                        value={editData.dailyRate}
                        onChange={(e) => setEditData({...editData, dailyRate: e.target.value})}
                        placeholder="Enter daily rate"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maintenanceStatus">Maintenance Status</Label>
                      <Select value={editData.maintenanceStatus} onValueChange={(value) => setEditData({...editData, maintenanceStatus: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select maintenance status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateVehicle} disabled={updateVehicleMutation.isPending}>
                      {updateVehicleMutation.isPending ? "Updating..." : "Update Vehicle"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Wrench className="h-4 w-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Maintenance</DialogTitle>
                    <DialogDescription>
                      Schedule maintenance for {vehicle.make} {vehicle.model}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="maintenanceType">Maintenance Type</Label>
                      <Select value={maintenanceType} onValueChange={setMaintenanceType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select maintenance type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oil_change">Oil Change</SelectItem>
                          <SelectItem value="tire_rotation">Tire Rotation</SelectItem>
                          <SelectItem value="brake_inspection">Brake Inspection</SelectItem>
                          <SelectItem value="engine_service">Engine Service</SelectItem>
                          <SelectItem value="transmission_service">Transmission Service</SelectItem>
                          <SelectItem value="general_inspection">General Inspection</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maintenanceDate">Scheduled Date</Label>
                      <Input
                        id="maintenanceDate"
                        type="date"
                        value={maintenanceDate}
                        onChange={(e) => setMaintenanceDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maintenanceNotes">Notes</Label>
                      <Textarea
                        id="maintenanceNotes"
                        value={maintenanceNotes}
                        onChange={(e) => setMaintenanceNotes(e.target.value)}
                        placeholder="Additional notes or instructions..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleScheduleMaintenance} disabled={scheduleMaintenanceMutation.isPending}>
                      {scheduleMaintenanceMutation.isPending ? "Scheduling..." : "Schedule Maintenance"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        {/* Active Bookings Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Active Bookings</CardTitle>
              <CardDescription>Current and upcoming rentals</CardDescription>
            </CardHeader>
            <CardContent>
              {activeBookings && activeBookings.length > 0 ? (
                <div className="space-y-3">
                  {activeBookings.map((booking: Booking) => (
                    <div key={booking.id} className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{booking.bookingRef}</span>
                        <Badge variant={booking.status === "active" ? "default" : "outline"}>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {booking.startDate ? format(new Date(booking.startDate), 'MMM d') : 'N/A'} - {booking.endDate ? format(new Date(booking.endDate), 'MMM d') : 'N/A'}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${booking.totalAmount?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No active bookings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}