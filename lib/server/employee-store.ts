import { Employee } from '@/types';
import { serverDb } from './server-db';

// Compatibility adapter for serverEmployeeCache backed by durable serverDb
export const serverEmployeeCache = {
  get(id: string): Employee | undefined {
    return serverDb.getEmployeeById(id) || undefined;
  },
  set(id: string, emp: Employee): void {
    serverDb.saveEmployee(emp);
  },
  has(id: string): boolean {
    return Boolean(serverDb.getEmployeeById(id));
  },
  delete(id: string): boolean {
    return serverDb.deleteEmployee(id);
  },
  get size(): number {
    return serverDb.getAllEmployees().length;
  },
  values(): IterableIterator<Employee> {
    return serverDb.getEmployees().values();
  },
  entries(): [string, Employee][] {
    return serverDb.getEmployees().map((e) => [e.id, e]);
  },
};
