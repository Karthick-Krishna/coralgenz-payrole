"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MockDataStore } from "@/lib/store/mock-store";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Building2,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { success } = useToast();
  const [step, setStep] = useState(1);

  const [companyName, setCompanyName] = useState("Coralgenz Technologies Pvt. Ltd.");
  const [email, setEmail] = useState("admin@coralgenz.com");
  const [phone, setPhone] = useState("+91 80 4123 4567");
  const [address, setAddress] = useState("Tech Park, 4th Floor, Bellandur");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [country, setCountry] = useState("India");
  const [currency, setCurrency] = useState("INR");
  const [payrollFreq, setPayrollFreq] = useState<"monthly" | "bi_weekly" | "weekly">("monthly");
  const [empPrefix, setEmpPrefix] = useState("CGG-EMP-");

  const handleFinish = () => {
    MockDataStore.updateOrganization({
      name: companyName,
      email,
      phone,
      address,
      city,
      state,
      country,
      currency,
      payrollFrequency: payrollFreq,
      employeeIdPrefix: empPrefix,
      onboardingCompleted: true,
    });

    success("Onboarding Completed", "Organization setup initialized successfully!");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-coral-600 to-coral-400 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-glow">
          C
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Organization Setup Wizard
        </h1>
        <p className="text-xs text-slate-400">
          Configure your company profile, statutory defaults, and payroll preferences
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <Card className="border-slate-800 bg-slate-900 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
            <CardTitle className="text-base text-white">
              {step === 1 && "Step 1: Company Profile & Location"}
              {step === 2 && "Step 2: Payroll & Currency Configuration"}
            </CardTitle>
            <Badge variant="coral" size="sm">
              Step {step} of 2
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <Input
                  label="Company Name"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Official Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                  <Input
                    label="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                </div>

                <Input
                  label="Office Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white"
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                  <Input
                    label="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                  <Input
                    label="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Operating Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  >
                    <option value="INR">Indian Rupee (INR ₹)</option>
                    <option value="USD">US Dollar (USD $)</option>
                    <option value="EUR">Euro (EUR €)</option>
                  </Select>

                  <Select
                    label="Payroll Frequency"
                    value={payrollFreq}
                    onChange={(e) => setPayrollFreq(e.target.value as "monthly" | "bi_weekly" | "weekly")}
                    className="bg-slate-950 border-slate-700 text-white"
                  >
                    <option value="monthly">Monthly (Standard)</option>
                    <option value="bi_weekly">Bi-Weekly</option>
                    <option value="weekly">Weekly</option>
                  </Select>
                </div>

                <Input
                  label="Employee ID Prefix"
                  value={empPrefix}
                  onChange={(e) => setEmpPrefix(e.target.value.toUpperCase())}
                  className="bg-slate-950 border-slate-700 text-white"
                  helperText="Example: CGG-EMP-0001"
                />

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-coral-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Standard Indian Statutory Defaults Pre-configured:</span>
                  </div>
                  <p className="text-slate-400">• EPF (12% employee + 12% employer)</p>
                  <p className="text-slate-400">• ESI (0.75% for gross &le; ₹21,000)</p>
                  <p className="text-slate-400">• Professional Tax (PT Karnataka ₹200 slab)</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-800 bg-slate-950/50">
            {step === 2 ? (
              <Button variant="outline" size="sm" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
            ) : <div />}

            {step === 1 ? (
              <Button
                variant="coral"
                size="sm"
                onClick={() => setStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Payroll Config
              </Button>
            ) : (
              <Button
                variant="coral"
                size="sm"
                onClick={handleFinish}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Complete Onboarding & Enter App
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
