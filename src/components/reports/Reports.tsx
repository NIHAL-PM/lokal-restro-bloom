
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Users,
  Clock,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { databaseService } from "@/services/databaseService";

export function Reports() {
  const { toast } = useToast();
  const [data, setData] = useState(databaseService.getData());
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedWaiter, setSelectedWaiter] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');

  useEffect(() => {
    const unsubscribe = databaseService.subscribe(setData);
    return unsubscribe;
  }, []);

  // Filter data based on selected criteria
  const getFilteredTransactions = () => {
    return data.transactions.filter(txn => {
      const txnDate = new Date(txn.timestamp).toISOString().split('T')[0];
      const inDateRange = txnDate >= dateRange.from && txnDate <= dateRange.to;
      const matchesPayment = selectedPaymentMethod === 'all' || txn.paymentMethod === selectedPaymentMethod;
      return inDateRange && matchesPayment;
    });
  };

  const getFilteredOrders = () => {
    return data.orders.filter(order => {
      const orderDate = new Date(order.timestamp).toISOString().split('T')[0];
      const inDateRange = orderDate >= dateRange.from && orderDate <= dateRange.to;
      const matchesWaiter = selectedWaiter === 'all' || order.waiterId === selectedWaiter;
      return inDateRange && matchesWaiter;
    });
  };

  // Calculate key metrics
  const calculateMetrics = () => {
    const filteredTransactions = getFilteredTransactions();
    const filteredOrders = getFilteredOrders();

    const totalRevenue = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate growth (compared to previous period)
    const periodDays = Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const previousFrom = new Date(new Date(dateRange.from).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const previousTo = new Date(new Date(dateRange.to).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const previousTransactions = data.transactions.filter(txn => {
      const txnDate = new Date(txn.timestamp).toISOString().split('T')[0];
      return txnDate >= previousFrom && txnDate <= previousTo;
    });
    
    const previousRevenue = previousTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowth
    };
  };

  // Generate daily revenue chart data
  const getDailyRevenueData = () => {
    const dailyData: { [key: string]: number } = {};
    
    getFilteredTransactions().forEach(txn => {
      const date = new Date(txn.timestamp).toISOString().split('T')[0];
      dailyData[date] = (dailyData[date] || 0) + txn.amount;
    });

    return Object.entries(dailyData).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString(),
      revenue
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Generate payment method distribution
  const getPaymentMethodData = () => {
    const paymentData: { [key: string]: number } = {};
    
    getFilteredTransactions().forEach(txn => {
      paymentData[txn.paymentMethod] = (paymentData[txn.paymentMethod] || 0) + txn.amount;
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    return Object.entries(paymentData).map(([method, amount], index) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: amount,
      color: colors[index % colors.length]
    }));
  };

  // Generate top menu items data
  const getTopMenuItemsData = () => {
    const itemData: { [key: string]: { quantity: number; revenue: number } } = {};
    
    getFilteredOrders().forEach(order => {
      order.items.forEach(item => {
        if (!itemData[item.name]) {
          itemData[item.name] = { quantity: 0, revenue: 0 };
        }
        itemData[item.name].quantity += item.quantity;
        itemData[item.name].revenue += item.price * item.quantity;
      });
    });

    return Object.entries(itemData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  // Generate waiter performance data
  const getWaiterPerformanceData = () => {
    const waiterData: { [key: string]: { orders: number; revenue: number } } = {};
    
    getFilteredOrders().forEach(order => {
      const waiter = data.users.find(u => u.id === order.waiterId)?.name || 'Unknown';
      if (!waiterData[waiter]) {
        waiterData[waiter] = { orders: 0, revenue: 0 };
      }
      waiterData[waiter].orders += 1;
      waiterData[waiter].revenue += order.total;
    });

    return Object.entries(waiterData).map(([name, data]) => ({ name, ...data }));
  };

  const handleExportCSV = () => {
    const filteredTransactions = getFilteredTransactions();
    const csvData = [
      ['Date', 'Order ID', 'Amount', 'Payment Method', 'Cashier'],
      ...filteredTransactions.map(txn => [
        new Date(txn.timestamp).toLocaleDateString(),
        txn.orderId,
        txn.amount,
        txn.paymentMethod,
        data.users.find(u => u.id === txn.cashierId)?.name || 'Unknown'
      ])
    ];

    const csvString = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange.from}-to-${dateRange.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "CSV file has been downloaded successfully",
    });
  };

  const handleExportJSON = () => {
    const reportData = {
      dateRange,
      metrics: calculateMetrics(),
      transactions: getFilteredTransactions(),
      orders: getFilteredOrders(),
      exportTimestamp: new Date().toISOString()
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed-report-${dateRange.from}-to-${dateRange.to}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Detailed Report Exported",
      description: "JSON file has been downloaded successfully",
    });
  };

  const metrics = calculateMetrics();
  const dailyRevenueData = getDailyRevenueData();
  const paymentMethodData = getPaymentMethodData();
  const topMenuItemsData = getTopMenuItemsData();
  const waiterPerformanceData = getWaiterPerformanceData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Business insights and performance metrics</p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Waiter</Label>
              <Select value={selectedWaiter} onValueChange={setSelectedWaiter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Waiters</SelectItem>
                  {data.users.filter(u => u.role === 'waiter').map(waiter => (
                    <SelectItem key={waiter.id} value={waiter.id}>
                      {waiter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Payment Method</Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">₹{metrics.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-100">
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-700">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.totalOrders}</p>
                <p className="text-xs text-blue-600">
                  Selected period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-700">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-900">₹{metrics.averageOrderValue.toFixed(0)}</p>
                <p className="text-xs text-purple-600">
                  Per transaction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">Active Tables</p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.tables.filter(t => t.status === 'occupied').length}
                </p>
                <p className="text-xs text-orange-600">
                  Currently occupied
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="menu">Menu Performance</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Daily Revenue Trend</CardTitle>
              <CardDescription>Revenue performance over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
              <CardDescription>Revenue breakdown by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Top Menu Items</CardTitle>
              <CardDescription>Best performing items by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topMenuItemsData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Waiter Performance</CardTitle>
              <CardDescription>Orders and revenue by waiter</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={waiterPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#8B5CF6" name="Orders" />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
