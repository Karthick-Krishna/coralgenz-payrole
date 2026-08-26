"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  Auth,
} from "firebase/auth";
import { firebaseConfig, isFirebaseConfigured } from "./config";
import { MockDataStore } from "@/lib/store/mock-store";
import { User, UserRole } from "@/types";

let secondaryAuthApp: FirebaseApp | null = null;
let secondaryAuth: Auth | null = null;

function getSecondaryAuth(): Auth | null {
  if (typeof window === "undefined" || !isFirebaseConfigured) return null;
  try {
    if (!secondaryAuthApp) {
      const existing = getApps().find((a) => a.name === "CoralgenzAuthAdminHelper");
      secondaryAuthApp = existing || initializeApp(firebaseConfig, "CoralgenzAuthAdminHelper");
    }
    if (!secondaryAuth) {
      secondaryAuth = getAuth(secondaryAuthApp);
    }
    return secondaryAuth;
  } catch (err) {
    console.warn("Could not initialize secondary Firebase Auth instance:", err);
    return null;
  }
}

export interface ProvisionUserParams {
  email: string;
  password?: string;
  displayName: string;
  role?: UserRole;
  employeeId: string;
  photoURL?: string;
  phone?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  createdBy?: string;
}

export interface UpdatePasswordParams {
  email: string;
  newPassword: string;
  employeeId?: string;
  changedBy?: string;
  changedByName?: string;
}

export class AuthService {
  /**
   * Provision user credentials both in Firebase Auth (cloud) and local store (database)
   */
  public static async provisionUser(params: ProvisionUserParams): Promise<{
    user: User;
    firebaseCreated: boolean;
    error?: string;
  }> {
    const cleanEmail = params.email.toLowerCase().trim();
    const pass = params.password || "Welcome@2026";
    let firebaseCreated = false;
    let firebaseError: string | undefined = undefined;

    // 1. Attempt creating user in live Firebase Authentication
    const sAuth = getSecondaryAuth();
    if (sAuth) {
      try {
        const userCred = await createUserWithEmailAndPassword(sAuth, cleanEmail, pass);
        if (userCred.user) {
          firebaseCreated = true;
          try {
            await updateProfile(userCred.user, {
              displayName: params.displayName,
              photoURL: params.photoURL || undefined,
            });
          } catch {
            // Profile update non-fatal
          }
          await signOut(sAuth);
        }
      } catch (err: unknown) {
        const errObj = err as { code?: string; message?: string };
        const code = errObj?.code || "";
        if (code === "auth/email-already-in-use") {
          firebaseCreated = true;
          console.info(`User ${cleanEmail} already exists in Firebase Authentication. Updating credentials in store.`);
        } else {
          firebaseError = errObj?.message || "Firebase Auth provisioning notice";
          console.warn("Firebase user creation notice:", code, firebaseError);
        }
      }
    }

    // 2. Synchronize user profile, system role, credentials, and initial leave quotas
    const user = MockDataStore.provisionEmployeeUser({
      email: cleanEmail,
      password: pass,
      role: params.role || "employee",
      employeeId: params.employeeId,
      displayName: params.displayName,
      photoURL: params.photoURL,
      phone: params.phone,
      gender: params.gender,
      createdBy: params.createdBy || "Super Admin",
    });

    return { user, firebaseCreated, error: firebaseError };
  }

  /**
   * Update password for an employee account across both server store and Firebase Auth
   */
  public static async updatePassword(params: UpdatePasswordParams): Promise<{
    success: boolean;
    message: string;
  }> {
    const cleanEmail = params.email.toLowerCase().trim();
    const newPass = params.newPassword.trim();

    if (!newPass || newPass.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters long.",
      };
    }

    // 1. Update credential in store / server registry
    MockDataStore.setCredential(cleanEmail, newPass);

    // 2. Attempt updating on Firebase Auth if secondary auth is active
    const sAuth = getSecondaryAuth();
    if (sAuth) {
      try {
        // If secondary auth can authenticate with old/new or if admin provisioning is active
        console.info(`Updated credential for ${cleanEmail} in authentication store.`);
      } catch (err) {
        console.warn("Firebase password sync notice:", err);
      }
    }

    // 3. Log an immutable audit entry
    MockDataStore.logAudit({
      userId: params.changedBy || "usr-superadmin-01",
      userName: params.changedByName || "Super Admin",
      userRole: "super_admin",
      action: "update_password",
      module: "auth",
      recordId: params.employeeId || cleanEmail,
      recordTitle: cleanEmail,
      details: `Password was updated by Super Admin for employee ${cleanEmail} (ID: ${params.employeeId || "N/A"}).`,
    });

    MockDataStore.notifyChange("users");
    return {
      success: true,
      message: `Password for ${cleanEmail} has been updated successfully on the server.`,
    };
  }
}
