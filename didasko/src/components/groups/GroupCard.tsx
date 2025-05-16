import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Group } from './types';
import Link from 'next/link';

interface GroupCardProps {
  group: Group;
  courseCode: string;
  courseSection: string;
}

export function GroupCard({
  group,
  courseCode,
  courseSection,
}: GroupCardProps) {
  return (
    <Card className='w-65 h-80 p-6 flex flex-col items-center shadow-lg'>
      <div className='mb-4'>
        <svg
          className='h-20 w-20 text-gray-400'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          viewBox='0 0 24 24'
        >
          <path d='M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2' />
          <circle cx='9' cy='7' r='4' />
          <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
          <path d='M16 3.13a4 4 0 0 1 0 7.75' />
        </svg>
      </div>
      <h2 className='text-2xl font-bold text-[#124A69] text-center -mb-2'>
        Group {group.number}
      </h2>
      {group.name ? (
        <p className='text-xl text-[#124A69] font-sm text-center -mt-3'>
          {group.name}
        </p>
      ) : (
        <div
          className='text-xl text-[#124A69] font-sm text-center -mt-3'
          style={{ visibility: 'hidden' }}
        >
          &nbsp;
        </div>
      )}
      <Link
        href={`/grading/reporting/${courseCode}/${courseSection}/group/${group.id}`}
      >
        <Button className='w-full bg-[#124A69] text-white font-semibold rounded mt-7'>
          View group
        </Button>
      </Link>
    </Card>
  );
}
