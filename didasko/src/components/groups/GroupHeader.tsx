import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface GroupHeaderProps {
  courseCode: string;
  courseSection: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function GroupHeader({
  courseCode,
  courseSection,
  searchQuery,
  onSearchChange,
}: GroupHeaderProps) {
  return (
    <div className='flex items-center gap-2 px-4 py-3 border-b bg-[#F5F6FA] rounded-t-lg'>
      <Button asChild variant='ghost' size='icon'>
        <Link href='/grading/reporting'>
          <ArrowLeft className='h-4 w-4' />
        </Link>
      </Button>
      <div className='flex flex-col mr-4'>
        <span className='text-lg font-bold text-[#124A69] leading-tight'>
          {courseCode}
        </span>
        <span className='text-sm text-gray-500'>{courseSection}</span>
      </div>
      <div className='flex-1 flex items-center gap-2'>
        <div className='relative w-64'>
          <svg
            className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <circle cx='11' cy='11' r='8' />
            <path d='m21 21-4.3-4.3' />
          </svg>
          <Input
            placeholder='Search a group'
            className='w-full pl-9 rounded-full border-gray-200 h-9 bg-[#F5F6FA]'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className='flex items-center gap-2'>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='w-[140px] h-9 rounded-full border-gray-200 bg-[#F5F6FA] justify-between'
              >
                <span>Filter</span>
                <svg
                  className='h-4 w-4 text-gray-500'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <path d='M19 9l-7 7-7-7' />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[200px] p-4'>
              <div className='space-y-3'>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='active' />
                  <label
                    htmlFor='active'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    Active Groups
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='completed' />
                  <label
                    htmlFor='completed'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    Completed Groups
                  </label>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
