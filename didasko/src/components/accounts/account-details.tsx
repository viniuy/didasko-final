'use client';
import React from 'react';
import { WorkType } from '@prisma/client';
import { Button } from '@/components/ui/button';

interface Account {
  id: string;
  name: string;
  email: string;
  workType: WorkType;
}

interface AccountDetailsProps {
  account: Account;
  onClose: () => void;
}

export default function AccountDetails({
  account,
  onClose,
}: AccountDetailsProps) {
  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <div className='flex justify-between items-start mb-6'>
        <h2 className='text-2xl font-bold'>{account.name}</h2>
        <Button variant='outline' onClick={onClose}>
          Back
        </Button>
      </div>

      <div className='space-y-4'>
        <div>
          <h3 className='text-sm font-medium text-gray-500'>Email</h3>
          <p className='mt-1'>{account.email}</p>
        </div>

        <div>
          <h3 className='text-sm font-medium text-gray-500'>Work Type</h3>
          <p className='mt-1'>{account.workType}</p>
        </div>
      </div>
    </div>
  );
}
