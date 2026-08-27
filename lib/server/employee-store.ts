import { Employee } from '@/types';

// Shared server-side store to guarantee data persistence across API routes
declare global {
  var __coralgenz_server_employee_cache: Map<string, Employee> | undefined;
}

if (!global.__coralgenz_server_employee_cache) {
  global.__coralgenz_server_employee_cache = new Map<string, Employee>();
}

export const serverEmployeeCache = global.__coralgenz_server_employee_cache;
