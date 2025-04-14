'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as PrismaUser, WorkType, Role, Permission } from '@prisma/client';
import { RoleSelect } from './role-select';
import { PermissionSelect } from './permission-select';

// Extend PrismaUser to include potential properties like image
type User = PrismaUser & { image?: string };

export const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Avatar className='h-8 w-8'>
          <AvatarImage src={row.original.image} alt={row.getValue('name')} />
          <AvatarFallback>
            {row.getValue('name')
              ? (row.getValue('name') as string).charAt(0)
              : '?'}
          </AvatarFallback>
        </Avatar>
        <span>{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
  {
    accessorKey: 'workType',
    header: 'Work Type',
    cell: ({ row }) => {
      const workType = row.getValue('workType') as WorkType;
      return (
        <span className='capitalize'>
          {workType.toLowerCase().replace('_', ' ')}
        </span>
      );
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as Role;
      const userId = row.original.id;
      return <RoleSelect userId={userId} currentRole={role} />;
    },
  },
  {
    accessorKey: 'permission',
    header: 'Permission',
    cell: ({ row }) => {
      const permission = row.getValue('permission') as Permission;
      const userId = row.original.id;
      return (
        <PermissionSelect userId={userId} currentPermission={permission} />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className='mr-2 h-4 w-4' /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className='text-red-600 hover:text-red-600 focus:text-red-600'>
              <Trash2 className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
