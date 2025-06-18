
import { useState } from "react";
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
import { 
  Settings as SettingsIcon, 
  Printer, 
  Download, 
  Upload, 
  Wifi, 
  Volume2,
  Users,
  Palette,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Settings() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    // General Settings
    restaurantName: "LokalRestro",
    currency: "INR",
    timezone: "Asia/Kolkata",
    language: "en",
    
    // Tax & Billing
    taxRate: "18",
    serviceCharge: "10",
    enableRounding: true,
    
    // Printer Settings
    printerIP: "192.168.1.100",
    printerPort: "9100",
    
    // Sound Settings
    enableSounds: true,
    soundVolume: "50",
    
    // Theme Settings
    theme: "light",
    primaryColor: "blue",
    
    // Module Settings
    enableKDS: true,
    enableRoomManagement: true,
    enableReports: true,
  });

  const [connectedDevices] = useState([
    { id: 1, name: "POS Station 1", ip: "192.168.1.101", role: "cashier", status: "online", lastSeen: "Just now" },
    { id: 2, name: "Kitchen Display", ip: "192.168.1.102", role: "chef", status: "online", lastSeen: "1 min ago" },
    { id: 3, name: "Waiter Tablet 1", ip: "192.168.1.103", role: "waiter", status: "offline", lastSeen: "5 min ago" },
  ]);

  const handleSaveSettings = () => {
    // Save settings to localStorage or sync across LAN
    localStorage.setItem('lokal_settings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Your configuration has been updated successfully",
    });
  };

  const handleTestPrinter = () => {
    toast({
      title: "Testing Printer",
      description: "Sending test receipt to printer...",
    });
    
    // Simulate printer test
    setTimeout(() => {
      toast({
        title: "Printer Test Complete",
        description: "Test receipt printed successfully",
      });
    }, 2000);
  };

  const handleBackup = () => {
    const backupData = {
      settings,
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lokalrestro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    toast({
      title: "Backup Created",
      description: "Configuration backup downloaded successfully",
    });
  };

  const pingAllDevices = () => {
    toast({
      title: "Pinging Devices",
      description: "Checking connectivity to all devices...",
    });
    
    // Simulate ping test
    setTimeout(() => {
      toast({
        title: "Ping Complete",
        description: "2 of 3 devices are responding",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your LokalRestro system</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

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
                  <Label htmlFor="restaurantName">Restaurant Name</Label>
                  <Input
                    id="restaurantName"
                    value={settings.restaurantName}
                    onChange={(e) => setSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                  />
                </div>
                
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
                
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => setSettings(prev => ({ ...prev, theme: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
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
              
              <Button onClick={handleTestPrinter} variant="outline" className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Test Printer Connection
              </Button>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Test Receipt Preview:</h4>
                <div className="text-sm font-mono bg-white p-3 rounded border">
                  <div className="text-center">
                    <div className="font-bold">{settings.restaurantName}</div>
                    <div>Test Receipt</div>
                    <div>{new Date().toLocaleString()}</div>
                  </div>
                  <div className="border-t border-dashed my-2"></div>
                  <div>1x Test Item ..................... ₹100.00</div>
                  <div className="border-t border-dashed my-2"></div>
                  <div className="font-bold">Total: ₹100.00</div>
                  <div className="text-center mt-2">Thank you for your visit!</div>
                </div>
              </div>
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
                    <p className="text-sm text-gray-600">Real-time order tracking for kitchen staff</p>
                  </div>
                  <Switch
                    checked={settings.enableKDS}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableKDS: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Room Management</h4>
                    <p className="text-sm text-gray-600">Hotel room booking and management</p>
                  </div>
                  <Switch
                    checked={settings.enableRoomManagement}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableRoomManagement: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Reports & Analytics</h4>
                    <p className="text-sm text-gray-600">Sales reports and business insights</p>
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
                        <div className="text-sm text-gray-600">{device.ip} • {device.role}</div>
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
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">2</div>
                  <div className="text-sm text-green-700">Online Devices</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">1</div>
                  <div className="text-sm text-red-700">Offline Devices</div>
                </div>
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
                
                <Button variant="outline" className="h-20 flex flex-col">
                  <Upload className="h-6 w-6 mb-2" />
                  Restore Backup
                  <span className="text-xs opacity-80">Upload and restore from file</span>
                </Button>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Backup Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Settings and configuration</li>
                  <li>• Menu items and categories</li>
                  <li>• Table and room setup</li>
                  <li>• User roles and permissions</li>
                  <li>• Recent transaction logs</li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Important Notes</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Backups are created in JSON format</li>
                  <li>• Store backups securely and regularly</li>
                  <li>• Test restore functionality periodically</li>
                  <li>• Consider automated backup scheduling</li>
                </ul>
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
    </div>
  );
}
