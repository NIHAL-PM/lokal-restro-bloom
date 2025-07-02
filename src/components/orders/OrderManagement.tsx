import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const data = databaseService.getData();
    setOrders(data.orders);
    setMenuItems(data.menuItems);
    setTables(data.tables);
    setRooms(data.rooms);
    setLoading(false);
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
    const settings = databaseService.getData().settings;
    const tax = subtotal * (settings.taxRate / 100);
    const serviceCharge = subtotal * (settings.serviceChargeRate / 100);
    const total = subtotal + tax + serviceCharge;
    
    return { subtotal, tax, serviceCharge, total };
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
    const orderData = {
      type: newOrder.type,
      tableId: newOrder.type === 'dine-in' ? newOrder.tableId : undefined,
      roomId: newOrder.type === 'room-service' ? newOrder.roomId : undefined,
      items: selectedItems,
      status: 'pending' as const,
      waiterId: newOrder.waiterId,
      timestamp: new Date().toISOString(),
      notes: newOrder.notes,
      subtotal: totals.subtotal,
      tax: totals.tax,
      serviceCharge: totals.serviceCharge,
      discount: 0,
      total: totals.total
    };

    const createdOrder = databaseService.createOrder(orderData);

    // Update table status if dine-in
    if (newOrder.type === 'dine-in' && newOrder.tableId) {
      databaseService.updateTable(newOrder.tableId, {
        status: 'occupied',
        currentOrderId: createdOrder.id,
        occupiedSince: new Date().toISOString()
      });
    }

    // Add order to room if room service
    if (newOrder.type === 'room-service' && newOrder.roomId) {
      const room = rooms.find(r => r.id === newOrder.roomId);
      if (room) {
        const updatedOrderIds = [...room.orderIds, createdOrder.id];
        databaseService.updateRoom(newOrder.roomId, { orderIds: updatedOrderIds });
      }
    }

    // Sync the new order
    syncService.broadcast({
      type: 'order',
      action: 'create',
      data: createdOrder,
      timestamp: Date.now(),
      deviceId: syncService.getDeviceId()
    });

    // Play sound and show notification
    soundService.playNewOrderChime();
    toast({
      title: "Order Created",
      description: `Order ${createdOrder.id} has been created successfully`,
    });

    // Reset form
    setSelectedItems([]);
    setNewOrder({
      type: 'dine-in',
      tableId: '',
      roomId: '',
      waiterId: 'current-user',
      notes: ''
    });
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
      case "pending": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "preparing": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "ready": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "served": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "cancelled": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || order.type === selectedType;
    return matchesSearch && matchesType;
  });

  const resetCreateDialog = () => {
    setSelectedItems([]);
    setNewOrder({
      type: 'dine-in',
      tableId: '',
      roomId: '',
      waiterId: 'current-user',
      notes: ''
    });
    setShowCreateDialog(false);
  };

  if (loading) return <div className="p-8 text-center text-lg">Loading orders...</div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Order Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage customer orders</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={resetCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>Add items and create a new customer order</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Details */}
              <div className="space-y-4">
                <div>
                  <Label>Order Type</Label>
                  <Select value={newOrder.type} onValueChange={(value: any) => setNewOrder(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine-in">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Dine In
                        </div>
                      </SelectItem>
                      <SelectItem value="takeaway">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Takeaway
                        </div>
                      </SelectItem>
                      <SelectItem value="room-service">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-2" />
                          Room Service
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newOrder.type === 'dine-in' && (
                  <div>
                    <Label>Select Table</Label>
                    <Select value={newOrder.tableId} onValueChange={(value) => setNewOrder(prev => ({ ...prev, tableId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.filter(table => table.status === 'free').map((table) => (
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
                    <Label>Select Room</Label>
                    <Select value={newOrder.roomId} onValueChange={(value) => setNewOrder(prev => ({ ...prev, roomId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.filter(room => room.status === 'occupied').map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.number} - {room.guest?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special instructions or notes"
                    rows={3}
                  />
                </div>

                {/* Selected Items */}
                <div>
                  <Label>Selected Items ({selectedItems.length})</Label>
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {selectedItems.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No items selected</p>
                    ) : (
                      selectedItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">₹{item.price} each</p>
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
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedItems.length > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{calculateOrderTotal().subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{calculateOrderTotal().tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Charge:</span>
                        <span>₹{calculateOrderTotal().serviceCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-1">
                        <span>Total:</span>
                        <span>₹{calculateOrderTotal().total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="space-y-4">
                <div>
                  <Label>Add Menu Items</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search menu items..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-2 pr-4">
                    {menuItems.filter(item => item.available).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">₹{item.price}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addItemToOrder(item)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={resetCreateDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateOrder}
                disabled={selectedItems.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
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
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="dine-in">Dine In</SelectItem>
            <SelectItem value="takeaway">Takeaway</SelectItem>
            <SelectItem value="room-service">Room Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800">
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
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {searchTerm || selectedType !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first order to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
