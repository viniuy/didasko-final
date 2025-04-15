'use client';
import { useEffect, useState } from 'react';
import { Role, WorkType } from '@prisma/client';
import { Users, GraduationCap, BookOpen, UserCircle2 } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  semester: string;
  schedules: {
    id: string;
    day: Date;
    fromTime: string;
    toTime: string;
  }[];
  students: {
    id: string;
  }[];
}

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  workType: WorkType;
  role: Role;
  coursesTeaching: Course[];
}

interface FacultyDetailsProps {
  faculty: FacultyMember;
}

export default function FacultyDetails({ faculty }: FacultyDetailsProps) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalCourses: 0,
  });

  useEffect(() => {
    // Calculate total unique students across all courses
    const uniqueStudents = new Set();
    let totalClasses = 0;

    faculty.coursesTeaching.forEach(course => {
      // Count students
      course.students?.forEach(student => {
        uniqueStudents.add(student.id);
      });
      // Count classes (schedules)
      totalClasses += course.schedules?.length || 0;
    });

    setStats({
      totalStudents: uniqueStudents.size,
      totalClasses: totalClasses,
      totalCourses: faculty.coursesTeaching.length,
    });
  }, [faculty]);

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-6">
        <div className="flex items-start space-x-6">
          {/* Faculty Image */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#124A69] flex items-center justify-center text-white">
              <UserCircle2 size={72} />
            </div>
          </div>

          {/* Faculty Info */}
          <div className="flex-grow">
            <h1 className="text-2xl font-bold text-gray-900">{faculty.name}</h1>
            <p className="text-gray-600">{faculty.department}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-1 text-xs rounded-full bg-[#124A69] text-white">
                {faculty.role}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-[#FAEDCB] text-[#124A69]">
                {faculty.workType}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-[#F8F9FA] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2 text-[#124A69]">
              <Users size={24} />
            </div>
            <div className="text-2xl font-bold text-[#124A69]">{stats.totalStudents}</div>
            <div className="text-sm text-gray-600">STUDENTS</div>
          </div>

          <div className="bg-[#F8F9FA] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2 text-[#124A69]">
              <GraduationCap size={24} />
            </div>
            <div className="text-2xl font-bold text-[#124A69]">{stats.totalClasses}</div>
            <div className="text-sm text-gray-600">CLASSES</div>
          </div>

          <div className="bg-[#F8F9FA] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2 text-[#124A69]">
              <BookOpen size={24} />
            </div>
            <div className="text-2xl font-bold text-[#124A69]">{stats.totalCourses}</div>
            <div className="text-sm text-gray-600">TOTAL COURSES</div>
          </div>
        </div>
      </div>
    </div>
  );
} 