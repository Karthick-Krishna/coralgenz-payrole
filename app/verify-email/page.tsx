"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="border-slate-800 bg-slate-900 shadow-2xl text-center">
          <CardContent className="p-8 space-y-5">
            <div className="w-14 h-14 rounded-3xl bg-coral-500/20 text-coral-400 flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Verify Your Corporate Email</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                A verification link has been sent to your work email. Click the link to activate your workspace profile.
              </p>
            </div>

            <div className="pt-3">
              <Button
                variant="coral"
                size="md"
                onClick={() => (window.location.href = "/login")}
                className="w-full font-semibold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
