import { firebaseConfig } from './config';
import { Employee } from '@/types';

/**
 * Direct REST communication with Google Cloud Firestore
 * Runs in any environment (Vercel Serverless, Node, Edge, Local)
 */
export class FirestoreRest {
  private static projectId = firebaseConfig.projectId || 'coralgenz-payroll';
  private static baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;

  private static toFirestoreFields(obj: any): any {
    const fields: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val === undefined || val === null) {
        fields[key] = { nullValue: null };
      } else if (typeof val === 'string') {
        fields[key] = { stringValue: val };
      } else if (typeof val === 'number') {
        fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
      } else if (typeof val === 'boolean') {
        fields[key] = { booleanValue: val };
      } else if (Array.isArray(val)) {
        fields[key] = {
          arrayValue: {
            values: val.map((v) => (typeof v === 'object' ? this.toFirestoreFields(v) : { stringValue: String(v) })),
          },
        };
      } else if (typeof val === 'object') {
        fields[key] = { mapValue: { fields: this.toFirestoreFields(val) } };
      }
    }
    return fields;
  }

  private static fromFirestoreFields(fields: any): any {
    if (!fields) return {};
    const obj: any = {};
    for (const [key, valObj] of Object.entries(fields) as [string, any][]) {
      if ('stringValue' in valObj) obj[key] = valObj.stringValue;
      else if ('integerValue' in valObj) obj[key] = Number(valObj.integerValue);
      else if ('doubleValue' in valObj) obj[key] = Number(valObj.doubleValue);
      else if ('booleanValue' in valObj) obj[key] = valObj.booleanValue;
      else if ('nullValue' in valObj) obj[key] = null;
      else if ('mapValue' in valObj) obj[key] = this.fromFirestoreFields(valObj.mapValue?.fields);
      else if ('arrayValue' in valObj) {
        obj[key] = (valObj.arrayValue?.values || []).map((v: any) =>
          'mapValue' in v ? this.fromFirestoreFields(v.mapValue?.fields) : v.stringValue || v
        );
      }
    }
    return obj;
  }

  public static async getEmployees(authHeader?: string): Promise<Employee[]> {
    try {
      const url = `${this.baseUrl}/employees?pageSize=100`;
      const headers: Record<string, string> = {};
      if (authHeader) headers['Authorization'] = authHeader;
      const res = await fetch(url, { headers, cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.documents) return [];
      return data.documents.map((docItem: any) => this.fromFirestoreFields(docItem.fields) as Employee);
    } catch {
      return [];
    }
  }

  public static async setEmployee(id: string, employee: Employee, authHeader?: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/employees/${id}`;
      const fields = this.toFirestoreFields(employee);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;
      const res = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async getEmployee(id: string, authHeader?: string): Promise<Employee | null> {
    try {
      const url = `${this.baseUrl}/employees/${id}`;
      const headers: Record<string, string> = {};
      if (authHeader) headers['Authorization'] = authHeader;
      const res = await fetch(url, { headers, cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return this.fromFirestoreFields(data.fields) as Employee;
    } catch {
      return null;
    }
  }
}
