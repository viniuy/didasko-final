import React from 'react';
import { GroupCard } from './GroupCard';
import { AddGroupModal } from '@/components/groups/AddGroupModal';
import { RandomizerButton } from './RandomizerButton';
import { Loader2 } from 'lucide-react';
import { Group } from './types';

interface GroupGridProps {
  groups: Group[];
  isLoading: boolean;
  courseCode: string;
  courseSection: string;
  excludedStudentIds: string[];
  nextGroupNumber: number;
  onGroupAdded: () => void;
}

export function GroupGrid({
  groups,
  isLoading,
  courseCode,
  courseSection,
  excludedStudentIds,
  nextGroupNumber,
  onGroupAdded,
}: GroupGridProps) {
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[300px]'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className='flex flex-row gap-12 items-center justify-center mb-8'>
        <AddGroupModal
          courseCode={courseCode}
          excludedStudentIds={excludedStudentIds}
          nextGroupNumber={nextGroupNumber}
          onGroupAdded={onGroupAdded}
        />
        <RandomizerButton disabled />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start justify-center min-h-[300px]'>
      {groups.map((group) => (
        <GroupCard 
          key={group.id} 
          group={group} 
          courseCode={courseCode}
          courseSection={courseSection}
        />
      ))}
      <div className='flex flex-col gap-8'>
        <AddGroupModal
          courseCode={courseCode}
          excludedStudentIds={excludedStudentIds}
          nextGroupNumber={nextGroupNumber}
          onGroupAdded={onGroupAdded}
        />
        <RandomizerButton disabled />
      </div>
    </div>
  );
} 