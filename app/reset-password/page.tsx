"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      error("Weak Password", "Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      error("Mismatch", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      success("Password Reset Successful", "You can now log in with your new password.");
      router.push("/login");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-coral-500 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-glow">
          C
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Create New Password
        </h2>
        <p className="text-xs text-slate-400">
          Enter your new secure corporate access password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="border-slate-800 bg-slate-900 shadow-2xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                className="bg-slate-950 border-slate-700 text-white"
                helperText="Minimum 8 alphanumeric characters"
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                className="bg-slate-950 border-slate-700 text-white"
              />

              <Button
                type="submit"
                variant="coral"
                isLoading={isLoading}
                className="w-full font-bold shadow-lg"
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Update Password & Sign In
              </Button>
            </form>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-slate-400 hover:text-coral-400 inline-flex items-center gap-1.5 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
