"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth/auth-context";
import { NotificationItem } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Bell, Check, ArrowRight } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const url = user?.id ? `/api/notifications?userId=${encodeURIComponent(user.id)}` : "/api/notifications";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data?.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error("Error loading notifications:", e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleUpdate = () => loadData(false);
    window.addEventListener("coralgenz_store_updated", handleUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleUpdate);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      loadData(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
      }
    } catch {}
  };

  return (
    <AppLayout module="dashboard">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Notifications Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time updates on leave requests, payroll processing, and announcements.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Mark All as Read
          </Button>
        </div>

        <Card>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-coral-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                No unread notifications at this time.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    !notif.isRead ? "bg-coral-50/40 dark:bg-coral-950/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        !notif.isRead ? "bg-coral-500" : "bg-transparent"
                      }`}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {notif.title}
                        </span>
                        <Badge
                          variant={
                            notif.type === "leave_rejected"
                              ? "danger"
                              : notif.type === "leave_approved" || notif.type === "payslip_ready"
                              ? "success"
                              : "secondary"
                          }
                          size="sm"
                        >
                          {notif.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        {formatDate(notif.createdAt, "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                  </div>

                  {notif.link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(notif.link!)}
                      className="shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
