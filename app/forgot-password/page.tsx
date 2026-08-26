"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error("Email required", "Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    const res = await resetPassword(email);
    setIsLoading(false);

    if (res.success) {
      setIsSubmitted(true);
      success("Reset Link Sent", res.message);
    } else {
      error("Failed", res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-coral-500 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-glow">
          C
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Reset Your Password
        </h2>
        <p className="text-xs text-slate-400">
          We will send secure recovery instructions to your corporate email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="border-slate-800 bg-slate-900 shadow-2xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Registered Work Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@coralgenz.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  className="bg-slate-950 border-slate-700 text-white"
                />

                <Button
                  type="submit"
                  variant="coral"
                  isLoading={isLoading}
                  className="w-full font-bold shadow-lg"
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Send Recovery Link
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Check Your Inbox</h4>
                <p className="text-xs text-slate-400">
                  Password reset link has been dispatched to <span className="text-white font-semibold">{email}</span>.
                </p>
              </div>
            )}

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
