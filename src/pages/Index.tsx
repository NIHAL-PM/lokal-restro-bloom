
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
import { AdminTools } from "@/components/admin/AdminTools";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { soundService } from "@/services/soundService";
import { syncService } from "@/services/syncService";
import { databaseService } from "@/services/databaseService";

const Index = () => {
  const [currentUser, setCurrentUser] = useLocalStorage("lokal_user", null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize services
    soundService.updateSettings();
    
    // Setup sync listeners
    const unsubscribeSync = syncService.onSync((syncData) => {
      // Handle incoming sync data
      console.log('Received sync:', syncData);
      
      if (syncData.type === 'order' && syncData.action === 'create') {
        soundService.playNewOrderChime();
        toast({
          title: "New Order Received",
          description: `Order ${syncData.data.id} has been created`,
        });
      }
    });

    // Setup global sound function
    window.playLokalSound = (type: string) => {
      switch (type) {
        case 'order':
          soundService.playNewOrderChime();
          break;
        case 'ready':
          soundService.playOrderReadyChime();
          break;
        case 'billing':
          soundService.playBillPrintChime();
          break;
        case 'checkin':
          soundService.playCheckinChime();
          break;
        case 'checkout':
          soundService.playCheckoutChime();
          break;
      }
    };

    return () => {
      unsubscribeSync();
      syncService.disconnect();
    };
  }, [toast]);

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
            <Route path="/admin" element={<AdminTools />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Index;
