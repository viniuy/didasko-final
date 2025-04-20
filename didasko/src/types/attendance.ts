import { AttendanceStatus } from '@prisma/client';

export type AttendanceStatusWithNotSet = AttendanceStatus | 'NOT_SET';

export interface FilterState {
  status: AttendanceStatusWithNotSet[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  courseId?: string;
}

export interface Student {
  id: string;
  name: string;
  image?: string;
  status: AttendanceStatusWithNotSet;
  attendanceRecords: AttendanceRecord[];
}
