
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Clock, CheckCircle, AlertCircle, Edit, Trash2, Users, Bed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { databaseService } from "@/services/databaseService";
import { syncService } from "@/services/syncService";
import { soundService } from "@/services/soundService";
import type { Order, OrderItem, MenuItem, Table, Room } from "@/services/databaseService";

export function OrderManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOrder, setNewOrder] = useState({
    type: 'dine-in' as 'dine-in' | 'takeaway' | 'room-service',
    tableId: '',
    roomId: '',
    waiterId: 'current-user',
    notes: ''
  });
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const data = databaseService.getData();
    setOrders(data.orders);
    setMenuItems(data.menuItems);
    setTables(data.tables);
    setRooms(data.rooms);

    const unsubscribe = databaseService.subscribe((data) => {
      setOrders(data.orders);
      setMenuItems(data.menuItems);
      setTables(data.tables);
      setRooms(data.rooms);
    });

    return unsubscribe;
  }, []);

  const addItemToOrder = (menuItem: MenuItem) => {
    const existingItemIndex = selectedItems.findIndex(item => item.menuItemId === menuItem.id);
    
    if (existingItemIndex !== -1) {
      setSelectedItems(prev => prev.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems(prev => [...prev, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
        modifiers: [],
        status: 'pending'
      }]);
    }
  };

  const removeItemFromOrder = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(index);
      return;
    }
    
    setSelectedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const calculateOrderTotal = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceCharge = (subtotal * 10) / 100; // 10% service charge
    const tax = ((subtotal + serviceCharge) * 18) / 100; // 18% GST
    return {
      subtotal,
      serviceCharge,
      tax,
      total: subtotal + serviceCharge + tax
    };
  };

  const handleCreateOrder = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please add items to the order",
        variant: "destructive"
      });
      return;
    }

    if (newOrder.type === 'dine-in' && !newOrder.tableId) {
      toast({
        title: "Table Required",
        description: "Please select a table for dine-in orders",
        variant: "destructive"
      });
      return;
    }

    if (newOrder.type === 'room-service' && !newOrder.roomId) {
      toast({
        title: "Room Required",
        description: "Please select a room for room service orders",
        variant: "destructive"
      });
      return;
    }

    const totals = calculateOrderTotal();
    
    const order = databaseService.createOrder({
      type: newOrder.type,
      tableId: newOrder.type === 'dine-in' ? newOrder.tableId : undefined,
      roomId: newOrder.type === 'room-service' ? newOrder.roomId : undefined,
      items: selectedItems,
      status: 'pending',
      waiterId: newOrder.waiterId,
      timestamp: new Date().toISOString(),
      notes: newOrder.notes,
      subtotal: totals.subtotal,
      tax: totals.tax,
      serviceCharge: totals.serviceCharge,
      discount: 0,
      total: totals.total
    });

    // Update table/room status
    if (newOrder.type === 'dine-in' && newOrder.tableId) {
      databaseService.updateTable(newOrder.tableId, {
        status: 'occupied',
        currentOrderId: order.id,
        occupiedSince: new Date().toISOString()
      });
    }

    if (newOrder.type === 'room-service' && newOrder.roomId) {
      const room = rooms.find(r => r.id === newOrder.roomId);
      if (room) {
        databaseService.updateRoom(newOrder.roomId, {
          orderIds: [...room.orderIds, order.id]
        });
      }
    }

    // Sync order creation
    syncService.broadcast({
      type: 'order',
      action: 'create',
      data: order,
      timestamp: Date.now(),
      deviceId: syncService.getDeviceId()
    });

    // Play sound notification
    soundService.playNewOrderChime();

    toast({
      title: "Order Created",
      description: `Order ${order.id} has been created successfully`,
    });

    // Reset form
    setNewOrder({
      type: 'dine-in',
      tableId: '',
      roomId: '',
      waiterId: 'current-user',
      notes: ''
    });
    setSelectedItems([]);
    setShowCreateDialog(false);
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    databaseService.updateOrder(orderId, { status: newStatus });
    
    syncService.broadcast({
      type: 'order',
      action: 'update',
      data: { id: orderId, status: newStatus },
      timestamp: Date.now(),
      deviceId: syncService.getDeviceId()
    });

    if (newStatus === 'ready') {
      soundService.playOrderReadyChime();
    }

    toast({
      title: "Order Updated",
      description: `Order ${orderId} marked as ${newStatus}`,
    });
  };

  const deleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Free up table/room
    if (order.tableId) {
      databaseService.updateTable(order.tableId, {
        status: 'free',
        currentOrderId: undefined,
        occupiedSince: undefined
      });
    }

    if (order.roomId) {
      const room = rooms.find(r => r.id === order.roomId);
      if (room) {
        databaseService.updateRoom(order.roomId, {
          orderIds: room.orderIds.filter(id => id !== orderId)
        });
      }
    }

    const updatedOrders = orders.filter(o => o.id !== orderId);
    databaseService.updateData({ orders: updatedOrders });

    syncService.broadcast({
      type: 'order',
      action: 'delete',
      data: { id: orderId },
      timestamp: Date.now(),
      deviceId: syncService.getDeviceId()
    });

    toast({
      title: "Order Deleted",
      description: `Order ${orderId} has been removed`,
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case "pending": return "bg-red-100 text-red-800";
      case "preparing": return "bg-yellow-100 text-yellow-800";
      case "ready": return "bg-green-100 text-green-800";
      case "served": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.tableId && order.tableId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.roomId && order.roomId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "all" || order.type === selectedType;
    return matchesSearch && matchesType;
  });

  const availableTables = tables.filter(table => table.status === 'free');
  const availableRooms = rooms.filter(room => room.status === 'occupied' && room.guest);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 mt-1">Create and manage customer orders</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>Add items and details for the new order</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Details */}
              <div className="space-y-4">
                <div>
                  <Label>Order Type</Label>
                  <Select value={newOrder.type} onValueChange={(value: 'dine-in' | 'takeaway' | 'room-service') => setNewOrder(prev => ({ ...prev, type: value }))}>
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

                {newOrder.type === 'dine-in' && (
                  <div>
                    <Label>Table</Label>
                    <Select value={newOrder.tableId} onValueChange={(value) => setNewOrder(prev => ({ ...prev, tableId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTables.map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            Table {table.number} (Capacity: {table.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newOrder.type === 'room-service' && (
                  <div>
                    <Label>Room</Label>
                    <Select value={newOrder.roomId} onValueChange={(value) => setNewOrder(prev => ({ ...prev, roomId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.number} - {room.guest?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special instructions..."
                  />
                </div>

                {/* Selected Items */}
                <div>
                  <Label>Selected Items</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500 ml-2">₹{item.price}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItemFromOrder(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedItems.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{calculateOrderTotal().subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Charge (10%):</span>
                          <span>₹{calculateOrderTotal().serviceCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (18%):</span>
                          <span>₹{calculateOrderTotal().tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-1">
                          <span>Total:</span>
                          <span>₹{calculateOrderTotal().total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Menu Items */}
              <div>
                <Label>Add Menu Items</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {menuItems.filter(item => item.available).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => addItemToOrder(item)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                        <p className="text-sm text-green-600 font-semibold">₹{item.price}</p>
                      </div>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} disabled={selectedItems.length === 0}>
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
          <SelectTrigger className="w-48">
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

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{order.id}</CardTitle>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center">
                {order.type === 'room-service' ? (
                  <><Bed className="h-4 w-4 mr-1" /> Room {order.roomId}</>
                ) : order.type === 'dine-in' ? (
                  <><Users className="h-4 w-4 mr-1" /> Table {order.tableId}</>
                ) : (
                  <>Takeaway</>
                )}
                <span className="ml-2">• {new Date(order.timestamp).toLocaleTimeString()}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              {order.notes && (
                <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  <strong>Notes:</strong> {order.notes}
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Total: ₹{order.total.toFixed(2)}</span>
                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'served')}
                    >
                      Mark Served
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteOrder(order.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
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
