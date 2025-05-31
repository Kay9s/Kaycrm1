import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  Mail, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Settings
} from "lucide-react";

export default function Integrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sheetTitle, setSheetTitle] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");

  // Check Google authentication status
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ['/api/google/calendar/test'],
    retry: false,
  });

  // Authenticate with Google
  const authenticateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google/auth/url');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
      return data;
    },
    onError: (error) => {
      toast({
        title: "Authentication Error",
        description: "Failed to get authentication URL. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync calendar
  const syncCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google/calendar/sync', { method: 'POST' });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Calendar Sync Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/google/calendar/test'] });
    },
    onError: (error) => {
      toast({
        title: "Calendar Sync Failed",
        description: "Failed to sync calendar. Please check your authentication.",
        variant: "destructive",
      });
    },
  });

  // Create Google Sheet
  const createSheetMutation = useMutation({
    mutationFn: async (data: { title: string; data: any[] }) => {
      const response = await fetch('/api/google/sheets/create', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sheet Created",
        description: `Google Sheet "${sheetTitle}" created successfully.`,
      });
      setSheetTitle("");
    },
    onError: (error) => {
      toast({
        title: "Sheet Creation Failed",
        description: "Failed to create Google Sheet. Please check your authentication.",
        variant: "destructive",
      });
    },
  });

  // Create Google Doc
  const createDocMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await fetch('/api/google/docs/create', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Document Created",
        description: `Google Document "${docTitle}" created successfully.`,
      });
      setDocTitle("");
      setDocContent("");
    },
    onError: (error) => {
      toast({
        title: "Document Creation Failed",
        description: "Failed to create Google Document. Please check your authentication.",
        variant: "destructive",
      });
    },
  });

  const isAuthenticated = authStatus && typeof authStatus === 'object' && 'authenticated' in authStatus ? authStatus.authenticated : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Manage your Google services integration for calendar, docs, and sheets
        </p>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Google Services Authentication
          </CardTitle>
          <CardDescription>
            Connect your Google account to enable calendar sync, document creation, and email features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Badge variant="secondary">Checking...</Badge>
            ) : isAuthenticated ? (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {isAuthenticated ? "Google services are ready to use" : "Authentication required"}
            </span>
          </div>

          {!isAuthenticated && (
            <Button 
              onClick={() => authenticateMutation.mutate()}
              disabled={authenticateMutation.isPending}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect Google Account
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Sync your booking data with Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Automatically create calendar events for all bookings to keep track of rental schedules.
          </p>
          <Button 
            onClick={() => syncCalendarMutation.mutate()}
            disabled={!isAuthenticated || syncCalendarMutation.isPending}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncCalendarMutation.isPending ? 'animate-spin' : ''}`} />
            Sync All Bookings
          </Button>
        </CardContent>
      </Card>

      {/* Google Sheets Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Google Sheets
          </CardTitle>
          <CardDescription>
            Export your data to Google Sheets for analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                disabled={!isAuthenticated}
                variant="outline"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Create New Sheet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Google Sheet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sheet-title">Sheet Title</Label>
                  <Input
                    id="sheet-title"
                    value={sheetTitle}
                    onChange={(e) => setSheetTitle(e.target.value)}
                    placeholder="Car Rental Report - 2025"
                  />
                </div>
                <Button 
                  onClick={() => createSheetMutation.mutate({ 
                    title: sheetTitle, 
                    data: [] 
                  })}
                  disabled={!sheetTitle || createSheetMutation.isPending}
                  className="w-full"
                >
                  Create Sheet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Google Docs Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Google Docs
          </CardTitle>
          <CardDescription>
            Create professional reports and documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                disabled={!isAuthenticated}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create New Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Google Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-title">Document Title</Label>
                  <Input
                    id="doc-title"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Monthly Rental Report"
                  />
                </div>
                <div>
                  <Label htmlFor="doc-content">Initial Content (Optional)</Label>
                  <Textarea
                    id="doc-content"
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Document content..."
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={() => createDocMutation.mutate({ 
                    title: docTitle, 
                    content: docContent 
                  })}
                  disabled={!docTitle || createDocMutation.isPending}
                  className="w-full"
                >
                  Create Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Gmail Integration (Future) */}
      <Card className="opacity-75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail (Coming Soon)
          </CardTitle>
          <CardDescription>
            Send automated emails for booking confirmations and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Email automation features will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}