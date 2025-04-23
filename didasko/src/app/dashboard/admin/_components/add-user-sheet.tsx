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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Available departments
const DEPARTMENTS = ['IT Department', 'BA Department', 'HM Department'];

const userSchema = z.object({
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(30, 'Last name must be at most 30 characters')
    .refine(
      (val) => /^[A-Za-z\s-]+$/.test(val),
      'Last name cannot contain special characters or numbers',
    ),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(30, 'First name must be at most 30 characters')
    .refine(
      (val) => /^[A-Za-z\s-]+$/.test(val),
      'First name cannot contain special characters or numbers',
    ),
  middleInitial: z
    .string()
    .max(1, 'Middle initial must be a single character')
    .refine(
      (val) => !val || /^[A-Za-z]$/.test(val),
      'Middle initial must be a single letter',
    )
    .optional(),
  email: z.string().email('Invalid email address'),
  department: z.string().min(1, 'Department is required'),
  workType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']),
  role: z.enum(['ADMIN', 'FACULTY', 'ACADEMIC_HEAD']),
  permission: z.enum(['GRANTED', 'DENIED']),
});

interface AddUserSheetProps {
  onSuccess?: () => Promise<void> | void;
}

export function AddUserSheet({ onSuccess }: AddUserSheetProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<{
    lastName?: string;
    firstName?: string;
    middleInitial?: string;
  }>({});

  const validateName = (
    value: string,
    field: 'lastName' | 'firstName' | 'middleInitial',
  ) => {
    if (field === 'middleInitial') {
      if (value && !/^[A-Za-z]$/.test(value)) {
        setNameError((prev) => ({
          ...prev,
          [field]: 'Must be a single letter',
        }));
        return false;
      }
      setNameError((prev) => ({ ...prev, [field]: undefined }));
      return true;
    }

    if (value.startsWith(' ')) {
      setNameError((prev) => ({
        ...prev,
        [field]: 'Cannot start with a space',
      }));
      return false;
    }

    if (!/^[A-Za-z\s-]+$/.test(value)) {
      setNameError((prev) => ({
        ...prev,
        [field]: 'Cannot contain special characters or numbers',
      }));
      return false;
    }
    setNameError((prev) => ({ ...prev, [field]: undefined }));
    return true;
  };

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      middleInitial: '',
      email: '',
      department: '',
      workType: 'FULL_TIME',
      role: 'FACULTY',
      permission: 'GRANTED',
    },
  });

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      setIsSubmitting(true);

      // Combine name fields into a single name string
      const fullName = `${values.lastName}, ${values.firstName}${
        values.middleInitial ? ` ${values.middleInitial}.` : ''
      }`;

      const result = await addUser({
        ...values,
        name: fullName,
      });

      if (result.success) {
        toast.success('User added successfully');
        form.reset();
        setOpen(false);
        // Call onSuccess callback if provided
        if (onSuccess) {
          await onSuccess();
        }
      } else {
        toast.error(result.error || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('An error occurred while adding the user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          form.reset({
            lastName: '',
            firstName: '',
            middleInitial: '',
            email: '',
            department: '',
            workType: 'FULL_TIME',
            role: 'FACULTY',
            permission: 'GRANTED',
          });
          setNameError({});
        }
        setOpen(isOpen);
      }}
    >
      <SheetTrigger asChild>
        <Button className='ml-auto bg-[#124A69] text-white hover:bg-gray-700'>
          <Plus className='mr-2 h-4 w-4' /> Add User
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Add User</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 py-4 p-4'
        >
          <div className='space-y-1 w-97'>
            <Label htmlFor='lastName'>Last Name *</Label>
            <Input
              id='lastName'
              {...form.register('lastName')}
              onChange={(e) => {
                form.setValue('lastName', e.target.value);
                validateName(e.target.value, 'lastName');
              }}
              className={
                nameError.lastName
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
              maxLength={30}
            />
            <div className='flex justify-between'>
              <div className='text-xs text-muted-foreground'>
                {form.watch('lastName').length}/30
              </div>
              {nameError.lastName && (
                <p className='text-sm text-red-500'>{nameError.lastName}</p>
              )}
            </div>
          </div>

          <div className='flex flex-row gap-2'>
            <div className='space-y-1'>
              <Label htmlFor='firstName'>First Name *</Label>
              <Input
                id='firstName'
                {...form.register('firstName')}
                onChange={(e) => {
                  form.setValue('firstName', e.target.value);
                  validateName(e.target.value, 'firstName');
                }}
                className={
                  nameError.firstName
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
                maxLength={30}
              />
              <div className='flex justify-between'>
                <div className='text-xs text-muted-foreground'>
                  {form.watch('firstName').length}/30
                </div>
                {nameError.firstName && (
                  <p className='text-sm text-red-500'>{nameError.firstName}</p>
                )}
              </div>
            </div>

            <div className='space-y-1 w-40'>
              <Label htmlFor='middleInitial'>Middle Initial</Label>
              <Input
                id='middleInitial'
                {...form.register('middleInitial')}
                onChange={(e) => {
                  form.setValue('middleInitial', e.target.value);
                  validateName(e.target.value, 'middleInitial');
                }}
                className={
                  nameError.middleInitial
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
                maxLength={1}
              />
              {nameError.middleInitial && (
                <p className='text-sm text-red-500'>
                  {nameError.middleInitial}
                </p>
              )}
            </div>
          </div>

          <div className='space-y-1 w-97'>
            <Label htmlFor='email'>Email *</Label>
            <Input
              id='email'
              type='email'
              {...form.register('email')}
              className={form.formState.errors.email ? 'border-red-500' : ''}
            />
            {form.formState.errors.email && (
              <p className='text-sm text-red-500'>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <Label htmlFor='department'>Department *</Label>
            <Select
              onValueChange={(value) => form.setValue('department', value)}
              defaultValue={form.getValues('department')}
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
            {form.formState.errors.department && (
              <p className='text-sm text-red-500'>
                {form.formState.errors.department.message}
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <Label htmlFor='workType'>Work Type *</Label>
            <Select
              onValueChange={(value) =>
                form.setValue('workType', value as WorkType)
              }
              defaultValue={form.getValues('workType')}
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
            {form.formState.errors.workType && (
              <p className='text-sm text-red-500'>
                {form.formState.errors.workType.message}
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <Label htmlFor='role'>Role *</Label>
            <Select
              onValueChange={(value) => form.setValue('role', value as Role)}
              defaultValue={form.getValues('role')}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.FACULTY}>Faculty</SelectItem>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                <SelectItem value={Role.ACADEMIC_HEAD}>
                  Academic Head
                </SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className='text-sm text-red-500'>
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <Label htmlFor='permission'>Permission *</Label>
            <Select
              onValueChange={(value) =>
                form.setValue('permission', value as Permission)
              }
              defaultValue={form.getValues('permission')}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select permission' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Permission.GRANTED}>Granted</SelectItem>
                <SelectItem value={Permission.DENIED}>Denied</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.permission && (
              <p className='text-sm text-red-500'>
                {form.formState.errors.permission.message}
              </p>
            )}
          </div>

          <div className='flex justify-end pt-4 gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                form.reset({
                  lastName: '',
                  firstName: '',
                  middleInitial: '',
                  email: '',
                  department: '',
                  workType: 'FULL_TIME',
                  role: 'FACULTY',
                  permission: 'GRANTED',
                });
                setNameError({});
                setOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='bg-[#124A69] text-white hover:bg-gray-700'
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
