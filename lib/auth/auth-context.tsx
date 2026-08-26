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
  organization: Organization | null;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoRole: (role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updateCurrentUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = "coralgenz_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isFirebaseConfigured);

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
          const matchedUser: User = {
            id: fbUser.uid,
            email: fbUser.email || "user@coralgenz.com",
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            role: "super_admin",
            organizationId: org.id,
            photoURL: fbUser.photoURL || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };
          setUser(matchedUser);
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
      if (saved) {
        const parsed = JSON.parse(saved) as User;
        setUser(parsed);
      } else {
        // Default to Super Admin demo profile for instant preview
        const defaultUser = DEMO_USERS[0];
        setUser(defaultUser);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } catch {
      setUser(DEMO_USERS[0]);
    }
  };

  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured && firebaseAuth) {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
        const fbUser = userCredential.user;
        const loggedUser: User = {
          id: fbUser.uid,
          email: fbUser.email || email,
          displayName: fbUser.displayName || email.split("@")[0],
          role: "super_admin",
          organizationId: organization?.id || "org-coralgenz-01",
          photoURL: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        };
        setUser(loggedUser);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(loggedUser));
        setIsDemoMode(false);
        setIsLoading(false);
        return { success: true };
      } else {
        // Match against demo users or create demo session
        const matched = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        const loggedUser: User = matched || {
          id: `usr-${Date.now()}`,
          email,
          displayName: email.split("@")[0].replace(".", " ").toUpperCase(),
          role: "super_admin",
          organizationId: organization?.id || "org-coralgenz-01",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        };

        setUser(loggedUser);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(loggedUser));
        setIsDemoMode(true);
        setIsLoading(false);

        MockDataStore.logAudit({
          userId: loggedUser.id,
          userName: loggedUser.displayName,
          userRole: loggedUser.role,
          action: "login",
          module: "auth",
          details: `User ${loggedUser.displayName} logged in`,
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
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(demoUser));
    setIsDemoMode(true);
    setIsLoading(false);

    MockDataStore.logAudit({
      userId: demoUser.id,
      userName: demoUser.displayName,
      userRole: role,
      action: "login",
      module: "auth",
      details: `Switched session to Demo Role: ${role.replace("_", " ").toUpperCase()}`,
    });
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
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
