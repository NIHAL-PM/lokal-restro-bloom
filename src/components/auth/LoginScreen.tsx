
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    pin: ""
  });
  const { toast } = useToast();

  const defaultUsers = {
    admin: { name: "Admin User", pin: "1234" },
    waiter: { name: "Waiter", pin: "1111" },
    chef: { name: "Chef", pin: "2222" },
    cashier: { name: "Cashier", pin: "3333" },
    housekeeping: { name: "Housekeeping", pin: "4444" }
  };

  const handleLogin = () => {
    if (!formData.name || !formData.role || !formData.pin) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Simple PIN validation for demo
    const defaultUser = defaultUsers[formData.role as keyof typeof defaultUsers];
    if (defaultUser && formData.pin === defaultUser.pin) {
      onLogin({
        name: formData.name,
        role: formData.role,
        loginTime: new Date().toISOString()
      });
      
      toast({
        title: "Welcome to LokalRestro!",
        description: `Logged in as ${formData.role}`,
      });
    } else {
      toast({
        title: "Invalid PIN",
        description: "Please check your credentials",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">LR</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">LokalRestro</CardTitle>
          <CardDescription>
            Restaurant & Hotel Management System
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="waiter">Waiter</SelectItem>
                <SelectItem value="chef">Chef</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="housekeeping">Housekeeping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              value={formData.pin}
              onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
              placeholder="Enter your PIN"
              className="mt-1"
              maxLength={4}
            />
          </div>

          <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Sign In
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Demo PINs: Admin(1234), Waiter(1111), Chef(2222), Cashier(3333), Housekeeping(4444)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
