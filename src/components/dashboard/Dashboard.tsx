
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  Table,
  Bed,
  ChefHat,
  AlertCircle,
  Plus
} from "lucide-react";
import { useEffect, useState } from "react";

export function Dashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 15420,
    activeOrders: 12,
    occupiedTables: 8,
    occupiedRooms: 14,
    pendingKitchen: 5,
    totalGuests: 34
  });

  const [recentOrders] = useState([
    { id: "ORD-001", table: "T5", items: 3, amount: 450, status: "preparing", time: "2 min ago" },
    { id: "ORD-002", room: "R101", items: 2, amount: 280, status: "ready", time: "5 min ago" },
    { id: "ORD-003", table: "T2", items: 4, amount: 720, status: "served", time: "8 min ago" },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing": return "bg-yellow-100 text-yellow-800";
      case "ready": return "bg-green-100 text-green-800";
      case "served": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time overview of your restaurant operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">₹{stats.todayRevenue.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Active Orders</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.activeOrders}</div>
            <p className="text-xs text-blue-600">
              {stats.pendingKitchen} pending in kitchen
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Occupied Tables</CardTitle>
            <Table className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.occupiedTables}/20</div>
            <p className="text-xs text-purple-600">
              40% occupancy rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Occupied Rooms</CardTitle>
            <Bed className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.occupiedRooms}/25</div>
            <p className="text-xs text-orange-600">
              {stats.totalGuests} total guests
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChefHat className="h-5 w-5 mr-2 text-blue-600" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest order activity across all locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {order.table ? `Table ${order.table}` : `Room ${order.room}`} • {order.items} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{order.amount}</p>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{order.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-green-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-16 flex flex-col bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <Plus className="h-5 w-5 mb-1" />
                New Order
              </Button>
              <Button variant="outline" className="h-16 flex flex-col border-2 hover:bg-gray-50">
                <Table className="h-5 w-5 mb-1" />
                Manage Tables
              </Button>
              <Button variant="outline" className="h-16 flex flex-col border-2 hover:bg-gray-50">
                <Bed className="h-5 w-5 mb-1" />
                Check-in Guest
              </Button>
              <Button variant="outline" className="h-16 flex flex-col border-2 hover:bg-gray-50">
                <ChefHat className="h-5 w-5 mb-1" />
                Kitchen View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
