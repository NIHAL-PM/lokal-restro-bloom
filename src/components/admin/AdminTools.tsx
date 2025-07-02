
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Database, 
  Download, 
  Upload,
  RefreshCw,
  Settings,
  Shield,
  Activity,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { databaseService } from "@/services/databaseService";
import { exportBackupAPI, importBackupAPI } from '@/services/api';
import { getUsersAPI, createUserAPI, updateUserAPI, deleteUserAPI } from '@/services/api';
import { getAll, putItem, deleteItem } from '@/services/indexedDb';
import { syncService } from "@/services/syncService";
import { soundService } from "@/services/soundService";
import type { User, DatabaseSchema } from "@/services/databaseService";

export function AdminTools() {
  const { toast } = useToast();
  const [data, setData] = useState<DatabaseSchema>(databaseService.getData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    role: "waiter" as User['role'],
    pin: "",
    active: true
  });
  const [backupData, setBackupData] = useState("");
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());
  const [connectedDevices, setConnectedDevices] = useState(syncService.getConnectedDevices());

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        // Try backend first
        const users = await getUsersAPI();
        setData(prev => ({ ...prev, users }));
      } catch (err) {
        // Fallback to IndexedDB
        try {
          const users = await getAll('users');
          setData(prev => ({ ...prev, users }));
        } catch (e) {
          setError('Failed to load users.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();

    const statusInterval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
      setConnectedDevices(syncService.getConnectedDevices());
    }, 5000);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.pin) {
      toast({
        title: "Incomplete Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check if PIN already exists
    const existingUser = data.users.find(u => u.pin === newUser.pin);
    if (existingUser) {
      toast({
        title: "PIN Already Exists",
        description: "Please choose a different PIN",
        variant: "destructive"
      });
      return;
    }

    const user: Omit<User, 'id'> = {
      name: newUser.name,
      role: newUser.role,
      pin: newUser.pin,
      active: newUser.active
    };

    try {
      // Backend
      const created = await createUserAPI(user);
      // IndexedDB
      await putItem('users', created);
      setData(prev => ({ ...prev, users: [...prev.users, created] }));
      setNewUser({ name: "", role: "waiter", pin: "", active: true });
      setShowAddUserDialog(false);
      toast({
        title: "User Added",
        description: `${created.name} has been added as ${created.role}`,
      });
      soundService.playSound('success');
    } catch (e) {
      toast({
        title: "User Add Failed",
        description: "Could not add user. Please try again.",
        variant: "destructive"
      });
      soundService.playSound('error');
    }
  };

  const handleEditUser = async (user: User) => {
    if (!user.name || !user.pin) {
      toast({
        title: "Incomplete Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check if PIN already exists for other users
    const existingUser = data.users.find(u => u.pin === user.pin && u.id !== user.id);
    if (existingUser) {
      toast({
        title: "PIN Already Exists",
        description: "Please choose a different PIN",
        variant: "destructive"
      });
      return;
    }

    try {
      // Backend
      await updateUserAPI(user.id, user);
      // IndexedDB
      await putItem('users', user);
      setData(prev => ({ ...prev, users: prev.users.map(u => u.id === user.id ? user : u) }));
      setEditingUser(null);
      toast({
        title: "User Updated",
        description: `${user.name} has been updated`,
      });
      soundService.playSound('success');
    } catch (e) {
      toast({
        title: "User Update Failed",
        description: "Could not update user. Please try again.",
        variant: "destructive"
      });
      soundService.playSound('error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = data.users.find(u => u.id === userId);
    try {
      // Backend
      await deleteUserAPI(userId);
      // IndexedDB
      await deleteItem('users', userId);
      setData(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId) }));
      toast({
        title: "User Deleted",
        description: `${user?.name} has been removed`,
      });
      soundService.playSound('success');
    } catch (e) {
      toast({
        title: "User Delete Failed",
        description: "Could not delete user. Please try again.",
        variant: "destructive"
      });
      soundService.playSound('error');
    }
  };

  const exportBackup = async () => {
    try {
      // Try backend first
      const backupData = await exportBackupAPI();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lokalrestro-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Backup Created",
        description: "Database backup has been downloaded",
      });
      soundService.playSound('success');
    } catch (error) {
      // Fallback to local export
      try {
        const backupData = databaseService.exportData();
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lokalrestro-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast({
          title: "Backup Created (Local)",
          description: "Database backup has been downloaded from local storage",
        });
        soundService.playSound('success');
      } catch (e) {
        toast({
          title: "Backup Failed",
          description: "Failed to create backup",
          variant: "destructive"
        });
        soundService.playSound('error');
      }
    }
  };

  const importBackup = async () => {
    if (!backupData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste backup data",
        variant: "destructive"
      });
      return;
    }

    try {
      // Try backend first
      await importBackupAPI(backupData);
      setBackupData("");
      setShowBackupDialog(false);
      syncService.broadcast({
        type: 'system',
        action: 'restore',
        data: { timestamp: Date.now() },
        timestamp: Date.now(),
        deviceId: syncService.getDeviceId()
      });
      toast({
        title: "Backup Restored",
        description: "Database has been restored successfully",
      });
      soundService.playSound('success');
    } catch (error) {
      // Fallback to local import
      try {
        databaseService.importData(backupData);
        setBackupData("");
        setShowBackupDialog(false);
        syncService.broadcast({
          type: 'system',
          action: 'restore',
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
          deviceId: syncService.getDeviceId()
        });
        toast({
          title: "Backup Restored (Local)",
          description: "Database has been restored from local storage",
        });
        soundService.playSound('success');
      } catch (e) {
        toast({
          title: "Restore Failed",
          description: "Failed to restore backup: " + (e as Error).message,
          variant: "destructive"
        });
        soundService.playSound('error');
      }
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setBackupData(content);
    };
    reader.readAsText(file);
  };

  const resetSystem = () => {
    if (confirm('Are you sure you want to reset the entire system? This will delete all data!')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const forceSync = async () => {
    try {
      await syncService.pingAllDevices();
      
      // Broadcast full data sync
      syncService.broadcast({
        type: 'system',
        action: 'full-sync',
        data: databaseService.getData(),
        timestamp: Date.now(),
        deviceId: syncService.getDeviceId()
      });

      toast({
        title: "Sync Initiated",
        description: "Full system sync has been triggered",
      });

      soundService.playSound('success');
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to initiate sync",
        variant: "destructive"
      });
      soundService.playSound('error');
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'chef': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'waiter': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cashier': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'housekeeping': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStorageInfo = () => {
    try {
      const data = localStorage.getItem('lokalrestro_data');
      const sizeInBytes = new Blob([data || '']).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      return { size: sizeInKB, orders: JSON.parse(data || '{}').orders?.length || 0 };
    } catch {
      return { size: '0', orders: 0 };
    }
  };

  const storageInfo = getStorageInfo();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Tools</h1>
          <p className="text-gray-500 dark:text-gray-400">
            System administration and management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={syncStatus.online ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {syncStatus.online ? "Online" : "Offline"}
          </Badge>
          <Button variant="outline" onClick={forceSync}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Sync
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">User Management</h2>
            <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <Label>Role *</Label>
                    <Select value={newUser.role} onValueChange={(value: User['role']) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="waiter">Waiter</SelectItem>
                        <SelectItem value="chef">Chef</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>PIN Code *</Label>
                    <Input
                      type="password"
                      value={newUser.pin}
                      onChange={(e) => setNewUser(prev => ({ ...prev, pin: e.target.value }))}
                      placeholder="4-digit PIN"
                      maxLength={4}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Active User</Label>
                    <Switch
                      checked={newUser.active}
                      onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, active: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser}>
                    Add User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.users.map((user) => (
              <Card key={user.id} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      {user.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge className={user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {user.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">PIN: •••{user.pin.slice(-1)}</p>
                    <p className="text-sm text-gray-500">Role: {user.role}</p>
                    <div className="flex justify-between pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Edit User Dialog */}
          {editingUser && (
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>Update user information</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={editingUser.name}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <Label>Role *</Label>
                    <Select value={editingUser.role} onValueChange={(value: User['role']) => setEditingUser(prev => prev ? { ...prev, role: value } : null)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="waiter">Waiter</SelectItem>
                        <SelectItem value="chef">Chef</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>PIN Code *</Label>
                    <Input
                      type="password"
                      value={editingUser.pin}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, pin: e.target.value } : null)}
                      placeholder="4-digit PIN"
                      maxLength={4}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Active User</Label>
                    <Switch
                      checked={editingUser.active}
                      onCheckedChange={(checked) => setEditingUser(prev => prev ? { ...prev, active: checked } : null)}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => editingUser && handleEditUser(editingUser)}>
                    Update User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storageInfo.size} KB</div>
                <p className="text-xs text-muted-foreground">
                  {storageInfo.orders} orders stored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.users.filter(u => u.active).length}</div>
                <p className="text-xs text-muted-foreground">
                  of {data.users.length} total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sync</span>
                    <Badge className={syncStatus.online ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {syncStatus.online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sounds</span>
                    <Badge className={data.settings.enableSounds ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {data.settings.enableSounds ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Printer</span>
                    <Badge className={data.settings.printerConfig.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {data.settings.printerConfig.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                System Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => soundService.playTestSound()}>
                  Test Sound System
                </Button>
                <Button variant="outline" onClick={forceSync}>
                  Force Full Sync
                </Button>
                <Button variant="destructive" onClick={resetSystem}>
                  Reset System
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Export Backup
                </CardTitle>
                <CardDescription>Download a complete backup of your data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportBackup} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Import Backup
                </CardTitle>
                <CardDescription>Restore data from a backup file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                />
                <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Import from Text
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Import Backup Data</DialogTitle>
                      <DialogDescription>Paste your backup data below</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <Textarea
                        value={backupData}
                        onChange={(e) => setBackupData(e.target.value)}
                        placeholder="Paste backup JSON data here..."
                        rows={10}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={importBackup}>
                        Import Backup
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Sync Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Connection Status:</span>
                    <Badge className={syncStatus.online ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {syncStatus.online ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sync Method:</span>
                    <Badge variant="outline">{syncStatus.method}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Device ID:</span>
                    <Badge variant="outline">{syncService.getDeviceId().slice(-8)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Connected Devices:</span>
                    <Badge variant="outline">{syncStatus.devices}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2" />
                  Connected Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connectedDevices.length > 0 ? (
                    connectedDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-gray-500">{device.ip} - {device.role}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {device.ping && (
                            <Badge variant="outline">{device.ping.toFixed(0)}ms</Badge>
                          )}
                          <Badge className={device.status === 'online' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {device.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No devices connected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
