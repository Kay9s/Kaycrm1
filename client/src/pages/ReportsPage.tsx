import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Edit, Trash2, BarChart3, PieChart, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ReportTable = {
  id: number;
  name: string;
  type: 'bookings' | 'vehicles' | 'customers' | 'revenue' | 'custom';
  columns: string[];
  filters: Record<string, any>;
  createdAt: string;
  data?: any[];
};

type TableTemplate = {
  id: string;
  name: string;
  description: string;
  type: ReportTable['type'];
  defaultColumns: string[];
  availableColumns: string[];
  icon: any;
};

const tableTemplates: TableTemplate[] = [
  {
    id: 'bookings-overview',
    name: 'Bookings Overview',
    description: 'Complete booking information with customer and vehicle details',
    type: 'bookings',
    defaultColumns: ['bookingRef', 'customerName', 'vehicleMake', 'vehicleModel', 'startDate', 'endDate', 'totalAmount', 'status'],
    availableColumns: ['bookingRef', 'customerName', 'customerEmail', 'vehicleMake', 'vehicleModel', 'vehicleLicense', 'startDate', 'endDate', 'totalAmount', 'status', 'createdAt'],
    icon: Calendar
  },
  {
    id: 'revenue-analysis',
    name: 'Revenue Analysis',
    description: 'Financial performance and revenue tracking',
    type: 'revenue',
    defaultColumns: ['month', 'totalRevenue', 'bookingCount', 'averageBookingValue'],
    availableColumns: ['month', 'totalRevenue', 'bookingCount', 'averageBookingValue', 'vehicleCategory', 'customerType'],
    icon: TrendingUp
  },
  {
    id: 'vehicle-utilization',
    name: 'Vehicle Utilization',
    description: 'Track vehicle usage and performance metrics',
    type: 'vehicles',
    defaultColumns: ['make', 'model', 'licensePlate', 'category', 'status', 'totalBookings', 'revenue'],
    availableColumns: ['make', 'model', 'licensePlate', 'category', 'status', 'totalBookings', 'revenue', 'utilizationRate', 'maintenanceStatus'],
    icon: BarChart3
  },
  {
    id: 'customer-insights',
    name: 'Customer Insights',
    description: 'Customer behavior and preferences analysis',
    type: 'customers',
    defaultColumns: ['fullName', 'email', 'totalBookings', 'totalSpent', 'lastBooking'],
    availableColumns: ['fullName', 'email', 'phone', 'totalBookings', 'totalSpent', 'averageBookingValue', 'lastBooking', 'preferredCategory'],
    icon: PieChart
  }
];

export default function ReportsPage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<TableTemplate | null>(null);
  const [customTableName, setCustomTableName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<ReportTable | null>(null);

  // Fetch custom tables
  const { data: customTables = [], isLoading: isLoadingTables } = useQuery({
    queryKey: ['/api/reports/tables'],
  });

  // Create custom table mutation
  const createTableMutation = useMutation({
    mutationFn: async (tableData: any) => {
      const response = await fetch('/api/reports/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableData)
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/tables'] });
      setCreateDialogOpen(false);
      setSelectedTemplate(null);
      setCustomTableName('');
      setSelectedColumns([]);
      toast({
        title: "Table Created",
        description: "Your custom report table has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create custom table. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: async (tableId: number) => {
      const response = await fetch(`/api/reports/tables/${tableId}`, {
        method: 'DELETE'
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/tables'] });
      toast({
        title: "Table Deleted",
        description: "The custom table has been deleted successfully.",
      });
    }
  });

  // Get table data mutation
  const getTableDataMutation = useMutation({
    mutationFn: async (tableId: number) => {
      return await apiRequest(`/api/reports/tables/${tableId}/data`);
    },
    onSuccess: (data, tableId) => {
      queryClient.setQueryData(['/api/reports/tables', tableId, 'data'], data);
    }
  });

  const handleTemplateSelect = (template: TableTemplate) => {
    setSelectedTemplate(template);
    setSelectedColumns(template.defaultColumns);
    setCustomTableName(template.name);
  };

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const handleCreateTable = async () => {
    if (!selectedTemplate || !customTableName.trim() || selectedColumns.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a template, enter a table name, and choose at least one column.",
        variant: "destructive"
      });
      return;
    }

    const tableData = {
      name: customTableName,
      type: selectedTemplate.type,
      columns: selectedColumns,
      filters: {}
    };

    createTableMutation.mutate(tableData);
  };

  const handleDeleteTable = (tableId: number) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      deleteTableMutation.mutate(tableId);
    }
  };

  const handleExportTable = async (table: ReportTable) => {
    try {
      const response = await fetch(`/api/reports/tables/${table.id}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table.name.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `${table.name} has been exported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export table data.",
        variant: "destructive"
      });
    }
  };

  const renderTableData = (table: ReportTable) => {
    const { data: tableData } = useQuery({
      queryKey: ['/api/reports/tables', table.id, 'data'],
      enabled: false
    });

    return (
      <Card key={table.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                {table.name}
                <Badge variant="outline">{table.type}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created {new Date(table.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => getTableDataMutation.mutate(table.id)}
                disabled={getTableDataMutation.isPending}
              >
                {getTableDataMutation.isPending ? 'Loading...' : 'Refresh Data'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportTable(table)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingTable(table)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteTable(table.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tableData && Array.isArray(tableData) && tableData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {table.columns.map(column => (
                    <TableHead key={column} className="capitalize">
                      {column.replace(/([A-Z])/g, ' $1').trim()}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.slice(0, 10).map((row, index) => (
                  <TableRow key={index}>
                    {table.columns.map(column => (
                      <TableCell key={column}>
                        {row[column] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No data available for this table.</p>
              <Button 
                variant="link" 
                onClick={() => getTableDataMutation.mutate(table.id)}
                className="mt-2"
              >
                Load Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Create and manage custom report tables</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Table
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Report Table</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="templates" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates">Choose Template</TabsTrigger>
                <TabsTrigger value="customize">Customize</TabsTrigger>
              </TabsList>
              
              <TabsContent value="templates" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tableTemplates.map(template => {
                    const IconComponent = template.icon;
                    return (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold">{template.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {template.defaultColumns.slice(0, 3).map(col => (
                              <Badge key={col} variant="secondary" className="text-xs">
                                {col}
                              </Badge>
                            ))}
                            {template.defaultColumns.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.defaultColumns.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="customize" className="space-y-4">
                {selectedTemplate ? (
                  <>
                    <div>
                      <Label htmlFor="tableName">Table Name</Label>
                      <Input
                        id="tableName"
                        value={customTableName}
                        onChange={(e) => setCustomTableName(e.target.value)}
                        placeholder="Enter table name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Select Columns</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                        {selectedTemplate.availableColumns.map(column => (
                          <div key={column} className="flex items-center space-x-2">
                            <Checkbox
                              id={column}
                              checked={selectedColumns.includes(column)}
                              onCheckedChange={() => handleColumnToggle(column)}
                            />
                            <Label 
                              htmlFor={column} 
                              className="text-sm capitalize cursor-pointer"
                            >
                              {column.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateTable}
                        disabled={createTableMutation.isPending}
                      >
                        {createTableMutation.isPending ? 'Creating...' : 'Create Table'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Please select a template from the previous tab to customize it.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Custom Tables</h2>
        {isLoadingTables ? (
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Loading tables...</div>
          </div>
        ) : customTables.length > 0 ? (
          <div className="space-y-4">
            {customTables.map((table: ReportTable) => renderTableData(table))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No Custom Tables</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom report table to get started.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Table
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}