"use client";

import { UserRole } from "@/types";

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
    try {
      const response = await fetch('/api/auth/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to provision user' };
      }

      return { success: true, uid: data.uid };
    } catch (err: any) {
      console.error("Auth provisioning error:", err);
      return { success: false, error: err.message || 'Network error' };
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
