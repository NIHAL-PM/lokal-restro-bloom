import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  Download, 
  Calendar,
  Users,
  ShoppingCart,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const chartConfig = {
  sales: { label: "Sales", color: "hsl(var(--chart-1))" },
  orders: { label: "Orders", color: "hsl(var(--chart-2))" },
  revenue: { label: "Revenue", color: "hsl(var(--chart-3))" }
};

export function Reports() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Sample data for charts
  const salesData = [
    { name: "Mon", sales: 12000, orders: 45 },
    { name: "Tue", sales: 15000, orders: 52 },
    { name: "Wed", sales: 18000, orders: 67 },
    { name: "Thu", sales: 14000, orders: 48 },
    { name: "Fri", sales: 22000, orders: 78 },
    { name: "Sat", sales: 28000, orders: 95 },
    { name: "Sun", sales: 25000, orders: 88 }
  ];

  const categoryData = [
    { name: "Main Course", value: 45, color: "#8884d8" },
    { name: "Beverages", value: 25, color: "#82ca9d" },
    { name: "Appetizers", value: 15, color: "#ffc658" },
    { name: "Desserts", value: 10, color: "#ff7c7c" },
    { name: "Others", value: 5, color: "#8dd1e1" }
  ];

  const topItems = [
    { name: "Butter Chicken", sold: 156, revenue: 54600 },
    { name: "Biryani Special", sold: 124, revenue: 55800 },
    { name: "Paneer Tikka", sold: 98, revenue: 31360 },
    { name: "Naan", sold: 245, revenue: 14700 },
    { name: "Fresh Juice", sold: 189, revenue: 22680 }
  ];

  const waiterPerformance = [
    { name: "John Doe", orders: 45, revenue: 67500, rating: 4.8 },
    { name: "Jane Smith", orders: 38, revenue: 52400, rating: 4.6 },
    { name: "Mike Johnson", orders: 42, revenue: 61200, rating: 4.7 },
    { name: "Sarah Wilson", orders: 35, revenue: 48300, rating: 4.5 }
  ];

  const handleExportReport = async (format: string) => {
    toast({
      title: "Exporting Report",
      description: `Generating ${format.toUpperCase()} report...`,
    });

    try {
      const reportData = {
        dateRange,
        summary: {
          totalRevenue: 134000,
          totalOrders: 473,
          averageOrder: 283,
          totalCustomers: 1247
        },
        salesData,
        categoryData,
        topItems,
        waiterPerformance,
        exportDate: new Date().toISOString()
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Convert data to CSV format
        const csvData = [
          ['Date Range', `${dateRange.from} to ${dateRange.to}`],
          ['Total Revenue', '₹134,000'],
          ['Total Orders', '473'],
          ['Average Order', '₹283'],
          ['', ''],
          ['Top Items', '', ''],
          ['Item Name', 'Quantity Sold', 'Revenue'],
          ...topItems.map(item => [item.name, item.sold.toString(), `₹${item.revenue}`])
        ];
        
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // For PDF, we would typically use a library like jsPDF
        // For now, we'll create a simple text-based "PDF"
        const pdfContent = `
LOKALRESTRO BUSINESS REPORT
==========================

Date Range: ${dateRange.from} to ${dateRange.to}
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Total Revenue: ₹1,34,000
Total Orders: 473
Average Order: ₹283
Total Customers: 1,247

TOP PERFORMING ITEMS
-------------------
${topItems.map((item, index) => 
  `${index + 1}. ${item.name} - ${item.sold} units - ₹${item.revenue.toLocaleString()}`
).join('\n')}

STAFF PERFORMANCE
----------------
${waiterPerformance.map(waiter => 
  `${waiter.name} - ${waiter.orders} orders - ₹${waiter.revenue.toLocaleString()} - ${waiter.rating}⭐`
).join('\n')}
        `;
        
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Report downloaded in ${format.toUpperCase()} format`,
        });
      }, 1500);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Business insights and performance metrics</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleExportReport("pdf")}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportReport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportReport("json")}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="flex items-end">
              <Button className="w-full">Generate Report</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">₹1,34,000</div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">473</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Average: 67 orders/day
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Average Order</CardTitle>
            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">₹283</div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              +₹15 from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">1,247</div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              238 unique customers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="items">Item Performance</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="customer">Customer Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Daily Sales Trend</CardTitle>
                <CardDescription>Revenue and order count for the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sales" fill="var(--color-sales)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Revenue distribution across menu categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Top Performing Items</CardTitle>
              <CardDescription>Best selling menu items by quantity and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center">
                        #{index + 1}
                      </Badge>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.sold} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600 dark:text-green-400">₹{item.revenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Waiter Performance</CardTitle>
              <CardDescription>Staff performance metrics and ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {waiterPerformance.map((waiter, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{waiter.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{waiter.orders} orders served</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600 dark:text-green-400">₹{waiter.revenue.toLocaleString()}</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Rating:</span>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          ⭐ {waiter.rating}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
              <CardDescription>Customer behavior and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Peak Hours</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">12:00 PM - 2:00 PM</span>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Peak</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">7:00 PM - 9:00 PM</span>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Peak</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">9:00 AM - 11:00 AM</span>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Moderate</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Customer Preferences</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dine-in</span>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Room Service</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Takeaway</span>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
