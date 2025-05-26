'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'react-hot-toast';
import { Plus, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Available departments
const DEPARTMENTS = ['IT Department', 'BA Department', 'HM Department'];

const userSchema = z.object({
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(30, 'Last name must be at most 30 characters')
    .refine(
      (val) => /^[A-Za-z\s.-]+$/.test(val),
      'Last name cannot contain special characters or numbers',
    ),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(30, 'First name must be at most 30 characters')
    .refine(
      (val) => /^[A-Za-z\s.-]+$/.test(val),
      'First name cannot contain special characters or numbers',
    ),
  middleInitial: z
    .string()
    .max(2, 'Middle initial must be at most 2 characters')
    .refine(
      (val) => !val || /^[A-Za-z.]+$/.test(val),
      'Middle initial must be letters only',
    )
    .optional(),
  email: z.string().email('Invalid email address'),
  department: z.string().min(1, 'Department is required'),
  workType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']),
  role: z.enum(['ADMIN', 'FACULTY', 'ACADEMIC_HEAD']),
  permission: z.enum(['GRANTED', 'DENIED']),
});

interface UserSheetProps {
  mode: 'add' | 'edit';
  user?: {
    id: string;
    name: string;
    email: string;
    department: string;
    workType: WorkType;
    role: Role;
    permission: Permission;
  };
  onSuccess?: () => Promise<void> | void;
  onClose?: () => void;
  onSave?: (
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

export function UserSheet({
  mode,
  user,
  onSuccess,
  onClose,
  onSave,
}: UserSheetProps) {
  const [open, setOpen] = useState(mode === 'edit');
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
      if (value && !/^[A-Za-z.]+$/.test(value)) {
        setNameError((prev) => ({
          ...prev,
          [field]: 'Must be letters only',
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

    if (value.length < 2) {
      setNameError((prev) => ({
        ...prev,
        [field]: 'Must be at least 2 characters',
      }));
      return false;
    }

    if (!/^[A-Za-z\s.-]+$/.test(value)) {
      setNameError((prev) => ({
        ...prev,
        [field]: 'Cannot contain special characters or numbers',
      }));
      return false;
    }
    setNameError((prev) => ({ ...prev, [field]: undefined }));
    return true;
  };

  // Add parseName function
  const parseName = (fullName: string) => {
    // Remove any extra spaces
    const trimmedName = fullName.trim().replace(/\s+/g, ' ');

    let firstName = '';
    let middleInitial = '';
    let lastName = '';

    const commaIndex = trimmedName.indexOf(',');

    if (commaIndex > -1) {
      // Format: "LastName, FirstName MiddleInitial(s)"
      lastName = trimmedName.substring(0, commaIndex).trim();
      const restOfName = trimmedName.substring(commaIndex + 1).trim();
      const spaceParts = restOfName.split(' ').filter((part) => part !== '');

      firstName = spaceParts[0] || '';
      middleInitial =
        spaceParts.length > 1
          ? spaceParts.slice(1).join(' ').replace(/\./g, '').charAt(0)
          : '';
    } else {
      // Format: "FirstName MiddleInitial(s) LastName"
      const spaceParts = trimmedName.split(' ').filter((part) => part !== '');

      if (spaceParts.length === 3) {
        firstName = spaceParts[0];
        middleInitial = spaceParts[1].replace(/\./g, '').charAt(0);
        lastName = spaceParts[2];
      } else if (spaceParts.length === 2) {
        firstName = spaceParts[0];
        lastName = spaceParts[1];
        middleInitial = '';
      } else if (spaceParts.length === 1) {
        firstName = spaceParts[0];
        lastName = '';
        middleInitial = '';
      }
    }

    return { firstName, middleInitial, lastName };
  };

  // Use parseName instead of simple split
  const { firstName, middleInitial, lastName } =
    mode === 'edit' && user
      ? parseName(user.name)
      : { firstName: '', middleInitial: '', lastName: '' };

  const initialFormData = {
    firstName: mode === 'edit' ? firstName : '',
    lastName: mode === 'edit' ? lastName : '',
    middleInitial: mode === 'edit' ? middleInitial : '',
    email: mode === 'edit' ? user?.email || '' : '',
    department: mode === 'edit' ? user?.department || '' : '',
    workType: mode === 'edit' ? user?.workType || 'FULL_TIME' : 'FULL_TIME',
    role: mode === 'edit' ? user?.role || 'FACULTY' : 'FACULTY',
    permission: mode === 'edit' ? user?.permission || 'GRANTED' : 'GRANTED',
  };

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: initialFormData,
  });

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      setIsSubmitting(true);

      // Combine name fields into a single name string (First MiddleInitial Last)
      const fullName = `${values.firstName}${
        values.middleInitial ? ` ${values.middleInitial}` : ''
      } ${values.lastName}`;

      if (mode === 'add') {
        const result = await addUser({
          ...values,
          name: fullName,
        });

        if (result.success) {
          form.reset();
          setOpen(false);
          if (onSuccess) {
            await onSuccess();
          }
        }
      } else if (mode === 'edit' && user && onSave) {
        await onSave(user.id, {
          name: fullName,
          email: values.email,
          department: values.department,
          workType: values.workType,
          role: values.role,
          permission: values.permission,
        });
        setOpen(false);
        if (onSuccess) {
          await onSuccess();
        }
      }
    } catch (error) {
      console.error(
        `Error ${mode === 'add' ? 'adding' : 'updating'} user:`,
        error,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset(initialFormData);
    setNameError({});
    setOpen(false);
    document.body.style.pointerEvents = ''; // Reset pointer events
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = ''; // Cleanup on unmount
    };
  }, []);

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        } else {
          setOpen(true);
        }
      }}
    >
      {mode === 'add' && (
        <SheetTrigger asChild>
          <Button className='ml-auto bg-[#124A69] text-white hover:bg-gray-700'>
            <Plus className='mr-2 h-4 w-4' /> Add User
          </Button>
        </SheetTrigger>
      )}
      <SheetContent side='right' className='sm:max-w-md p-4 flex flex-col'>
        <SheetHeader className='mb-6'>
          <SheetTitle className='text-3xl font-semibold text-[#124A69] tracking-tight'>
            {mode === 'add' ? 'Add User' : 'Edit User'}
          </SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 py-4 flex-1 flex flex-col'
        >
          <div className='flex-1'>
            <div className='space-y-4'>
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
                      <p className='text-sm text-red-500'>
                        {nameError.firstName}
                      </p>
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
                    maxLength={2}
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
                  className={
                    form.formState.errors.email ? 'border-red-500' : ''
                  }
                />
                {form.formState.errors.email && (
                  <p className='text-sm text-red-500'>
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className='flex flex-row gap-2'>
                <div className='space-y-1 flex-1'>
                  <Label htmlFor='department'>Department *</Label>
                  <Select
                    onValueChange={(value) =>
                      form.setValue('department', value)
                    }
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

                <div className='space-y-1 flex-1'>
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
                      <SelectItem value={WorkType.FULL_TIME}>
                        Full Time
                      </SelectItem>
                      <SelectItem value={WorkType.PART_TIME}>
                        Part Time
                      </SelectItem>
                      <SelectItem value={WorkType.CONTRACT}>
                        Contract
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.workType && (
                    <p className='text-sm text-red-500'>
                      {form.formState.errors.workType.message}
                    </p>
                  )}
                </div>
              </div>

              <div className='flex flex-row gap-2'>
                <div className='space-y-1 flex-1'>
                  <Label htmlFor='role'>Role *</Label>
                  <Select
                    onValueChange={(value) =>
                      form.setValue('role', value as Role)
                    }
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

                <div className='space-y-1 flex-1'>
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
                      <SelectItem value={Permission.GRANTED}>
                        Granted
                      </SelectItem>
                      <SelectItem value={Permission.DENIED}>Denied</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.permission && (
                    <p className='text-sm text-red-500'>
                      {form.formState.errors.permission.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='flex justify-end gap-2 pt-4 border-t mt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={isSubmitting}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 bg-[#124A69] text-white hover:bg-gray-700'
            >
              {isSubmitting
                ? mode === 'add'
                  ? 'Adding...'
                  : 'Saving...'
                : mode === 'add'
                ? 'Add'
                : 'Save Changes'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
