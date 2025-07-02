
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/services/api";
import { getAll, putItem, deleteItem as idbDeleteItem } from "@/services/indexedDb";

export function MenuManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    stock: "10",
    variants: "",
    addOns: ""
  });

  const categories = ["Starters", "Main Course", "Rice", "Bread", "Beverages", "Desserts"];

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.price) {
      toast({
        title: "Incomplete Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    try {
      const item = {
        name: newItem.name,
        category: newItem.category,
        price: parseInt(newItem.price),
        description: newItem.description,
        available: true,
        stock: parseInt(newItem.stock),
        variants: newItem.variants ? newItem.variants.split(',').map(v => v.trim()) : [],
        addOns: newItem.addOns ? newItem.addOns.split(',').map(a => a.trim()) : []
      };
      const created = await apiFetch('/menu', { method: 'POST', body: JSON.stringify(item) });
      setMenuItems(prev => [...prev, created]);
      await putItem('menu', created);
      setNewItem({ name: "", category: "", price: "", description: "", stock: "10", variants: "", addOns: "" });
      setShowAddDialog(false);
      toast({
        title: "Item Added",
        description: `${created.name} has been added to the menu`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const toggleAvailability = async (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    try {
      const updated = await apiFetch(`/menu/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ available: !item.available })
      });
      setMenuItems(prev => prev.map(i => i.id === itemId ? updated : i));
      await putItem('menu', updated);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await apiFetch(`/menu/${itemId}`, { method: 'DELETE' });
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      await idbDeleteItem('menu', itemId);
      toast({
        title: "Item Deleted",
        description: "Menu item has been removed",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        let items = [];
        try {
          items = await apiFetch('/menu');
        } catch {
          // fallback to IndexedDB if offline
          items = await getAll('menu');
        }
        setMenuItems(items);
        // update IndexedDB cache
        for (const item of items) await putItem('menu', item);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="p-8 text-center text-lg">Loading menu...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant menu items</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>Create a new item for your menu</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Item Name *</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Butter Chicken"
                  />
                </div>

                <div>
                  <Label>Category *</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>Stock Quantity</Label>
                  <Input
                    type="number"
                    value={newItem.stock}
                    onChange={(e) => setNewItem(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <Label>Variants (comma separated)</Label>
                  <Input
                    value={newItem.variants}
                    onChange={(e) => setNewItem(prev => ({ ...prev, variants: e.target.value }))}
                    placeholder="Regular, Large"
                  />
                </div>

                <div>
                  <Label>Add-ons (comma separated)</Label>
                  <Input
                    value={newItem.addOns}
                    onChange={(e) => setNewItem(prev => ({ ...prev, addOns: e.target.value }))}
                    placeholder="Extra Rice, Naan"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ChefHat className="h-5 w-5 mr-2 text-purple-600" />
                  {item.name}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={item.available}
                    onCheckedChange={() => toggleAvailability(item.id)}
                  />
                  <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {item.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>
              <CardDescription>{item.category}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">₹{item.price}</span>
                  <span className="text-sm text-gray-500">Stock: {item.stock}</span>
                </div>
              </div>

              {item.variants.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Variants:</h4>
                  <div className="flex flex-wrap gap-1">
                    {item.variants.map((variant, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {variant}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {item.addOns.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Add-ons:</h4>
                  <div className="flex flex-wrap gap-1">
                    {item.addOns.map((addOn, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        {addOn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => deleteItem(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
            <p className="text-gray-500 text-center">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Add your first menu item to get started"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
