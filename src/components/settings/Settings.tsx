
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Printer, 
  Volume2, 
  Shield, 
  Wifi,
  Upload,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { databaseService, AppSettings } from "@/services/databaseService";
import { printerService } from "@/services/printerService";
import { soundService } from "@/services/soundService";

export function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(databaseService.getData().settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const unsubscribe = databaseService.subscribe((data) => {
      setSettings(data.settings);
    });
    return unsubscribe;
  }, []);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const updateNestedSetting = (parent: keyof AppSettings, key: string, value: any) => {
    const parentValue = settings[parent];
    if (typeof parentValue === 'object' && parentValue !== null) {
      const newSettings = {
        ...settings,
        [parent]: {
          ...parentValue,
          [key]: value
        }
      };
      setSettings(newSettings);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    databaseService.updateSettings(settings);
    
    // Update sound service
    soundService.setEnabled(settings.enableSounds);
    soundService.setVolume(settings.soundVolume);
    
    // Update printer service
    printerService.updateConfig(settings.printerConfig);
    
    setHasChanges(false);
    
    toast({
      title: "Settings Saved",
      description: "All settings have been updated successfully",
    });
  };

  const handleTestPrinter = async () => {
    const success = await printerService.testPrinter();
    
    toast({
      title: success ? "Printer Test Successful" : "Printer Test Failed",
      description: success 
        ? "Test receipt sent to printer successfully" 
        : "Failed to connect to printer. Check configuration.",
      variant: success ? "default" : "destructive"
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateSetting('logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const presetColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your restaurant management system</p>
        </div>
        
        {hasChanges && (
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Basic Configuration
                </CardTitle>
                <CardDescription>Core restaurant settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="restaurantName">Restaurant Name</Label>
                  <Input
                    id="restaurantName"
                    value={settings.restaurantName}
                    onChange={(e) => updateSetting('restaurantName', e.target.value)}
                    placeholder="Enter restaurant name"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Select value={settings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="₹">₹ (Indian Rupee)</SelectItem>
                      <SelectItem value="$">$ (US Dollar)</SelectItem>
                      <SelectItem value="€">€ (Euro)</SelectItem>
                      <SelectItem value="£">£ (British Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) || 0)}
                    placeholder="18"
                  />
                </div>

                <div>
                  <Label htmlFor="serviceCharge">Service Charge (%)</Label>
                  <Input
                    id="serviceCharge"
                    type="number"
                    value={settings.serviceChargeRate}
                    onChange={(e) => updateSetting('serviceChargeRate', parseFloat(e.target.value) || 0)}
                    placeholder="10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="h-5 w-5 mr-2 text-green-600" />
                  Sound Settings
                </CardTitle>
                <CardDescription>Audio notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Sound Effects</Label>
                    <p className="text-sm text-gray-500">Play chimes for key actions</p>
                  </div>
                  <Switch
                    checked={settings.enableSounds}
                    onCheckedChange={(checked) => updateSetting('enableSounds', checked)}
                  />
                </div>

                {settings.enableSounds && (
                  <div>
                    <Label htmlFor="soundVolume">Volume Level: {settings.soundVolume}%</Label>
                    <Input
                      id="soundVolume"
                      type="range"
                      min="0"
                      max="100"
                      value={settings.soundVolume}
                      onChange={(e) => updateSetting('soundVolume', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-gray-500">Switch to dark theme</p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2 text-purple-600" />
                Brand Customization
              </CardTitle>
              <CardDescription>Customize your restaurant's visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="logo">Restaurant Logo</Label>
                <div className="mt-2 space-y-3">
                  {settings.logo && (
                    <div className="flex items-center space-x-3">
                      <img 
                        src={settings.logo} 
                        alt="Logo preview" 
                        className="w-16 h-16 object-contain border rounded-lg"
                      />
                      <div>
                        <p className="text-sm text-gray-600">Current logo</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateSetting('logo', undefined)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                      id="logo-upload"
                    />
                    <Button 
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Primary Color Theme</Label>
                <div className="mt-3 grid grid-cols-6 gap-3">
                  {presetColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateSetting('primaryColor', color.value)}
                      className={`w-16 h-16 rounded-lg border-2 transition-all ${
                        settings.primaryColor === color.value 
                          ? 'border-gray-400 scale-105' 
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
                
                <div className="mt-3">
                  <Label htmlFor="customColor">Custom Color</Label>
                  <Input
                    id="customColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    className="w-20 h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printer Settings */}
        <TabsContent value="printer">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="h-5 w-5 mr-2 text-orange-600" />
                ESC/POS Printer Configuration
              </CardTitle>
              <CardDescription>Configure thermal printer for receipts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Printer</Label>
                  <p className="text-sm text-gray-500">Enable receipt printing</p>
                </div>
                <Switch
                  checked={settings.printerConfig.enabled}
                  onCheckedChange={(checked) => updateNestedSetting('printerConfig', 'enabled', checked)}
                />
              </div>

              {settings.printerConfig.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="printerIp">Printer IP Address</Label>
                    <Input
                      id="printerIp"
                      value={settings.printerConfig.ip}
                      onChange={(e) => updateNestedSetting('printerConfig', 'ip', e.target.value)}
                      placeholder="192.168.1.100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="printerPort">Printer Port</Label>
                    <Input
                      id="printerPort"
                      value={settings.printerConfig.port}
                      onChange={(e) => updateNestedSetting('printerConfig', 'port', e.target.value)}
                      placeholder="9100"
                    />
                  </div>

                  <Button 
                    onClick={handleTestPrinter}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Test Printer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module Settings */}
        <TabsContent value="modules">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-600" />
                Module Configuration
              </CardTitle>
              <CardDescription>Enable or disable system modules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Room Management</Label>
                  <p className="text-sm text-gray-500">Hotel room booking and management</p>
                </div>
                <Switch
                  checked={settings.modules.roomManagement}
                  onCheckedChange={(checked) => updateNestedSetting('modules', 'roomManagement', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Kitchen Display System</Label>
                  <p className="text-sm text-gray-500">Real-time kitchen order tracking</p>
                </div>
                <Switch
                  checked={settings.modules.kds}
                  onCheckedChange={(checked) => updateNestedSetting('modules', 'kds', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Reports & Analytics</Label>
                  <p className="text-sm text-gray-500">Sales reports and performance analytics</p>
                </div>
                <Switch
                  checked={settings.modules.reports}
                  onCheckedChange={(checked) => updateNestedSetting('modules', 'reports', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wifi className="h-5 w-5 mr-2 text-cyan-600" />
                  Network & Sync
                </CardTitle>
                <CardDescription>LAN synchronization settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sync Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className="bg-green-100 text-green-800">
                      LAN Sync Active
                    </Badge>
                    <span className="text-sm text-gray-500">Connected devices: 3</span>
                  </div>
                </div>

                <div>
                  <Label>Device ID</Label>
                  <Input
                    value={localStorage.getItem('lokal_device_id') || 'Not Set'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Application details and diagnostics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Version</Label>
                    <p className="text-gray-600">v1.0.0</p>
                  </div>
                  <div>
                    <Label>Build</Label>
                    <p className="text-gray-600">Production</p>
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <p className="text-gray-600">Web</p>
                  </div>
                  <div>
                    <Label>Storage</Label>
                    <p className="text-gray-600">LocalStorage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <div className="fixed bottom-4 right-4">
          <Button 
            onClick={handleSave}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            <Save className="h-5 w-5 mr-2" />
            Save All Changes
          </Button>
        </div>
      )}
    </div>
  );
}
