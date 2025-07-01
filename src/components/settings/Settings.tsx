import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
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
    const unsubscribe = databaseService.subscribe(setData);
    setSettings(data.settings);
    return unsubscribe;
  }, [setData]);

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

  const updateNestedSetting = (key: string, value: any) => {
    const updatedSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(updatedSettings);
    databaseService.updateSettings(updatedSettings);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      updateNestedSetting('logo', URL.createObjectURL(file));
    }
  };

  const handleRestaurantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNestedSetting('restaurantName', e.target.value);
  };

  const handlePrimaryColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNestedSetting('primaryColor', e.target.value);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNestedSetting('currency', e.target.value);
  };

  const handleTaxRateChange = (value: number[]) => {
    updateNestedSetting('taxRate', value[0]);
  };

  const handleServiceChargeRateChange = (value: number[]) => {
    updateNestedSetting('serviceChargeRate', value[0]);
  };

  const handleEnableSoundsChange = (checked: boolean) => {
    updateNestedSetting('enableSounds', checked);
    soundService.updateSettings();
  };

  const handleSoundVolumeChange = (value: number[]) => {
    updateNestedSetting('soundVolume', value[0]);
    soundService.updateSettings();
  };

  const handlePrinterIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNestedSetting('printerConfig', { ...settings.printerConfig, ip: e.target.value });
  };

  const handlePrinterPortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNestedSetting('printerConfig', { ...settings.printerConfig, port: e.target.value });
  };

  const handlePrinterEnabledChange = (checked: boolean) => {
    updateNestedSetting('printerConfig', { ...settings.printerConfig, enabled: checked });
  };

  const handleRoomManagementChange = (checked: boolean) => {
    updateNestedSetting('modules', { ...settings.modules, roomManagement: checked });
  };

  const handleKDSModuleChange = (checked: boolean) => {
    updateNestedSetting('modules', { ...settings.modules, kds: checked });
  };

  const handleReportsModuleChange = (checked: boolean) => {
    updateNestedSetting('modules', { ...settings.modules, reports: checked });
  };

  const handleDarkModeChange = (checked: boolean) => {
    updateNestedSetting('darkMode', checked);
    document.documentElement.classList.toggle('dark', checked);
  };

  const handleTestPrinter = async () => {
    const testReceipt: Receipt = {
      header: {
        restaurantName: settings.restaurantName,
        address: '123 Restaurant Street, City',
        phone: '+91 98765 43210'
      },
      order: {
        id: 'TEST-001',
        table: 'T1',
        waiter: 'Test User',
        timestamp: new Date().toISOString()
      },
      items: [
        { name: 'Butter Chicken', quantity: 1, price: 350, total: 350 },
        { name: 'Naan Bread', quantity: 2, price: 45, total: 90 },
        { name: 'Lassi', quantity: 1, price: 80, total: 80 }
      ],
      totals: {
        subtotal: 520,
        tax: 93.60,
        serviceCharge: 52,
        discount: 0,
        total: 665.60
      },
      payment: {
        method: 'Cash',
        amount: 700,
        change: 34.40
      },
      footer: 'Thank you for dining with us!\nVisit again soon!'
    };

    const success = await printerService.printReceipt(testReceipt);
    
    toast({
      title: success ? "Test Print Successful" : "Test Print Failed",
      description: success 
        ? "Test receipt sent to printer successfully" 
        : "Failed to connect to printer. Check printer configuration.",
      variant: success ? "default" : "destructive"
    });
  };

  return (
    <div className="space-y-6">
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
              onChange={handleRestaurantNameChange}
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
                {logoFile ? 'Change Logo' : 'Upload Logo'}
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
              onChange={handlePrimaryColorChange}
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={settings.currency}
              onChange={handleCurrencyChange}
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
              defaultValue={[settings.taxRate]}
              max={30}
              step={0.5}
              onValueChange={handleTaxRateChange}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current Tax Rate: {settings.taxRate}%
            </p>
          </div>
          <div>
            <Label htmlFor="serviceChargeRate">Service Charge Rate (%)</Label>
            <Slider
              id="serviceChargeRate"
              defaultValue={[settings.serviceChargeRate]}
              max={20}
              step={0.5}
              onValueChange={handleServiceChargeRateChange}
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
          <CardDescription>Enable or disable sound notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableSounds">Enable Sounds</Label>
            <Switch
              id="enableSounds"
              checked={settings.enableSounds}
              onCheckedChange={handleEnableSoundsChange}
            />
          </div>
          <div>
            <Label htmlFor="soundVolume">Sound Volume</Label>
            <Slider
              id="soundVolume"
              defaultValue={[settings.soundVolume]}
              max={100}
              step={1}
              onValueChange={handleSoundVolumeChange}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current Volume: {settings.soundVolume}%
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Printer Settings</CardTitle>
          <CardDescription>Configure your thermal printer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="printerEnabled">Printer Enabled</Label>
            <Switch
              id="printerEnabled"
              checked={settings.printerConfig.enabled}
              onCheckedChange={handlePrinterEnabledChange}
            />
          </div>
          <div>
            <Label htmlFor="printerIp">Printer IP Address</Label>
            <Input
              id="printerIp"
              value={settings.printerConfig.ip}
              onChange={(e) => handlePrinterIpChange(e)}
            />
          </div>
          <div>
            <Label htmlFor="printerPort">Printer Port</Label>
            <Input
              id="printerPort"
              value={settings.printerConfig.port}
              onChange={handlePrinterPortChange}
            />
          </div>
          <Button onClick={handleTestPrinter}>Test Printer</Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Module Settings</CardTitle>
          <CardDescription>Enable or disable modules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="roomManagement">Room Management</Label>
            <Switch
              id="roomManagement"
              checked={settings.modules.roomManagement}
              onCheckedChange={handleRoomManagementChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="kdsModule">Kitchen Display System (KDS)</Label>
            <Switch
              id="kdsModule"
              checked={settings.modules.kds}
              onCheckedChange={handleKDSModuleChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="reportsModule">Reports Module</Label>
            <Switch
              id="reportsModule"
              checked={settings.modules.reports}
              onCheckedChange={handleReportsModuleChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="darkMode">Dark Mode</Label>
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
