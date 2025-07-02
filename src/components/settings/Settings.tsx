
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { databaseService } from "@/services/databaseService";
import { soundService } from "@/services/soundService";
import { printerService, Receipt } from "@/services/printerService";

export function Settings() {
  const { toast } = useToast();
  const [data, setData] = useState(databaseService.getData());
  const [settings, setSettings] = useState(data.settings);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    const unsubscribe = databaseService.subscribe((newData) => {
      setData(newData);
      setSettings(newData.settings);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (logoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(logoFile);
    } else {
      setLogoPreview(settings.logo || '');
    }
  }, [logoFile, settings.logo]);

  // Apply dark mode to document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const updateNestedSetting = (key: string, value: any) => {
    const updatedSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(updatedSettings);
    databaseService.updateSettings(updatedSettings);

    // Update sound service if sound settings changed
    if (key === 'enableSounds' || key === 'soundVolume') {
      soundService.updateSettings();
    }

    // Update printer service if printer settings changed
    if (key === 'printerConfig') {
      printerService.updateConfig(value);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNestedSetting('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDarkModeChange = (checked: boolean) => {
    updateNestedSetting('darkMode', checked);
    
    // Immediately apply theme change
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    toast({
      title: "Theme Updated",
      description: `Switched to ${checked ? 'dark' : 'light'} mode`,
    });

    soundService.playSound('success');
  };

  const handleTestPrinter = async () => {
    const testReceipt: Receipt = {
      header: {
        restaurantName: settings.restaurantName,
        address: '123 Restaurant Street, City',
        phone: '+91 98765 43210'
      },
      order: {
        id: 'TEST-' + Date.now(),
        table: 'T1',
        waiter: 'Test User',
        timestamp: new Date().toISOString()
      },
      items: [
        { name: 'Test Item 1', quantity: 2, price: 150, total: 300 },
        { name: 'Test Item 2', quantity: 1, price: 200, total: 200 }
      ],
      totals: {
        subtotal: 500,
        tax: 90,
        serviceCharge: 50,
        discount: 0,
        total: 640
      },
      payment: {
        method: 'Cash',
        amount: 650,
        change: 10
      },
      footer: 'Thank you for testing LokalRestro!\nPrint System Working'
    };

    const success = await printerService.printReceipt(testReceipt);
    
    toast({
      title: success ? "Test Print Successful" : "Test Print Failed",
      description: success 
        ? "Test receipt sent to printer successfully" 
        : "Failed to connect to printer. Check printer configuration.",
      variant: success ? "default" : "destructive"
    });

    soundService.playSound(success ? 'success' : 'error');
  };

  const handleTestSound = () => {
    soundService.playTestSound();
    toast({
      title: "Sound Test",
      description: "Playing test sound with current settings",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your restaurant settings</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage basic restaurant information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            <Input
              id="restaurantName"
              value={settings.restaurantName}
              onChange={(e) => updateNestedSetting('restaurantName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="logo">Logo</Label>
            <Input
              type="file"
              id="logo"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <Button variant="outline" asChild>
              <label htmlFor="logo" className="cursor-pointer">
                {logoFile || settings.logo ? 'Change Logo' : 'Upload Logo'}
              </label>
            </Button>
            {logoPreview && (
              <div className="mt-2">
                <img src={logoPreview} alt="Logo Preview" className="max-h-20 rounded-md" />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input
              type="color"
              id="primaryColor"
              value={settings.primaryColor}
              onChange={(e) => updateNestedSetting('primaryColor', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency Symbol</Label>
            <Input
              id="currency"
              value={settings.currency}
              onChange={(e) => updateNestedSetting('currency', e.target.value)}
              placeholder="₹"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
          <CardDescription>Manage tax and service charge rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Slider
              id="taxRate"
              value={[settings.taxRate]}
              max={30}
              step={0.5}
              onValueChange={([value]) => updateNestedSetting('taxRate', value)}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current Tax Rate: {settings.taxRate}%
            </p>
          </div>
          <div>
            <Label htmlFor="serviceChargeRate">Service Charge Rate (%)</Label>
            <Slider
              id="serviceChargeRate"
              value={[settings.serviceChargeRate]}
              max={20}
              step={0.5}
              onValueChange={([value]) => updateNestedSetting('serviceChargeRate', value)}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current Service Charge Rate: {settings.serviceChargeRate}%
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Sound Settings</CardTitle>
          <CardDescription>Configure audio notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableSounds">Enable Sound Notifications</Label>
            <Switch
              id="enableSounds"
              checked={settings.enableSounds}
              onCheckedChange={(checked) => updateNestedSetting('enableSounds', checked)}
            />
          </div>
          <div>
            <Label htmlFor="soundVolume">Sound Volume</Label>
            <Slider
              id="soundVolume"
              value={[settings.soundVolume]}
              max={100}
              step={1}
              onValueChange={([value]) => updateNestedSetting('soundVolume', value)}
              disabled={!settings.enableSounds}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current Volume: {settings.soundVolume}%
            </p>
          </div>
          <Button variant="outline" onClick={handleTestSound} disabled={!settings.enableSounds}>
            Test Sound
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Printer Settings</CardTitle>
          <CardDescription>Configure your thermal printer for receipts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="printerEnabled">Enable Printer</Label>
            <Switch
              id="printerEnabled"
              checked={settings.printerConfig.enabled}
              onCheckedChange={(checked) => 
                updateNestedSetting('printerConfig', { ...settings.printerConfig, enabled: checked })
              }
            />
          </div>
          <div>
            <Label htmlFor="printerIp">Printer IP Address</Label>
            <Input
              id="printerIp"
              value={settings.printerConfig.ip}
              onChange={(e) => 
                updateNestedSetting('printerConfig', { ...settings.printerConfig, ip: e.target.value })
              }
              placeholder="192.168.1.100"
              disabled={!settings.printerConfig.enabled}
            />
          </div>
          <div>
            <Label htmlFor="printerPort">Printer Port</Label>
            <Input
              id="printerPort"
              value={settings.printerConfig.port}
              onChange={(e) => 
                updateNestedSetting('printerConfig', { ...settings.printerConfig, port: e.target.value })
              }
              placeholder="9100"
              disabled={!settings.printerConfig.enabled}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={handleTestPrinter}
            disabled={!settings.printerConfig.enabled}
          >
            Test Printer
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Module Settings</CardTitle>
          <CardDescription>Enable or disable system modules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="roomManagement">Room Management</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hotel room booking and management</p>
            </div>
            <Switch
              id="roomManagement"
              checked={settings.modules.roomManagement}
              onCheckedChange={(checked) => 
                updateNestedSetting('modules', { ...settings.modules, roomManagement: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="kdsModule">Kitchen Display System</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Real-time kitchen order display</p>
            </div>
            <Switch
              id="kdsModule"
              checked={settings.modules.kds}
              onCheckedChange={(checked) => 
                updateNestedSetting('modules', { ...settings.modules, kds: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reportsModule">Reports & Analytics</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sales reports and business analytics</p>
            </div>
            <Switch
              id="reportsModule"
              checked={settings.modules.reports}
              onCheckedChange={(checked) => 
                updateNestedSetting('modules', { ...settings.modules, reports: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="darkMode">Dark Mode</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
            </div>
            <Switch
              id="darkMode"
              checked={settings.darkMode}
              onCheckedChange={handleDarkModeChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
