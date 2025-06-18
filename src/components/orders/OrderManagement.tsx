
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Clock, CheckCircle, AlertCircle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function OrderManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  
  const [orders, setOrders] = useState([
    {
      id: "ORD-001",
      type: "dine-in",
      table: "T5",
      waiter: "John Doe",
      items: [
        { name: "Butter Chicken", quantity: 2, price: 350, notes: "Medium spicy" },
        { name: "Naan", quantity: 3, price: 50 }
      ],
      total: 850,
      status: "preparing",
      timestamp: new Date().toISOString(),
      notes: "Customer requested extra napkins"
    },
    {
      id: "ORD-002",
      type: "room-service",
      room: "R101",
      waiter: "Jane Smith",
      items: [
        { name: "Club Sandwich", quantity: 1, price: 280 },
        { name: "Fresh Juice", quantity: 2, price: 120 }
      ],
      total: 520,
      status: "ready",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      notes: ""
    }
  ]);

  const [newOrder, setNewOrder] = useState({
    type: "dine-in",
    location: "",
    items: [],
    notes: "",
    waiter: "Current User"
  });

  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);

  const menuItems = [
    { id: "1", name: "Butter Chicken", price: 350, category: "Main Course" },
    { id: "2", name: "Paneer Tikka", price: 320, category: "Main Course" },
    { id: "3", name: "Naan", price: 50, category: "Bread" },
    { id: "4", name: "Biryani", price: 450, category: "Rice" },
    { id: "5", name: "Fresh Juice", price: 120, category: "Beverages" }
  ];

  const handleCreateOrder = () => {
    if (!newOrder.location || newOrder.items.length === 0) {
      toast({
        title: "Incomplete Order",
        description: "Please select location and add items",
        variant: "destructive"
      });
      return;
    }

    const order = {
      id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
      ...newOrder,
      total: newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: "pending",
      timestamp: new Date().toISOString()
    };

    setOrders(prev => [order, ...prev]);
    setNewOrder({ type: "dine-in", location: "", items: [], notes: "", waiter: "Current User" });
    setShowNewOrderDialog(false);
    
    // Play order sound
    if (window.playLokalSound) {
      window.playLokalSound("order");
    }

    toast({
      title: "Order Created",
      description: `Order ${order.id} has been sent to kitchen`,
    });
  };

  const addItemToOrder = (menuItem) => {
    const existingItem = newOrder.items.find(item => item.id === menuItem.id);
    if (existingItem) {
      setNewOrder(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }));
    } else {
      setNewOrder(prev => ({
        ...prev,
        items: [...prev.items, { ...menuItem, quantity: 1, notes: "" }]
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "preparing": return "bg-blue-100 text-blue-800";
      case "ready": return "bg-green-100 text-green-800";
      case "served": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "preparing": return <AlertCircle className="h-4 w-4" />;
      case "ready": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.table && order.table.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.room && order.room.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "all" || order.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 mt-1">Create and track customer orders</p>
        </div>
        
        <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>Add items and details for the new order</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Order Type</Label>
                  <Select value={newOrder.type} onValueChange={(value) => setNewOrder(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine-in">Dine In</SelectItem>
                      <SelectItem value="takeaway">Takeaway</SelectItem>
                      <SelectItem value="room-service">Room Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{newOrder.type === "room-service" ? "Room Number" : "Table Number"}</Label>
                  <Input
                    value={newOrder.location}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={newOrder.type === "room-service" ? "e.g., R101" : "e.g., T5"}
                  />
                </div>

                <div>
                  <Label>Special Notes</Label>
                  <Textarea
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions..."
                    rows={3}
                  />
                </div>

                {newOrder.items.length > 0 && (
                  <div>
                    <Label>Order Summary</Label>
                    <div className="space-y-2 mt-2">
                      {newOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>{item.name} x{item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className="font-bold text-lg pt-2 border-t">
                        Total: ₹{newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Menu Items</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-96 overflow-y-auto">
                  {menuItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.category}</p>
                        <p className="text-sm font-semibold text-green-600">₹{item.price}</p>
                      </div>
                      <Button size="sm" onClick={() => addItemToOrder(item)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewOrderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder}>
                Create Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="dine-in">Dine In</SelectItem>
            <SelectItem value="takeaway">Takeaway</SelectItem>
            <SelectItem value="room-service">Room Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{order.id}</CardTitle>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </Badge>
              </div>
              <CardDescription>
                {order.type === "room-service" ? `Room ${order.room}` : `Table ${order.table}`} • 
                Waiter: {order.waiter} • 
                {new Date(order.timestamp).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Items:</h4>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {order.notes && (
                  <div>
                    <h4 className="font-medium mb-1">Notes:</h4>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-lg font-bold">Total: ₹{order.total}</span>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 text-center">
              {searchTerm || selectedType !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Create your first order to get started"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
