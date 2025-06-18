import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, 
  Printer, 
  Download, 
  Upload, 
  Wifi, 
  Volume2,
  Users,
  Palette,
  DollarSign,
  Image,
  Moon,
  Sun
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { printerService } from "@/services/printerService";
import { backupService } from "@/services/backupService";
import { syncService } from "@/services/syncService";
import { soundService } from "@/services/soundService";

export function Settings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState({
    // Branding Settings
    restaurantName: localStorage.getItem('lokal_restaurant_name') || "LokalRestro",
    logoUrl: localStorage.getItem('lokal_logo_url') || "",
    primaryColor: localStorage.getItem('lokal_primary_color') || "blue",
    footerText: localStorage.getItem('lokal_footer_text') || "Thank you for your visit!",
    
    // General Settings
    currency: "INR",
    timezone: "Asia/Kolkata",
    language: "en",
    theme: localStorage.getItem('lokal_theme') || "light",
    
    // Tax & Billing
    taxRate: "18",
    serviceCharge: "10",
    enableRounding: true,
    
    // Printer Settings
    printerIP: "192.168.1.100",
    printerPort: "9100",
    printerEnabled: true,
    
    // Sound Settings
    enableSounds: true,
    soundVolume: "50",
    
    // Module Settings
    enableKDS: true,
    enableRoomManagement: true,
    enableReports: true,
    
    // Network Settings
    serverUrl: "ws://192.168.1.1:8080"
  });

  const [connectedDevices] = useState(syncService.getConnectedDevices());
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(backupService.getPendingRestore());

  const handleSaveSettings = () => {
    // Save all settings to localStorage
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(`lokal_${key}`, value.toString());
    });
    
    // Update services
    printerService.updateConfig({
      ip: settings.printerIP,
      port: settings.printerPort,
      enabled: settings.printerEnabled
    });
    
    soundService.setEnabled(settings.enableSounds);
    soundService.setVolume(parseFloat(settings.soundVolume));
    
    toast({
      title: "Settings Saved",
      description: "Your configuration has been updated successfully",
    });
  };

  const handleTestPrinter = async () => {
    toast({
      title: "Testing Printer",
      description: "Sending test receipt to printer...",
    });
    
    const success = await printerService.testPrinter();
    
    setTimeout(() => {
      toast({
        title: success ? "Printer Test Complete" : "Printer Test Failed",
        description: success ? "Test receipt printed successfully" : "Check printer connection and settings",
        variant: success ? "default" : "destructive"
      });
    }, 2000);
  };

  const handleBackup = async () => {
    try {
      await backupService.downloadBackup();
      toast({
        title: "Backup Created",
        description: "Configuration backup downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await backupService.restoreBackup(file);
      setPendingRestore(backupService.getPendingRestore());
      setRestoreDialogOpen(true);
    } catch (error) {
      toast({
        title: "Invalid Backup File",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const confirmRestore = async () => {
    try {
      await backupService.confirmRestore();
      toast({
        title: "Restore Complete",
        description: "System has been restored from backup. Please refresh the page.",
      });
      setRestoreDialogOpen(false);
      setPendingRestore(null);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const logoUrl = e.target?.result as string;
      setSettings(prev => ({ ...prev, logoUrl }));
      localStorage.setItem('lokal_logo_url', logoUrl);
      toast({
        title: "Logo Updated",
        description: "Your logo has been uploaded successfully",
      });
    };
    reader.readAsDataURL(file);
  };

  const pingAllDevices = () => {
    syncService.pingAllDevices();
    toast({
      title: "Pinging Devices",
      description: "Checking connectivity to all devices...",
    });
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    setSettings(prev => ({ ...prev, theme: newTheme }));
    localStorage.setItem('lokal_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your LokalRestro system</p>
        </div>
        <Button onClick={toggleTheme} variant="outline" className="flex items-center space-x-2">
          {settings.theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span>{settings.theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </Button>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Branding & Appearance
              </CardTitle>
              <CardDescription>Customize your restaurant's brand identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="restaurantName">Restaurant Name</Label>
                    <Input
                      id="restaurantName"
                      value={settings.restaurantName}
                      onChange={(e) => setSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                      className="text-lg font-semibold"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="footerText">Invoice Footer Text</Label>
                    <Textarea
                      id="footerText"
                      value={settings.footerText}
                      onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
                      placeholder="Thank you message for receipts..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="primaryColor">Primary Color Theme</Label>
                    <Select value={settings.primaryColor} onValueChange={(value) => setSettings(prev => ({ ...prev, primaryColor: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Logo Upload</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      {settings.logoUrl ? (
                        <div className="space-y-2">
                          <img src={settings.logoUrl} alt="Logo" className="mx-auto h-16 w-auto" />
                          <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                            Change Logo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Image className="mx-auto h-12 w-12 text-gray-400" />
                          <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </Button>
                        </div>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="bg-white dark:bg-gray-700 p-4 rounded border">
                  <div className="flex items-center space-x-3 mb-2">
                    {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto" />}
                    <h3 className="font-bold text-lg">{settings.restaurantName}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{settings.footerText}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
              <CardDescription>Basic configuration for your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="sounds"
                  checked={settings.enableSounds}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableSounds: checked }))}
                />
                <Label htmlFor="sounds">Enable Sound Notifications</Label>
              </div>
              
              {settings.enableSounds && (
                <div>
                  <Label htmlFor="volume">Sound Volume: {settings.soundVolume}%</Label>
                  <Input
                    id="volume"
                    type="range"
                    min="0"
                    max="100"
                    value={settings.soundVolume}
                    onChange={(e) => setSettings(prev => ({ ...prev, soundVolume: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Billing & Tax Settings
              </CardTitle>
              <CardDescription>Configure tax rates and billing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, taxRate: e.target.value }))}
                    step="0.1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="serviceCharge">Service Charge (%)</Label>
                  <Input
                    id="serviceCharge"
                    type="number"
                    value={settings.serviceCharge}
                    onChange={(e) => setSettings(prev => ({ ...prev, serviceCharge: e.target.value }))}
                    step="0.1"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="rounding"
                  checked={settings.enableRounding}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableRounding: checked }))}
                />
                <Label htmlFor="rounding">Enable Bill Rounding to Nearest Rupee</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printer" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="h-5 w-5 mr-2" />
                Printer Configuration
              </CardTitle>
              <CardDescription>Setup ESC/POS thermal printer connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="printerIP">Printer IP Address</Label>
                  <Input
                    id="printerIP"
                    value={settings.printerIP}
                    onChange={(e) => setSettings(prev => ({ ...prev, printerIP: e.target.value }))}
                    placeholder="192.168.1.100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="printerPort">Printer Port</Label>
                  <Input
                    id="printerPort"
                    value={settings.printerPort}
                    onChange={(e) => setSettings(prev => ({ ...prev, printerPort: e.target.value }))}
                    placeholder="9100"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="printerEnabled"
                  checked={settings.printerEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, printerEnabled: checked }))}
                />
                <Label htmlFor="printerEnabled">Enable Printer</Label>
              </div>
              
              <Button onClick={handleTestPrinter} variant="outline" className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Test Printer Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Module Management
              </CardTitle>
              <CardDescription>Enable or disable system modules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Kitchen Display System</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Real-time order tracking for kitchen staff</p>
                  </div>
                  <Switch
                    checked={settings.enableKDS}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableKDS: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Room Management</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Hotel room booking and management</p>
                  </div>
                  <Switch
                    checked={settings.enableRoomManagement}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableRoomManagement: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Reports & Analytics</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sales reports and business insights</p>
                  </div>
                  <Switch
                    checked={settings.enableReports}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableReports: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wifi className="h-5 w-5 mr-2" />
                Network & Connected Devices
              </CardTitle>
              <CardDescription>Monitor LAN connectivity and device status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="serverUrl">WebSocket Server URL</Label>
                <Input
                  id="serverUrl"
                  value={settings.serverUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, serverUrl: e.target.value }))}
                  placeholder="ws://192.168.1.1:8080"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Connected Devices</h4>
                <Button onClick={pingAllDevices} variant="outline" size="sm">
                  Ping All Devices
                </Button>
              </div>
              
              <div className="space-y-3">
                {connectedDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{device.ip} • {device.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {device.status}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">{device.lastSeen}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Backup & Restore
              </CardTitle>
              <CardDescription>Manage system data backups and restoration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleBackup} className="h-20 flex flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  Create Backup
                  <span className="text-xs opacity-80">Download current configuration</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-6 w-6 mb-2" />
                  Restore Backup
                  <span className="text-xs opacity-80">Upload and restore from file</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reset Changes
        </Button>
        <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          Save All Settings
        </Button>
      </div>

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Restore</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore from this backup? This will replace all current data.
            </DialogDescription>
          </DialogHeader>
          {pendingRestore && (
            <div className="space-y-2">
              <p><strong>Backup Date:</strong> {new Date(pendingRestore.timestamp).toLocaleString()}</p>
              <p><strong>Version:</strong> {pendingRestore.version}</p>
              <p><strong>Restaurant:</strong> {pendingRestore.metadata.restaurantName}</p>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRestore} variant="destructive">
              Confirm Restore
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
