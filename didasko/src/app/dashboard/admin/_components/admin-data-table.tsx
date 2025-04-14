'use client';

import { DataTable } from './data-table';
import { columns } from './columns';
import { User } from '@prisma/client';

interface AdminDataTableProps {
  users: User[];
}

export function AdminDataTable({ users }: AdminDataTableProps) {
  return <DataTable columns={columns} data={users} />;
}
