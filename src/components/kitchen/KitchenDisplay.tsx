
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function KitchenDisplay() {
  const { toast } = useToast();
  
  const [orders, setOrders] = useState([
    {
      id: "ORD-001",
      type: "dine-in",
      table: "T5",
      items: [
        { name: "Butter Chicken", quantity: 2, notes: "Medium spicy", status: "pending" },
        { name: "Naan", quantity: 3, notes: "", status: "pending" }
      ],
      status: "pending",
      timestamp: new Date().toISOString(),
      orderTime: "2 min ago",
      waiter: "John Doe"
    },
    {
      id: "ORD-002",
      type: "room-service",
      room: "R101",
      items: [
        { name: "Club Sandwich", quantity: 1, notes: "No mayo", status: "preparing" },
        { name: "Fresh Juice", quantity: 2, notes: "Orange", status: "ready" }
      ],
      status: "preparing",
      timestamp: new Date(Date.now() - 600000).toISOString(),
      orderTime: "10 min ago",
      waiter: "Jane Smith"
    },
    {
      id: "ORD-003",
      type: "dine-in",
      table: "T2",
      items: [
        { name: "Biryani", quantity: 1, notes: "Extra raita", status: "ready" },
        { name: "Lassi", quantity: 2, notes: "Sweet", status: "ready" }
      ],
      status: "ready",
      timestamp: new Date(Date.now() - 900000).toISOString(),
      orderTime: "15 min ago",
      waiter: "Mike Johnson"
    }
  ]);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));

    if (newStatus === "ready" && window.playLokalSound) {
      window.playLokalSound("ready");
    }

    toast({
      title: "Order Updated",
      description: `Order ${orderId} marked as ${newStatus}`,
    });
  };

  const updateItemStatus = (orderId: string, itemIndex: number, newStatus: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = [...order.items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: newStatus };
        
        // Check if all items are ready
        const allReady = updatedItems.every(item => item.status === "ready");
        const orderStatus = allReady ? "ready" : "preparing";
        
        return { ...order, items: updatedItems, status: orderStatus };
      }
      return order;
    }));

    toast({
      title: "Item Updated",
      description: `Item marked as ${newStatus}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-red-100 text-red-800 border-red-200";
      case "preparing": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ready": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <AlertTriangle className="h-4 w-4" />;
      case "preparing": return <ChefHat className="h-4 w-4" />;
      case "ready": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (orderTime: string) => {
    const minutes = parseInt(orderTime.split(' ')[0]);
    if (minutes > 15) return "border-l-red-500 bg-red-50";
    if (minutes > 10) return "border-l-yellow-500 bg-yellow-50";
    return "border-l-green-500 bg-green-50";
  };

  const pendingOrders = orders.filter(order => order.status === "pending");
  const preparingOrders = orders.filter(order => order.status === "preparing");
  const readyOrders = orders.filter(order => order.status === "ready");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kitchen Display System</h1>
          <p className="text-gray-500 mt-1">Real-time order tracking and preparation</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{pendingOrders.length}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{preparingOrders.length}</div>
            <div className="text-sm text-gray-500">Preparing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{readyOrders.length}</div>
            <div className="text-sm text-gray-500">Ready</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-600 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Pending Orders
          </h2>
          {pendingOrders.map((order) => (
            <Card key={order.id} className={`border-0 shadow-lg border-l-4 ${getPriorityColor(order.orderTime)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{order.id}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {order.type === "room-service" ? `Room ${order.room}` : `Table ${order.table}`} • 
                  {order.orderTime} • {order.waiter}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <div className="font-medium">{item.name} x{item.quantity}</div>
                      {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => updateItemStatus(order.id, index, "preparing")}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Start
                    </Button>
                  </div>
                ))}
                <Button 
                  className="w-full mt-3" 
                  onClick={() => updateOrderStatus(order.id, "preparing")}
                >
                  Start All Items
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preparing Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-yellow-600 flex items-center">
            <ChefHat className="h-5 w-5 mr-2" />
            Preparing Orders
          </h2>
          {preparingOrders.map((order) => (
            <Card key={order.id} className={`border-0 shadow-lg border-l-4 ${getPriorityColor(order.orderTime)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{order.id}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {order.type === "room-service" ? `Room ${order.room}` : `Table ${order.table}`} • 
                  {order.orderTime} • {order.waiter}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <div className="font-medium">{item.name} x{item.quantity}</div>
                      {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    {item.status === "preparing" && (
                      <Button 
                        size="sm" 
                        onClick={() => updateItemStatus(order.id, index, "ready")}
                        className="bg-green-600 hover:bg-green-700 ml-2"
                      >
                        Ready
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ready Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-600 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Ready Orders
          </h2>
          {readyOrders.map((order) => (
            <Card key={order.id} className="border-0 shadow-lg border-l-4 border-l-green-500 bg-green-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{order.id}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {order.type === "room-service" ? `Room ${order.room}` : `Table ${order.table}`} • 
                  {order.orderTime} • {order.waiter}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <div className="font-medium">{item.name} x{item.quantity}</div>
                      {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      ✓ {item.status}
                    </Badge>
                  </div>
                ))}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  onClick={() => updateOrderStatus(order.id, "served")}
                >
                  Mark as Served
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {orders.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders in kitchen</h3>
            <p className="text-gray-500 text-center">
              All orders have been completed or no new orders have arrived yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
