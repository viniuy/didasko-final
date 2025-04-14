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

interface RoleSelectProps {
  userId: string;
  currentRole: Role;
}

export function RoleSelect({ userId, currentRole }: RoleSelectProps) {
  const handleRoleChange = async (newRole: Role) => {
    const result = await updateUserRole(userId, newRole);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update role');
    }
  };

  return (
    <Select
      defaultValue={currentRole}
      onValueChange={(value) => {
        toast.promise(handleRoleChange(value as Role), {
          loading: 'Updating role...',
          success: 'Role updated successfully',
          error: (err) => `Failed to update role: ${err.message}`,
        });
      }}
    >
      <SelectTrigger className='w-[180px]'>
        <SelectValue placeholder='Select role' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={Role.ADMIN}>Admin</SelectItem>
        <SelectItem value={Role.ACADEMIC_HEAD}>Academic Head</SelectItem>
        <SelectItem value={Role.FACULTY}>Faculty</SelectItem>
      </SelectContent>
    </Select>
  );
}
