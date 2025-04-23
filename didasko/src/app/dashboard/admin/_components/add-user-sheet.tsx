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
const DEPARTMENTS = ['IT Department', 'BA Department', 'HM Department'];

interface AddUserSheetProps {
  isInline?: boolean;
}

export function AddUserSheet({ isInline = false }: AddUserSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    email: '',
    department: '',
    workType: '',
    permission: '',
  });

  const [isEmailValid, setIsEmailValid] = useState(true);
  const [nameErrors, setNameErrors] = useState({
    lastName: false,
    firstName: false,
    middleInitial: false,
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name: string) => {
    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    // Check if the trimmed name is not empty and contains at least one letter
    return (
      nameRegex.test(name) && name.trim().length > 0 && /[a-zA-Z]/.test(name)
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'email') {
      setIsEmailValid(validateEmail(value) || value === '');
    } else if (
      name === 'lastName' ||
      name === 'firstName' ||
      name === 'middleInitial'
    ) {
      setNameErrors((prev) => ({
        ...prev,
        [name]: value !== '' && !validateName(value),
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submission
    const hasNameErrors =
      !validateName(formData.firstName) ||
      !validateName(formData.lastName) ||
      (formData.middleInitial && !validateName(formData.middleInitial));

    if (hasNameErrors) {
      toast.error('Please enter valid names');
      return;
    }

    setIsLoading(true);

    try {
      const result = await addUser({
        name: `${formData.firstName} ${
          formData.middleInitial ? formData.middleInitial + ' ' : ''
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
          middleInitial: '',
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
            <Label htmlFor='lastName'>Last Name *</Label>
            <Input
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              required
              maxLength={30}
              className={
                nameErrors.lastName
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />
            <div className='flex justify-between'>
              <div className='text-xs text-muted-foreground'>
                {formData.lastName.length}/30
              </div>
              {nameErrors.lastName && (
                <p className='text-xs text-red-500'>
                  No special characters allowed
                </p>
              )}
            </div>
          </div>

          <div className='space-y-1'>
            <Label>First Name *</Label>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <Input
                  id='firstName'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  maxLength={30}
                  placeholder='First Name'
                  className={
                    nameErrors.firstName
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />
                <div className='flex justify-between'>
                  <div className='text-xs text-muted-foreground'>
                    {formData.firstName.length}/30
                  </div>
                  {nameErrors.firstName && (
                    <p className='text-xs text-red-500'>
                      No special characters allowed
                    </p>
                  )}
                </div>
              </div>
              <div className='w-16'>
                <Input
                  id='middleInitial'
                  name='middleInitial'
                  value={formData.middleInitial}
                  onChange={handleInputChange}
                  maxLength={1}
                  placeholder='M.I.'
                  className={`text-center ${
                    nameErrors.middleInitial
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }`}
                />
                {nameErrors.middleInitial && (
                  <p className='text-xs text-red-500 text-center'>
                    No special characters
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='email'>Email *</Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              className={
                !isEmailValid ? 'border-red-500 focus-visible:ring-red-500' : ''
              }
            />
            {!isEmailValid && (
              <p className='text-sm text-red-500'>
                Please enter a valid email address
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <Label htmlFor='department'>Department *</Label>
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
            <Label htmlFor='workType'>Work Type *</Label>
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
            <Label htmlFor='permission'>Permission *</Label>
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
      <SheetContent side='right' className='sm:max-w-md p-3 '>
        <SheetHeader>
          <SheetTitle>Add User</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className='space-y-4 py-4'>
          <div className='space-y-1'>
            <Label htmlFor='lastName'>Last Name *</Label>
            <Input
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              required
              maxLength={30}
              className={
                nameErrors.lastName
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />
            <div className='flex justify-end'>
              <div className='text-xs text-muted-foreground'>
                {formData.lastName.length}/30
              </div>
              {nameErrors.lastName && (
                <p className='text-xs text-red-500'>
                  No special characters allowed
                </p>
              )}
            </div>
          </div>

          <div className='space-y-1'>
            <Label>First Name *</Label>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <Input
                  id='firstName'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  maxLength={30}
                  placeholder='First Name'
                  className={
                    nameErrors.firstName
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />
                <div className='flex justify-end'>
                  <div className='text-xs text-muted-foreground'>
                    {formData.firstName.length}/30
                  </div>
                  {nameErrors.firstName && (
                    <p className='text-xs text-red-500'>
                      No special characters allowed
                    </p>
                  )}
                </div>
              </div>
              <div className='w-16'>
                <Input
                  id='middleInitial'
                  name='middleInitial'
                  value={formData.middleInitial}
                  onChange={handleInputChange}
                  maxLength={1}
                  placeholder='M.I.'
                  className={`text-center ${
                    nameErrors.middleInitial
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }`}
                />
                {nameErrors.middleInitial && (
                  <p className='text-xs text-red-500 text-center'>
                    No special characters
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='email'>Email *</Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              className={
                !isEmailValid ? 'border-red-500 focus-visible:ring-red-500' : ''
              }
            />
            {!isEmailValid && (
              <p className='text-sm text-red-500'>
                Please enter a valid email address
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <Label htmlFor='department'>Department *</Label>
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
            <Label htmlFor='workType'>Work Type *</Label>
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
            <Label htmlFor='permission'>Permission *</Label>
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
