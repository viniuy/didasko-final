'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
import { toast } from 'sonner';

// Available departments
const DEPARTMENTS = ['IT Department', 'BA Department', 'HM Department'];

// Name validation regex - letters, spaces, and hyphens only
const nameRegex = /^[a-zA-Z\s-]+$/;

interface EditUserSheetProps {
  user: {
    id: string;
    name: string;
    email: string;
    department: string;
    workType: WorkType;
    role: Role;
    permission: Permission;
  };
  onClose: () => void;
  onSave: (
    userId: string,
    data: {
      name?: string;
      email?: string;
      department?: string;
      workType?: WorkType;
      role?: Role;
      permission?: Permission;
    },
  ) => Promise<void>;
}

export function EditUserSheet({ user, onClose, onSave }: EditUserSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Split the full name into parts
  const nameParts = user.name.split(' ');
  const initialFormData = {
    firstName: nameParts[0] || '',
    lastName: nameParts.length > 2 ? nameParts[2] : nameParts[1] || '',
    middleInitial: nameParts.length > 2 ? nameParts[1] : '',
    email: user.email,
    department: user.department,
    workType: user.workType,
    role: user.role,
    permission: user.permission,
  };

  const [formData, setFormData] = useState(initialFormData);

  const validateName = (name: string) => {
    if (!name.trim()) return false;
    if (!nameRegex.test(name)) return false;
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear name error when user types
    if (['firstName', 'middleInitial', 'lastName'].includes(name)) {
      setNameError(null);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate names
    const hasNameErrors =
      !validateName(formData.firstName) ||
      !validateName(formData.lastName) ||
      (formData.middleInitial && !validateName(formData.middleInitial));

    if (hasNameErrors) {
      setNameError('Names can only contain letters, spaces, and hyphens');
      setIsLoading(false);
      return;
    }

    try {
      // Construct the full name in the correct order: Last, First M.
      const fullName = `${formData.firstName} ${
        formData.middleInitial ? ' ' + formData.middleInitial : ''
      }${formData.lastName}`;

      console.log('Full name parts:', {
        firstName: formData.firstName,
        middleInitial: formData.middleInitial,
        lastName: formData.lastName,
      });
      console.log('Full name:', fullName);
      const updateData = {
        name: fullName,
        email: formData.email,
        department: formData.department,
        workType: formData.workType,
        role: formData.role,
        permission: formData.permission,
      };

      console.log('Saving user changes:', { userId: user.id, updateData });
      await onSave(user.id, updateData);
      console.log('User changes saved successfully');
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to update user');
      } else {
        toast.error('Failed to update user');
      }
    } finally {
      setIsLoading(false);
      document.body.style.pointerEvents = '';
    }
  };

  const cleanup = () => {
    document.body.style.pointerEvents = '';
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <Sheet
      defaultOpen={true}
      onOpenChange={(open) => {
        if (!open) {
          cleanup();
          onClose();
        }
      }}
    >
      <SheetContent side='right' className='sm:max-w-md p-3'>
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className='space-y-4 py-4'>
          <div className='space-y-4'>
            <div className='space-y-1'>
              <Label htmlFor='lastName'>Last Name</Label>
              <Input
                id='lastName'
                name='lastName'
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className={nameError ? 'border-red-500' : ''}
              />
            </div>

            <div className='flex gap-4'>
              <div className='flex-1 space-y-1'>
                <Label htmlFor='firstName'>First Name</Label>
                <Input
                  id='firstName'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className={nameError ? 'border-red-500' : ''}
                />
              </div>

              <div className='w-24 space-y-1'>
                <Label htmlFor='middleInitial'>M.I.</Label>
                <Input
                  id='middleInitial'
                  name='middleInitial'
                  value={formData.middleInitial}
                  onChange={handleInputChange}
                  className={nameError ? 'border-red-500' : ''}
                  maxLength={1}
                />
              </div>
            </div>

            {nameError && (
              <p className='text-sm text-red-500 mt-1'>{nameError}</p>
            )}
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
                <SelectValue placeholder='Select department' />
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
                <SelectValue placeholder='Select work type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WorkType.FULL_TIME}>Full Time</SelectItem>
                <SelectItem value={WorkType.PART_TIME}>Part Time</SelectItem>
                <SelectItem value={WorkType.CONTRACT}>Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='role'>Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleSelectChange('role', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                <SelectItem value={Role.FACULTY}>Faculty</SelectItem>
                <SelectItem value={Role.ACADEMIC_HEAD}>
                  Academic Head
                </SelectItem>
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
                <SelectValue placeholder='Select permission' />
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
              onClick={() => {
                cleanup();
                onClose();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
