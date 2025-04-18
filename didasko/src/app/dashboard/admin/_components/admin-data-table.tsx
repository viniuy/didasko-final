'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Role, WorkType, Permission } from '@/lib/types';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  workType: WorkType;
  role: Role;
  permission: Permission;
}

interface AdminDataTableProps {
  users: User[];
}

export function AdminDataTable({ users }: AdminDataTableProps) {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Work Type</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Permission</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.department}</TableCell>
              <TableCell>
                <Badge variant='outline'>{user.workType}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant='outline'>{user.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    user.permission === 'GRANTED' ? 'secondary' : 'destructive'
                  }
                >
                  {user.permission}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
