'use client';

import { useSession } from 'next-auth/react';
import { User, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';

interface StatCardProps {
  icon: React.ReactNode;
  count: number;
  label: string;
}

const StatCard = ({ icon, count, label }: StatCardProps) => {
  return (
    <Card className='w-full'>
      <CardContent className='flex items-center -mt-2 -mb-2 justify-between '>
        <div>
          <CardDescription className='text-sm  font-semibold'>
            {label}
          </CardDescription>
          <p className='text-3xl font-bold text-[#124A69]'>{count}</p>
        </div>
        <div className='bg-[#124A69] p-3 rounded-lg text-white'>{icon}</div>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className='pt-2 px-5'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
        <StatCard
          icon={<User size={24} />}
          count={5}
          label='FACULTY FULL-TIME'
        />
        <StatCard
          icon={<BookOpen size={24} />}
          count={7}
          label='FACULTY PART-TIME'
        />
      </div>
    </div>
  );
}
