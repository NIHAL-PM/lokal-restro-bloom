
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity,
  Database,
  Wifi,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncService } from "@/services/syncService";
import { backupService } from "@/services/backupService";

export function AdminTools() {
  const { toast } = useToast();
  const [devices, setDevices] = useState(syncService.getConnectedDevices());
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    database: 'online',
    websocket: 'online',
    printer: 'unknown',
    lastBackup: new Date().toISOString()
  });

  useEffect(() => {
    // Load sync logs from localStorage
    const logs = JSON.parse(localStorage.getItem('lokal_sync_logs') || '[]');
    setSyncLogs(logs.slice(-50)); // Show last 50 logs

    // Set up device monitoring
    const interval = setInterval(() => {
      setDevices(syncService.getConnectedDevices());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handlePingAll = () => {
    syncService.pingAllDevices();
    toast({
      title: "Pinging All Devices",
      description: "Testing connectivity to all connected devices...",
    });
  };

  const handleExportLogs = () => {
    const logsData = {
      exportDate: new Date().toISOString(),
      systemStatus,
      connectedDevices: devices,
      syncLogs,
      localStorage: {
        orders: JSON.parse(localStorage.getItem('lokal_orders') || '[]').length,
        menu: JSON.parse(localStorage.getItem('lokal_menu') || '[]').length,
        tables: JSON.parse(localStorage.getItem('lokal_tables') || '[]').length,
        rooms: JSON.parse(localStorage.getItem('lokal_rooms') || '[]').length
      }
    };

    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Logs Exported",
      description: "System logs have been downloaded successfully",
    });
  };

  const handleClearData = (dataType: string) => {
    if (confirm(`Are you sure you want to clear all ${dataType} data? This cannot be undone.`)) {
      localStorage.removeItem(`lokal_${dataType}`);
      toast({
        title: "Data Cleared",
        description: `All ${dataType} data has been cleared`,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Online</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Offline</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Tools</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">System monitoring and administration</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {getStatusBadge(systemStatus.database)}
                <p className="text-xs text-gray-500 mt-2">Local storage active</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">WebSocket</CardTitle>
                <Wifi className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {getStatusBadge(systemStatus.websocket)}
                <p className="text-xs text-gray-500 mt-2">LAN sync enabled</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{devices.filter(d => d.status === 'online').length}</div>
                <p className="text-xs text-gray-500 mt-1">of {devices.length} total</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                <p className="text-xs text-gray-500 mt-2">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handlePingAll} variant="outline">
                    <Wifi className="h-4 w-4 mr-2" />
                    Ping All
                  </Button>
                  <Button onClick={() => backupService.downloadBackup()} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Backup Now
                  </Button>
                  <Button onClick={handleExportLogs} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>Local data storage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Orders</span>
                    <Badge variant="outline">{JSON.parse(localStorage.getItem('lokal_orders') || '[]').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Menu Items</span>
                    <Badge variant="outline">{JSON.parse(localStorage.getItem('lokal_menu') || '[]').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tables</span>
                    <Badge variant="outline">{JSON.parse(localStorage.getItem('lokal_tables') || '[]').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rooms</span>
                    <Badge variant="outline">{JSON.parse(localStorage.getItem('lokal_rooms') || '[]').length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Connected Devices
                <Button onClick={handlePingAll} size="sm" variant="outline">
                  Ping All
                </Button>
              </CardTitle>
              <CardDescription>Monitor all devices connected to the LAN</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{device.ip} • {device.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(device.status)}
                      <div className="text-xs text-gray-500 mt-1">{device.lastSeen}</div>
                      {device.ping && <div className="text-xs text-gray-500">Ping: {device.ping}ms</div>}
                    </div>
                  </div>
                ))}
                
                {devices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No devices connected. Check your WebSocket server configuration.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Sync Logs
                <Button onClick={handleExportLogs} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
              <CardDescription>Real-time sync activity and errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {syncLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-2 text-sm border-b">
                    <div className="flex items-center space-x-2">
                      {log.type === 'error' ? 
                        <AlertTriangle className="h-4 w-4 text-red-500" /> : 
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      }
                      <span>{log.message}</span>
                    </div>
                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
                
                {syncLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No sync logs available. Logs will appear here as sync events occur.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions that affect system data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900">Clear All Orders</h4>
                    <p className="text-sm text-red-600">Remove all order history and data</p>
                  </div>
                  <Button onClick={() => handleClearData('orders')} variant="destructive" size="sm">
                    Clear Orders
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900">Clear Menu Data</h4>
                    <p className="text-sm text-red-600">Remove all menu items and categories</p>
                  </div>
                  <Button onClick={() => handleClearData('menu')} variant="destructive" size="sm">
                    Clear Menu
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900">Reset All Settings</h4>
                    <p className="text-sm text-red-600">Restore default configuration</p>
                  </div>
                  <Button onClick={() => handleClearData('settings')} variant="destructive" size="sm">
                    Reset Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
