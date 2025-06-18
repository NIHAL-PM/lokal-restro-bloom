
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  House, 
  Plus, 
  Printer, 
  Table, 
  Menu, 
  Bed, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { databaseService } from "@/services/databaseService";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole: string;
}

export function Sidebar({ isOpen, onToggle, userRole }: SidebarProps) {
  const location = useLocation();
  const [settings, setSettings] = useState(databaseService.getData().settings);

  useEffect(() => {
    const unsubscribe = databaseService.subscribe((data) => {
      setSettings(data.settings);
    });
    return unsubscribe;
  }, []);

  const menuItems = [
    { icon: House, label: "Dashboard", path: "/", roles: ["admin", "waiter", "cashier"] },
    { icon: Plus, label: "Orders", path: "/orders", roles: ["admin", "waiter"] },
    { icon: Printer, label: "Kitchen", path: "/kitchen", roles: ["admin", "chef"], enabled: settings.modules.kds },
    { icon: FileText, label: "Billing", path: "/billing", roles: ["admin", "cashier"] },
    { icon: Table, label: "Tables", path: "/tables", roles: ["admin", "waiter"] },
    { icon: Menu, label: "Menu", path: "/menu", roles: ["admin"] },
    { icon: Bed, label: "Rooms", path: "/rooms", roles: ["admin", "waiter", "housekeeping"], enabled: settings.modules.roomManagement },
    { icon: FileText, label: "Reports", path: "/reports", roles: ["admin", "cashier"], enabled: settings.modules.reports },
    { icon: Shield, label: "Admin Tools", path: "/admin", roles: ["admin"] },
    { icon: Settings, label: "Settings", path: "/settings", roles: ["admin"] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(userRole.toLowerCase()) && (item.enabled !== false)
  );

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {isOpen && (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.primaryColor}CC)` }}
                >
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo" className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-white font-bold text-sm">LR</span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{settings.restaurantName}</h1>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-2"
            >
              {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all duration-200",
                    isActive 
                      ? "text-white hover:opacity-90 shadow-md" 
                      : "text-gray-700 hover:bg-gray-100",
                    !isOpen && "px-2"
                  )}
                  style={isActive ? { backgroundColor: settings.primaryColor } : {}}
                >
                  <item.icon className={cn("h-5 w-5", isOpen && "mr-3")} />
                  {isOpen && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            {isOpen && <span>Online • LAN Sync Active</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
