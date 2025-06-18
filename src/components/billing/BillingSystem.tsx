
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Receipt, Printer, CreditCard, DollarSign, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function BillingSystem() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [readyOrders] = useState([
    {
      id: "ORD-001",
      type: "dine-in",
      table: "T5",
      items: [
        { name: "Butter Chicken", quantity: 2, price: 350, total: 700 },
        { name: "Naan", quantity: 3, price: 50, total: 150 }
      ],
      subtotal: 850,
      waiter: "John Doe",
      timestamp: new Date().toISOString()
    },
    {
      id: "ORD-002",
      type: "room-service",
      room: "R101",
      items: [
        { name: "Club Sandwich", quantity: 1, price: 280, total: 280 },
        { name: "Fresh Juice", quantity: 2, price: 120, total: 240 }
      ],
      subtotal: 520,
      waiter: "Jane Smith",
      timestamp: new Date(Date.now() - 300000).toISOString()
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billDetails, setBillDetails] = useState({
    discount: 0,
    discountType: "amount", // amount or percentage
    paymentMethod: "cash",
    splitBill: false,
    customerCount: 1
  });

  const taxRate = 18; // 18% GST
  const serviceCharge = 10; // 10% service charge

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setBillDetails(prev => ({ 
      ...prev, 
      customerCount: order.type === "room-service" ? 1 : 2 
    }));
  };

  const calculateBill = () => {
    if (!selectedOrder) return null;
    
    const subtotal = selectedOrder.subtotal;
    const serviceChargeAmount = (subtotal * serviceCharge) / 100;
    const discountAmount = billDetails.discountType === "percentage" 
      ? (subtotal * billDetails.discount) / 100 
      : billDetails.discount;
    const taxableAmount = subtotal + serviceChargeAmount - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;
    
    return {
      subtotal,
      serviceChargeAmount,
      discountAmount,
      taxAmount,
      total: Math.round(total) // Round to nearest rupee
    };
  };

  const handlePrintBill = () => {
    if (!selectedOrder) return;
    
    const calculation = calculateBill();
    
    // Simulate printing
    if (window.playLokalSound) {
      window.playLokalSound("ready");
    }
    
    toast({
      title: "Bill Printed",
      description: `Receipt for ${selectedOrder.id} sent to printer`,
    });

    // Generate receipt data for printing
    const receiptData = {
      orderID: selectedOrder.id,
      table: selectedOrder.table || selectedOrder.room,
      items: selectedOrder.items,
      calculation,
      paymentMethod: billDetails.paymentMethod,
      timestamp: new Date().toISOString()
    };
    
    console.log("Receipt Data:", receiptData);
  };

  const handlePayment = () => {
    if (!selectedOrder) return;
    
    toast({
      title: "Payment Processed",
      description: `Payment of ₹${calculateBill()?.total} received via ${billDetails.paymentMethod}`,
    });
    
    setSelectedOrder(null);
    setBillDetails({
      discount: 0,
      discountType: "amount",
      paymentMethod: "cash",
      splitBill: false,
      customerCount: 1
    });
  };

  const filteredOrders = readyOrders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.table && order.table.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.room && order.room.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const billCalculation = calculateBill();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing System</h1>
        <p className="text-gray-500 mt-1">Process payments and generate receipts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ready Orders */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-green-600" />
              Ready Orders
            </CardTitle>
            <CardDescription>Orders ready for billing</CardDescription>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedOrder?.id === order.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleSelectOrder(order)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{order.id}</h4>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {order.type === "room-service" ? `Room ${order.room}` : `Table ${order.table}`} • 
                  Waiter: {order.waiter}
                </div>
                
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₹{item.total}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-bold text-green-600">₹{order.subtotal}</span>
                </div>
              </div>
            ))}
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No ready orders found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill Processing */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Bill Processing
            </CardTitle>
            <CardDescription>
              {selectedOrder ? `Processing bill for ${selectedOrder.id}` : "Select an order to process bill"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {selectedOrder ? (
              <>
                {/* Bill Details */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="discount">Discount</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="discount"
                        type="number"
                        value={billDetails.discount}
                        onChange={(e) => setBillDetails(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                        className="flex-1"
                      />
                      <Select 
                        value={billDetails.discountType} 
                        onValueChange={(value) => setBillDetails(prev => ({ ...prev, discountType: value }))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">₹</SelectItem>
                          <SelectItem value="percentage">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={billDetails.paymentMethod} 
                      onValueChange={(value) => setBillDetails(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Bill Calculation */}
                {billCalculation && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{billCalculation.subtotal}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Service Charge ({serviceCharge}%):</span>
                      <span>₹{billCalculation.serviceChargeAmount.toFixed(2)}</span>
                    </div>
                    
                    {billCalculation.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-₹{billCalculation.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Tax/GST ({taxRate}%):</span>
                      <span>₹{billCalculation.taxAmount.toFixed(2)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-600">₹{billCalculation.total}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={handlePrintBill} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Bill
                  </Button>
                  
                  <Button 
                    onClick={handlePayment} 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payment (₹{billCalculation?.total})
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Order Selected</h3>
                <p className="text-gray-500">
                  Select a ready order from the left panel to process billing
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
