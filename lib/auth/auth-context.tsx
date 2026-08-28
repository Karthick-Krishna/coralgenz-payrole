"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole, Organization } from "@/types";
import { DEMO_ORGANIZATION } from "@/lib/demo/demo-data";
import { isFirebaseConfigured, auth as firebaseAuth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const isSuperAdmin = baseRole === "super_admin" || user?.email?.toLowerCase() === "karthick@coralgenz.co.in";

  // Pure Server Profile Resolver directly from Firestore & Server API
  const resolveUserProfile = async (uid: string, email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    let role: UserRole = "employee";
    let employeeId = "";
    let displayName = cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    let photoURL: string | undefined = undefined;

    // 1. Super Admin special identity
    if (cleanEmail === "karthick@coralgenz.co.in" || cleanEmail === "admin@coralgenz.co.in") {
      return {
        role: "super_admin" as UserRole,
        employeeId: "CGG-EMP-0001",
        displayName: "Karthick Krishna",
        photoURL: "/logo.png",
      };
    }

    // 2. Fetch authoritative profile from server endpoint
    try {
      const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(cleanEmail)}&uid=${encodeURIComponent(uid)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          return {
            role: data.profile.role as UserRole,
            employeeId: data.profile.employeeId || "",
            displayName: data.profile.displayName || displayName,
            photoURL: data.profile.photoURL || undefined,
          };
        }
      }
    } catch (e) {
      console.warn("Server profile API notice:", e);
    }

    // 3. Fallback client Firestore checks
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          role = (data.role as UserRole) || role;
          employeeId = data.employeeId || employeeId;
          displayName = data.displayName || displayName;
          photoURL = data.photoURL || photoURL;
        } else {
          const uQuery = query(collection(db, "users"), where("email", "==", cleanEmail));
          const uSnap = await getDocs(uQuery);
          if (!uSnap.empty) {
            const data = uSnap.docs[0].data();
            role = (data.role as UserRole) || role;
            employeeId = data.employeeId || employeeId;
            displayName = data.displayName || displayName;
            photoURL = data.photoURL || photoURL;
          }
        }

        const empQuery = query(collection(db, "employees"), where("email", "==", cleanEmail));
        const empSnap = await getDocs(empQuery);
        if (!empSnap.empty) {
          const emp = empSnap.docs[0].data();
          employeeId = emp.id || employeeId;
          displayName = `${emp.firstName} ${emp.lastName}`;
          photoURL = emp.avatarUrl || photoURL;
          if (emp.role) {
            role = emp.role as UserRole;
          } else {
            const title = (emp.designationTitle || "").toLowerCase();
            const dept = (emp.departmentName || "").toLowerCase();

            if (title.includes("super admin") || title.includes("founder") || title.includes("director")) {
              role = "super_admin";
            } else if (title.includes("hr") || title.includes("human resource") || dept.includes("human resource")) {
              role = "hr_admin";
            } else if (title.includes("payroll") || title.includes("finance") || title.includes("accounts") || dept.includes("finance")) {
              role = "payroll_manager";
            } else if (title.includes("manager") || title.includes("lead") || title.includes("head") || title.includes("vp")) {
              role = "manager";
            }
          }
        }
      } catch (err: any) {
        console.warn("Error fetching Firestore user profile:", err?.message || err);
      }
    }

    return { role, employeeId, displayName, photoURL };
  };

  useEffect(() => {
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
  ): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);
    const cleanEmail = email.toLowerCase().trim();

    try {
      if (!isFirebaseConfigured || !firebaseAuth) {
        setIsLoading(false);
        return { success: false, error: "Firebase Authentication is not configured on this instance." };
      }

      try {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
        const fbUser = userCredential.user;
        const profile = await resolveUserProfile(fbUser.uid, cleanEmail);

        const isSuper = cleanEmail === "karthick@coralgenz.co.in" || profile.role === "super_admin";
        
        // Active role automatically matches the employee's assigned role
        const activeRole: UserRole = isSuper
          ? (expectedPortalRole || "super_admin")
          : profile.role;

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
        setBaseRole(activeRole);
        setIsDemoMode(false);
        setIsLoading(false);

        AuditService.logAction({
          userId: loggedUser.id,
          userName: loggedUser.displayName,
          userRole: loggedUser.role,
          action: "login",
          module: "auth",
          details: `User ${loggedUser.displayName} (${cleanEmail}) authenticated successfully with role '${loggedUser.role}'.`,
        });

        return { success: true, role: activeRole };
      } catch (fbErr: any) {
        setIsLoading(false);
        const fbErrorCode = fbErr?.code || "";
        if (fbErrorCode === "auth/wrong-password" || fbErrorCode === "auth/invalid-credential") {
          return { success: false, error: "Incorrect password. Please verify the credentials assigned by your admin." };
        }
        if (fbErrorCode === "auth/user-not-found") {
          return { success: false, error: "No account found for this email. Please ask your HR/Super Admin to onboard you." };
        }
        if (fbErrorCode === "auth/too-many-requests") {
          return { success: false, error: "Account temporarily locked due to multiple failed attempts. Please try again in 5 minutes." };
        }
        return { success: false, error: fbErr.message || "Authentication failed." };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Authentication failed." };
    }
  };

  const loginAsDemoRole = async (role: UserRole) => {
    // Disabled in production
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
            details: `User ${user.displayName} signed out.`,
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
    return { success: false, message: "Firebase Auth not configured." };
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
