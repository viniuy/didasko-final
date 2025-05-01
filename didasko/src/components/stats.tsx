'use client';

import { User, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { useEffect, useState } from 'react';

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

async function getFacultyCount() {
  try {
    const response = await fetch('/api/users/faculty-count');
    if (!response.ok) throw new Error('Failed to fetch faculty count');
    return await response.json();
  } catch (error) {
    console.error('Error fetching faculty count:', error);
    return { fullTime: 0, partTime: 0 };
  }
}

export default function Dashboard() {
  const [facultyCount, setFacultyCount] = useState({
    fullTime: 0,
    partTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyCount = async () => {
      setIsLoading(true);
      const counts = await getFacultyCount();
      setFacultyCount(counts);
      setIsLoading(false);
    };

    fetchFacultyCount();
  }, []);

  return (
    <div className='pt-2 px-5'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
        <StatCard
          icon={<User size={24} />}
          count={facultyCount.fullTime}
          label='FACULTY FULL-TIME'
          isLoading={isLoading}
        />
        <StatCard
          icon={<BookOpen size={24} />}
          count={facultyCount.partTime}
          label='FACULTY PART-TIME'
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
