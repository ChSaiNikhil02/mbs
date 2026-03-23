import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/integrations/apiClient"; // Import apiClient
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Home, Phone, Shield, Save, ChevronRight } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser, token } = useAuth();
  // const [fullName, setFullName] = useState(user?.full_name || ""); // Removed fullName state
  const [address, setAddress] = useState(user?.address || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // setFullName(user.full_name || ""); // Removed fullName initialization
      setAddress(user.address || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    setSaving(true);
    try {
      await apiClient("users/me", {
        method: "PATCH",
        token: token,
        data: { address: address, phone: phone }, // Send updated data without full_name
      });
      toast({ title: "Profile updated" });
      await refreshUser(); // Refresh user data in context
    } catch (error: any) {
      toast({ title: "Error", description: error.detail || "Failed to update profile.", variant: "destructive" });
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <Card className="shadow-banking">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-display text-2xl font-bold">
              {user.username?.charAt(0)?.toUpperCase() || "U"} {/* Display username initial */}
            </div>
            <div>
              <CardTitle className="font-display">{user.username}</CardTitle> {/* Display username */}
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Link 
                to="/dashboard/kyc" 
                className="flex items-center gap-1.5 mt-1 hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors w-fit group"
                title="View KYC Verification"
              >
                <div className={`h-2 w-2 rounded-full ${user.kyc_status === "approved" ? "bg-success" : "bg-warning"}`} />
                <span className="text-xs text-muted-foreground capitalize group-hover:text-foreground transition-colors">
                  {user.kyc_status}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-all" />
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Removed Full Name input */}
            {/*
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" />
              </div>
            </div>
            */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label> {/* Display username as read-only */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" value={user.username} disabled className="pl-10 opacity-60" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" value={user.email} disabled className="pl-10 opacity-60" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" placeholder="Your address" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" placeholder="Your phone number" />
              </div>
            </div>
            <Button type="submit" className="gradient-primary text-primary-foreground" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
