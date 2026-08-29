"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { NotificationService } from "@/lib/firebase/notification-service";
import { AttendanceService } from "@/lib/firebase/attendance-service";
import { NotificationItem } from "@/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials, cn } from "@/lib/utils";
import {
  Menu,
  Search,
  Bell,
  Check,
  User,
  Settings,
  LogOut,
  Clock,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export function Header({ onOpenMobileMenu, onOpenSearch }: HeaderProps) {
  const router = useRouter();
  const { user, currentRole, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifs = async () => {
      const all = await NotificationService.getNotifications(user?.id);
      setNotifications(all);

      // Check today's attendance for current user
      if (user?.employeeId) {
        const today = new Date().toISOString().split("T")[0];
        const att = await AttendanceService.getAttendance(user.employeeId);
        const myAtt = att.find((a) => a.date === today);
        setTodayCheckedIn(Boolean(myAtt?.checkIn && !myAtt?.checkOut));
      }
    };

    loadNotifs();
    window.addEventListener("coralgenz_store_updated", loadNotifs);
    return () => window.removeEventListener("coralgenz_store_updated", loadNotifs);
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await NotificationService.markAllAsRead(user.id);
      const updated = await NotificationService.getNotifications(user.id);
      setNotifications(updated);
    }
  };

  const handleQuickCheckIn = async () => {
    if (!user?.employeeId) {
      router.push("/attendance");
      return;
    }
    
    const today = new Date().toISOString().split("T")[0];
    const time = new Date().toISOString();
    
    if (todayCheckedIn) {
      await AttendanceService.logAttendance({
         employeeId: user.employeeId,
         date: today,
         checkOut: time,
         status: 'present'
      });
      setTodayCheckedIn(false);
    } else {
      await AttendanceService.logAttendance({
         employeeId: user.employeeId,
         employeeName: user.displayName,
         date: today,
         checkIn: time,
         status: 'present'
      });
      setTodayCheckedIn(true);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Mobile Toggle & Global Search trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 text-xs font-medium transition-all group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-coral-500 transition-colors" />
          <span className="hidden sm:inline">Search anything in Coralgenz...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side: Quick Check-in, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Check-in Button */}
        <Button
          variant={todayCheckedIn ? "success" : "outline"}
          size="sm"
          onClick={handleQuickCheckIn}
          leftIcon={<Clock className="w-3.5 h-3.5" />}
          className="hidden md:inline-flex"
        >
          {todayCheckedIn ? "Checked In" : "Quick Check-in"}
        </Button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-coral-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <Badge variant="coral" size="sm">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-coral-600 hover:text-coral-700 dark:text-coral-400 font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={async () => {
                        await NotificationService.markAsRead(notif.id);
                        if (notif.link) router.push(notif.link);
                        setShowNotifications(false);
                      }}
                      className={cn(
                        "p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left flex items-start gap-3",
                        !notif.isRead && "bg-coral-50/30 dark:bg-coral-950/20"
                      )}
                    >
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-coral-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-coral-500 dark:text-slate-400"
                >
                  View Notifications Center &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-coral-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {getInitials(user?.displayName)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {user?.displayName || "User"}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">
                {(currentRole || "employee").replace("_", " ")}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {user?.displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
                <Badge variant="coral" size="sm" className="mt-1.5">
                  {(currentRole || "employee").replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Organization Settings</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
