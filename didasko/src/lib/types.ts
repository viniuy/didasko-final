export enum WorkType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACTUAL = 'CONTRACTUAL'
}

export enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
  ADMIN = 'ADMIN'
}

export enum Role {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  ACADEMIC_HEAD = 'ACADEMIC_HEAD',
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  units: number;
  department: string;
  facultyId: string;
  faculty: User;
  students: User[];
  schedules: CourseSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseSchedule {
  id: string;
  courseId: string;
  course: Course;
  day: Date;
  fromTime: string;
  toTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  workType: WorkType;
  permission: Permission;
  coursesTeaching: Course[];
  coursesEnrolled: Course[];
  createdAt: Date;
  updatedAt: Date;
}
