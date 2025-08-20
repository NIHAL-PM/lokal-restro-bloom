import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Minus, 
  Clock, 
  Users, 
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  tableNumber?: string;
  roomNumber?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served';
  timestamp: string;
  waiter: string;
  priority?: 'low' | 'normal' | 'high';
  estimatedTime?: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready';
}

interface Props {
  orders: Order[];
  onStatusChange: (orderId: string, status: Order['status']) => void;
  onItemStatusChange: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export function MobileKitchenDisplay({ 
  orders, 
  onStatusChange, 
  onItemStatusChange,
  deviceType = 'mobile' 
}: Props) {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'preparing': return 'bg-blue-500';
      case 'ready': return 'bg-green-500';
      case 'served': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'normal': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-500';
      default: return 'border-l-gray-500';
    }
  };

  const getTimeElapsed = (timestamp: string) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  const StatusButton = ({ 
    status, 
    orderId, 
    isActive = false 
  }: { 
    status: Order['status']; 
    orderId: string; 
    isActive?: boolean;
  }) => (
    <Button
      size={deviceType === 'mobile' ? 'sm' : 'default'}
      variant={isActive ? 'default' : 'outline'}
      className={cn(
        "flex-1 touch-manipulation",
        deviceType === 'mobile' && "h-12 text-xs"
      )}
      onClick={() => onStatusChange(orderId, status)}
    >
      {status === 'pending' && <AlertCircle className="h-4 w-4 mr-1" />}
      {status === 'preparing' && <Clock className="h-4 w-4 mr-1" />}
      {status === 'ready' && <CheckCircle className="h-4 w-4 mr-1" />}
      {status === 'served' && <XCircle className="h-4 w-4 mr-1" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Button>
  );

  const ItemCard = ({ 
    item, 
    orderId 
  }: { 
    item: OrderItem; 
    orderId: string;
  }) => (
    <div 
      className={cn(
        "p-3 border rounded-lg bg-background",
        item.status === 'ready' && "border-green-500 bg-green-50",
        item.status === 'preparing' && "border-blue-500 bg-blue-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs",
                deviceType === 'mobile' && "px-1 py-0 text-xs"
              )}
            >
              {item.quantity}x
            </Badge>
            <span className={cn(
              "font-medium",
              deviceType === 'mobile' && "text-sm"
            )}>
              {item.name}
            </span>
          </div>
          {item.notes && (
            <p className={cn(
              "text-muted-foreground mt-1",
              deviceType === 'mobile' ? "text-xs" : "text-sm"
            )}>
              Note: {item.notes}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={item.status === 'preparing' ? 'default' : 'outline'}
            className={cn(
              "touch-manipulation",
              deviceType === 'mobile' && "h-8 w-8 p-0"
            )}
            onClick={() => onItemStatusChange(orderId, item.id, 'preparing')}
          >
            <Clock className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={item.status === 'ready' ? 'default' : 'outline'}
            className={cn(
              "touch-manipulation",
              deviceType === 'mobile' && "h-8 w-8 p-0"
            )}
            onClick={() => onItemStatusChange(orderId, item.id, 'ready')}
          >
            <CheckCircle className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "space-y-4",
      deviceType === 'mobile' && "space-y-3 px-2"
    )}>
      {orders.map((order) => {
        const timeElapsed = getTimeElapsed(order.timestamp);
        const isOverdue = timeElapsed > (order.estimatedTime || 30);
        
        return (
          <Card 
            key={order.id}
            className={cn(
              "border-l-4",
              getPriorityColor(order.priority),
              isOverdue && "border border-red-200 bg-red-50"
            )}
          >
            <CardHeader className={cn(
              "pb-3",
              deviceType === 'mobile' && "py-3 px-4"
            )}>
              <div className="flex items-center justify-between">
                <CardTitle className={cn(
                  "flex items-center gap-2",
                  deviceType === 'mobile' ? "text-lg" : "text-xl"
                )}>
                  <span>#{order.id.slice(-4)}</span>
                  {order.tableNumber && (
                    <Badge variant="outline">Table {order.tableNumber}</Badge>
                  )}
                  {order.roomNumber && (
                    <Badge variant="outline">Room {order.roomNumber}</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={cn(
                      getStatusColor(order.status),
                      "text-white"
                    )}
                  >
                    {order.status}
                  </Badge>
                  <Badge 
                    variant={isOverdue ? 'destructive' : 'secondary'}
                    className={cn(
                      "flex items-center gap-1",
                      deviceType === 'mobile' && "text-xs"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {timeElapsed}m
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {order.waiter}
                </div>
                <div>
                  {new Date(order.timestamp).toLocaleTimeString()}
                </div>
                {order.estimatedTime && (
                  <div>
                    ETA: {order.estimatedTime}m
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className={cn(
              "space-y-4",
              deviceType === 'mobile' && "px-4 pb-4 space-y-3"
            )}>
              {/* Items */}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    orderId={order.id}
                  />
                ))}
              </div>
              
              {/* Status Controls */}
              <div className={cn(
                "flex gap-2",
                deviceType === 'mobile' && "grid grid-cols-2 gap-2"
              )}>
                <StatusButton 
                  status="preparing" 
                  orderId={order.id}
                  isActive={order.status === 'preparing'}
                />
                <StatusButton 
                  status="ready" 
                  orderId={order.id}
                  isActive={order.status === 'ready'}
                />
                {deviceType !== 'mobile' && (
                  <>
                    <StatusButton 
                      status="served" 
                      orderId={order.id}
                      isActive={order.status === 'served'}
                    />
                  </>
                )}
              </div>
              
              {deviceType === 'mobile' && (
                <div className="flex gap-2">
                  <StatusButton 
                    status="served" 
                    orderId={order.id}
                    isActive={order.status === 'served'}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-12 touch-manipulation"
                    onClick={() => {/* Add priority toggle */}}
                  >
                    Priority: {order.priority || 'normal'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {orders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-muted-foreground">No pending orders</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MobileKitchenDisplay;