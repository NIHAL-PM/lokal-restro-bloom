
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Bed, Users, Clock, Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RoomManagement() {
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState([
    {
      id: "R101",
      number: "101",
      type: "Deluxe",
      capacity: 2,
      pricePerNight: 2500,
      status: "occupied",
      guest: {
        name: "John Smith",
        phone: "+91 9876543210",
        checkIn: new Date(Date.now() - 86400000).toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        guests: 2
      },
      features: ["AC", "TV", "WiFi", "Balcony"]
    },
    {
      id: "R102",
      number: "102",
      type: "Standard",
      capacity: 2,
      pricePerNight: 1800,
      status: "vacant",
      guest: null,
      features: ["AC", "TV", "WiFi"]
    },
    {
      id: "R103",
      number: "103",
      type: "Suite",
      capacity: 4,
      pricePerNight: 4500,
      status: "cleaning",
      guest: null,
      features: ["AC", "TV", "WiFi", "Kitchen", "Balcony", "Bathtub"]
    },
    {
      id: "R201",
      number: "201",
      type: "Deluxe",
      capacity: 2,
      pricePerNight: 2500,
      status: "maintenance",
      guest: null,
      features: ["AC", "TV", "WiFi", "Balcony"]
    }
  ]);

  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkInForm, setCheckInForm] = useState({
    name: "",
    phone: "",
    email: "",
    idProof: "",
    guests: 1,
    checkOut: "",
    specialRequests: ""
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vacant": return "bg-green-100 text-green-800 border-green-200";
      case "occupied": return "bg-red-100 text-red-800 border-red-200";
      case "cleaning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "maintenance": return "bg-gray-100 text-gray-800 border-gray-200";
      case "reserved": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoomCardBorder = (status: string) => {
    switch (status) {
      case "vacant": return "border-l-green-500 bg-green-50";
      case "occupied": return "border-l-red-500 bg-red-50";
      case "cleaning": return "border-l-yellow-500 bg-yellow-50";
      case "maintenance": return "border-l-gray-500 bg-gray-50";
      case "reserved": return "border-l-blue-500 bg-blue-50";
      default: return "border-l-gray-500 bg-gray-50";
    }
  };

  const handleCheckIn = () => {
    if (!checkInForm.name || !checkInForm.phone || !checkInForm.checkOut) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const updatedRoom = {
      ...selectedRoom,
      status: "occupied",
      guest: {
        name: checkInForm.name,
        phone: checkInForm.phone,
        email: checkInForm.email,
        checkIn: new Date().toISOString(),
        checkOut: new Date(checkInForm.checkOut).toISOString(),
        guests: parseInt(checkInForm.guests),
        specialRequests: checkInForm.specialRequests
      }
    };

    setRooms(prev => prev.map(room => 
      room.id === selectedRoom.id ? updatedRoom : room
    ));

    if (window.playLokalSound) {
      window.playLokalSound("order");
    }

    toast({
      title: "Guest Checked In",
      description: `${checkInForm.name} checked into room ${selectedRoom.number}`,
    });

    setShowCheckInDialog(false);
    setSelectedRoom(null);
    setCheckInForm({
      name: "",
      phone: "",
      email: "",
      idProof: "",
      guests: 1,
      checkOut: "",
      specialRequests: ""
    });
  };

  const handleCheckOut = (room) => {
    const updatedRoom = {
      ...room,
      status: "cleaning",
      guest: null
    };

    setRooms(prev => prev.map(r => 
      r.id === room.id ? updatedRoom : r
    ));

    if (window.playLokalSound) {
      window.playLokalSound("order");
    }

    toast({
      title: "Guest Checked Out",
      description: `Room ${room.number} is now available for cleaning`,
    });
  };

  const updateRoomStatus = (roomId: string, newStatus: string) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, status: newStatus } : room
    ));

    toast({
      title: "Room Status Updated",
      description: `Room status changed to ${newStatus}`,
    });
  };

  const getOccupiedDuration = (checkIn: string) => {
    if (!checkIn) return "";
    const hours = Math.floor((Date.now() - new Date(checkIn).getTime()) / 3600000);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const vacantRooms = rooms.filter(r => r.status === "vacant").length;
  const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
  const totalGuests = rooms.reduce((sum, room) => sum + (room.guest?.guests || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-500 mt-1">Manage hotel rooms and guest bookings</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Available Rooms</CardTitle>
            <Bed className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{vacantRooms}</div>
            <p className="text-xs text-green-600">Ready for booking</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Occupied Rooms</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{occupiedRooms}</div>
            <p className="text-xs text-red-600">Currently occupied</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Guests</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalGuests}</div>
            <p className="text-xs text-blue-600">Currently staying</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Occupancy Rate</CardTitle>
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">{Math.round((occupiedRooms / rooms.length) * 100)}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{Math.round((occupiedRooms / rooms.length) * 100)}%</div>
            <p className="text-xs text-purple-600">Current occupancy</p>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card key={room.id} className={`border-0 shadow-lg border-l-4 transition-all hover:shadow-xl ${getRoomCardBorder(room.status)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Room {room.number}</CardTitle>
                <Badge className={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </div>
              <CardDescription>
                {room.type} • ₹{room.pricePerNight}/night • Capacity: {room.capacity}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {room.guest && (
                <div className="space-y-2 p-3 bg-white rounded border">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">{room.guest.name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {room.guest.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Staying for: {getOccupiedDuration(room.guest.checkIn)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Check-out: {new Date(room.guest.checkOut).toLocaleDateString()}
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                <strong>Features:</strong> {room.features.join(", ")}
              </div>
              
              <div className="flex space-x-2">
                {room.status === "vacant" && (
                  <Dialog open={showCheckInDialog && selectedRoom?.id === room.id} onOpenChange={(open) => {
                    setShowCheckInDialog(open);
                    if (open) setSelectedRoom(room);
                    else setSelectedRoom(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex-1">
                        Check In
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Check In Guest - Room {room.number}</DialogTitle>
                        <DialogDescription>Enter guest details for check-in</DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="guestName">Guest Name *</Label>
                            <Input
                              id="guestName"
                              value={checkInForm.name}
                              onChange={(e) => setCheckInForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Full name"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="guestPhone">Phone Number *</Label>
                            <Input
                              id="guestPhone"
                              value={checkInForm.phone}
                              onChange={(e) => setCheckInForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+91 9876543210"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="guestEmail">Email</Label>
                          <Input
                            id="guestEmail"
                            type="email"
                            value={checkInForm.email}
                            onChange={(e) => setCheckInForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="guest@example.com"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="guestCount">Number of Guests</Label>
                            <Select value={String(checkInForm.guests)} onValueChange={(value) => setCheckInForm(prev => ({ ...prev, guests: parseInt(value) }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: room.capacity }, (_, i) => (
                                  <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="checkOutDate">Check-out Date *</Label>
                            <Input
                              id="checkOutDate"
                              type="date"
                              value={checkInForm.checkOut}
                              onChange={(e) => setCheckInForm(prev => ({ ...prev, checkOut: e.target.value }))}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="specialRequests">Special Requests</Label>
                          <Textarea
                            id="specialRequests"
                            value={checkInForm.specialRequests}
                            onChange={(e) => setCheckInForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                            placeholder="Any special requirements..."
                            rows={3}
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
                )}
                
                {room.status === "occupied" && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleCheckOut(room)}
                    className="flex-1"
                  >
                    Check Out
                  </Button>
                )}
                
                {room.status === "cleaning" && (
                  <Button 
                    size="sm" 
                    onClick={() => updateRoomStatus(room.id, "vacant")}
                    className="flex-1"
                  >
                    Mark Clean
                  </Button>
                )}
                
                {room.status === "maintenance" && (
                  <Button 
                    size="sm" 
                    onClick={() => updateRoomStatus(room.id, "vacant")}
                    className="flex-1"
                  >
                    Fixed
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2 pt-2 border-t">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {room.status !== "maintenance" && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateRoomStatus(room.id, "maintenance")}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    Maintenance
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
