"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { MockDataStore } from "@/lib/store/mock-store";
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

  const loadData = () => {
    setNotifications(MockDataStore.getNotifications(user?.id));
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, [user]);

  const handleMarkAllRead = () => {
    MockDataStore.markAllNotificationsRead();
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
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No notifications in your inbox.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    MockDataStore.markNotificationRead(notif.id);
                    if (notif.link) router.push(notif.link);
                  }}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        notif.isRead ? "bg-slate-300 dark:bg-slate-700" : "bg-coral-500"
                      }`}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <Badge variant="coral" size="sm">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block">
                        {formatDate(notif.createdAt, "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                  </div>

                  {notif.link && (
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
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
