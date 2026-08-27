"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { GlobalSearch } from "@/components/shared/global-search";
import { RoleGuard } from "./role-guard";
import { Permission } from "@/lib/permissions/rbac";
import { UserRole } from "@/types";

interface AppLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  permission?: Permission;
  module?: string;
}

export function AppLayout({
  children,
  allowedRoles,
  permission,
  module,
}: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-row font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-40">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-[280px] sm:max-w-xs w-full bg-slate-900 shadow-2xl z-50 animate-in slide-in-from-left duration-250">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 p-3.5 sm:p-5 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          <RoleGuard allowedRoles={allowedRoles} permission={permission} module={module}>
            {children}
          </RoleGuard>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Global Search Dialog */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
