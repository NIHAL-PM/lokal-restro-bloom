
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Users,
  Clock,
  Printer
} from "lucide-react";
import { databaseService } from "@/services/databaseService";
import { getAll } from '@/services/indexedDb';
import { apiFetch } from '@/services/api';
import { useToast } from "@/hooks/use-toast";
import type { DatabaseSchema, Order, Transaction } from "@/services/databaseService";

export function Reports() {
  const { toast } = useToast();
  const [data, setData] = useState<DatabaseSchema>(databaseService.getData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Try backend first
        const [orders, transactions, menu, tables, rooms, settings] = await Promise.all([
          apiFetch('/orders'),
          apiFetch('/transactions'),
          apiFetch('/menu'),
          apiFetch('/tables'),
          apiFetch('/rooms'),
          apiFetch('/settings'),
        ]);
        setData((prev) => ({
          ...prev,
          orders,
          transactions,
          menuItems: menu,
          tables,
          rooms,
          settings,
        }));
      } catch (err) {
        // If backend fails, fallback to IndexedDB
        try {
          const [orders, transactions, menu, tables, rooms, settings] = await Promise.all([
            getAll('orders'),
            getAll('transactions'),
            getAll('menu'),
            getAll('tables'),
            getAll('rooms'),
            getAll('settings'),
          ]);
          setData((prev) => ({
            ...prev,
            orders,
            transactions,
            menuItems: menu,
            tables,
            rooms,
            settings: settings[0] || prev.settings,
          }));
        } catch (e) {
          setError('Failed to load report data.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  // Filter data based on date range
  const filteredOrders = Array.isArray(data.orders) ? data.orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999); // Include full day
    return orderDate >= fromDate && orderDate <= toDate;
  }) : [];

  const filteredTransactions = Array.isArray(data.transactions) ? data.transactions.filter(transaction => {
    const transactionDate = new Date(transaction.timestamp);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    return transactionDate >= fromDate && transactionDate <= toDate;
  }) : [];

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalTax = filteredOrders.reduce((sum, order) => sum + order.tax, 0);

  // Sales by day
  const salesByDay = filteredOrders.reduce((acc, order) => {
    const date = new Date(order.timestamp).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + order.total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByDay).map(([date, amount]) => ({
    date: new Date(date).toLocaleDateString(),
    amount: amount,
    orders: filteredOrders.filter(o => o.timestamp.startsWith(date)).length
  }));

  // Popular items
  const itemSales = filteredOrders.flatMap(order => order.items).reduce((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const popularItems = Object.entries(itemSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, quantity]) => ({ name, quantity }));

  // Payment methods
  const paymentMethods = filteredTransactions.reduce((acc, transaction) => {
    acc[transaction.paymentMethod] = (acc[transaction.paymentMethod] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentChartData = Object.entries(paymentMethods).map(([method, amount]) => ({
    name: method.toUpperCase(),
    value: amount
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const exportReport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csvData = [
        ['Date', 'Orders', 'Revenue', 'Avg Order Value'],
        ...chartData.map(item => [item.date, item.orders, item.amount, (item.amount / item.orders).toFixed(2)])
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${dateRange.from}-to-${dateRange.to}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Report Exported",
      description: `${format.toUpperCase()} report has been downloaded`,
    });
  };

  const printReport = () => {
    const reportContent = `
      <html>
        <head>
          <title>Sales Report - ${data.settings.restaurantName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary { display: flex; justify-content: space-between; margin: 20px 0; }
            .metric { text-align: center; }
          </style>
        </head>
        <body>
          <h1>${data.settings.restaurantName} - Sales Report</h1>
          <p><strong>Period:</strong> ${dateRange.from} to ${dateRange.to}</p>
          
          <div class="summary">
            <div class="metric">
              <h3>${data.settings.currency}${totalRevenue.toFixed(2)}</h3>
              <p>Total Revenue</p>
            </div>
            <div class="metric">
              <h3>${totalOrders}</h3>
              <p>Total Orders</p>
            </div>
            <div class="metric">
              <h3>${data.settings.currency}${avgOrderValue.toFixed(2)}</h3>
              <p>Avg Order Value</p>
            </div>
          </div>

          <h2>Daily Sales</h2>
          <table>
            <tr><th>Date</th><th>Orders</th><th>Revenue</th></tr>
            ${chartData.map(item => `
              <tr>
                <td>${item.date}</td>
                <td>${item.orders}</td>
                <td>${data.settings.currency}${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Popular Items</h2>
          <table>
            <tr><th>Item</th><th>Quantity Sold</th></tr>
            ${popularItems.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: "Report Printed",
      description: "Sales report has been sent to printer",
    });
  };

  if (loading) {
    return <div className="p-6 text-center text-lg">Loading reports...</div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track your restaurant's performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={printReport}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.settings.currency}{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Including {data.settings.currency}{totalTax.toFixed(2)} tax
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orders processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.settings.currency}{avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.tables.filter(t => t.status === 'occupied').length + 
               data.rooms.filter(r => r.status === 'occupied').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently dining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Trend</TabsTrigger>
          <TabsTrigger value="items">Popular Items</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
              <CardDescription>Daily revenue and order count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'amount' ? `${data.settings.currency}${value}` : value,
                      name === 'amount' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Items</CardTitle>
              <CardDescription>Items ordered most frequently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{item.quantity} sold</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
              <CardDescription>Revenue breakdown by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${data.settings.currency}${value}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
