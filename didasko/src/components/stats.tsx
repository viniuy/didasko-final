'use client';

import { User, BookOpen, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';

interface StatCardProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  isLoading?: boolean;
}

const StatCard = ({ icon, count, label, isLoading = false }: StatCardProps) => {
  return (
    <Card className='w-full'>
      <CardContent className='flex items-center -mt-2 -mb-2 justify-between'>
        <div>
          <CardDescription className='text-sm font-semibold'>
            {label}
          </CardDescription>
          {isLoading ? (
            <div className='h-9 w-16 bg-gray-200 animate-pulse rounded'></div>
          ) : (
            <p className='text-3xl font-bold text-[#124A69]'>{count}</p>
          )}
        </div>
        <div className='bg-[#124A69] p-3 rounded-lg text-white'>{icon}</div>
      </CardContent>
    </Card>
  );
};

async function getFacultyStats() {
  try {
    const response = await axiosInstance.get('/users/faculty-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching faculty stats:', error);
    return { totalStudents: 0, totalCourses: 0, totalClasses: 0 };
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalClasses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const data = await getFacultyStats();
      setStats(data);
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div className='pt-2 px-5'>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4'>
        <StatCard
          icon={<User size={24} />}
          count={stats.totalStudents}
          label='TOTAL STUDENTS'
          isLoading={isLoading}
        />
        <StatCard
          icon={<BookOpen size={24} />}
          count={stats.totalCourses}
          label='TOTAL SUBJECTS'
          isLoading={isLoading}
        />
        <StatCard
          icon={<GraduationCap size={24} />}
          count={stats.totalClasses}
          label='TOTAL SECTIONS'
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
