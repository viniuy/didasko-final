'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create course');
      }

      toast({
        title: 'Success',
        description: 'Course created successfully',
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create course',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Course</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
          <div className='space-y-2'>
            <Label htmlFor='code'>Course Code</Label>
            <Input id='code' name='code' placeholder='e.g., IT101' required />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='title'>Course Title</Label>
            <Input
              id='title'
              name='title'
              placeholder='e.g., Introduction to Programming'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='room'>Room</Label>
            <Input id='room' name='room' placeholder='e.g., Room 101' />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='semester'>Semester</Label>
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

          <div className='space-y-2'>
            <Label htmlFor='section'>Section</Label>
            <Input
              id='section'
              name='section'
              placeholder='e.g., BSIT-111'
              required
            />
          </div>

          <div className='flex justify-end gap-2 mt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
