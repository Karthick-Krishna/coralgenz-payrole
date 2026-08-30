"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/types";
import { hasPermission, Permission, canAccessModule } from "@/lib/permissions/rbac";
import { FireLogoLoader } from "@/components/ui/fire-logo-loader";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  permission?: Permission;
  module?: string;
  redirectToUnauthorized?: boolean;
}

export function RoleGuard({
  children,
  allowedRoles,
  permission,
  module,
  redirectToUnauthorized = false,
}: RoleGuardProps) {
  const { currentRole, isLoading, user } = useAuth();
  const router = useRouter();

  const isPermitted = (): boolean => {
    if (currentRole === "super_admin") return true;

    if (allowedRoles && !allowedRoles.includes(currentRole)) {
      return false;
    }

    if (permission && !hasPermission(currentRole, permission)) {
      return false;
    }

    if (module && !canAccessModule(currentRole, module)) {
      return false;
    }

    return true;
  };

  const permitted = isPermitted();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!permitted && redirectToUnauthorized) {
        router.push("/unauthorized");
      }
    }
  }, [isLoading, permitted, redirectToUnauthorized, router, user]);

  if (isLoading || (!user && !isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[55vh] p-8">
        <FireLogoLoader
          size="md"
          message="Igniting Payroll System..."
          subMessage="Verifying role permissions with database server"
        />
      </div>
    );
  }

  if (!permitted) {
    if (redirectToUnauthorized) return null;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
          Your current role (<span className="font-semibold text-slate-700 dark:text-slate-300">{(currentRole || "employee").replace("_", " ")}</span>) does not have sufficient permissions to view this module.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
