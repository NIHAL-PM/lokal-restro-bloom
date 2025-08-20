import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Tablet, Monitor, Wifi, WifiOff } from "lucide-react";
import { syncService } from "@/services/syncService";

interface Device {
  id: string;
  name: string;
  type: string;
  role: string;
  status: 'online' | 'offline';
  ip?: string;
  lastSeen: string;
  ping?: number;
}

export function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());

  useEffect(() => {
    // Initialize current device info
    setCurrentDevice({
      id: syncService.getDeviceId(),
      name: localStorage.getItem('lokalrestro_device_name') || 'This Device',
      type: getDeviceType(),
      role: getDeviceRole(),
      status: 'online',
      lastSeen: new Date().toISOString()
    });

    // Update devices list
    const updateDevices = () => {
      setDevices(syncService.getConnectedDevices());
      setSyncStatus(syncService.getSyncStatus());
    };

    updateDevices();
    const interval = setInterval(updateDevices, 5000);

    // Listen for sync updates
    const unsubscribe = syncService.onSync((data) => {
      if (data.type === 'device_update') {
        updateDevices();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.screen.width;
    
    if (/android/i.test(userAgent)) {
      return width < 600 ? 'Android Phone' : 'Android Tablet';
    }
    if (/iphone/i.test(userAgent)) return 'iPhone';
    if (/ipad/i.test(userAgent)) return 'iPad';
    if (/windows/i.test(userAgent)) return 'Windows PC';
    if (/mac/i.test(userAgent)) return 'Mac';
    
    return width < 600 ? 'Mobile' : width < 1024 ? 'Tablet' : 'Desktop';
  };

  const getDeviceRole = () => {
    const path = window.location.pathname;
    const stored = localStorage.getItem('lokalrestro_device_role');
    
    if (stored) return stored;
    if (path.includes('/kitchen')) return 'KDS';
    if (path.includes('/billing')) return 'POS';
    if (path.includes('/orders')) return 'Waiter';
    if (path.includes('/admin')) return 'Admin';
    
    return 'General';
  };

  const getDeviceIcon = (type: string) => {
    if (type.includes('Phone') || type.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (type.includes('Tablet') || type.includes('iPad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'kds': return 'bg-orange-500';
      case 'pos': return 'bg-green-500';
      case 'waiter': return 'bg-blue-500';
      case 'admin': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const setDeviceName = () => {
    const name = prompt('Enter device name:', currentDevice?.name || '');
    if (name && name.trim()) {
      localStorage.setItem('lokalrestro_device_name', name.trim());
      if (currentDevice) {
        setCurrentDevice({ ...currentDevice, name: name.trim() });
      }
    }
  };

  const setDeviceRole = () => {
    const roles = ['KDS', 'POS', 'Waiter', 'Admin', 'General'];
    const roleIndex = prompt(
      `Select role:\n${roles.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
      '1'
    );
    
    const index = parseInt(roleIndex || '1') - 1;
    if (index >= 0 && index < roles.length) {
      const role = roles[index];
      localStorage.setItem('lokalrestro_device_role', role);
      if (currentDevice) {
        setCurrentDevice({ ...currentDevice, role });
      }
    }
  };

  const pingDevice = async (device: Device) => {
    try {
      const ping = await syncService.pingDevice(device.id);
      setDevices(devices.map(d => 
        d.id === device.id ? { ...d, ping } : d
      ));
    } catch (error) {
      console.error('Ping failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {syncStatus.online ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Sync Status
          </CardTitle>
          <CardDescription>
            Real-time device synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge variant={syncStatus.online ? "default" : "destructive"}>
                {syncStatus.online ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Method</p>
              <Badge variant="outline">{syncStatus.method}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Connected Devices</p>
              <Badge variant="secondary">{syncStatus.devices} devices</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Device ID</p>
              <Badge variant="outline" className="text-xs">
                {syncService.getDeviceId().slice(-8)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Device */}
      {currentDevice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getDeviceIcon(currentDevice.type)}
              This Device
            </CardTitle>
            <CardDescription>Configure this device settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{currentDevice.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground">{currentDevice.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <Badge className={getRoleColor(currentDevice.role)}>
                    {currentDevice.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant="default">Online</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={setDeviceName}>
                  Change Name
                </Button>
                <Button variant="outline" size="sm" onClick={setDeviceRole}>
                  Change Role
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>
            {devices.length} devices connected to the network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other devices connected
            </p>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(device.type)}
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.type} • {device.ip || 'IP unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(device.role)}>
                      {device.role}
                    </Badge>
                    <Badge 
                      variant={device.status === 'online' ? 'default' : 'secondary'}
                    >
                      {device.status}
                    </Badge>
                    {device.ping && (
                      <Badge variant="outline" className="text-xs">
                        {device.ping}ms
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pingDevice(device)}
                    >
                      Ping
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DeviceManager;