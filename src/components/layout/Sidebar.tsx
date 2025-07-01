
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, 
  ShoppingCart, 
  ChefHat, 
  Receipt, 
  Table, 
  UtensilsCrossed,
  Bed,
  BarChart,
  Settings,
  Users,
  ChevronLeft,
  Store
} from "lucide-react";
import { databaseService } from "@/services/databaseService";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole: string;
}

export function Sidebar({ isOpen, onToggle, userRole }: SidebarProps) {
  const location = useLocation();
  const [data, setData] = useState(databaseService.getData());

  useEffect(() => {
    const unsubscribe = databaseService.subscribe(setData);
    return unsubscribe;
  }, []);

  const pendingOrders = data.orders.filter(order => order.status === 'pending').length;
  const readyOrders = data.orders.filter(order => order.status === 'ready').length;
  const occupiedTables = data.tables.filter(table => table.status === 'occupied').length;
  const occupiedRooms = data.rooms.filter(room => room.status === 'occupied').length;

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
      roles: ['admin', 'waiter', 'chef', 'cashier', 'housekeeping']
    },
    {
      title: "Orders",
      href: "/orders",
      icon: ShoppingCart,
      badge: pendingOrders > 0 ? pendingOrders : undefined,
      roles: ['admin', 'waiter']
    },
    {
      title: "Kitchen Display",
      href: "/kitchen",
      icon: ChefHat,
      badge: pendingOrders > 0 ? pendingOrders : undefined,
      roles: ['admin', 'chef', 'waiter']
    },
    {
      title: "Billing",
      href: "/billing",
      icon: Receipt,
      badge: readyOrders > 0 ? readyOrders : undefined,
      roles: ['admin', 'cashier', 'waiter']
    },
    {
      title: "Tables",
      href: "/tables",
      icon: Table,
      badge: occupiedTables > 0 ? occupiedTables : undefined,
      roles: ['admin', 'waiter', 'cashier']
    },
    {
      title: "Menu",
      href: "/menu",
      icon: UtensilsCrossed,
      roles: ['admin', 'chef']
    },
    {
      title: "Rooms",
      href: "/rooms",
      icon: Bed,
      badge: occupiedRooms > 0 ? occupiedRooms : undefined,
      roles: ['admin', 'housekeeping', 'waiter'],
      hidden: !data.settings.modules.roomManagement
    },
    {
      title: "Reports",
      href: "/reports",
      icon: BarChart,
      roles: ['admin', 'cashier']
    },
    {
      title: "Admin",
      href: "/admin",
      icon: Users,
      roles: ['admin']
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ['admin']
    }
  ];

  const visibleItems = navigationItems.filter(item => 
    !item.hidden && item.roles.includes(userRole)
  );

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-r border-gray-200/50 dark:border-gray-700/50 transition-transform duration-300 ease-in-out shadow-xl",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0",
        "w-64"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg shadow-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                LokalRestro
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">v1.0.0</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {visibleItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive: navIsActive }) => cn(
                  "flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  (navIsActive || isActive(item.href))
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                )}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 768) {
                    onToggle();
                  }
                }}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 shadow-sm">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Offline Mode Ready</span>
            </div>
            <p>LAN Sync Active</p>
          </div>
        </div>
      </div>
    </>
  );
}
