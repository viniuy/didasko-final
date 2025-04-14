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

interface PermissionSelectProps {
  userId: string;
  currentPermission: Permission;
}

export function PermissionSelect({
  userId,
  currentPermission,
}: PermissionSelectProps) {
  const handlePermissionChange = async (newPermission: Permission) => {
    const result = await updateUserPermission(userId, newPermission);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update permission');
    }
  };

  return (
    <Select
      defaultValue={currentPermission}
      onValueChange={(value) => {
        toast.promise(handlePermissionChange(value as Permission), {
          loading: 'Updating permission...',
          success: 'Permission updated successfully',
          error: (err) => `Failed to update permission: ${err.message}`,
        });
      }}
    >
      <SelectTrigger className='w-[180px]'>
        <SelectValue placeholder='Select permission' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={Permission.GRANTED}>Granted</SelectItem>
        <SelectItem value={Permission.DENIED}>Denied</SelectItem>
      </SelectContent>
    </Select>
  );
}
