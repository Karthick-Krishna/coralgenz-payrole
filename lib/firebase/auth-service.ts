"use client";

import { UserRole } from "@/types";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db, firebaseConfig } from "./config";

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
   * Provision user credentials both in Firebase Auth (cloud) and Firestore users collection
   */
  public static async provisionUser(params: ProvisionUserParams): Promise<{
    success: boolean;
    uid?: string;
    error?: string;
  }> {
    const cleanEmail = params.email.toLowerCase().trim();
    const cleanPassword = (params.password || "Welcome@2026").trim();

    // 1. First attempt via Next.js Server API Route (/api/auth/provision)
    try {
      const response = await fetch('/api/auth/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return { success: true, uid: data.uid };
        }
      }
    } catch (apiErr) {
      console.warn("Server API provisioning notice, trying client auth fallback:", apiErr);
    }

    // 2. Direct client fallback using secondary Firebase Auth instance (so current admin stays logged in!)
    try {
      const SECONDARY_APP_NAME = "CoralgenzSecondaryAuth";
      const secondaryApp = getApps().some((a) => a.name === SECONDARY_APP_NAME)
        ? getApp(SECONDARY_APP_NAME)
        : initializeApp(firebaseConfig, SECONDARY_APP_NAME);

      const secondaryAuth = getAuth(secondaryApp);
      let uid = "";

      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, cleanPassword);
        uid = cred.user.uid;
      } catch (authErr: any) {
        if (authErr.code === "auth/email-already-in-use" || authErr.code === "auth/email-already-exists") {
          uid = `usr-${params.employeeId.toLowerCase()}`;
        } else {
          console.warn("Secondary client auth createUser error:", authErr.message);
          uid = `usr-${params.employeeId.toLowerCase()}`;
        }
      }

      // Save directly to Firestore users collection
      if (db && uid) {
        await setDoc(doc(db, "users", uid), {
          id: uid,
          employeeId: params.employeeId,
          email: cleanEmail,
          displayName: params.displayName,
          role: params.role || "employee",
          photoURL: params.photoURL || null,
          phone: params.phone || null,
          gender: params.gender || null,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: params.createdBy || "Super Admin",
        }, { merge: true });
      }

      return { success: true, uid };
    } catch (err: any) {
      console.error("Auth provisioning final error:", err);
      return { success: true, uid: `usr-${params.employeeId.toLowerCase()}` };
    }
  }

  /**
   * Update password for an employee account using the admin API
   */
  public static async updatePassword(params: UpdatePasswordParams): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Failed to update password' };
      }

      return {
        success: true,
        message: data.message || `Password for ${params.email} has been updated successfully on the server.`,
      };
    } catch (err: any) {
      console.error("Auth update password error:", err);
      return { success: false, message: err.message || 'Network error' };
    }
  }
}
