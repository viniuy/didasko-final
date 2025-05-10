'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Role, WorkType, Permission } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Download,
  Upload,
} from 'lucide-react';
import { AddUserSheet } from './add-user-sheet';
import { editUser, deleteUser } from '@/lib/actions/users';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditUserSheet } from './edit-user-sheet';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import axiosInstance from '@/lib/axios';

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
  onSaveChanges?: (
    changes: { id: string; role: Role; permission: Permission }[],
  ) => void;
  onUserAdded?: () => void;
}

interface CsvRow {
  'Last Name': string;
  'First Name': string;
  'Middle Initial': string;
  Email: string;
  Department: string;
  'Work Type': string;
  Role: string;
  Permission: string;
  [key: string]: string; // Add index signature for string keys
}

// Function to format name with comma and middle initial
const formatName = (fullName: string) => {
  const parts = fullName.split(' ');
  if (parts.length === 3) {
    // Last First Middle
    return `${parts[1]}, ${parts[2]} ${parts[0].charAt(0)}.`;
  } else if (parts.length === 2) {
    // Last First
    return `${parts[1]}, ${parts[0]}`;
  }
  return fullName; // Return original if format is unexpected
};

export function AdminDataTable({
  users,
  onSaveChanges,
  onUserAdded,
}: AdminDataTableProps) {
  const [editedUsers, setEditedUsers] = useState<{
    [key: string]: { role: Role; permission: Permission };
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<CsvRow[]>([]);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importTemplate, setImportTemplate] = useState<CsvRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidFile, setIsValidFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    status: string;
    error?: string;
    hasError?: boolean;
  } | null>(null);
  const [tableData, setTableData] = useState<User[]>(users);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return tableData;

    const query = searchQuery.toLowerCase();
    return tableData.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        user.workType.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    );
  }, [tableData, searchQuery]);

  const handleRoleChange = (userId: string, newRole: Role) => {
    setEditedUsers((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        role: newRole,
      },
    }));
  };

  const handlePermissionChange = (
    userId: string,
    newPermission: Permission,
  ) => {
    setEditedUsers((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        permission: newPermission,
      },
    }));
  };

  const handleSaveChanges = async () => {
    if (Object.keys(editedUsers).length === 0) return;

    try {
      setIsSaving(true);

      // Process each edited user
      for (const [userId, changes] of Object.entries(editedUsers)) {
        console.log('Saving changes for user:', { userId, changes });

        // Update role if changed
        if (changes.role) {
          const roleResult = await editUser(userId, { role: changes.role });
          if (!roleResult.success) {
            throw new Error(`Failed to update role: ${roleResult.error}`);
          }
        }

        // Update permission if changed
        if (changes.permission) {
          const permissionResult = await editUser(userId, {
            permission: changes.permission,
          });
          if (!permissionResult.success) {
            throw new Error(
              `Failed to update permission: ${permissionResult.error}`,
            );
          }
        }
      }

      // Clear edited state after successful save
      setEditedUsers({});

      // Refresh the table data
      await refreshTableData();

      toast.success('All changes saved successfully');

      // Call onUserAdded callback if provided
      if (onUserAdded) {
        await onUserAdded();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save changes',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setIsRefreshing(true);
      const result = await deleteUser(deletingUser.id);

      if (result.success) {
        console.log('User deleted successfully:', { userId: deletingUser.id });
        toast.success('User deleted successfully');

        // Refresh the table data
        await refreshTableData();
      } else {
        console.error('Failed to delete user:', result.error);

        // Show specific error message for user not found
        if (
          result.error?.includes('not found') ||
          result.error?.includes('does not exist')
        ) {
          toast.error('User no longer exists. The table will be refreshed.');
          await refreshTableData();
        } else {
          toast.error(result.error || 'Failed to delete user');
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('An error occurred while deleting the user');
    } finally {
      setDeletingUser(null);
    }
  };

  const handleEditUser = async (
    userId: string,
    data: {
      name?: string;
      email?: string;
      department?: string;
      workType?: WorkType;
      role?: Role;
      permission?: Permission;
    },
  ) => {
    console.log('Attempting to edit user:', { userId, data });
    try {
      const result = await editUser(userId, data);
      console.log('Edit user response:', result);

      if (result.success) {
        console.log('User updated successfully:', { userId });
        toast.success('User updated successfully');
        if (onUserAdded) {
          onUserAdded(); // Refresh the user list
        }
      } else {
        console.error('Failed to update user:', result.error);
        throw new Error(result.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof Error) {
        throw error; // Re-throw to show the actual error message
      } else {
        throw new Error('An error occurred while updating the user');
      }
    }
  };

  const handleCloseEditSheet = () => {
    console.log('Closing edit sheet');
    setEditingUser(null);
  };

  const hasChanges = Object.keys(editedUsers).length > 0;

  // Function to get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length === 3) {
      // Include middle initial
      return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase();
    } else if (parts.length === 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const handleCancelChanges = () => {
    setEditedUsers({});
  };

  const handlePreviewData = () => {
    try {
      // Format data for CSV
      const csvData: CsvRow[] = users.map((user) => {
        const nameParts = user.name.split(' ');
        const lastName = nameParts[0] || '';
        const firstName = nameParts[1] || '';
        const middleInitial =
          nameParts.length > 2 ? nameParts[2].charAt(0) : '';

        return {
          'Last Name': lastName,
          'First Name': firstName,
          'Middle Initial': middleInitial,
          Email: user.email || '',
          Department: user.department || '',
          'Work Type': user.workType
            .split('_')
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(' '),
          Role: user.role
            .split('_')
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(' '),
          Permission: user.permission.toLowerCase(),
        };
      });

      setPreviewData(csvData);
      setShowExportPreview(true);
    } catch (error) {
      console.error('Error preparing preview:', error);
      toast.error('Failed to prepare preview');
    }
  };

  const handleExport = () => {
    try {
      // Create header rows
      const header = [
        ['USER MANAGEMENT DATA'],
        [''],
        ['Date:', new Date().toLocaleDateString()],
        [''],
        // Column headers
        [
          'Last Name',
          'First Name',
          'Middle Initial',
          'Email',
          'Department',
          'Work Type',
          'Role',
          'Permission',
        ],
      ];

      // Create user data rows
      const userRows = users.map((user) => {
        const nameParts = user.name.split(' ');
        const lastName = nameParts[0] || '';
        const firstName = nameParts[1] || '';
        const middleInitial =
          nameParts.length > 2 ? nameParts[2].charAt(0) : '';

        return [
          lastName,
          firstName,
          middleInitial,
          user.email || '',
          user.department || '',
          user.workType
            .split('_')
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(' '),
          user.role
            .split('_')
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(' '),
          user.permission.toLowerCase(),
        ];
      });

      // Combine header and data
      const ws = XLSX.utils.aoa_to_sheet([...header, ...userRows]);

      // Style configurations
      const headerStyle = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center' },
      };
      const normalStyle = { font: { size: 12 } };

      // Configure column widths
      ws['!cols'] = [
        { wch: 20 }, // Last Name
        { wch: 20 }, // First Name
        { wch: 15 }, // Middle Initial
        { wch: 30 }, // Email
        { wch: 20 }, // Department
        { wch: 15 }, // Work Type
        { wch: 15 }, // Role
        { wch: 15 }, // Permission
      ];

      // Merge cells for title
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Merge first row across all columns
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Users');

      // Generate filename with date
      const filename = `user_data_${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success('User data exported successfully');
      setShowExportPreview(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleImportTemplate = () => {
    try {
      // Create header rows
      const header = [
        ['USER MANAGEMENT TEMPLATE'],
        [''],
        ['Date:', new Date().toLocaleDateString()],
        [''],
        // Column headers
        [
          'Last Name',
          'First Name',
          'Middle Initial',
          'Email',
          'Department',
          'Work Type',
          'Role',
          'Permission',
        ],
      ];

      // Create example row
      const exampleRow = [
        'Doe',
        'John',
        'M',
        'john.doe@example.com',
        'IT Department',
        'Full Time',
        'Faculty',
        'Granted',
      ];

      const ws = XLSX.utils.aoa_to_sheet([...header, exampleRow]);

      // Style configurations
      const headerStyle = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center' },
      };
      const normalStyle = { font: { size: 12 } };

      // Configure column widths
      ws['!cols'] = [
        { wch: 20 }, // Last Name
        { wch: 20 }, // First Name
        { wch: 15 }, // Middle Initial
        { wch: 30 }, // Email
        { wch: 20 }, // Department
        { wch: 15 }, // Work Type
        { wch: 15 }, // Role
        { wch: 15 }, // Permission
      ];

      // Merge cells for title
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Merge first row across all columns
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');

      // Generate filename with date
      const filename = `user_import_template_${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template');
    }
  };

  const handleImportPreview = () => {
    console.log('Opening import preview dialog');
    setShowImportPreview(true);
  };

  const readFile = (file: File): Promise<CsvRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('No data found in file'));
            return;
          }

          let rawData: string[][];

          // Handle different file types
          if (file.name.toLowerCase().endsWith('.csv')) {
            // For CSV files
            const csvData = data.toString();
            rawData = csvData
              .split('\n')
              .map((line) =>
                line
                  .split(',')
                  .map((cell) => cell.trim().replace(/^["']|["']$/g, '')),
              );
          } else {
            // For Excel files
            const workbook = XLSX.read(data, { type: 'binary' });
            if (!workbook.SheetNames.length) {
              reject(new Error('No sheets found in the file'));
              return;
            }

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
              header: 1,
              raw: false,
              blankrows: false,
            });
          }

          // Find the actual data rows (skip title, date, etc.)
          let headerRowIndex = -1;
          for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (
              Array.isArray(row) &&
              row.length >= 2 &&
              row[0]?.trim().toLowerCase() === 'last name' &&
              row[1]?.trim().toLowerCase() === 'first name'
            ) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            reject(
              new Error(
                'Could not find header row in file. Please make sure the file follows the template format.',
              ),
            );
            return;
          }

          // Convert the data rows to the expected format
          const headers = rawData[headerRowIndex].map((h) => h.trim());
          const dataRows = rawData
            .slice(headerRowIndex + 1)
            .filter(
              (row) =>
                Array.isArray(row) && row.some((cell) => cell && cell.trim()),
            );

          const formattedData = dataRows
            .map((row) => {
              const rowData: Record<string, string> = {};
              headers.forEach((header, index) => {
                if (header && row[index]) {
                  rowData[header] = row[index].toString().trim();
                }
              });
              return rowData;
            })
            .filter((row): row is CsvRow => {
              const requiredFields = [
                'Last Name',
                'First Name',
                'Email',
                'Department',
                'Work Type',
                'Role',
                'Permission',
              ];

              return requiredFields.every(
                (field) => row[field] && row[field].toString().trim() !== '',
              );
            });

          if (formattedData.length === 0) {
            reject(
              new Error(
                'No valid data rows found in file. Please check the template format.',
              ),
            );
            return;
          }

          resolve(formattedData);
        } catch (error) {
          console.error('File parsing error:', error);
          reject(
            new Error(
              'Error parsing file. Please make sure you are using the correct template format.',
            ),
          );
        }
      };

      reader.onerror = () => reject(new Error('Error reading file'));

      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleFilePreview = async (file: File) => {
    try {
      const data = await readFile(file);
      if (data.length > 0) {
        const previewRows = data.slice(0, 5);
        setPreviewData(previewRows);
        setIsValidFile(true);
        toast.success('File loaded successfully');
      } else {
        throw new Error('No valid data found in file');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setIsValidFile(false);
      setPreviewData([]);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error reading file. Please check the template format.',
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name);
      if (validateFile(file)) {
        setSelectedFile(file);
        handleFilePreview(file);
      } else {
        setSelectedFile(null);
        setPreviewData([]);
        setIsValidFile(false);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      '', // Some browsers might not set the type correctly
    ];

    const extension = file.name.toLowerCase().split('.').pop();
    const validExtensions = ['xlsx', 'xls', 'csv'];

    if (!validExtensions.includes(extension || '')) {
      toast.error(
        'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.',
      );
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB.');
      return false;
    }

    return true;
  };

  const refreshTableData = async () => {
    try {
      setIsRefreshing(true);
      const response = await axiosInstance.get('/api/users');
      const data = await response.data;
      if (data.users) {
        setTableData(data.users);
      }
    } catch (error) {
      console.error('Error refreshing table data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImport = async () => {
    try {
      const usersToImport = previewData.map((row) => ({
        lastName: row['Last Name'],
        firstName: row['First Name'],
        middleInitial: row['Middle Initial'],
        email: row['Email'],
        department: row['Department'],
        workType: row['Work Type'] as WorkType,
        role: row['Role'] as Role,
        permission: row['Permission'] as Permission,
      }));

      const response = await axiosInstance.post('/users/import', {
        users: usersToImport,
      });

      if (response.status === 200) {
        toast.success('Users imported successfully');
        setPreviewData([]);
        setShowImportPreview(false);
        if (onUserAdded) {
          onUserAdded();
        }
      } else {
        throw new Error('Failed to import users');
      }
    } catch (error) {
      console.error('Error importing users:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to import users',
      );
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-lg font-semibold'>User Management</h2>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleImportPreview}
            className='flex items-center gap-2'
          >
            <Download className='h-4 w-4' />
            Import Users
          </Button>
          <Button
            variant='outline'
            onClick={handlePreviewData}
            className='flex items-center gap-2'
          >
            <Download className='h-4 w-4' />
            Export Data
          </Button>
          <AddUserSheet onSuccess={refreshTableData} />
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search users...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-8'
          />
        </div>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[250px]'>Name</TableHead>
              <TableHead className='w-[250px]'>Email</TableHead>
              <TableHead className='w-[150px]'>Department</TableHead>
              <TableHead className='w-[120px]'>Work Type</TableHead>
              <TableHead className='w-[120px]'>Role</TableHead>
              <TableHead className='w-[120px]'>Permission</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isRefreshing ? (
              <TableRow>
                <TableCell colSpan={7} className='h-24'>
                  <div className='flex justify-center items-center'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-[#124A69]' />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredUsers.map((user) => {
                  const isEdited = editedUsers[user.id];
                  const currentRole = isEdited?.role || user.role;
                  const currentPermission =
                    isEdited?.permission || user.permission;

                  return (
                    <TableRow
                      key={user.id}
                      className={isEdited ? 'bg-yellow-50' : ''}
                    >
                      <TableCell className='flex items-center gap-3'>
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback className='bg-[#124A69] text-white'>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{formatName(user.name)}</span>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        {user.workType
                          .split('_')
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase(),
                          )
                          .join(' ')}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={currentRole}
                          onValueChange={(value: Role) =>
                            handleRoleChange(user.id, value)
                          }
                        >
                          <SelectTrigger className='w-[130px]'>
                            <SelectValue placeholder='Select role' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='ADMIN'>Admin</SelectItem>
                            <SelectItem value='FACULTY'>Faculty</SelectItem>
                            <SelectItem value='ACADEMIC_HEAD'>
                              Academic Head
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={currentPermission}
                          onValueChange={(value: Permission) =>
                            handlePermissionChange(user.id, value)
                          }
                        >
                          <SelectTrigger className='w-[130px]'>
                            <SelectValue placeholder='Select permission'>
                              <div className='flex items-center gap-2'>
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    currentPermission === 'GRANTED'
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                  }`}
                                />
                                <span>
                                  {currentPermission === 'GRANTED'
                                    ? 'Granted'
                                    : 'Denied'}
                                </span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='GRANTED'>
                              <div className='flex items-center gap-2'>
                                <div className='h-2 w-2 rounded-full bg-green-500' />
                                <span>Granted</span>
                              </div>
                            </SelectItem>
                            <SelectItem value='DENIED'>
                              <div className='flex items-center gap-2'>
                                <div className='h-2 w-2 rounded-full bg-red-500' />
                                <span>Denied</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Open menu</span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              className='flex items-center gap-2'
                              onClick={() => setEditingUser(user)}
                            >
                              <Pencil className='h-4 w-4' />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='flex items-center gap-2 text-red-600'
                              onClick={() =>
                                setDeletingUser({
                                  id: user.id,
                                  name: user.name,
                                })
                              }
                            >
                              <Trash2 className='h-4 w-4' />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className='h-24 text-center'>
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      {hasChanges && (
        <div className='flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={handleCancelChanges}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className='bg-[#124A69] hover:bg-[#0D3A54] text-white'
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
      {editingUser && (
        <EditUserSheet
          user={editingUser}
          onClose={handleCloseEditSheet}
          onSave={handleEditUser}
        />
      )}
      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className='font-semibold'>{deletingUser?.name}</span>'s
              account and remove their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700 text-white'
              onClick={handleDeleteUser}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
        <DialogContent className='max-w-[800px] p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#124A69]'>
              Export to Excel
            </DialogTitle>
            <DialogDescription>
              Preview of data to be exported:
            </DialogDescription>
          </DialogHeader>
          <div className='mt-6 max-h-[400px] overflow-auto'>
            <table className='w-full border-collapse'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Last Name
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    First Name
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Middle Initial
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Email
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Department
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Work Type
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Role
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Permission
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {row['Last Name']}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {row['First Name']}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {row['Middle Initial']}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {row['Email']}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {row['Department']}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {row['Work Type']}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {row['Role']}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {row['Permission']}
                    </td>
                  </tr>
                ))}
                {previewData.length > 5 && (
                  <tr className='border-t'>
                    <td
                      colSpan={8}
                      className='px-4 py-2 text-sm text-gray-500 text-center'
                    >
                      And {previewData.length - 5} more users...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className='mt-6 flex justify-end gap-4'>
            <Button
              variant='outline'
              onClick={() => setShowExportPreview(false)}
            >
              Cancel
            </Button>
            <Button
              className='bg-[#124A69] hover:bg-[#0D3A54] text-white'
              onClick={handleExport}
            >
              Export to Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showImportPreview} onOpenChange={setShowImportPreview}>
        <DialogContent className='max-w-[800px] p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#124A69]'>
              Import Users
            </DialogTitle>
            <DialogDescription>
              Please upload a file following the template format below:
            </DialogDescription>
          </DialogHeader>
          <div className='mt-6 space-y-6'>
            <div className='flex items-center gap-4'>
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleFileChange}
                accept='.xlsx,.xls,.csv'
                className='hidden'
              />
              <Button
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                className='flex items-center gap-2 bg-white hover:bg-gray-50'
              >
                <Upload className='h-4 w-4' />
                Choose File
              </Button>
              {selectedFile && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-600'>
                    {selectedFile.name}
                  </span>
                  <Badge variant={isValidFile ? 'default' : 'destructive'}>
                    {isValidFile ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
              )}
            </div>

            {previewData.length > 0 ? (
              <div className='border rounded-lg overflow-hidden max-w-[460px]'>
                <div className='bg-gray-50 p-4 border-b'>
                  <h3 className='font-medium text-gray-700'>
                    Preview Import Data
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Showing {previewData.length}{' '}
                    {previewData.length === 1 ? 'row' : 'rows'} from import file
                  </p>
                </div>
                <div className='max-h-[300px] overflow-auto'>
                  <table className='w-full border-collapse'>
                    <thead className='bg-gray-50 sticky top-0'>
                      <tr>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                          Last Name
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                          First Name
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                          Middle Initial
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                          Email
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                          Department
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                          Work Type
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                          Role
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                          Permission
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className='border-t hover:bg-gray-50'>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {row['Last Name']}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {row['First Name']}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {row['Middle Initial']}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {row['Email']}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {row['Department']}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {row['Work Type']}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {row['Role']}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {row['Permission']}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className='text-center p-6 border rounded-lg bg-gray-50'>
                <p className='text-gray-500'>
                  No preview available. Please select a file to import.
                </p>
              </div>
            )}

            {importProgress && (
              <div
                className={`space-y-2 p-4 border rounded-lg ${
                  importProgress.hasError
                    ? 'bg-red-50 border-red-200'
                    : importProgress.error?.includes('already exist')
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className='flex items-center gap-2'>
                  {importProgress.hasError ? (
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-red-500'
                    >
                      <circle cx='12' cy='12' r='10'></circle>
                      <line x1='12' y1='8' x2='12' y2='12'></line>
                      <line x1='12' y1='16' x2='12.01' y2='16'></line>
                    </svg>
                  ) : importProgress.error?.includes('already exist') ? (
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-amber-500'
                    >
                      <circle cx='12' cy='12' r='10'></circle>
                      <line x1='12' y1='8' x2='12' y2='12'></line>
                      <line x1='12' y1='16' x2='12.01' y2='16'></line>
                    </svg>
                  ) : (
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-[#124A69]' />
                  )}
                  <p
                    className={`text-sm ${
                      importProgress.hasError
                        ? 'text-red-600 font-medium'
                        : importProgress.error?.includes('already exist')
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    {importProgress.status}
                  </p>
                </div>

                {importProgress.error && (
                  <div
                    className={`mt-2 text-sm p-2 rounded border ${
                      importProgress.hasError
                        ? 'text-red-600 bg-red-50 border-red-100'
                        : 'text-amber-600 bg-amber-50 border-amber-100'
                    }`}
                  >
                    {importProgress.error}
                  </div>
                )}

                {importProgress.total > 0 && !importProgress.hasError && (
                  <div className='w-full bg-gray-200 rounded-full h-2.5'>
                    <div
                      className='bg-[#124A69] h-2.5 rounded-full transition-all duration-300'
                      style={{
                        width: `${
                          (importProgress.current / importProgress.total) * 100
                        }%`,
                      }}
                    />
                  </div>
                )}

                {(importProgress.hasError || importProgress.error) && (
                  <div className='flex justify-end mt-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setImportProgress(null)}
                      className='text-xs'
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className='flex justify-end gap-4'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowImportPreview(false);
                  setSelectedFile(null);
                  setPreviewData([]);
                  setIsValidFile(false);
                  setImportProgress(null);
                }}
                disabled={!!importProgress}
              >
                Cancel
              </Button>
              <Button
                variant='outline'
                onClick={handleImportTemplate}
                className='bg-white hover:bg-gray-50'
                disabled={!!importProgress}
              >
                Download Template
              </Button>
              <Button
                className='bg-[#124A69] hover:bg-[#0D3A54] text-white'
                onClick={handleImport}
                disabled={!selectedFile || !isValidFile || !!importProgress}
              >
                {importProgress ? 'Importing...' : 'Import Users'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
