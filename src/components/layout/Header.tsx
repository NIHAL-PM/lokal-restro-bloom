
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, User, LogOut, Settings, Wifi, WifiOff } from "lucide-react";
import { syncService } from "@/services/syncService";
import { databaseService } from "@/services/databaseService";

interface HeaderProps {
  user: { id: string; name: string; role: string };
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function Header({ user, onLogout, onToggleSidebar }: HeaderProps) {
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());
  const data = databaseService.getData();
  
  // Update sync status periodically
  useState(() => {
    const interval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
    }, 2000);
    return () => clearInterval(interval);
  });

  const pendingOrders = data.orders.filter(order => order.status === 'pending').length;
  const readyOrders = data.orders.filter(order => order.status === 'ready').length;

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
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {data.settings.restaurantName}
            </h2>
            
            <div className="flex items-center space-x-2">
              {syncStatus.online ? (
                <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {syncStatus.method} • {syncStatus.devices} devices
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {(pendingOrders > 0 || readyOrders > 0) && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                  {pendingOrders + readyOrders}
                </Badge>
              )}
            </Button>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                  <Badge className={getRoleColor(user.role)} variant="outline">
                    {user.role}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
