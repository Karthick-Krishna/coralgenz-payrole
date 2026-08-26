"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole, Organization } from "@/types";
import { DEMO_USERS, DEMO_ORGANIZATION } from "@/lib/demo/demo-data";
import { MockDataStore } from "@/lib/store/mock-store";
import { isFirebaseConfigured, auth as firebaseAuth } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  currentRole: UserRole;
  isSuperAdmin: boolean;
  organization: Organization | null;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string, expectedPortalRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoRole: (role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => boolean;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updateCurrentUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = "coralgenz_auth_user";
const BASE_ROLE_STORAGE_KEY = "coralgenz_auth_base_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [baseRole, setBaseRole] = useState<UserRole>("employee");
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isFirebaseConfigured);

  const isSuperAdmin = baseRole === "super_admin" || user?.email?.toLowerCase() === "karthick@coralgenz.co.in";

  useEffect(() => {
    // Initialize mock data store
    MockDataStore.initialize();
    const org = MockDataStore.getOrganization();
    setOrganization(org);

    // Listen for storage events across tabs or local updates
    const handleStoreUpdate = () => {
      setOrganization(MockDataStore.getOrganization());
    };
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);

    // Check Firebase Auth or Local Session
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
        if (fbUser) {
          const email = fbUser.email?.toLowerCase() || "";
          const storedUser = MockDataStore.getUserByEmail(email);
          const role: UserRole = email === "karthick@coralgenz.co.in" 
            ? "super_admin" 
            : (storedUser?.role || "employee");

          const matchedUser: User = {
            id: fbUser.uid,
            email: fbUser.email || "karthick@coralgenz.co.in",
            displayName: fbUser.displayName || storedUser?.displayName || "Karthick Krishna",
            role: role,
            organizationId: org.id,
            photoURL: fbUser.photoURL || storedUser?.photoURL || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };
          setUser(matchedUser);
          setBaseRole(role);
          setIsDemoMode(false);
        } else {
          checkSavedLocalUser();
        }
        setIsLoading(false);
      });
      return () => {
        unsubscribe();
        window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
      };
    } else {
      checkSavedLocalUser();
      setIsLoading(false);
      return () => {
        window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
      };
    }
  }, []);

  const checkSavedLocalUser = () => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      const savedBase = localStorage.getItem(BASE_ROLE_STORAGE_KEY) as UserRole | null;
      if (saved) {
        const parsed = JSON.parse(saved) as User;
        setUser(parsed);
        setBaseRole(savedBase || parsed.role || "super_admin");
      } else {
        // Default to Super Admin profile
        const defaultUser = DEMO_USERS[0];
        setUser(defaultUser);
        setBaseRole(defaultUser.role);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(defaultUser));
        localStorage.setItem(BASE_ROLE_STORAGE_KEY, defaultUser.role);
      }
    } catch {
      setUser(DEMO_USERS[0]);
      setBaseRole(DEMO_USERS[0].role);
    }
  };

  const login = async (
    email: string,
    pass: string,
    expectedPortalRole?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Check user registry in MockDataStore
      const registeredUser = MockDataStore.getUserByEmail(cleanEmail);
      const isSuper = cleanEmail === "karthick@coralgenz.co.in" || registeredUser?.role === "super_admin";

      // 2. Validate role against specific portal if requested
      if (expectedPortalRole && !isSuper) {
        const actualRole = registeredUser?.role || (cleanEmail.includes("employee") ? "employee" : "employee");
        if (actualRole !== expectedPortalRole) {
          const roleNames: Record<UserRole, string> = {
            super_admin: "Super Admin",
            hr_admin: "HR Administrator",
            payroll_manager: "Payroll Manager",
            manager: "Team Manager",
            employee: "Employee",
          };
          setIsLoading(false);
          return {
            success: false,
            error: `Access Denied: This portal is strictly for ${roleNames[expectedPortalRole]}. Your account is assigned as '${roleNames[actualRole]}'. Please switch to your designated portal.`,
          };
        }
      }

      if (isFirebaseConfigured && firebaseAuth) {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
        const fbUser = userCredential.user;
        const assignedRole: UserRole = isSuper ? (expectedPortalRole || "super_admin") : (registeredUser?.role || "employee");

        const loggedUser: User = {
          id: fbUser.uid,
          email: fbUser.email || email,
          displayName: registeredUser?.displayName || fbUser.displayName || (isSuper ? "Karthick Krishna" : email.split("@")[0]),
          role: assignedRole,
          organizationId: organization?.id || "org-coralgenz-01",
          photoURL: fbUser.photoURL || registeredUser?.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        };

        setUser(loggedUser);
        setBaseRole(isSuper ? "super_admin" : assignedRole);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(loggedUser));
        localStorage.setItem(BASE_ROLE_STORAGE_KEY, isSuper ? "super_admin" : assignedRole);
        setIsDemoMode(false);
        setIsLoading(false);
        return { success: true };
      } else {
        // Fallback / Local Mode
        let loggedUser: User;
        const actualBaseRole: UserRole = isSuper ? "super_admin" : (registeredUser?.role || "employee");
        const activeRole: UserRole = isSuper ? (expectedPortalRole || "super_admin") : actualBaseRole;

        if (registeredUser) {
          loggedUser = { ...registeredUser, role: activeRole };
        } else if (cleanEmail.includes("employee") || cleanEmail.endsWith("@coralgenz.com") || cleanEmail.endsWith("@coralgenz.co.in")) {
          const empList = MockDataStore.getEmployees();
          const matchedEmp =
            empList.find((e) => e.email?.toLowerCase() === cleanEmail) ||
            empList.find((e) => e.id === "CGG-EMP-0002") ||
            empList[0];

          loggedUser = {
            id: `usr-emp-${matchedEmp?.id || "0002"}`,
            email: cleanEmail,
            displayName: matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}` : "Employee",
            role: "employee",
            employeeId: matchedEmp?.id || "CGG-EMP-0002",
            organizationId: organization?.id || "org-coralgenz-01",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };
        } else {
          loggedUser = {
            id: `usr-${Date.now()}`,
            email: cleanEmail,
            displayName: cleanEmail.split("@")[0].replace(".", " ").toUpperCase(),
            role: activeRole,
            organizationId: organization?.id || "org-coralgenz-01",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };
        }

        setUser(loggedUser);
        setBaseRole(actualBaseRole);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(loggedUser));
        localStorage.setItem(BASE_ROLE_STORAGE_KEY, actualBaseRole);
        setIsDemoMode(true);
        setIsLoading(false);

        MockDataStore.logAudit({
          userId: loggedUser.id,
          userName: loggedUser.displayName,
          userRole: loggedUser.role,
          action: "login",
          module: "auth",
          details: `User ${loggedUser.displayName} logged in (${loggedUser.role})`,
        });

        return { success: true };
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const errorMsg = err instanceof Error ? err.message : "Authentication failed. Please check your credentials.";
      return { success: false, error: errorMsg };
    }
  };

  const loginAsDemoRole = async (role: UserRole) => {
    setIsLoading(true);
    const matched = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    const demoUser = { ...matched, role };
    setUser(demoUser);
    setBaseRole(role === "super_admin" ? "super_admin" : role);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(demoUser));
    localStorage.setItem(BASE_ROLE_STORAGE_KEY, role);
    setIsDemoMode(true);
    setIsLoading(false);

    MockDataStore.logAudit({
      userId: demoUser.id,
      userName: demoUser.displayName,
      userRole: role,
      action: "login",
      module: "auth",
      details: `Logged in via direct role portal: ${role.replace("_", " ").toUpperCase()}`,
    });
  };

  const switchRole = (newRole: UserRole): boolean => {
    // STRICT RULE: Only Super Admin is allowed to switch perspectives in-session
    if (!isSuperAdmin) {
      return false;
    }
    if (!user) return false;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
    return true;
  };

  const logout = async () => {
    setIsLoading(true);
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        await fbSignOut(firebaseAuth);
      } catch (e) {
        console.error("Firebase signout error:", e);
      }
    }
    if (user) {
      MockDataStore.logAudit({
        userId: user.id,
        userName: user.displayName,
        userRole: user.role,
        action: "logout",
        module: "auth",
        details: `User ${user.displayName} logged out`,
      });
    }
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    setUser(null);
    setIsLoading(false);
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        await sendPasswordResetEmail(firebaseAuth, email);
        return {
          success: true,
          message: "Password reset link sent to your registered email address.",
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to send reset email";
        return {
          success: false,
          message: errorMsg,
        };
      }
    } else {
      return {
        success: true,
        message: `(Demo Mode) Password reset link has been dispatched to ${email}.`,
      };
    }
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole: user?.role || "employee",
        isSuperAdmin,
        organization,
        isLoading,
        isDemoMode,
        login,
        loginAsDemoRole,
        switchRole,
        logout,
        resetPassword,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
