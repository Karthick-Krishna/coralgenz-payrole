"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole, Organization, Employee } from "@/types";
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
          const email = fbUser.email?.toLowerCase().trim() || "";
          const isSuper = email === "karthick@coralgenz.co.in";
          const storedUser = MockDataStore.getUserByEmail(email);
          const empList = MockDataStore.getEmployees();
          const matchedEmp = empList.find((e) => e.email?.toLowerCase() === email);

          const role: UserRole = isSuper 
            ? "super_admin" 
            : (storedUser?.role || (matchedEmp ? "employee" : "employee"));

          const matchedUser: User = {
            id: fbUser.uid,
            email: fbUser.email || email,
            displayName: isSuper 
              ? "Karthick Krishna"
              : (storedUser?.displayName || (matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}` : (fbUser.displayName || email.split("@")[0]))),
            role: role,
            employeeId: isSuper ? "CGG-EMP-0001" : (matchedEmp?.id || storedUser?.employeeId),
            organizationId: org.id,
            photoURL: fbUser.photoURL || matchedEmp?.avatarUrl || storedUser?.photoURL || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };
          setUser(matchedUser);
          setBaseRole(isSuper ? "super_admin" : role);
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
      const isSuper = cleanEmail === "karthick@coralgenz.co.in";
      const registeredUser = MockDataStore.getUserByEmail(cleanEmail);
      const empList = MockDataStore.getEmployees();
      const matchedEmp = empList.find((e) => e.email?.toLowerCase() === cleanEmail);

      // Infer role from employee designation/department if not explicitly registered
      const inferRole = (emp?: Employee): UserRole => {
        if (!emp) return "employee";
        const title = (emp.designationTitle || "").toLowerCase();
        const dept = (emp.departmentName || "").toLowerCase();
        if (title.includes("hr") || title.includes("human resource") || dept.includes("human resource") || dept.includes("talent")) return "hr_admin";
        if (title.includes("payroll") || title.includes("finance") || title.includes("accounts") || dept.includes("payroll") || dept.includes("finance")) return "payroll_manager";
        if (title.includes("manager") || title.includes("lead") || title.includes("director") || title.includes("head") || title.includes("vp")) return "manager";
        return "employee";
      };

      const userRole: UserRole = isSuper
        ? "super_admin"
        : (registeredUser?.role || inferRole(matchedEmp));

      // Portal Access Validation:
      // - Super Admin can access all portals
      // - Any staff member can access Employee Self-Service (ESS)
      // - Roles can access their specific designated portals
      const isPortalAllowed =
        isSuper ||
        !expectedPortalRole ||
        expectedPortalRole === "employee" ||
        expectedPortalRole === userRole;

      if (!isPortalAllowed && expectedPortalRole) {
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
          error: `Access Denied: This portal is strictly for ${roleNames[expectedPortalRole]}. Your account is assigned as '${roleNames[userRole]}'. Please switch to the ${roleNames[userRole]} tab.`,
        };
      }

      // Determine active role for this session
      const activeRole: UserRole = isSuper
        ? (expectedPortalRole || "super_admin")
        : (expectedPortalRole === "employee" ? "employee" : userRole);

      // 1. Direct Live Firebase Authentication
      if (isFirebaseConfigured && firebaseAuth) {
        try {
          const userCredential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
          const fbUser = userCredential.user;

          const loggedUser: User = {
            id: fbUser.uid,
            email: fbUser.email || cleanEmail,
            displayName: isSuper
              ? "Karthick Krishna"
              : (registeredUser?.displayName || (matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}` : (fbUser.displayName || cleanEmail.split("@")[0]))),
            role: activeRole,
            employeeId: isSuper ? "CGG-EMP-0001" : (matchedEmp?.id || registeredUser?.employeeId),
            organizationId: organization?.id || "org-coralgenz-01",
            photoURL: fbUser.photoURL || matchedEmp?.avatarUrl || registeredUser?.photoURL || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };

          setUser(loggedUser);
          setBaseRole(isSuper ? "super_admin" : activeRole);
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(loggedUser));
          localStorage.setItem(BASE_ROLE_STORAGE_KEY, isSuper ? "super_admin" : activeRole);
          setIsDemoMode(false);
          setIsLoading(false);

          MockDataStore.logAudit({
            userId: loggedUser.id,
            userName: loggedUser.displayName,
            userRole: loggedUser.role,
            action: "login",
            module: "auth",
            details: `Firebase Live Authentication successful for ${loggedUser.displayName} (${loggedUser.email}) as ${loggedUser.role}.`,
          });

          return { success: true };
        } catch (fbErr: unknown) {
          const errObj = fbErr as { code?: string; message?: string };
          const fbErrorCode = errObj?.code || "";

          // Check if local store credentials match
          const isLocalValid = MockDataStore.verifyCredentials(cleanEmail, pass);
          if (!isLocalValid) {
            if (fbErrorCode === "auth/wrong-password" || fbErrorCode === "auth/invalid-credential") {
              setIsLoading(false);
              return {
                success: false,
                error: "Incorrect password for this account. Please verify your credentials.",
              };
            }
          }

          if (fbErrorCode === "auth/too-many-requests") {
            setIsLoading(false);
            return {
              success: false,
              error: "Access temporarily disabled due to multiple failed login attempts. Please try again in a few moments.",
            };
          }

          console.warn("Firebase Auth fallback to local store:", fbErrorCode);
        }
      }

      // 2. Local / Database Store Authentication
      const isPasswordValid = MockDataStore.verifyCredentials(cleanEmail, pass);
      if (!isPasswordValid) {
        setIsLoading(false);
        return {
          success: false,
          error: "Incorrect password. Please verify the password provided during account creation.",
        };
      }

      let loggedUser: User;
      if (registeredUser) {
        loggedUser = {
          ...registeredUser,
          role: activeRole,
          employeeId: registeredUser.employeeId || matchedEmp?.id,
          photoURL: registeredUser.photoURL || matchedEmp?.avatarUrl,
        };
      } else if (matchedEmp) {
        loggedUser = {
          id: `usr-emp-${matchedEmp.id}`,
          email: cleanEmail,
          displayName: `${matchedEmp.firstName} ${matchedEmp.lastName}`,
          role: activeRole,
          employeeId: matchedEmp.id,
          photoURL: matchedEmp.avatarUrl,
          organizationId: organization?.id || "org-coralgenz-01",
          phone: matchedEmp.phone,
          createdAt: matchedEmp.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        };
      } else {
        loggedUser = {
          id: `usr-${Date.now()}`,
          email: cleanEmail,
          displayName: isSuper ? "Karthick Krishna" : cleanEmail.split("@")[0].replace(".", " ").toUpperCase(),
          role: activeRole,
          organizationId: organization?.id || "org-coralgenz-01",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        };
      }

      setUser(loggedUser);
      setBaseRole(activeRole);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(loggedUser));
      localStorage.setItem(BASE_ROLE_STORAGE_KEY, activeRole);
      setIsDemoMode(true);
      setIsLoading(false);

      MockDataStore.logAudit({
        userId: loggedUser.id,
        userName: loggedUser.displayName,
        userRole: loggedUser.role,
        action: "login",
        module: "auth",
        details: `User ${loggedUser.displayName} (${loggedUser.email}) logged in to ${loggedUser.role} portal.`,
      });

      return { success: true };
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
