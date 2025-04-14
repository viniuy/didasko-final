'use client';

import { Permission } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserPermission } from '@/lib/actions/users';
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

interface PermissionSelectProps {
  userId: string;
  currentPermission: Permission;
}

export function PermissionSelect({
  userId,
  currentPermission,
}: PermissionSelectProps) {
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentValue, setCurrentValue] =
    useState<Permission>(currentPermission);

  const handlePermissionChange = async (newPermission: Permission) => {
    const result = await updateUserPermission(userId, newPermission);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update permission');
    }
    setCurrentValue(newPermission);
  };

  const handleSelectChange = (value: string) => {
    setSelectedPermission(value as Permission);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!selectedPermission) return;

    toast.promise(handlePermissionChange(selectedPermission), {
      loading: 'Updating permission...',
      success: 'Permission updated successfully',
      error: (err) => `Failed to update permission: ${err.message}`,
    });
    setShowConfirmDialog(false);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setSelectedPermission(null);
  };

  return (
    <>
      <Select value={currentValue} onValueChange={handleSelectChange}>
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='Select permission' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={Permission.GRANTED}>Granted</SelectItem>
          <SelectItem value={Permission.DENIED}>Denied</SelectItem>
        </SelectContent>
      </Select>

      <AlertDialog open={showConfirmDialog} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Permission Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this user's permission to{' '}
              <span className='font-semibold'>
                {selectedPermission?.toLowerCase()}
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
