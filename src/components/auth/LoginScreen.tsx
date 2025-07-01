
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { databaseService } from "@/services/databaseService";
import { Restaurant, Lock, User, Wifi, WifiOff } from "lucide-react";
import { syncService } from "@/services/syncService";

interface LoginScreenProps {
  onLogin: (user: { id: string; name: string; role: string }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());

  const data = databaseService.getData();
  const users = data.users.filter(user => user.active);

  // Update sync status periodically
  useState(() => {
    const interval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
    }, 1000);
    return () => clearInterval(interval);
  });

  const handleLogin = async () => {
    if (!selectedUser || !pin) {
      toast({
        title: "Missing Information",
        description: "Please select a user and enter PIN",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = users.find(u => u.id === selectedUser);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.pin !== pin) {
        throw new Error("Invalid PIN");
      }

      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
      });

      onLogin(user);

    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'waiter': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'chef': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'cashier': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'housekeeping': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 rounded-full">
              <Restaurant className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">LokalRestro</h1>
          <p className="text-gray-500 dark:text-gray-400">Restaurant & Hotel Management System</p>
        </div>

        {/* Sync Status */}
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {syncStatus.online ? (
                  <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span className="text-sm font-medium">
                  {syncStatus.online ? 'Connected' : 'Offline Mode'}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {syncStatus.method} • {syncStatus.devices} devices
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card className="border-0 shadow-xl dark:bg-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center">
              <Lock className="h-5 w-5 mr-2" />
              Staff Login
            </CardTitle>
            <CardDescription>Select your profile and enter your PIN to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your profile" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {user.name}
                        </div>
                        <Badge className={getRoleColor(user.role)} variant="outline">
                          {user.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>PIN</Label>
              <Input
                type="password"
                placeholder="Enter your 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={4}
              />
            </div>

            <Button 
              onClick={handleLogin}
              disabled={isLoading || !selectedUser || !pin}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </CardContent>
        </Card>

        {/* Demo Users */}
        <Card className="border border-dashed border-gray-300 dark:border-gray-600 dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="text-sm">Demo Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.slice(0, 3).map((user) => (
              <div key={user.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-2" />
                  {user.name}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRoleColor(user.role)} variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                  <span className="text-gray-500 dark:text-gray-400">PIN: {user.pin}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Offline-first • LAN Synced • Secure</p>
          <p className="mt-1">© 2025 LokalRestro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
