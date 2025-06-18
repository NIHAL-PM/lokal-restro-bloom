
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bed, Plus, User, Phone, Calendar, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RoomManagement() {
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState([
    {
      id: "R101",
      type: "Standard",
      price: 2500,
      status: "occupied",
      guest: { name: "John Doe", phone: "9876543210", checkIn: "2024-01-15", guests: 2 },
      orders: [{ id: "ORD-002", amount: 520 }]
    },
    {
      id: "R102",
      type: "Deluxe",
      price: 3500,
      status: "vacant",
      guest: null,
      orders: []
    },
    {
      id: "R103",
      type: "Suite",
      price: 5000,
      status: "cleaning",
      guest: null,
      orders: []
    }
  ]);

  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [checkInData, setCheckInData] = useState({
    name: "",
    phone: "",
    guests: "1",
    checkIn: new Date().toISOString().split('T')[0]
  });

  const handleCheckIn = () => {
    if (!selectedRoom || !checkInData.name || !checkInData.phone) {
      toast({
        title: "Incomplete Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setRooms(prev => prev.map(room => 
      room.id === selectedRoom 
        ? { 
            ...room, 
            status: "occupied", 
            guest: { 
              ...checkInData, 
              guests: parseInt(checkInData.guests) 
            } 
          }
        : room
    ));

    // Play check-in sound
    if (window.playLokalSound) {
      window.playLokalSound("ready");
    }

    toast({
      title: "Guest Checked In",
      description: `${checkInData.name} checked into room ${selectedRoom}`,
    });

    setShowCheckInDialog(false);
    setSelectedRoom(null);
    setCheckInData({ name: "", phone: "", guests: "1", checkIn: new Date().toISOString().split('T')[0] });
  };

  const handleCheckOut = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.guest) return;

    const roomCharges = room.price;
    const orderCharges = room.orders.reduce((sum, order) => sum + order.amount, 0);
    const totalAmount = roomCharges + orderCharges;

    setRooms(prev => prev.map(r => 
      r.id === roomId 
        ? { ...r, status: "vacant", guest: null, orders: [] }
        : r
    ));

    // Play check-out sound
    if (window.playLokalSound) {
      window.playLokalSound("ready");
    }

    toast({
      title: "Guest Checked Out",
      description: `Total bill: ₹${totalAmount} (Room: ₹${roomCharges} + Orders: ₹${orderCharges})`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vacant": return "bg-green-100 text-green-800";
      case "occupied": return "bg-blue-100 text-blue-800";
      case "cleaning": return "bg-yellow-100 text-yellow-800";
      case "maintenance": return "bg-red-100 text-red-800";
      case "reserved": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-500 mt-1">Manage hotel rooms and guest bookings</p>
        </div>
        
        <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <User className="h-4 w-4 mr-2" />
              Check In Guest
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guest Check-In</DialogTitle>
              <DialogDescription>Enter guest details for room check-in</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Select Room</Label>
                <Select value={selectedRoom || ""} onValueChange={setSelectedRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose available room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.filter(room => room.status === "vacant").map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.id} - {room.type} (₹{room.price}/night)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Guest Name *</Label>
                <Input
                  value={checkInData.name}
                  onChange={(e) => setCheckInData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter guest name"
                />
              </div>

              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={checkInData.phone}
                  onChange={(e) => setCheckInData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label>Number of Guests</Label>
                <Select value={checkInData.guests} onValueChange={(value) => setCheckInData(prev => ({ ...prev, guests: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Guest</SelectItem>
                    <SelectItem value="2">2 Guests</SelectItem>
                    <SelectItem value="3">3 Guests</SelectItem>
                    <SelectItem value="4">4 Guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Check-in Date</Label>
                <Input
                  type="date"
                  value={checkInData.checkIn}
                  onChange={(e) => setCheckInData(prev => ({ ...prev, checkIn: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCheckInDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCheckIn}>
                Check In Guest
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card key={room.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Bed className="h-5 w-5 mr-2 text-blue-600" />
                  {room.id}
                </CardTitle>
                <Badge className={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </div>
              <CardDescription>
                {room.type} Room • ₹{room.price}/night
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {room.guest && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">{room.guest.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-2" />
                      {room.guest.phone}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-2" />
                      Check-in: {room.guest.checkIn}
                    </div>
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-2" />
                      {room.guest.guests} Guest(s)
                    </div>
                  </div>
                </div>
              )}

              {room.orders.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Room Service Orders</h4>
                  {room.orders.map((order) => (
                    <div key={order.id} className="flex justify-between text-sm">
                      <span>{order.id}</span>
                      <span>₹{order.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t">
                {room.status === "occupied" && room.guest ? (
                  <div className="text-sm">
                    <div className="flex items-center text-gray-600">
                      <IndianRupee className="h-3 w-3 mr-1" />
                      Total: ₹{room.price + room.orders.reduce((sum, order) => sum + order.amount, 0)}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Available for booking
                  </div>
                )}
                
                {room.status === "occupied" ? (
                  <Button 
                    size="sm" 
                    onClick={() => handleCheckOut(room.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Check Out
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedRoom(room.id);
                      setShowCheckInDialog(true);
                    }}
                    disabled={room.status !== "vacant"}
                  >
                    Check In
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rooms.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bed className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
            <p className="text-gray-500 text-center">
              Add rooms to start managing guest bookings
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
