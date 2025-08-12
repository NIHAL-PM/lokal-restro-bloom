import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

interface Props {
  menuItems: MenuItem[];
  onOrderSubmit: (order: {
    items: CartItem[];
    tableNumber?: string;
    customerName?: string;
    total: number;
    paymentMethod: string;
  }) => void;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export function MobilePOSSystem({ 
  menuItems, 
  onOrderSubmit,
  deviceType = 'mobile' 
}: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [showPayment, setShowPayment] = useState(false);

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];
  
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      return prevCart.reduce((acc, cartItem) => {
        if (cartItem.id === itemId) {
          if (cartItem.quantity > 1) {
            acc.push({ ...cartItem, quantity: cartItem.quantity - 1 });
          }
        } else {
          acc.push(cartItem);
        }
        return acc;
      }, [] as CartItem[]);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleSubmitOrder = () => {
    if (cart.length === 0) return;
    
    onOrderSubmit({
      items: cart,
      tableNumber: tableNumber || undefined,
      customerName: customerName || undefined,
      total: getCartTotal(),
      paymentMethod
    });
    
    // Reset form
    setCart([]);
    setTableNumber('');
    setCustomerName('');
    setShowPayment(false);
  };

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md touch-manipulation",
        !item.available && "opacity-50 cursor-not-allowed",
        deviceType === 'mobile' && "min-h-[120px]"
      )}
      onClick={() => item.available && addToCart(item)}
    >
      <CardContent className={cn(
        "p-3 flex flex-col justify-between h-full",
        deviceType === 'mobile' && "p-2"
      )}>
        {item.image && (
          <div className="w-full h-16 bg-gray-200 rounded mb-2 overflow-hidden">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <h3 className={cn(
            "font-medium mb-1",
            deviceType === 'mobile' ? "text-sm" : "text-base"
          )}>
            {item.name}
          </h3>
          <Badge variant="outline" className="text-xs mb-2">
            {item.category}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className={cn(
            "font-bold",
            deviceType === 'mobile' ? "text-base" : "text-lg"
          )}>
            ₹{item.price}
          </span>
          {!item.available && (
            <Badge variant="destructive" className="text-xs">
              Unavailable
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const CartItemCard = ({ item }: { item: CartItem }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <h4 className={cn(
          "font-medium",
          deviceType === 'mobile' ? "text-sm" : "text-base"
        )}>
          {item.name}
        </h4>
        <p className={cn(
          "text-muted-foreground",
          deviceType === 'mobile' ? "text-xs" : "text-sm"
        )}>
          ₹{item.price} each
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "touch-manipulation",
            deviceType === 'mobile' && "h-8 w-8 p-0"
          )}
          onClick={() => removeFromCart(item.id)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="min-w-8 text-center font-medium">
          {item.quantity}
        </span>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "touch-manipulation",
            deviceType === 'mobile' && "h-8 w-8 p-0"
          )}
          onClick={() => addToCart(item)}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <span className={cn(
          "min-w-16 text-right font-bold",
          deviceType === 'mobile' ? "text-sm" : "text-base"
        )}>
          ₹{item.price * item.quantity}
        </span>
      </div>
    </div>
  );

  if (showPayment) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Summary</span>
              <Button 
                variant="outline" 
                onClick={() => setShowPayment(false)}
              >
                Back
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Details */}
            <div className="space-y-2">
              <Input
                placeholder="Table Number (optional)"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
              <Input
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {/* Cart Items */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cart.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>₹{getCartTotal()}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <p className="font-medium">Payment Method:</p>
              <div className={cn(
                "grid gap-2",
                deviceType === 'mobile' ? "grid-cols-1" : "grid-cols-3"
              )}>
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className="flex items-center gap-2 touch-manipulation"
                >
                  <Banknote className="h-4 w-4" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className="flex items-center gap-2 touch-manipulation"
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </Button>
                <Button
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('upi')}
                  className="flex items-center gap-2 touch-manipulation"
                >
                  <Smartphone className="h-4 w-4" />
                  UPI
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full touch-manipulation h-12 text-lg"
              onClick={handleSubmitOrder}
            >
              <Receipt className="h-5 w-5 mr-2" />
              Complete Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className={cn(
        "flex gap-2 overflow-x-auto pb-2",
        deviceType === 'mobile' && "scroll-smooth"
      )}>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap touch-manipulation"
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className={cn(
        "grid gap-4",
        deviceType === 'mobile' 
          ? "grid-cols-2" 
          : deviceType === 'tablet' 
            ? "grid-cols-3" 
            : "grid-cols-4"
      )}>
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">
                  {getCartItemCount()} items
                </span>
                <span className="text-lg font-bold">
                  ₹{getCartTotal()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setShowPayment(true)}
                  className="touch-manipulation"
                >
                  Checkout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MobilePOSSystem;