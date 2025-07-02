
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table as TableIcon, Users, Plus, Edit, Trash2, Clock } from "lucide-react";
import type { Table } from '@/services/databaseService';
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/services/api";
import { getAll, putItem, deleteItem as idbDeleteItem } from "@/services/indexedDb";

export function TableManagement() {
  const { toast } = useToast();
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [newTable, setNewTable] = useState({
    number: "",
    capacity: "2"
  });

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        let items = [];
        try {
          items = await apiFetch('/tables');
        } catch {
          items = await getAll('tables');
        }
        setTables(items);
        for (const item of items) await putItem('tables', item);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const handleAddTable = async () => {
    if (!newTable.number) {
      toast({
        title: "Error",
        description: "Please enter table number",
        variant: "destructive"
      });
      return;
    }
    try {
      const tableData = {
        number: newTable.number,
        capacity: parseInt(newTable.capacity),
        status: 'free'
      };
      const created = await apiFetch('/tables', { method: 'POST', body: JSON.stringify(tableData) });
      setTables(prev => [...prev, created]);
      await putItem('tables', created);
      setNewTable({ number: "", capacity: "2" });
      setShowAddDialog(false);
      toast({
        title: "Table Added",
        description: `Table ${created.number} has been added successfully`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleEditTable = (table: any) => {
    setEditingTable(table);
    setNewTable({ number: table.number, capacity: table.capacity.toString() });
    setShowAddDialog(true);
  };

  const handleUpdateTable = async () => {
    if (!editingTable || !newTable.number) return;
    try {
      const updatedTable = {
        ...editingTable,
        number: newTable.number,
        capacity: parseInt(newTable.capacity)
      };
      const updated = await apiFetch(`/tables/${editingTable.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTable)
      });
      setTables(prev => prev.map(t => t.id === editingTable.id ? updated : t));
      await putItem('tables', updated);
      setEditingTable(null);
      setNewTable({ number: "", capacity: "2" });
      setShowAddDialog(false);
      toast({
        title: "Table Updated",
        description: `Table ${updated.number} has been updated successfully`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    if (table.status !== 'free') {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete occupied or reserved tables",
        variant: "destructive"
      });
      return;
    }
    try {
      await apiFetch(`/tables/${tableId}`, { method: 'DELETE' });
      setTables(prev => prev.filter(t => t.id !== tableId));
      await idbDeleteItem('tables', tableId);
      toast({
        title: "Table Deleted",
        description: `Table ${table.number} has been deleted`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const updateTableStatus = async (tableId: string, status: string) => {
    try {
      const updated = await apiFetch(`/tables/${tableId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setTables(prev => prev.map(t => t.id === tableId ? updated : t));
      await putItem('tables', updated);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "free": return "bg-green-100 text-green-800";
      case "occupied": return "bg-blue-100 text-blue-800";
      case "pending-billing": return "bg-yellow-100 text-yellow-800";
      case "reserved": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTableOrder = (tableId: string) => {
    return orders.find(order => order.tableId === tableId && order.status !== 'served');
  };

  const resetDialog = () => {
    setEditingTable(null);
    setNewTable({ number: "", capacity: "2" });
    setShowAddDialog(false);
  };

  if (loading) return <div className="p-8 text-center text-lg">Loading tables...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Table Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage restaurant tables and seating</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={resetDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTable ? "Edit Table" : "Add New Table"}</DialogTitle>
              <DialogDescription>
                {editingTable ? "Update table information" : "Create a new table for your restaurant"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Table Number *</Label>
                <Input
                  value={newTable.number}
                  onChange={(e) => setNewTable(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="e.g., 1, A1, VIP-1"
                />
              </div>

              <div>
                <Label>Seating Capacity</Label>
                <Select value={newTable.capacity} onValueChange={(value) => setNewTable(prev => ({ ...prev, capacity: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 People</SelectItem>
                    <SelectItem value="4">4 People</SelectItem>
                    <SelectItem value="6">6 People</SelectItem>
                    <SelectItem value="8">8 People</SelectItem>
                    <SelectItem value="10">10 People</SelectItem>
                    <SelectItem value="12">12 People</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={resetDialog}>
                Cancel
              </Button>
              <Button onClick={editingTable ? handleUpdateTable : handleAddTable}>
                {editingTable ? "Update Table" : "Add Table"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Free Tables</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {tables.filter(t => t.status === 'free').length}
                </p>
              </div>
              <TableIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Occupied</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {tables.filter(t => t.status === 'occupied').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending Billing</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {tables.filter(t => t.status === 'pending-billing').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Reserved</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {tables.filter(t => t.status === 'reserved').length}
                </p>
              </div>
              <TableIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => {
          const currentOrder = getTableOrder(table.id);
          return (
            <Card key={table.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <TableIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Table {table.number}
                  </CardTitle>
                  <Badge className={getStatusColor(table.status)}>
                    {table.status.replace('-', ' ')}
                  </Badge>
                </div>
                <CardDescription>
                  Capacity: {table.capacity} people
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentOrder && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Current Order</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Order: {currentOrder.id}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Total: ₹{currentOrder.total}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Status: {currentOrder.status}
                    </p>
                  </div>
                )}

                {table.occupiedSince && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Occupied since: {new Date(table.occupiedSince).toLocaleTimeString()}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditTable(table)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteTable(table.id)}
                      disabled={table.status !== 'free'}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {table.status === 'free' && (
                    <Button 
                      size="sm"
                      onClick={() => updateTableStatus(table.id, 'occupied')}
                    >
                      Occupy
                    </Button>
                  )}

                  {table.status === 'occupied' && (
                    <Button 
                      size="sm"
                      onClick={() => updateTableStatus(table.id, 'pending-billing')}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Request Bill
                    </Button>
                  )}

                  {table.status === 'pending-billing' && (
                    <Button 
                      size="sm"
                      onClick={() => updateTableStatus(table.id, 'free')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Clear Table
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tables.length === 0 && (
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TableIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tables found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Add your first table to start managing seating
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
