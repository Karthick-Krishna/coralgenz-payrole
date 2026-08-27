"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole, Organization } from "@/types";
import { DEMO_ORGANIZATION, DEMO_USERS } from "@/lib/demo/demo-data";
import { MockDataStore } from "@/lib/store/mock-store";
import { isFirebaseConfigured, auth as firebaseAuth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { AuditService } from "@/lib/firebase/audit-service";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [baseRole, setBaseRole] = useState<UserRole>("employee");
  const [organization, setOrganization] = useState<Organization | null>(DEMO_ORGANIZATION);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isFirebaseConfigured);

  const isSuperAdmin = baseRole === "super_admin" || user?.email?.toLowerCase() === "karthick@coralgenz.co.in";

  // Helper to extract role / profile from Firestore or local store
  const resolveUserProfile = async (uid: string, email: string) => {
    let role: UserRole = "employee";
    let employeeId = "";
    let displayName = email.split("@")[0];
    let photoURL: string | undefined = undefined;

    // 1. Try local store first as baseline
    const storedUser = MockDataStore.getUserByEmail(email);
    const matchedEmp = MockDataStore.getEmployees().find((e) => e.email?.toLowerCase() === email);

    if (storedUser) {
      role = storedUser.role;
      employeeId = storedUser.employeeId || "";
      displayName = storedUser.displayName || displayName;
      photoURL = storedUser.photoURL;
    } else if (matchedEmp) {
      employeeId = matchedEmp.id;
      displayName = `${matchedEmp.firstName} ${matchedEmp.lastName}`;
      photoURL = matchedEmp.avatarUrl;
      const title = (matchedEmp.designationTitle || "").toLowerCase();
      if (title.includes("hr")) role = "hr_admin";
      else if (title.includes("payroll")) role = "payroll_manager";
      else if (title.includes("manager") || title.includes("lead")) role = "manager";
    }

    // 2. Try Firestore if permissions allow
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          role = data.role || role;
          employeeId = data.employeeId || employeeId;
          displayName = data.displayName || displayName;
          photoURL = data.photoURL || photoURL;
        }
      } catch {
        // Silently use local store profile on permission error
      }
    }

    if (email === "karthick@coralgenz.co.in") {
      role = "super_admin";
      displayName = "Karthick Krishna";
      employeeId = "CGG-EMP-0001";
    }

    return { role, employeeId, displayName, photoURL };
  };

  useEffect(() => {
    MockDataStore.initialize();
    
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (fbUser) {
          const email = fbUser.email?.toLowerCase().trim() || "";
          const profile = await resolveUserProfile(fbUser.uid, email);

          const matchedUser: User = {
            id: fbUser.uid,
            email: fbUser.email || email,
            displayName: profile.displayName,
            role: profile.role,
            employeeId: profile.employeeId,
            organizationId: "org-coralgenz-01",
            photoURL: fbUser.photoURL || profile.photoURL,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };
          setUser(matchedUser);
          setBaseRole(profile.role);
          setIsDemoMode(false);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    pass: string,
    expectedPortalRole?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.toLowerCase().trim();

    try {
      if (isFirebaseConfigured && firebaseAuth) {
        try {
          const userCredential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
          const fbUser = userCredential.user;
          const profile = await resolveUserProfile(fbUser.uid, cleanEmail);

          const isSuper = cleanEmail === "karthick@coralgenz.co.in";
          const isPortalAllowed =
            isSuper ||
            !expectedPortalRole ||
            expectedPortalRole === "employee" ||
            expectedPortalRole === profile.role;

          if (!isPortalAllowed && expectedPortalRole) {
            await fbSignOut(firebaseAuth);
            setIsLoading(false);
            return {
              success: false,
              error: `Access Denied: Your account role is '${profile.role}'. Please switch to the appropriate portal.`,
            };
          }

          const activeRole: UserRole = isSuper
            ? (expectedPortalRole || "super_admin")
            : (expectedPortalRole === "employee" ? "employee" : profile.role);

          const loggedUser: User = {
            id: fbUser.uid,
            email: fbUser.email || cleanEmail,
            displayName: profile.displayName,
            role: activeRole,
            employeeId: profile.employeeId,
            organizationId: "org-coralgenz-01",
            photoURL: fbUser.photoURL || profile.photoURL,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };

          setUser(loggedUser);
          setBaseRole(isSuper ? "super_admin" : activeRole);
          setIsDemoMode(false);
          setIsLoading(false);

          AuditService.logAction({
            userId: loggedUser.id,
            userName: loggedUser.displayName,
            userRole: loggedUser.role,
            action: "login",
            module: "auth",
            details: `User ${loggedUser.displayName} logged in to ${loggedUser.role} portal.`,
          });

          return { success: true };
        } catch (fbErr: any) {
          setIsLoading(false);
          const fbErrorCode = fbErr?.code || "";
          if (fbErrorCode === "auth/wrong-password" || fbErrorCode === "auth/invalid-credential") {
            return { success: false, error: "Incorrect password. Please verify your credentials." };
          }
          if (fbErrorCode === "auth/too-many-requests") {
            return { success: false, error: "Access temporarily disabled due to multiple failed login attempts." };
          }
          return { success: false, error: fbErr.message || "Authentication failed." };
        }
      } else {
        setIsLoading(false);
        return { success: false, error: "Firebase is not configured properly." };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Authentication failed." };
    }
  };

  const loginAsDemoRole = async (role: UserRole) => {
    // Demo helper
  };

  const switchRole = (newRole: UserRole): boolean => {
    if (!isSuperAdmin || !user) return false;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    return true;
  };

  const logout = async () => {
    setIsLoading(true);
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        await fbSignOut(firebaseAuth);
        if (user) {
          AuditService.logAction({
            userId: user.id,
            userName: user.displayName,
            userRole: user.role,
            action: "logout",
            module: "auth",
            details: `User ${user.displayName} logged out.`,
          });
        }
      } catch (e) {
        console.error("Firebase signout error:", e);
      }
    }
    setUser(null);
    setIsLoading(false);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        await sendPasswordResetEmail(firebaseAuth, email);
        return { success: true, message: "Password reset link sent to your registered email address." };
      } catch (err: any) {
        return { success: false, message: err.message || "Failed to send reset email" };
      }
    }
    return { success: false, message: "Firebase not configured." };
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates, updatedAt: new Date().toISOString() });
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
