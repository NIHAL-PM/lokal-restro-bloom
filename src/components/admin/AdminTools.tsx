
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Server, 
  Printer, 
  Download, 
  Upload, 
  MonitorCheck,
  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncService, ConnectedDevice } from "@/services/syncService";
import { printerService } from "@/services/printerService";
import { backupService, BackupData } from "@/services/backupService";
import { databaseService } from "@/services/databaseService";

export function AdminTools() {
  const { toast } = useToast();
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupData | null>(null);
  const [systemStats, setSystemStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeDevices: 0,
    uptime: '0h 0m'
  });

  useEffect(() => {
    const updateDevices = () => {
      setConnectedDevices(syncService.getConnectedDevices());
    };

    const updateStats = () => {
      const data = databaseService.getData();
      const totalRevenue = data.transactions.reduce((sum, txn) => sum + txn.amount, 0);
      
      setSystemStats({
        totalOrders: data.orders.length,
        totalRevenue,
        activeDevices: connectedDevices.length,
        uptime: getUptime()
      });
    };

    const updateLogs = () => {
      const data = databaseService.getData();
      setSyncLogs(data.syncLog.slice(-50).reverse());
    };

    const interval = setInterval(() => {
      updateDevices();
      updateStats();
      updateLogs();
    }, 5000);

    updateDevices();
    updateStats();
    updateLogs();

    return () => clearInterval(interval);
  }, [connectedDevices.length]);

  useEffect(() => {
    const pending = backupService.getPendingRestore();
    setPendingRestore(pending);
  }, []);

  const getUptime = () => {
    const startTime = localStorage.getItem('lokal_start_time');
    if (!startTime) {
      localStorage.setItem('lokal_start_time', Date.now().toString());
      return '0h 0m';
    }
    
    const uptime = Date.now() - parseInt(startTime);
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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

  const handlePingAllDevices = () => {
    syncService.pingAllDevices();
    toast({
      title: "Ping Sent",
      description: "Pinging all devices on the network",
    });
  };

  const handleBackupNow = async () => {
    try {
      await backupService.downloadBackup();
      toast({
        title: "Backup Created",
        description: "System backup downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleRestoreFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await backupService.restoreBackup(file);
      const pending = backupService.getPendingRestore();
      setPendingRestore(pending);
      setShowRestoreDialog(true);
    } catch (error) {
      toast({
        title: "Invalid Backup File",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleConfirmRestore = async () => {
    try {
      await backupService.confirmRestore();
      setPendingRestore(null);
      setShowRestoreDialog(false);
      
      toast({
        title: "Restore Completed",
        description: "System restored successfully. Refreshing...",
      });
      
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleCancelRestore = () => {
    backupService.cancelRestore();
    setPendingRestore(null);
    setShowRestoreDialog(false);
  };

  const getDeviceStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'sync': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'conflict': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Tools</h1>
        <p className="text-gray-500 mt-1">System monitoring and maintenance tools</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{systemStats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wifi className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.activeDevices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.uptime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MonitorCheck className="h-5 w-5 mr-2 text-blue-600" />
              System Actions
            </CardTitle>
            <CardDescription>Critical system maintenance and testing tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleTestPrinter}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Test Printer
              </Button>
              
              <Button 
                onClick={handlePingAllDevices}
                variant="outline"
                className="border-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Ping All Devices
              </Button>
              
              <Button 
                onClick={handleBackupNow}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Backup Now
              </Button>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  style={{ display: 'none' }}
                  id="restore-file"
                />
                <Button 
                  variant="outline"
                  className="w-full border-2"
                  onClick={() => document.getElementById('restore-file')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Backup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected Devices */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="h-5 w-5 mr-2 text-purple-600" />
              Connected Devices
            </CardTitle>
            <CardDescription>Real-time LAN device monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {connectedDevices.length > 0 ? (
                  connectedDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{device.name}</p>
                        <p className="text-sm text-gray-500">{device.ip} • {device.role}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getDeviceStatusColor(device.status)}>
                          {device.status}
                        </Badge>
                        {device.ping && (
                          <p className="text-xs text-gray-500 mt-1">{device.ping}ms</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No devices connected</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Sync Logs */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2 text-green-600" />
            Sync Logs
          </CardTitle>
          <CardDescription>Recent synchronization activity and errors</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {syncLogs.length > 0 ? (
                syncLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {log.type === 'error' ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{log.message}</p>
                        <p className="text-xs text-gray-500">Device: {log.deviceId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getLogTypeColor(log.type)}>
                        {log.type}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No sync activity yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm System Restore</DialogTitle>
            <DialogDescription>
              This will replace all current data with the backup. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {pendingRestore && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Backup Information</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>Restaurant: {pendingRestore.metadata.restaurantName}</p>
                  <p>Backup Date: {new Date(pendingRestore.timestamp).toLocaleString()}</p>
                  <p>Orders: {pendingRestore.orders.length}</p>
                  <p>Menu Items: {pendingRestore.menu.length}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelRestore}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmRestore}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirm Restore
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
