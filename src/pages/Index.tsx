
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { OrderManagement } from "@/components/orders/OrderManagement";
import { KitchenDisplay } from "@/components/kitchen/KitchenDisplay";
import { BillingSystem } from "@/components/billing/BillingSystem";
import { TableManagement } from "@/components/tables/TableManagement";
import { MenuManagement } from "@/components/menu/MenuManagement";
import { RoomManagement } from "@/components/rooms/RoomManagement";
import { Reports } from "@/components/reports/Reports";
import { Settings } from "@/components/settings/Settings";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentUser, setCurrentUser] = useLocalStorage("lokal_user", null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  // Play notification sound
  const playNotificationSound = (type: string) => {
    const audio = new Audio();
    switch (type) {
      case "order":
        audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D2u2YfCDWH0fPTgjMGJm7A7+OZRQ0PVqzn77BdGAg8k9r1unAjBSt+zPLaizsIGGS57OGYTgwOUarm7bllHgg2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd9bxpIAUrgMzx4X44ByRjuuvllU0NDVOn5O+zYBoGPIzU8tGAKwUme8PwzoI2Bhxqtu7mnEoODlaq4u6zYRsGOpPY9duLLgUreMPu3ZQ+CRZiturqklELDU2k4/CwZh0GOYzS8tOCMAUlecXu2Yk6CBRjtezomkwODlOo5e2wYh0GOY/W9NyKKwUqdsLu25M9CRdhtunnlU8MDUyj4O+yYx0FOpHS89GAMgUldsbu2ok5CBdjtOvmm0oODVKn5OyyYh4FOpDU8tyKLQUrd8Hu2ZM+CRVftuvonE4ODU+j4PCxZR4FOpDU9NuJLAUqd8Lu2pQ9CRZetuzom0wODVCj4O+wZh4HOpDS89qJLgUqeMDu2ZQ/CBVetOnonU4ODU6k4PCwZB8GOpDU89qJLwUpd8Du25Y8CRpbuevmnk4ODV2k4++wYx4IPY7U89yLKgUrdsHu2pU9CBZgtOzon04ODU2j4O+wZB8GO5DT8t2LKQYKUB5x";
        break;
      case "ready":
        audio.src = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vDwAAiI+NioyKjIiIiI";
        break;
      default:
        return;
    }
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Fail silently if audio can't play
  };

  useEffect(() => {
    // Setup global audio notifications
    window.playLokalSound = playNotificationSound;
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoginScreen onLogin={setCurrentUser} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userRole={currentUser.role}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={currentUser} 
          onLogout={() => setCurrentUser(null)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/kitchen" element={<KitchenDisplay />} />
            <Route path="/billing" element={<BillingSystem />} />
            <Route path="/tables" element={<TableManagement />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/rooms" element={<RoomManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Index;
