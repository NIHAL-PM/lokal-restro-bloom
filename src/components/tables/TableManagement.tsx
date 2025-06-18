
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TableManagement() {
  const { toast } = useToast();
  
  const [tables, setTables] = useState([
    { id: "T1", number: "1", capacity: 4, status: "free", occupiedSince: null, currentOrder: null },
    { id: "T2", number: "2", capacity: 2, status: "occupied", occupiedSince: new Date().toISOString(), currentOrder: "ORD-003" },
    { id: "T3", number: "3", capacity: 6, status: "free", occupiedSince: null, currentOrder: null },
    { id: "T4", number: "4", capacity: 4, status: "occupied", occupiedSince: new Date(Date.now() - 1800000).toISOString(), currentOrder: "ORD-001" },
    { id: "T5", number: "5", capacity: 8, status: "pending-billing", occupiedSince: new Date(Date.now() - 3600000).toISOString(), currentOrder: "ORD-002" },
    { id: "T6", number: "6", capacity: 2, status: "free", occupiedSince: null, currentOrder: null },
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTable, setNewTable] = useState({ number: "", capacity: "" });

  const handleAddTable = () => {
    if (!newTable.number || !newTable.capacity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const table = {
      id: `T${newTable.number}`,
      number: newTable.number,
      capacity: parseInt(newTable.capacity),
      status: "free",
      occupiedSince: null,
      currentOrder: null
    };

    setTables(prev => [...prev, table]);
    setNewTable({ number: "", capacity: "" });
    setShowAddDialog(false);
    
    toast({
      title: "Table Added",
      description: `Table ${newTable.number} has been added successfully`,
    });
  };

  const updateTableStatus = (tableId: string, newStatus: string) => {
    setTables(prev => prev.map(table => {
      if (table.id === tableId) {
        return {
          ...table,
          status: newStatus,
          occupiedSince: newStatus === "occupied" ? new Date().toISOString() : null,
          currentOrder: newStatus === "free" ? null : table.currentOrder
        };
      }
      return table;
    }));

    toast({
      title: "Table Updated",
      description: `Table ${tableId} marked as ${newStatus.replace('-', ' ')}`,
    });
  };

  const deleteTable = (tableId: string) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
    toast({
      title: "Table Deleted",
      description: `Table ${tableId} has been removed`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "free": return "bg-green-100 text-green-800 border-green-200";
      case "occupied": return "bg-red-100 text-red-800 border-red-200";
      case "pending-billing": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTableCardBorder = (status: string) => {
    switch (status) {
      case "free": return "border-l-green-500 bg-green-50";
      case "occupied": return "border-l-red-500 bg-red-50";
      case "pending-billing": return "border-l-yellow-500 bg-yellow-50";
      default: return "border-l-gray-500 bg-gray-50";
    }
  };

  const getOccupiedDuration = (occupiedSince: string) => {
    if (!occupiedSince) return "";
    const minutes = Math.floor((Date.now() - new Date(occupiedSince).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const freeTablesCount = tables.filter(t => t.status === "free").length;
  const occupiedTablesCount = tables.filter(t => t.status === "occupied").length;
  const pendingBillingCount = tables.filter(t => t.status === "pending-billing").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-500 mt-1">Monitor and manage restaurant tables</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>Create a new table for your restaurant</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tableNumber">Table Number</Label>
                <Input
                  id="tableNumber"
                  value={newTable.number}
                  onChange={(e) => setNewTable(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="e.g., 7"
                />
              </div>
              
              <div>
                <Label htmlFor="tableCapacity">Capacity (persons)</Label>
                <Input
                  id="tableCapacity"
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="e.g., 4"
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTable}>
                Add Table
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Available Tables</CardTitle>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{freeTablesCount}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{freeTablesCount} Free</div>
            <p className="text-xs text-green-600">Ready for guests</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Occupied Tables</CardTitle>
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{occupiedTablesCount}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{occupiedTablesCount} Occupied</div>
            <p className="text-xs text-red-600">Currently serving</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending Billing</CardTitle>
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{pendingBillingCount}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{pendingBillingCount} Pending</div>
            <p className="text-xs text-yellow-600">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <Card key={table.id} className={`border-0 shadow-lg border-l-4 transition-all hover:shadow-xl ${getTableCardBorder(table.status)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Table {table.number}</CardTitle>
                <Badge className={getStatusColor(table.status)}>
                  {table.status.replace('-', ' ')}
                </Badge>
              </div>
              <CardDescription className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Capacity: {table.capacity} persons
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {table.status !== "free" && (
                <div className="space-y-2">
                  {table.occupiedSince && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Occupied for: {getOccupiedDuration(table.occupiedSince)}
                    </div>
                  )}
                  {table.currentOrder && (
                    <div className="text-sm text-gray-600">
                      Order: {table.currentOrder}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex space-x-2">
                {table.status === "free" && (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => updateTableStatus(table.id, "occupied")}
                  >
                    Seat Guests
                  </Button>
                )}
                
                {table.status === "occupied" && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateTableStatus(table.id, "pending-billing")}
                    >
                      Request Bill
                    </Button>
                  </>
                )}
                
                {table.status === "pending-billing" && (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => updateTableStatus(table.id, "free")}
                  >
                    Clear Table
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => deleteTable(table.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tables.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tables configured</h3>
            <p className="text-gray-500 text-center mb-4">
              Add your first table to start managing restaurant seating
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Table
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
