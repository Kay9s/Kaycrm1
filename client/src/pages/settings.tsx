import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [currency, setCurrency] = useState("USD");
  
  const handleSaveGeneralSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your general settings have been updated successfully.",
    });
  };

  const handleSaveNotificationSettings = () => {
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated successfully.",
    });
  };

  const handleSaveIntegrationSettings = () => {
    toast({
      title: "Integration settings saved",
      description: "Your integration settings have been updated successfully.",
    });
  };

  const handleSaveBackupSettings = () => {
    toast({
      title: "Backup settings saved",
      description: "Your backup settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="backup">Backup & Export</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" defaultValue="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="john.doe@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue="Administrator" disabled />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" defaultValue="Fleet manager with 5+ years of experience in car rental operations." />
              </div>
              
              <Button onClick={handleSaveGeneralSettings}>
                Save Profile Information
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your application preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select value={timeFormat} onValueChange={setTimeFormat}>
                    <SelectTrigger id="timeFormat">
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                      <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Enable dark mode for the application interface</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <Button onClick={handleSaveGeneralSettings}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you'll receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="desktopNotifications">Desktop Notifications</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive notifications on your desktop</p>
                  </div>
                  <Switch
                    id="desktopNotifications"
                    checked={desktopNotifications}
                    onCheckedChange={setDesktopNotifications}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Types</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="notification-new-booking" className="rounded border-neutral-300 dark:border-neutral-700" defaultChecked />
                    <Label htmlFor="notification-new-booking">New Booking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="notification-booking-change" className="rounded border-neutral-300 dark:border-neutral-700" defaultChecked />
                    <Label htmlFor="notification-booking-change">Booking Changes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="notification-vehicle-maintenance" className="rounded border-neutral-300 dark:border-neutral-700" defaultChecked />
                    <Label htmlFor="notification-vehicle-maintenance">Vehicle Maintenance Due</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="notification-payment" className="rounded border-neutral-300 dark:border-neutral-700" defaultChecked />
                    <Label htmlFor="notification-payment">Payment Updates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="notification-support" className="rounded border-neutral-300 dark:border-neutral-700" defaultChecked />
                    <Label htmlFor="notification-support">Support Tickets</Label>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSaveNotificationSettings}>
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Integration Settings</CardTitle>
              <CardDescription>Configure external API integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n8n-webhook-url">n8n Webhook URL</Label>
                  <div className="flex">
                    <Input id="n8n-webhook-url" defaultValue="https://n8n.example.com/webhook/carflow" className="flex-1" />
                    <Button variant="outline" className="ml-2">
                      Test
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">URL for the n8n webhook integration</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="google-calendar-api">Google Calendar API Key</Label>
                  <div className="flex">
                    <Input id="google-calendar-api" type="password" defaultValue="••••••••••••••••" className="flex-1" />
                    <Button variant="outline" className="ml-2">
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">API key for Google Calendar integration</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="google-sheets-api">Google Sheets API Key</Label>
                  <div className="flex">
                    <Input id="google-sheets-api" type="password" defaultValue="••••••••••••••••" className="flex-1" />
                    <Button variant="outline" className="ml-2">
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">API key for Google Sheets integration</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="elevenlabs-api">ElevenLabs API Key</Label>
                  <div className="flex">
                    <Input id="elevenlabs-api" type="password" defaultValue="••••••••••••••••" className="flex-1" />
                    <Button variant="outline" className="ml-2">
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">API key for ElevenLabs voice agent integration</p>
                </div>
              </div>
              
              <Button onClick={handleSaveIntegrationSettings}>
                Save Integration Settings
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Webhook Notifications</CardTitle>
              <CardDescription>Configure webhook notifications for external systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-new-booking">New Booking Webhook</Label>
                <Input id="webhook-new-booking" defaultValue="https://yourapp.com/api/webhooks/new-booking" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook-booking-update">Booking Update Webhook</Label>
                <Input id="webhook-booking-update" defaultValue="https://yourapp.com/api/webhooks/booking-update" />
              </div>
              
              <Button onClick={handleSaveIntegrationSettings}>
                Save Webhook Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              
              <Button>Update Password</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Enable two-factor authentication for your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline">Setup 2FA</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Manage your active sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chrome on Windows</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Active now • Last seen 2 minutes ago</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Sign Out
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Safari on macOS</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Last seen 5 days ago</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Sign Out
                  </Button>
                </div>
              </div>
              
              <Button variant="outline">Sign Out All Devices</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>Configure database backup schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger id="backup-frequency">
                    <SelectValue placeholder="Select backup frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup-retention">Backup Retention</Label>
                <Select defaultValue="30days">
                  <SelectTrigger id="backup-retention">
                    <SelectValue placeholder="Select retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">7 Days</SelectItem>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="90days">90 Days</SelectItem>
                    <SelectItem value="365days">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSaveBackupSettings}>
                Save Backup Settings
              </Button>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Manual Backup</p>
                  <Button variant="outline">Create Backup Now</Button>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Create a manual backup of the database</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Export Data</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">Export Bookings (CSV)</Button>
                  <Button variant="outline" size="sm">Export Vehicles (CSV)</Button>
                  <Button variant="outline" size="sm">Export Customers (CSV)</Button>
                  <Button variant="outline" size="sm">Export All Data (JSON)</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}