'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { Plus } from 'lucide-react';

interface AddCourseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string | null;
}

export default function AddCourseSheet({
  open,
  onOpenChange,
  teacherId,
}: AddCourseSheetProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get('code') as string,
      title: formData.get('title') as string,
      room: formData.get('room') as string,
      semester: formData.get('semester') as string,
      section: formData.get('section') as string,
      facultyId: teacherId,
    };

    try {
      await axiosInstance.post('/courses', data);
      router.refresh();
      onOpenChange(false);
      toast({
        title: 'Success',
        description: 'Course added successfully',
      });
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: 'Error',
        description: 'Failed to add course',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className='ml-auto bg-[#124A69] text-white hover:bg-gray-700'>
          <Plus className='mr-2 h-4 w-4' /> Add Course
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='sm:max-w-md p-4'>
        <SheetHeader>
          <SheetTitle>Add Course</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-4'>
          <div className='space-y-1'>
            <Label htmlFor='code'>Course Code *</Label>
            <Input
              id='code'
              name='code'
              placeholder='e.g., IT101'
              required
              maxLength={10}
            />
            <div className='text-xs text-muted-foreground'>
              Maximum 10 characters
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='title'>Course Title *</Label>
            <Input
              id='title'
              name='title'
              placeholder='e.g., Introduction to Programming'
              required
              maxLength={100}
            />
            <div className='text-xs text-muted-foreground'>
              Maximum 100 characters
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='room'>Room</Label>
            <Input
              id='room'
              name='room'
              placeholder='e.g., Room 101'
              maxLength={20}
            />
            <div className='text-xs text-muted-foreground'>
              Maximum 20 characters
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='semester'>Semester *</Label>
            <Select name='semester' required>
              <SelectTrigger>
                <SelectValue placeholder='Select semester' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1st Semester'>1st Semester</SelectItem>
                <SelectItem value='2nd Semester'>2nd Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='section'>Section *</Label>
            <Input
              id='section'
              name='section'
              placeholder='e.g., BSIT-111'
              required
              maxLength={20}
            />
            <div className='text-xs text-muted-foreground'>
              Maximum 20 characters
            </div>
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={loading}
              className='bg-[#124A69] text-white hover:bg-gray-700'
            >
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
