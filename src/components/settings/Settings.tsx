
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Printer, 
  Volume2, 
  Wifi, 
  Upload,
  Download,
  Trash2,
  Save,
  RefreshCw,
  TestTube,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { databaseService, type AppSettings } from "@/services/databaseService";
import { printerService } from "@/services/printerService";
import { soundService } from "@/services/soundService";
import { syncService } from "@/services/syncService";
import { backupService } from "@/services/backupService";

export function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(databaseService.getData().settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = databaseService.subscribe((data) => {
      setSettings(data.settings);
      setHasChanges(false);
    });
    return unsubscribe;
  }, []);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
    soundService.updateSettings();
    setHasChanges(false);
    
    toast({
      title: "Settings Saved",
      description: "All settings have been updated successfully",
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File Too Large",
          description: "Logo file must be smaller than 2MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        updateSetting('logo', logoUrl);
      };
      reader.readAsDataURL(file);
      setLogoFile(file);
    }
  };

  const handleTestPrinter = async () => {
    setIsTestingPrinter(true);
    try {
      const testReceipt = {
        restaurantName: settings.restaurantName,
        orderID: "TEST-001",
        items: [
          { name: "Test Item", quantity: 1, price: 100 }
        ],
        total: 100,
        timestamp: new Date().toISOString()
      };
      
      await printerService.printReceipt(testReceipt);
      
      toast({
        title: "Printer Test Successful",
        description: "Test receipt sent to printer",
      });
    } catch (error) {
      toast({
        title: "Printer Test Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsTestingPrinter(false);
    }
  };

  const handleTestSound = () => {
    setIsTestingSound(true);
    soundService.playNewOrderChime();
    setTimeout(() => setIsTestingSound(false), 2000);
    
    toast({
      title: "Sound Test",
      description: "Playing new order chime",
    });
  };

  const predefinedColors = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Green", value: "#10B981" },
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F59E0B" },
    { name: "Pink", value: "#EC4899" },
    { name: "Indigo", value: "#6366F1" },
    { name: "Teal", value: "#14B8A6" }
  ];

  const handleExportSettings = () => {
    try {
      const settingsData = JSON.stringify(settings, null, 2);
      const blob = new Blob([settingsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lokalrestro-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Settings Exported",
        description: "Settings file has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export settings",
        variant: "destructive"
      });
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          setHasChanges(true);
          
          toast({
            title: "Settings Imported",
            description: "Settings have been loaded. Click Save to apply changes.",
          });
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Invalid settings file format",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: AppSettings = {
      restaurantName: 'LokalRestro',
      primaryColor: '#3B82F6',
      currency: '₹',
      taxRate: 18,
      serviceChargeRate: 10,
      enableSounds: true,
      soundVolume: 50,
      printerConfig: {
        ip: '192.168.1.100',
        port: '9100',
        enabled: true
      },
      modules: {
        roomManagement: true,
        kds: true,
        reports: true
      },
      darkMode: false
    };
    
    setSettings(defaultSettings);
    setHasChanges(true);
    
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults. Click Save to apply.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your LokalRestro system</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Unsaved Changes
            </Badge>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
          <TabsTrigger value="sound">Sound</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2 text-blue-600" />
                General Settings
              </CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    min="0"
                    max="50"
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
                    min="0"
                    max="25"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="darkMode" className="text-base font-medium">Dark Mode</Label>
                  <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2 text-purple-600" />
                Branding & Appearance
              </CardTitle>
              <CardDescription>Customize your restaurant's visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Restaurant Logo</Label>
                <div className="flex items-center space-x-4 mt-2">
                  {settings.logo && (
                    <div className="w-16 h-16 border rounded-lg overflow-hidden">
                      <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                  {settings.logo && (
                    <Button
                      variant="outline"
                      onClick={() => updateSetting('logo', undefined)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <Label>Primary Color</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <div 
                    className="w-12 h-12 rounded-lg border cursor-pointer"
                    style={{ backgroundColor: settings.primaryColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    placeholder="#3B82F6"
                    className="w-32"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  >
                    Choose Color
                  </Button>
                </div>
                
                {showColorPicker && (
                  <div className="grid grid-cols-4 gap-2 mt-4 p-4 border rounded-lg">
                    {predefinedColors.map((color) => (
                      <button
                        key={color.value}
                        className="w-12 h-12 rounded-lg border hover:scale-105 transition-transform"
                        style={{ backgroundColor: color.value }}
                        onClick={() => {
                          updateSetting('primaryColor', color.value);
                          setShowColorPicker(false);
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Preview</h4>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    {settings.logo ? (
                      <img src={settings.logo} alt="Logo" className="w-6 h-6 object-contain" />
                    ) : (
                      <span className="text-white font-bold text-sm">LR</span>
                    )}
                  </div>
                  <span className="text-lg font-bold">{settings.restaurantName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printer Settings */}
        <TabsContent value="printer" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="h-5 w-5 mr-2 text-green-600" />
                Printer Configuration
              </CardTitle>
              <CardDescription>Configure ESC/POS thermal printer settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable Printing</Label>
                  <p className="text-sm text-gray-500">Allow receipt printing functionality</p>
                </div>
                <Switch
                  checked={settings.printerConfig.enabled}
                  onCheckedChange={(checked) => updateNestedSetting('printerConfig', 'enabled', checked)}
                />
              </div>
              
              {settings.printerConfig.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleTestPrinter}
                  disabled={!settings.printerConfig.enabled || isTestingPrinter}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isTestingPrinter ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Printer
                </Button>
                
                <div className="text-sm text-gray-500">
                  This will print a test receipt to verify printer connection
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sound Settings */}
        <TabsContent value="sound" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Volume2 className="h-5 w-5 mr-2 text-orange-600" />
                Sound Configuration
              </CardTitle>
              <CardDescription>Configure notification sounds and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable Sounds</Label>
                  <p className="text-sm text-gray-500">Play notification sounds for events</p>
                </div>
                <Switch
                  checked={settings.enableSounds}
                  onCheckedChange={(checked) => updateSetting('enableSounds', checked)}
                />
              </div>
              
              {settings.enableSounds && (
                <div>
                  <Label>Sound Volume</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Slider
                      value={[settings.soundVolume]}
                      onValueChange={(value) => updateSetting('soundVolume', value[0])}
                      max={100}
                      step={10}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{settings.soundVolume}%</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleTestSound}
                  disabled={!settings.enableSounds || isTestingSound}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isTestingSound ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4 mr-2" />
                  )}
                  Test Sound
                </Button>
                
                <div className="text-sm text-gray-500">
                  This will play the new order notification sound
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module Settings */}
        <TabsContent value="modules" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-indigo-600" />
                Module Configuration
              </CardTitle>
              <CardDescription>Enable or disable system modules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Room Management</Label>
                  <p className="text-sm text-gray-500">Hotel room booking and guest management</p>
                </div>
                <Switch
                  checked={settings.modules.roomManagement}
                  onCheckedChange={(checked) => updateNestedSetting('modules', 'roomManagement', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Kitchen Display System</Label>
                  <p className="text-sm text-gray-500">Real-time kitchen order tracking</p>
                </div>
                <Switch
                  checked={settings.modules.kds}
                  onCheckedChange={(checked) => updateNestedSetting('modules', 'kds', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Reports & Analytics</Label>
                  <p className="text-sm text-gray-500">Sales reports and business analytics</p>
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
        <TabsContent value="advanced" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wifi className="h-5 w-5 mr-2 text-red-600" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>System backup, import/export, and advanced options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Settings Management</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <Button onClick={handleExportSettings} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('import-settings')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Settings
                  </Button>
                  <Input
                    id="import-settings"
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <Label className="text-base font-medium text-red-600">Danger Zone</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <Button
                    onClick={resetToDefaults}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <div className="text-sm text-gray-500">
                    This will reset all settings to their default values
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
