'use client';

import { Role } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserRole } from '@/lib/actions/users';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface RoleSelectProps {
  userId: string;
  currentRole: Role;
}

export function RoleSelect({ userId, currentRole }: RoleSelectProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentValue, setCurrentValue] = useState<Role>(currentRole);

  const handleRoleChange = async (newRole: Role) => {
    const result = await updateUserRole(userId, newRole);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update role');
    }
    setCurrentValue(newRole);
  };

  const handleSelectChange = (value: string) => {
    setSelectedRole(value as Role);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!selectedRole) return;

    toast.promise(handleRoleChange(selectedRole), {
      loading: 'Updating role...',
      success: 'Role updated successfully',
      error: (err) => `Failed to update role: ${err.message}`,
    });
    setShowConfirmDialog(false);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setSelectedRole(null);
  };

  return (
    <>
      <Select value={currentValue} onValueChange={handleSelectChange}>
        <SelectTrigger className='w-[200px]'>
          <SelectValue placeholder='Select role' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={Role.ADMIN}>Admin</SelectItem>
          <SelectItem value={Role.ACADEMIC_HEAD}>Academic Head</SelectItem>
          <SelectItem value={Role.FACULTY}>Faculty</SelectItem>
        </SelectContent>
      </Select>

      <AlertDialog open={showConfirmDialog} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this user's role to{' '}
              <span className='font-semibold'>
                {selectedRole?.toLowerCase().replace('_', ' ')}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
