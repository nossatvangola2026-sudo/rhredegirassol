
export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Simplified for demo
  role: Role;
  employeeId?: string; // Link to employee record if applicable
  mustChangePassword?: boolean;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  employeeNumber: string;
  jobTitle: string;
  department: string; // Stored as name for simplicity in reports
  contractType: string;
  admissionDate: string; // ISO Date
  supervisorId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  email: string;
  scheduleStart: string; // HH:mm
  scheduleEnd: string; // HH:mm
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // ISO Timestamp
  checkOut?: string; // ISO Timestamp
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'WEEKEND';
  isJustified?: boolean;
  overtimeHours?: number; // New field for extra hours
}

export interface Justification {
  id: string;
  employeeId: string;
  attendanceDate: string; // YYYY-MM-DD
  reason: string;
  attachmentUrl?: string; // Mock URL
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminComment?: string;
  submissionDate: string;
}

export interface SystemConfig {
  appName: string;
  logoUrl: string;
  description: string;
  customCss?: string; // For "Frontend" changes
  licenseKey?: string; // Activation key
  licenseExpirationDate?: string; // ISO Date for expiration override
}
