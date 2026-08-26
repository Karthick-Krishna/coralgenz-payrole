"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { getInitials } from "@/lib/utils";
import { User, Mail, Phone, Lock, Save, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user, currentRole, updateCurrentUser } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState(user?.phone || "+91 98765 43210");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      error("Name Required", "Please enter your name.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      updateCurrentUser({ displayName: name, phone });
      success("Profile Updated", "Your profile details have been saved.");
      setIsSaving(false);
    }, 400);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) {
      error("Weak Password", "New password must be at least 8 characters.");
      return;
    }

    success("Password Updated", "Security credentials updated successfully.");
    setCurrentPass("");
    setNewPass("");
  };

  return (
    <AppLayout module="dashboard">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Profile Card */}
        <Card className="overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-slate-900 to-coral-900" />
          <div className="p-6 pt-0 -mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-coral-500 to-amber-500 text-white font-bold text-2xl flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl shrink-0">
                {getInitials(user?.displayName)}
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {user?.displayName}
                </h1>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <Badge variant="coral" size="sm" className="capitalize">
                  {currentRole.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  label="Display Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Official Email (Immutable)"
                  disabled
                  value={user?.email || ""}
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />

                <Button
                  type="submit"
                  variant="coral"
                  size="sm"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Profile Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security & Password */}
          <Card>
            <CardHeader>
              <CardTitle>Security & Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                <Input
                  label="New Password"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  helperText="Minimum 8 characters"
                />

                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  leftIcon={<Shield className="w-4 h-4" />}
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
