'use client';

import { useState } from 'react';
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
import { Permission, Role, WorkType } from '@prisma/client';
import { addUser } from '@/lib/actions/users';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

// Available departments
const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Business Administration',
  'Education',
];

interface AddUserSheetProps {
  isInline?: boolean;
}

export function AddUserSheet({ isInline = false }: AddUserSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    department: '',
    workType: '',
    permission: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await addUser({
        name: `${formData.firstName} ${
          formData.middleName ? formData.middleName + ' ' : ''
        }${formData.lastName}`,
        email: formData.email,
        department: formData.department,
        workType: formData.workType as WorkType,
        permission: formData.permission as Permission,
        role: Role.FACULTY, // Default role for new users
      });

      if (result.success) {
        toast.success('User added successfully');
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          email: '',
          department: '',
          workType: '',
          permission: '',
        });
        setIsOpen(false);
      } else {
        toast.error(result.error || 'Failed to add user');
      }
    } catch (error) {
      toast.error('An error occurred while adding user');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the form directly when in inline mode
  if (isInline) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Add User</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className='space-y-4 py-4'>
          <div className='space-y-1'>
            <Label htmlFor='lastName'>Last Name</Label>
            <Input
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              required
              maxLength={30}
            />
            <div className='text-xs text-muted-foreground text-right'>
              {formData.lastName.length}/30
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='middleName'>Middle Name</Label>
            <Input
              id='middleName'
              name='middleName'
              value={formData.middleName}
              onChange={handleInputChange}
              maxLength={30}
            />
            <div className='text-xs text-muted-foreground text-right'>
              {formData.middleName.length}/30
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='firstName'>First Name</Label>
            <Input
              id='firstName'
              name='firstName'
              value={formData.firstName}
              onChange={handleInputChange}
              required
              maxLength={30}
            />
            <div className='text-xs text-muted-foreground text-right'>
              {formData.firstName.length}/30
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className='space-y-1'>
            <Label htmlFor='department'>Department</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => handleSelectChange('department', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='workType'>Work Type</Label>
            <Select
              value={formData.workType}
              onValueChange={(value) => handleSelectChange('workType', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WorkType.FULL_TIME}>Full Time</SelectItem>
                <SelectItem value={WorkType.PART_TIME}>Part Time</SelectItem>
                <SelectItem value={WorkType.CONTRACT}>Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='permission'>Permission</Label>
            <Select
              value={formData.permission}
              onValueChange={(value) => handleSelectChange('permission', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Permission.GRANTED}>Granted</SelectItem>
                <SelectItem value={Permission.DENIED}>Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex justify-between pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </>
    );
  }

  // Render with Sheet wrapper when not in inline mode
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className='ml-auto'>
          <Plus className='mr-2 h-4 w-4' /> Add User
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='sm:max-w-md '>
        <SheetHeader>
          <SheetTitle>Add User</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className='space-y-4 py-4'>
          <div className='space-y-1'>
            <Label htmlFor='lastName'>Last Name</Label>
            <Input
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              required
              maxLength={30}
            />
            <div className='text-xs text-muted-foreground text-right'>
              {formData.lastName.length}/30
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='middleName'>Middle Name</Label>
            <Input
              id='middleName'
              name='middleName'
              value={formData.middleName}
              onChange={handleInputChange}
              maxLength={30}
            />
            <div className='text-xs text-muted-foreground text-right'>
              {formData.middleName.length}/30
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='firstName'>First Name</Label>
            <Input
              id='firstName'
              name='firstName'
              value={formData.firstName}
              onChange={handleInputChange}
              required
              maxLength={30}
            />
            <div className='text-xs text-muted-foreground text-right'>
              {formData.firstName.length}/30
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className='space-y-1'>
            <Label htmlFor='department'>Department</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => handleSelectChange('department', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='workType'>Work Type</Label>
            <Select
              value={formData.workType}
              onValueChange={(value) => handleSelectChange('workType', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WorkType.FULL_TIME}>Full Time</SelectItem>
                <SelectItem value={WorkType.PART_TIME}>Part Time</SelectItem>
                <SelectItem value={WorkType.CONTRACT}>Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='permission'>Permission</Label>
            <Select
              value={formData.permission}
              onValueChange={(value) => handleSelectChange('permission', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Permission.GRANTED}>Granted</SelectItem>
                <SelectItem value={Permission.DENIED}>Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex justify-between pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
