
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChefHat, Clock, CheckCircle, AlertCircle, Utensils, Table, Bed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { databaseService } from "@/services/databaseService";
import { syncService } from "@/services/syncService";
import { soundService } from "@/services/soundService";
import type { Order, OrderItem } from "@/services/databaseService";

export function KitchenDisplay() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');

  useEffect(() => {
    const data = databaseService.getData();
    setOrders(data.orders.filter(order => order.status !== 'served' && order.status !== 'cancelled'));

    const unsubscribe = databaseService.subscribe((data) => {
      setOrders(data.orders.filter(order => order.status !== 'served' && order.status !== 'cancelled'));
    });

    // Listen for new orders
    const unsubscribeSync = syncService.onSync((syncData) => {
      if (syncData.type === 'order' && syncData.action === 'create') {
        soundService.playNewOrderChime();
        toast({
          title: "New Order Received",
          description: `Order ${syncData.data.id} has been created`,
        });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeSync();
    };
  }, [toast]);

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    databaseService.updateOrder(orderId, { status });

    syncService.broadcast({
      type: 'order',
      action: 'status_update',
      data: { id: orderId, status },
      timestamp: Date.now(),
      deviceId: syncService.getDeviceId()
    });

    if (status === 'ready') {
      soundService.playOrderReadyChime();
      toast({
        title: "Order Ready",
        description: `Order ${orderId} is ready for serving`,
      });
    }
  };

  const updateItemStatus = (orderId: string, itemIndex: number, status: OrderItem['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map((item, index) => 
      index === itemIndex ? { ...item, status } : item
    );

    // Check if all items are ready
    const allItemsReady = updatedItems.every(item => item.status === 'ready');
    const newOrderStatus = allItemsReady ? 'ready' : 'preparing';

    databaseService.updateOrder(orderId, { 
      items: updatedItems,
      status: newOrderStatus
    });

    syncService.broadcast({
      type: 'order',
      action: 'item_update',
      data: { id: orderId, items: updatedItems, status: newOrderStatus },
      timestamp: Date.now(),
      deviceId: syncService.getDeviceId()
    });

    if (allItemsReady) {
      soundService.playOrderReadyChime();
      toast({
        title: "Order Ready",
        description: `Order ${orderId} is ready for serving`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "preparing": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "ready": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800";
      case "preparing": return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800";
      case "ready": return "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800";
      default: return "bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800";
    }
  };

  const getPriorityOrder = (order: Order) => {
    const orderTime = new Date(order.timestamp).getTime();
    const now = Date.now();
    const waitTime = Math.floor((now - orderTime) / (1000 * 60)); // in minutes
    
    if (waitTime > 30) return 'high';
    if (waitTime > 15) return 'medium';
    return 'low';
  };

  const filteredOrders = orders
    .filter(order => selectedFilter === 'all' || order.status === selectedFilter)
    .sort((a, b) => {
      // Sort by priority first, then by time
      const aPriority = getPriorityOrder(a);
      const bPriority = getPriorityOrder(b);
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      
      if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
        return priorityOrder[bPriority] - priorityOrder[aPriority];
      }
      
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Kitchen Display System</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage order preparation and kitchen workflow</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All Orders', count: orderCounts.all },
          { key: 'pending', label: 'Pending', count: orderCounts.pending },
          { key: 'preparing', label: 'Preparing', count: orderCounts.preparing },
          { key: 'ready', label: 'Ready', count: orderCounts.ready }
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={selectedFilter === key ? "default" : "outline"}
            onClick={() => setSelectedFilter(key as any)}
            className="relative"
          >
            {label}
            {count > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                {count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => {
          const priority = getPriorityOrder(order);
          const orderTime = new Date(order.timestamp);
          const waitTime = Math.floor((Date.now() - orderTime.getTime()) / (1000 * 60));
          
          return (
            <Card 
              key={order.id} 
              className={`border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 ${
                priority === 'high' ? 'ring-2 ring-red-500' : 
                priority === 'medium' ? 'ring-1 ring-yellow-500' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <ChefHat className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                    {order.id}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {priority === 'high' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {order.type === 'room-service' ? (
                      <Bed className="h-4 w-4 mr-1" />
                    ) : (
                      <Table className="h-4 w-4 mr-1" />
                    )}
                    {order.tableId ? `Table ${order.tableId}` : `Room ${order.roomId}`}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className={waitTime > 20 ? 'text-red-600 font-semibold' : ''}>
                      {waitTime}m ago
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${getItemStatusColor(item.status)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Utensils className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              x{item.quantity}
                            </Badge>
                          </div>
                          <Badge className={getStatusColor(item.status)} variant="outline">
                            {item.status}
                          </Badge>
                        </div>
                        
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Modifiers: {item.modifiers.join(', ')}
                          </div>
                        )}
                        
                        {item.notes && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Notes: {item.notes}
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          {item.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateItemStatus(order.id, index, 'preparing')}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              Start Preparing
                            </Button>
                          )}
                          {item.status === 'preparing' && (
                            <Button
                              size="sm"
                              onClick={() => updateItemStatus(order.id, index, 'ready')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark Ready
                            </Button>
                          )}
                          {item.status === 'ready' && (
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Ready
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {order.notes && (
                  <>
                    <Separator />
                    <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Notes:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.notes}</p>
                    </div>
                  </>
                )}

                <Separator />
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total: ₹{order.total}
                  </div>
                  
                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Start Order
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
                      <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Order Ready
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {selectedFilter === 'all' ? 'No orders in kitchen' : `No ${selectedFilter} orders`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {selectedFilter === 'all' 
                ? 'New orders will appear here automatically' 
                : `Orders with ${selectedFilter} status will appear here`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
