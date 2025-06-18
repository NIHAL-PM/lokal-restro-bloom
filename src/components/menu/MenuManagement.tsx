
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MenuManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const [menuItems, setMenuItems] = useState([
    {
      id: "1",
      name: "Butter Chicken",
      description: "Creamy tomato-based curry with tender chicken pieces",
      price: 350,
      category: "Main Course",
      available: true,
      stock: 25,
      preparationTime: 15,
      isVeg: false,
      spiceLevel: "Medium",
      allergens: ["Dairy", "Nuts"]
    },
    {
      id: "2",
      name: "Paneer Tikka",
      description: "Grilled cottage cheese with Indian spices",
      price: 320,
      category: "Main Course",
      available: true,
      stock: 30,
      preparationTime: 12,
      isVeg: true,
      spiceLevel: "Medium",
      allergens: ["Dairy"]
    },
    {
      id: "3",
      name: "Garlic Naan",
      description: "Fresh baked bread with garlic and herbs",
      price: 60,
      category: "Bread",
      available: true,
      stock: 50,
      preparationTime: 5,
      isVeg: true,
      spiceLevel: "Mild",
      allergens: ["Gluten", "Dairy"]
    },
    {
      id: "4",
      name: "Biryani Special",
      description: "Aromatic basmati rice with chicken and spices",
      price: 450,
      category: "Rice",
      available: false,
      stock: 0,
      preparationTime: 25,
      isVeg: false,
      spiceLevel: "Hot",
      allergens: []
    },
    {
      id: "5",
      name: "Fresh Lime Soda",
      description: "Refreshing lime drink with soda water",
      price: 80,
      category: "Beverages",
      available: true,
      stock: 100,
      preparationTime: 2,
      isVeg: true,
      spiceLevel: "None",
      allergens: []
    }
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    preparationTime: "",
    isVeg: true,
    spiceLevel: "Mild",
    allergens: ""
  });

  const categories = ["Main Course", "Appetizers", "Bread", "Rice", "Beverages", "Desserts"];
  const spiceLevels = ["None", "Mild", "Medium", "Hot", "Very Hot"];

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const item = {
      id: String(menuItems.length + 1),
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      category: newItem.category,
      available: true,
      stock: parseInt(newItem.stock) || 0,
      preparationTime: parseInt(newItem.preparationTime) || 10,
      isVeg: newItem.isVeg,
      spiceLevel: newItem.spiceLevel,
      allergens: newItem.allergens ? newItem.allergens.split(',').map(a => a.trim()) : []
    };

    if (editingItem) {
      setMenuItems(prev => prev.map(i => i.id === editingItem.id ? { ...item, id: editingItem.id } : i));
      toast({
        title: "Item Updated",
        description: `${item.name} has been updated successfully`,
      });
    } else {
      setMenuItems(prev => [...prev, item]);
      toast({
        title: "Item Added",
        description: `${item.name} has been added to the menu`,
      });
    }

    setNewItem({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "",
      preparationTime: "",
      isVeg: true,
      spiceLevel: "Mild",
      allergens: ""
    });
    setEditingItem(null);
    setShowAddDialog(false);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      stock: String(item.stock),
      preparationTime: String(item.preparationTime),
      isVeg: item.isVeg,
      spiceLevel: item.spiceLevel,
      allergens: item.allergens.join(', ')
    });
    setShowAddDialog(true);
  };

  const toggleAvailability = (itemId: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, available: !item.available } : item
    ));
    
    const item = menuItems.find(i => i.id === itemId);
    toast({
      title: "Availability Updated",
      description: `${item?.name} is now ${item?.available ? "unavailable" : "available"}`,
    });
  };

  const deleteItem = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Item Deleted",
      description: `${item?.name} has been removed from the menu`,
    });
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableItems = menuItems.filter(item => item.available).length;
  const totalCategories = [...new Set(menuItems.map(item => item.category))].length;
  const lowStockItems = menuItems.filter(item => item.stock < 10).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant's menu items and pricing</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingItem(null);
            setNewItem({
              name: "",
              description: "",
              price: "",
              category: "",
              stock: "",
              preparationTime: "",
              isVeg: true,
              spiceLevel: "Mild",
              allergens: ""
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update the details for this menu item" : "Create a new item for your menu"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Butter Chicken"
                  />
                </div>
                
                <div>
                  <Label htmlFor="itemDescription">Description</Label>
                  <Textarea
                    id="itemDescription"
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the dish"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="itemPrice">Price (₹) *</Label>
                  <Input
                    id="itemPrice"
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <Label htmlFor="itemCategory">Category *</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemStock">Stock Quantity</Label>
                  <Input
                    id="itemStock"
                    type="number"
                    value={newItem.stock}
                    onChange={(e) => setNewItem(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="prepTime">Preparation Time (minutes)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={newItem.preparationTime}
                    onChange={(e) => setNewItem(prev => ({ ...prev, preparationTime: e.target.value }))}
                    placeholder="10"
                  />
                </div>
                
                <div>
                  <Label htmlFor="spiceLevel">Spice Level</Label>
                  <Select value={newItem.spiceLevel} onValueChange={(value) => setNewItem(prev => ({ ...prev, spiceLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spiceLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="allergens">Allergens (comma-separated)</Label>
                  <Input
                    id="allergens"
                    value={newItem.allergens}
                    onChange={(e) => setNewItem(prev => ({ ...prev, allergens: e.target.value }))}
                    placeholder="e.g., Dairy, Nuts, Gluten"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVeg"
                    checked={newItem.isVeg}
                    onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, isVeg: checked }))}
                  />
                  <Label htmlFor="isVeg">Vegetarian</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>
                {editingItem ? "Update Item" : "Add Item"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Available Items</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{availableItems}</div>
            <p className="text-xs text-blue-600">out of {menuItems.length} total items</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Categories</CardTitle>
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{totalCategories}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{totalCategories}</div>
            <p className="text-xs text-purple-600">menu categories</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Low Stock</CardTitle>
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{lowStockItems}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{lowStockItems}</div>
            <p className="text-xs text-orange-600">items need restocking</p>
          </CardContent>
        </Card>
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
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center">
                    {item.name}
                    {item.isVeg && <span className="ml-2 text-green-600 text-sm">🌱</span>}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                    {item.spiceLevel !== "None" && (
                      <Badge variant="outline" className="text-xs">
                        {item.spiceLevel}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={item.available}
                    onCheckedChange={() => toggleAvailability(item.id)}
                    size="sm"
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
              
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-green-600">₹{item.price}</div>
                <div className="text-sm text-gray-500">{item.preparationTime} min</div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className={`${item.stock < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                  Stock: {item.stock}
                </span>
                <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {item.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              
              {item.allergens.length > 0 && (
                <div className="text-xs text-gray-500">
                  Allergens: {item.allergens.join(', ')}
                </div>
              )}
              
              <div className="flex space-x-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEditItem(item)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => deleteItem(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
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
