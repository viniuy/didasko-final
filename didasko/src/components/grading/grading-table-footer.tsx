import React from 'react';
import { Button } from '@/components/ui/button';

interface GradingTableFooterProps {
  totalStudents: number;
}

const GradingTableFooter: React.FC<GradingTableFooterProps> = ({
  totalStudents,
}) => (
  <div className='flex items-center justify-between px-4 py-3 border-t bg-white'>
    <div className='flex items-center gap-2'>
      <span className='text-sm text-gray-600'>Total Students:</span>
      <span className='font-medium text-[#124A69]'>{totalStudents}</span>
    </div>
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        className='h-8 px-3 text-sm border-gray-200 text-gray-600 hover:bg-gray-50'
      >
        Previous
      </Button>
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          className='h-8 w-8 p-0 text-sm border-gray-200 text-[#124A69] hover:bg-gray-50'
        >
          1
        </Button>
        <Button
          variant='outline'
          className='h-8 w-8 p-0 text-sm border-gray-200 text-gray-600 hover:bg-gray-50'
        >
          2
        </Button>
        <Button
          variant='outline'
          className='h-8 w-8 p-0 text-sm border-gray-200 text-gray-600 hover:bg-gray-50'
        >
          3
        </Button>
      </div>
      <Button
        variant='outline'
        className='h-8 px-3 text-sm border-gray-200 text-gray-600 hover:bg-gray-50'
      >
        Next
      </Button>
    </div>
  </div>
);

export default GradingTableFooter;
