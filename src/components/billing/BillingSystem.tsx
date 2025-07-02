
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt, CreditCard, Banknote, Smartphone, Printer, Calculator, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { databaseService } from "@/services/databaseService";
import { createTransactionAPI, updateTransactionAPI, updateTableAPI, updateRoomAPI } from '@/services/api';
import { putItem, getAll } from '@/services/indexedDb';
import { syncService } from "@/services/syncService";
import { soundService } from "@/services/soundService";
import { printerService } from "@/services/printerService";
import type { Order, Transaction } from "@/services/databaseService";

export function BillingSystem() {
  const { toast } = useToast();
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [currentBill, setCurrentBill] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const data = databaseService.getData();
    setReadyOrders(data.orders.filter(order => order.status === 'ready'));

    const unsubscribe = databaseService.subscribe((data) => {
      setReadyOrders(data.orders.filter(order => order.status === 'ready'));
    });

    return unsubscribe;
  }, []);

  const handleSelectOrder = (order: Order) => {
    setCurrentBill(order);
    setAmountPaid(order.total.toString());
    setShowPaymentDialog(true);
  };

  const calculateChange = () => {
    if (!currentBill || !amountPaid) return 0;
    const paid = parseFloat(amountPaid);
    const total = currentBill.total;
    return Math.max(0, paid - total);
  };

  const handlePayment = async () => {
    if (!currentBill) return;

    const paid = parseFloat(amountPaid);
    if (paid < currentBill.total) {
      toast({
        title: "Insufficient Payment",
        description: "Payment amount is less than the total bill",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create transaction record
      const transaction: Omit<Transaction, 'id'> = {
        orderId: currentBill.id,
        amount: currentBill.total,
        paymentMethod,
        timestamp: new Date().toISOString(),
        cashierId: 'current-user' // Should be actual user ID
      };

      // 1. Create transaction in backend
      const newTransaction = await createTransactionAPI(transaction);
      // 2. Store transaction in IndexedDB
      await putItem('transactions', newTransaction);

      // 3. Update order status in backend
      await updateTransactionAPI(currentBill.id, { status: 'served' });
      // 4. Optionally update in IndexedDB (if offline-first)
      await putItem('orders', { ...currentBill, status: 'served' });

      // 5. Update table/room status if applicable (backend and IndexedDB)
      if (currentBill.tableId) {
        // Backend: update table status
        await updateTableAPI(currentBill.tableId, { status: 'free', currentOrderId: undefined, occupiedSince: undefined });
        // IndexedDB:
        await putItem('tables', { id: currentBill.tableId, status: 'free', currentOrderId: undefined, occupiedSince: undefined });
      }
      if (currentBill.roomId) {
        // Backend: update room orderIds
        // Fetch current room from IndexedDB (or backend if needed)
        // For now, just clear the order from the room's orderIds
        // You may want to fetch the room from backend for real implementation
        // Here, we assume the room is available in IndexedDB
        // Get all rooms from IndexedDB, update, and put back
        const allRooms = await getAll('rooms');
        const room = allRooms.find((r: any) => r.id === currentBill.roomId);
        if (room) {
          const updatedOrderIds = (room.orderIds || []).filter((id: string) => id !== currentBill.id);
          await updateRoomAPI(currentBill.roomId, { orderIds: updatedOrderIds });
          await putItem('rooms', { ...room, orderIds: updatedOrderIds });
        }
      }

      // Sync changes
      syncService.broadcast({
        type: 'payment',
        action: 'complete',
        data: {
          orderId: currentBill.id,
          transaction: newTransaction,
          tableId: currentBill.tableId,
          roomId: currentBill.roomId
        },
        timestamp: Date.now(),
        deviceId: syncService.getDeviceId()
      });

      // Print receipt
      const settings = databaseService.getData().settings;
      const receipt = {
        header: {
          restaurantName: settings.restaurantName,
          address: '123 Restaurant Street, City',
          phone: '+91 98765 43210'
        },
        order: {
          id: currentBill.id,
          table: currentBill.tableId,
          room: currentBill.roomId,
          waiter: 'Current User', // Should be actual waiter name
          timestamp: currentBill.timestamp
        },
        items: currentBill.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        totals: {
          subtotal: currentBill.subtotal,
          tax: currentBill.tax,
          serviceCharge: currentBill.serviceCharge,
          discount: currentBill.discount,
          total: currentBill.total
        },
        payment: {
          method: paymentMethod,
          amount: paid,
          change: calculateChange()
        },
        footer: 'Thank you for dining with us!\nVisit again soon!'
      };

      const printSuccess = await printerService.printReceipt(receipt);
      soundService.playBillPrintChime();
      toast({
        title: "Payment Processed",
        description: `Order ${currentBill.id} has been paid and ${printSuccess ? 'receipt printed' : 'receipt queued for printing'}`,
      });

      // Reset state
      setCurrentBill(null);
      setAmountPaid('');
      setPaymentMethod('cash');
      setShowPaymentDialog(false);

    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'upi': return <Smartphone className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const resetPaymentDialog = () => {
    setCurrentBill(null);
    setAmountPaid('');
    setPaymentMethod('cash');
    setShowPaymentDialog(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Billing System</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Process payments and generate receipts</p>
      </div>

      {/* Ready Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {readyOrders.map((order) => (
          <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  {order.id}
                </CardTitle>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  Ready to Bill
                </Badge>
              </div>
              <CardDescription className="flex items-center space-x-4">
                <span>
                  {order.tableId ? `Table ${order.tableId}` : `Room ${order.roomId}`}
                </span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(order.timestamp).toLocaleTimeString()}
                </div>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <div className="flex items-center">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          x{item.quantity}
                        </Badge>
                      </div>
                      <span className="text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{order.subtotal.toFixed(2)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>₹{order.tax.toFixed(2)}</span>
                  </div>
                )}
                {order.serviceCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Service Charge:</span>
                    <span>₹{order.serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount:</span>
                    <span>-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{order.total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={() => handleSelectOrder(order)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Process Payment
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {readyOrders.length === 0 && (
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No orders ready for billing</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Orders marked as ready in the kitchen will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={resetPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Complete the payment for order {currentBill?.id}
            </DialogDescription>
          </DialogHeader>

          {currentBill && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Order Total:</span>
                  <span className="text-xl font-bold">₹{currentBill.total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {currentBill.tableId ? `Table ${currentBill.tableId}` : `Room ${currentBill.roomId}`}
                </div>
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center">
                        <Banknote className="h-4 w-4 mr-2" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Card
                      </div>
                    </SelectItem>
                    <SelectItem value="upi">
                      <div className="flex items-center">
                        <Smartphone className="h-4 w-4 mr-2" />
                        UPI
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount Paid</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              {paymentMethod === 'cash' && calculateChange() > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-900 dark:text-blue-100">Change to Return:</span>
                    <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      ₹{calculateChange().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={resetPaymentDialog} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment} 
                  disabled={!amountPaid || parseFloat(amountPaid) < currentBill.total || isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Printer className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {getPaymentMethodIcon(paymentMethod)}
                      <span className="ml-2">Complete Payment</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
