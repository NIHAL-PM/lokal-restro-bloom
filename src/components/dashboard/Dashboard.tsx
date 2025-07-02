
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingCart, 
  ChefHat, 
  Receipt, 
  Table, 
  Bed, 
  Users, 
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { databaseService } from "@/services/databaseService";
import { syncService } from "@/services/syncService";
import { soundService } from "@/services/soundService";
import type { DatabaseSchema, Order, Table as TableType, Room } from "@/services/databaseService";

export function Dashboard() {
  const [data, setData] = useState<DatabaseSchema>(databaseService.getData());
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());

  useEffect(() => {
    const unsubscribeDb = databaseService.subscribe(setData);
    
    const syncInterval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
    }, 5000);

    return () => {
      unsubscribeDb();
      clearInterval(syncInterval);
    };
  }, []);

  // Calculate real-time metrics
  const todayOrders = data.orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const pendingOrders = data.orders.filter(order => order.status === 'pending');
  const readyOrders = data.orders.filter(order => order.status === 'ready');
  const occupiedTables = data.tables.filter(table => table.status === 'occupied');
  const occupiedRooms = data.rooms.filter(room => room.status === 'occupied');
  
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

  // Table occupancy rate
  const tableOccupancyRate = (occupiedTables.length / data.tables.length) * 100;
  const roomOccupancyRate = (occupiedRooms.length / data.rooms.length) * 100;

  const quickActions = [
    {
      title: "New Order",
      description: "Create a new order",
      icon: ShoppingCart,
      action: () => window.location.href = "/orders",
      color: "bg-blue-500"
    },
    {
      title: "Kitchen View",
      description: "Check kitchen orders",
      icon: ChefHat,
      action: () => window.location.href = "/kitchen",
      color: "bg-orange-500",
      badge: pendingOrders.length > 0 ? pendingOrders.length : undefined
    },
    {
      title: "Billing",
      description: "Process payments",
      icon: Receipt,
      action: () => window.location.href = "/billing",
      color: "bg-green-500",
      badge: readyOrders.length > 0 ? readyOrders.length : undefined
    },
    {
      title: "Manage Tables",
      description: "Table management",
      icon: Table,
      action: () => window.location.href = "/tables",
      color: "bg-purple-500"
    }
  ];

  const alerts = [
    ...(pendingOrders.length > 5 ? [{
      type: "warning" as const,
      message: `${pendingOrders.length} orders pending in kitchen`,
      action: () => window.location.href = "/kitchen"
    }] : []),
    ...(readyOrders.length > 3 ? [{
      type: "info" as const,
      message: `${readyOrders.length} orders ready for billing`,
      action: () => window.location.href = "/billing"
    }] : []),
    ...(!syncStatus.online ? [{
      type: "error" as const,
      message: "Sync offline - operating in local mode",
      action: () => {}
    }] : [])
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome to {data.settings.restaurantName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={syncStatus.online ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {syncStatus.online ? "Online" : "Offline"}
          </Badge>
          <Badge variant="outline">
            {syncStatus.devices} devices
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Card key={index} className={`border-l-4 ${
              alert.type === 'error' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10' :
              alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
              'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                  {alert.action && (
                    <Button size="sm" variant="outline" onClick={alert.action}>
                      View
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={action.action}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    {action.badge && (
                      <Badge className="bg-red-500 text-white">{action.badge}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mt-3">{action.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.settings.currency}{todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {todayOrders.length} orders today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.settings.currency}{avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Occupancy</CardTitle>
            <Table className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableOccupancyRate.toFixed(0)}%</div>
            <Progress value={tableOccupancyRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {occupiedTables.length} of {data.tables.length} tables
            </p>
          </CardContent>
        </Card>

        {data.settings.modules.roomManagement && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Room Occupancy</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roomOccupancyRate.toFixed(0)}%</div>
              <Progress value={roomOccupancyRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {occupiedRooms.length} of {data.rooms.length} rooms
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayOrders.slice(-5).reverse().map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {order.tableId ? `Table ${order.tableId}` : order.roomId ? `Room ${order.roomId}` : 'Takeaway'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{data.settings.currency}{order.total}</p>
                    <Badge className={
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {todayOrders.length === 0 && (
                <p className="text-center text-gray-500 py-4">No orders today</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Database</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Sync Service</span>
                <Badge className={syncStatus.online ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {syncStatus.online ? "Connected" : "Offline"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Print Service</span>
                <Badge className={data.settings.printerConfig.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {data.settings.printerConfig.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Sound Notifications</span>
                <Badge className={data.settings.enableSounds ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {data.settings.enableSounds ? "On" : "Off"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Connected Devices</span>
                <Badge variant="outline">{syncStatus.devices}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
