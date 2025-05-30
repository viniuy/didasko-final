'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { UserSheet } from './user-sheet';
import { editUser, deleteUser } from '@/lib/actions/users';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import axiosInstance from '@/lib/axios';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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

// Function to format name as "FirstName M.I. LastName"
const formatNameDisplay = (fullName: string) => {
  const trimmedName = fullName.trim().replace(/\s+/g, ' ');
  const commaParts = trimmedName.split(',');

  let firstName = '';
  let middleInitial = '';
  let lastName = '';

  if (commaParts.length > 1) {
    // Format: "LastName, FirstName SecondName MiddleInitial"
    lastName = commaParts[0].trim();
    const restOfName = commaParts[1].trim();
    const spaceParts = restOfName.split(' ');

    // Check if the last part is a middle initial
    const lastPart = spaceParts[spaceParts.length - 1];
    if (lastPart.length === 1 || lastPart.includes('.')) {
      middleInitial = lastPart.replace('.', '') + '.'; // Add dot if not present
      // Everything before the middle initial is first name (including second name)
      firstName = spaceParts.slice(0, -1).join(' ');
    } else {
      // No middle initial, everything before last name is first name
      firstName = spaceParts.slice(0, -1).join(' ');
    }
  } else {
    // Format: "FirstName SecondName MiddleInitial LastName" or "FirstName SecondName LastName"
    const spaceParts = trimmedName.split(' ');
    if (spaceParts.length === 1) {
      firstName = spaceParts[0];
    } else if (spaceParts.length === 2) {
      firstName = spaceParts[0];
      lastName = spaceParts[1];
    } else {
      // Check if the second-to-last part is a middle initial
      const secondToLast = spaceParts[spaceParts.length - 2];
      if (secondToLast.length === 1 || secondToLast.includes('.')) {
        middleInitial = secondToLast.replace('.', '') + '.'; // Add dot if not present
        lastName = spaceParts[spaceParts.length - 1];
        // First name is the first part, second name is everything between first name and middle initial
        firstName = spaceParts[0];
        if (spaceParts.length > 3) {
          firstName += ' ' + spaceParts.slice(1, -2).join(' ');
        }
      } else {
        // No middle initial, last part is last name, everything else is first name (including second name)
        lastName = spaceParts[spaceParts.length - 1];
        firstName = spaceParts.slice(0, -1).join(' ');
      }
    }
  }

  // Construct the display name
  let displayName = firstName;
  if (middleInitial) {
    displayName += ` ${middleInitial}`;
  }
  if (lastName) {
    displayName += ` ${lastName}`;
  }

  return displayName.trim();
};

export function AdminDataTable({
  users: initialUsers,
  onSaveChanges,
  onUserAdded,
}: AdminDataTableProps) {
  const [editedUsers, setEditedUsers] = useState<{
    [key: string]: {
      name?: string;
      email?: string;
      department?: string;
      workType?: WorkType;
      role?: Role;
      permission?: Permission;
    };
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<CsvRow[]>([]);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [showImportStatus, setShowImportStatus] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    imported: number;
    skipped: number;
    errors: Array<{ email: string; message: string }>;
    total: number;
    detailedFeedback: Array<{
      row: number;
      email: string;
      status: string;
      message: string;
    }>;
  } | null>(null);
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
  const [tableData, setTableData] = useState<User[]>(initialUsers);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isRoleUpdating, setIsRoleUpdating] = useState<{
    [key: string]: boolean;
  }>({});
  const [isPermissionUpdating, setIsPermissionUpdating] = useState<{
    [key: string]: boolean;
  }>({});

  const refreshTableData = async () => {
    try {
      setIsRefreshing(true);
      const response = await axiosInstance.get('/users');
      const data = await response.data;
      if (data.users) {
        // Create a map of existing users for quick lookup
        const existingUsersMap = new Map(
          tableData.map((user) => [user.id, user]),
        );

        // Merge new users with existing ones, preserving order and complete data structure
        const mergedUsers = data.users.map((newUser: User) => {
          const existingUser = existingUsersMap.get(newUser.id);
          if (existingUser) {
            // Preserve existing user data and update with any new changes
            return {
              ...existingUser,
              ...newUser,
              // Ensure all required fields are present
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              department: newUser.department,
              workType: newUser.workType,
              role: newUser.role,
              permission: newUser.permission,
            };
          }
          return newUser;
        });

        // Add any users that weren't in the response but exist in current table
        const newUsers = tableData.filter(
          (user) => !data.users.some((newUser: User) => newUser.id === user.id),
        );

        setTableData([...mergedUsers, ...newUsers]);
      }
    } catch (error) {
      console.error('Error refreshing table data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add useEffect to refresh data when initialUsers changes
  useEffect(() => {
    if (initialUsers.length > 0) {
      setTableData(initialUsers);
    }
  }, [initialUsers]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return tableData;

    const query = searchQuery.toLowerCase();
    return tableData.filter(
      (user: User) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        user.workType.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    );
  }, [tableData, searchQuery]);

  // Calculate pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage),
  );
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Add useEffect to handle pagination when filtered users change
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredUsers.length, currentPage, itemsPerPage]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      setIsRoleUpdating((prev) => ({ ...prev, [userId]: true }));

      const result = await editUser(userId, { role: newRole });
      if (result.success) {
        // Update the table data directly
        setTableData((prevData) =>
          prevData.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user,
          ),
        );

        toast.success(
          `Role updated to ${newRole
            .split('_')
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(' ')}`,
          {
            duration: 3000,
            style: {
              background: '#fff',
              color: '#124A69',
              border: '1px solid #e5e7eb',
              boxShadow:
                '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              borderRadius: '0.5rem',
              padding: '1rem',
            },
          },
        );
      } else {
        throw new Error(result.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update role',
        {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
        },
      );
    } finally {
      setIsRoleUpdating((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handlePermissionChange = async (
    userId: string,
    newPermission: Permission,
  ) => {
    try {
      setIsPermissionUpdating((prev) => ({ ...prev, [userId]: true }));

      const result = await editUser(userId, { permission: newPermission });
      if (result.success) {
        // Update the table data directly
        setTableData((prevData) =>
          prevData.map((user) =>
            user.id === userId ? { ...user, permission: newPermission } : user,
          ),
        );

        toast.success(`Permission ${newPermission.toLowerCase()}`, {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
        });
      } else {
        throw new Error(result.error || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update permission',
        {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
        },
      );
    } finally {
      setIsPermissionUpdating((prev) => ({ ...prev, [userId]: false }));
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
        toast.success('User updated successfully', {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
          },
        });
        // Refresh the table data
        await refreshTableData();
        if (onUserAdded) {
          await onUserAdded(); // Refresh the user list
        }
        // Close the edit sheet
        setEditingUser(null);
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsRefreshing(true);
      const result = await deleteUser(userToDelete.id);

      if (result.success) {
        console.log('User deleted successfully:', { userId: userToDelete.id });
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
      setUserToDelete(null);
    }
  };

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

  const handlePreviewData = () => {
    try {
      // Format data for CSV
      const csvData: CsvRow[] = tableData.map((user: User) => {
        const nameParts = user.name.split(' ');
        let firstName = '';
        let lastName = '';
        let middleInitial = '';

        if (nameParts.length >= 2) {
          // Last part is always last name
          lastName = nameParts[nameParts.length - 1];

          // Check if second-to-last part is a middle initial
          if (nameParts.length >= 3) {
            const secondToLast = nameParts[nameParts.length - 2];
            if (/^[A-Z]\.?$/.test(secondToLast) || secondToLast.length === 1) {
              middleInitial = secondToLast.replace('.', '');
              // Everything before middle initial is first name
              firstName = nameParts.slice(0, -2).join(' ');
            } else {
              // No middle initial, everything before last name is first name
              firstName = nameParts.slice(0, -1).join(' ');
            }
          } else {
            // Only two parts, first is first name
            firstName = nameParts[0];
          }
        } else {
          // Single name
          firstName = nameParts[0];
        }

        return {
          'First Name': firstName,
          'Last Name': lastName,
          'Middle Initial': middleInitial,
          Email: user.email || '',
          Department: user.department || '',
          'Work Type': user.workType
            .split('_')
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(' '),
          Role: user.role
            .split('_')
            .map(
              (word: string) =>
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
          'First Name',
          'Last Name',
          'Middle Initial',
          'Email',
          'Department',
          'Work Type',
          'Role',
          'Permission',
        ],
      ];

      // Create user data rows
      const userRows = tableData.map((user: User) => {
        const nameParts = user.name.split(' ');
        let firstName = '';
        let lastName = '';
        let middleInitial = '';

        if (nameParts.length >= 2) {
          // Last part is always last name
          lastName = nameParts[nameParts.length - 1];

          // Check if second-to-last part is a middle initial
          if (nameParts.length >= 3) {
            const secondToLast = nameParts[nameParts.length - 2];
            if (/^[A-Z]\.?$/.test(secondToLast) || secondToLast.length === 1) {
              middleInitial = secondToLast.replace('.', '');
              // Everything before middle initial is first name
              firstName = nameParts.slice(0, -2).join(' ');
            } else {
              // No middle initial, everything before last name is first name
              firstName = nameParts.slice(0, -1).join(' ');
            }
          } else {
            // Only two parts, first is first name
            firstName = nameParts[0];
          }
        } else {
          // Single name
          firstName = nameParts[0];
        }

        return [
          firstName,
          lastName,
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
        { wch: 20 }, // First Name
        { wch: 20 }, // Last Name
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
        ['IMPORTANT NOTES:'],
        ['1. All email addresses MUST be from @alabang.sti.edu.ph domain'],
        ['2. Example: john.doe@alabang.sti.edu.ph'],
        ['3. Do not include empty rows'],
        ['4. All fields are required'],
        [
          '5. Names can only contain letters and one space (e.g., "John Smith")',
        ],
        ['6. Middle initial must be a single letter'],
        [''],
        // Column headers
        [
          'First Name',
          'Last Name',
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
        'John',
        'Smith',
        'A',
        'john.smith@alabang.sti.edu.ph',
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
        { wch: 20 }, // First Name
        { wch: 20 }, // Last Name
        { wch: 15 }, // Middle Initial
        { wch: 35 }, // Email (increased width for longer email addresses)
        { wch: 20 }, // Department
        { wch: 15 }, // Work Type
        { wch: 15 }, // Role
        { wch: 15 }, // Permission
      ];

      // Merge cells for title and notes
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Merge title row
        { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }, // Merge "IMPORTANT NOTES:" row
        { s: { r: 5, c: 0 }, e: { r: 5, c: 7 } }, // Merge email requirement note
        { s: { r: 6, c: 0 }, e: { r: 6, c: 7 } }, // Merge email example
        { s: { r: 7, c: 0 }, e: { r: 7, c: 7 } }, // Merge empty rows note
        { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } }, // Merge required fields note
        { s: { r: 9, c: 0 }, e: { r: 9, c: 7 } }, // Merge name format note
        { s: { r: 10, c: 0 }, e: { r: 10, c: 7 } }, // Merge middle initial note
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
            // For CSV files, read into raw array of arrays
            const csvData = data.toString();
            rawData = csvData
              .split('\n')
              .map((line) =>
                line
                  .split(',')
                  .map((cell) => cell.trim().replace(/^["\']|["\']$/g, '')),
              );
          } else {
            // For Excel files, convert to CSV string first, then parse into raw array of arrays
            const workbook = XLSX.read(data, { type: 'binary' });
            if (!workbook.SheetNames.length) {
              reject(new Error('No sheets found in the file'));
              return;
            }
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert worksheet to CSV string
            const csvString = XLSX.utils.sheet_to_csv(worksheet, {
              blankrows: false, // Skip blank rows
              forceQuotes: true, // Ensure values with commas are quoted
            });

            // Parse CSV string into raw array of arrays
            rawData = csvString.split('\n').map(
              (line) =>
                line
                  .split(',')
                  .map((cell) => cell.trim().replace(/^"|"$/g, '')), // Remove potential quotes added by forceQuotes
            );
          }

          // --- Debugging: Log rawData structure and content ---
          console.log('Type of rawData:', typeof rawData);
          console.log('Is rawData an Array?', Array.isArray(rawData));
          if (Array.isArray(rawData)) {
            console.log('rawData length:', rawData.length);
            console.log('First few rows of rawData:', rawData.slice(0, 15));
            if (rawData.length > 0 && Array.isArray(rawData[0])) {
              console.log('Type of first row:', typeof rawData[0]);
              console.log('Is first row an Array?', Array.isArray(rawData[0]));
              console.log(
                'First few cells of first row:',
                rawData[0].slice(0, 5),
              );
            } else if (rawData.length > 0) {
              console.log(
                'First row is not an array. Structure might be unexpected.',
                rawData[0],
              );
            }
          } else {
            console.error(
              'rawData is not an array. Import cannot proceed.',
              rawData,
            );
            reject(new Error('Failed to read file data into expected format.'));
            return; // Stop processing if rawData is not an array
          }
          // --- End Debugging ---

          // Find the actual data rows (skip title, date, etc.)
          let headerRowIndex = -1;
          const expectedHeaders = [
            'First Name',
            'Last Name',
            'Middle Initial',
            'Email',
            'Department',
            'Work Type',
            'Role',
            'Permission',
          ];

          // Log the expected headers for debugging
          console.log('Looking for headers:', expectedHeaders);

          for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            // Ensure row is an array and has enough columns before checking headers
            if (!Array.isArray(row) || row.length < expectedHeaders.length)
              continue;

            // --- Detailed Debugging inside header detection loop ---
            console.log(
              `Checking row ${i} for headers:`,
              row.slice(0, expectedHeaders.length),
            ); // Log the potential header cells

            const isHeaderRow = expectedHeaders.every((header, index) => {
              const cellValue =
                typeof row[index] === 'string' || typeof row[index] === 'number'
                  ? String(row[index]).trim().toLowerCase()
                  : ''; // Treat non-string/number as empty
              const expectedValue = header.toLowerCase();
              const matches = cellValue === expectedValue;

              if (!matches) {
                console.log(
                  `Mismatch in header check at row ${i}, column ${index}:`,
                  {
                    expectedHeader: header,
                    cellValue: row[index], // Log original cell value
                    processedCellValue: cellValue, // Log processed cell value
                    expectedProcessedValue: expectedValue,
                  },
                );
              }

              return matches;
            });
            // --- End Detailed Debugging ---

            if (isHeaderRow) {
              headerRowIndex = i;
              console.log('Found header row at index:', i);
              break;
            }
          }

          if (headerRowIndex === -1) {
            // Instead of rejecting, resolve with an empty array and let the caller handle the invalid format
            resolve([]);
            return; // Exit the function after resolving
          }

          // Extract headers and data rows after finding the header index
          const headers = rawData[headerRowIndex].map(
            (h) => h?.toString().trim() || '',
          ); // Ensure headers are strings and handle potential null/undefined
          console.log('Found headers:', headers);

          const dataRowsRaw = rawData
            .slice(headerRowIndex + 1)
            .filter(
              (row) =>
                Array.isArray(row) &&
                row.some(
                  (cell) =>
                    cell !== null &&
                    cell !== undefined &&
                    cell.toString().trim() !== '',
                ),
            ); // Filter out empty or null/undefined rows

          console.log('Raw data rows after header:', dataRowsRaw.slice(0, 5));

          // Manually map data rows to objects using found headers
          const formattedData: CsvRow[] = dataRowsRaw.map((row) => {
            const rowData: Record<string, string> = {};
            headers.forEach((header, index) => {
              // Use header as key, get cell value, trim, default to empty string, ensure it's a string
              rowData[header] =
                row[index] !== null && row[index] !== undefined
                  ? String(row[index]).trim()
                  : '';
            });
            return rowData as CsvRow; // Cast to CsvRow type
          });

          // Filter out any rows that don't have required fields AFTER mapping
          const validFormattedData = formattedData.filter(
            (row): row is CsvRow => {
              const requiredFields = [
                'First Name',
                'Last Name',
                'Email',
                'Department',
                'Work Type',
                'Role',
                'Permission',
              ];

              // Check if all required fields have a non-empty value
              const isValid = requiredFields.every(
                (field) => row[field] && row[field].toString().trim() !== '',
              );

              if (!isValid) {
                console.log('Invalid row (missing required fields):', row);
              }

              return isValid;
            },
          );

          if (validFormattedData.length === 0) {
            reject(
              new Error(
                'No valid data rows found in file. Please check that there are rows with all required information below the header.',
              ),
            );
            return;
          }

          console.log(
            'Successfully formatted data:',
            validFormattedData.slice(0, 2),
          );
          resolve(validFormattedData);
        } catch (error) {
          console.error('File parsing error:', error);
          reject(
            new Error(
              'Error parsing file. Please make sure you are using a valid file and template format.',
            ), // More general error for other parsing issues
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@alabang\.sti\.edu\.ph$/;
    return emailRegex.test(email);
  };

  const handleFilePreview = async (file: File) => {
    try {
      console.log('Starting file preview for:', file.name);
      const data = await readFile(file);
      console.log(
        'readFile resolved successfully in handleFilePreview. Data length:',
        data.length,
      );

      if (data.length > 0) {
        const previewRows = data.slice(0, 5);
        setPreviewData(previewRows);
        setIsValidFile(true);
        toast.success('File loaded successfully');
      } else {
        // This branch is reached if readFile resolves with an empty array (e.g., header not found)
        console.warn('readFile resolved with empty data in handleFilePreview.');
        setIsValidFile(false); // Mark as invalid
        setPreviewData([]); // Clear preview data
        toast.error(
          'Could not find header row. Please make sure the file is using the template format.',
        ); // Specific error message
        // No need to throw here, already handled the invalid state
      }
    } catch (error) {
      console.error('Error caught in handleFilePreview:', error);
      setIsValidFile(false);
      setPreviewData([]);
      // Use a more general error message here for other parsing issues caught by readFile's catch
      toast.error(
        error instanceof Error && error.message.includes('parsing file')
          ? error.message // Use the more general parsing error message from readFile's catch
          : 'Error reading file. Please ensure it is a valid Excel or CSV file.',
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file for change:', file.name);
      if (validateFile(file)) {
        setSelectedFile(file);
        handleFilePreview(file);
      } else {
        setSelectedFile(null);
        setPreviewData([]);
        setIsValidFile(false);
        console.log('File validation failed in handleFileChange.');
      }
    } else {
      console.log('No file selected in handleFileChange.');
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

  const handleImport = async () => {
    if (!selectedFile || !isValidFile || previewData.length === 0) {
      console.warn(
        'Import attempted without a valid file or no data to import.',
      );
      // Optionally show a toast message here
      if (!selectedFile) toast.error('Please select a file first.');
      else if (!isValidFile) toast.error('Selected file is not valid.');
      else if (previewData.length === 0)
        toast.error('No valid data rows found in the file preview.');
      return;
    }

    try {
      setShowImportStatus(true);
      setImportProgress({
        current: 0,
        total: previewData.length, // Total is the number of rows to import
        status: 'Importing users...',
      });
      console.log('Starting import process. Sending parsed data to backend.');

      // We are now sending the already parsed previewData directly
      // No need for FormData or file processing on the frontend here

      const response = await axiosInstance.post('/users/import', previewData);

      const {
        imported,
        skipped,
        errors,
        importedUsers,
        total: backendTotalProcessed,
        detailedFeedback,
      } = response.data;

      // Set import status for the modal
      setImportStatus({
        imported: imported || 0, // number of successfully imported users
        skipped: skipped || 0, // number of skipped users (e.g., duplicates)
        errors: errors || [], // array of errors with email and message
        total: backendTotalProcessed || previewData.length, // Total processed items reported by backend or frontend total
        detailedFeedback: detailedFeedback || [], // Store detailed feedback
      });

      // Check if there were any errors or only skipped users
      if (errors && errors.length > 0) {
        toast.error(`Import finished with ${errors.length} errors.`);
      } else if (skipped && skipped > 0) {
        toast.warning(`Import finished. ${skipped} users skipped.`);
      } else if (imported && imported > 0) {
        toast.success(`Successfully imported ${imported} users.`);
      } else {
        // Handle case where response is success but no users were imported/skipped/errored (e.g., empty file after header)
        toast.info('Import process finished with no users imported.');
      }

      // Clear the progress after process is complete/failed
      setImportProgress(null);

      // Refresh the table data
      // A short delay might be needed to ensure backend database is updated before fetching
      setTimeout(async () => {
        await refreshTableData();
        if (onUserAdded) {
          onUserAdded(); // Refresh the user list if necessary
        }
      }, 500); // Add a small delay
    } catch (error: any) {
      console.error('Error caught in handleImport:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2)); // Log the full error object

      let errorMessage = 'Failed to import users';
      let importErrors = [];

      if (error.response && error.response.data && error.response.data.error) {
        // Backend returned a specific error message in the response body
        errorMessage = error.response.data.error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error
      ) {
        errorMessage = String((error as { message: unknown }).message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Try to get detailed errors from backend response if available
      const errorResponse = (error as any)?.response?.data;
      if (errorResponse && errorResponse.errors) {
        importErrors = errorResponse.errors;
      } else {
        // If no detailed error response, just show the basic error
        importErrors.push({ email: 'N/A', message: errorMessage });
      }

      setImportProgress({
        current: 0,
        total: previewData.length, // Total is the number of rows attempted to import
        status: 'Import failed',
        error: errorMessage,
        hasError: true,
      });
      toast.error(errorMessage);

      // Set import status to show details
      setImportStatus({
        imported: errorResponse?.imported || 0,
        skipped: errorResponse?.skipped || 0,
        errors: importErrors, // This is the summary errors array
        total: errorResponse?.total || previewData.length,
        detailedFeedback: errorResponse?.detailedFeedback || [], // Store detailed feedback from error response
      });
      // Keep status modal open to show errors
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search users...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8'
            />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => setShowImportPreview(true)}
            title='Import Users'
          >
            Import
            <Download className='h-4 w-4' />
          </Button>
          <Button variant='outline' onClick={handleExport} title='Export Users'>
            Export
            <Upload className='h-4 w-4' />
          </Button>
          <UserSheet mode='add' onSuccess={refreshTableData} />
        </div>
      </div>

      <div className='relative min-h-[700px] flex flex-col'>
        <div className='flex-1 rounded-md border'>
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
                  {currentUsers.map((user) => {
                    const isEdited = editedUsers[user.id];
                    const currentRole = isEdited?.role || user.role;
                    const currentPermission =
                      isEdited?.permission || user.permission;

                    return (
                      <TableRow
                        key={user.id}
                        className={isEdited ? 'bg-yellow-50' : ''}
                      >
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-2'>
                            <Avatar>
                              <AvatarFallback>
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>{formatNameDisplay(user.name)}</div>
                          </div>
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
                            disabled={isRoleUpdating[user.id]}
                          >
                            <SelectTrigger className='w-[130px]'>
                              <SelectValue placeholder='Select role'>
                                {isRoleUpdating[user.id] ? (
                                  <div className='flex items-center gap-2'>
                                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-[#124A69]' />
                                    <span>Updating...</span>
                                  </div>
                                ) : (
                                  currentRole
                                    .split('_')
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1).toLowerCase(),
                                    )
                                    .join(' ')
                                )}
                              </SelectValue>
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
                            disabled={isPermissionUpdating[user.id]}
                          >
                            <SelectTrigger className='w-[130px]'>
                              <SelectValue placeholder='Select permission'>
                                {isPermissionUpdating[user.id] ? (
                                  <div className='flex items-center gap-2'>
                                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-[#124A69]' />
                                    <span>Updating...</span>
                                  </div>
                                ) : (
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
                                )}
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
                                onClick={() => {
                                  setUserToDelete(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className='h-4 w-4' />
                                Delete
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

        {filteredUsers.length > 0 && (
          <div className='sticky bottom-0 bg-white border-t mt-4 py-4'>
            <div className='flex justify-between items-center px-2'>
              <p className='text-sm text-gray-500 w-full'>
                {currentPage * itemsPerPage - (itemsPerPage - 1)}-
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
              </p>
              <Pagination className='flex justify-end'>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={
                        currentPage === 1
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={
                          currentPage === i + 1 ? 'bg-[#124A69] text-white' : ''
                        }
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {editingUser && (
        <UserSheet
          mode='edit'
          user={editingUser}
          onClose={handleCloseEditSheet}
          onSave={handleEditUser}
        />
      )}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setUserToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className='font-semibold'>{userToDelete?.name}</span>'s
              account and remove their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDeleteUser();
                setIsDeleteDialogOpen(false);
              }}
              className='bg-red-600 text-white hover:bg-red-700'
            >
              Delete
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
        <DialogContent className='max-w-[98vw] min-w-[1100px] p-6'>
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
              <div className='border rounded-lg overflow-hidden max-w-[2100px]'>
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
                Import Users
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showImportStatus} onOpenChange={setShowImportStatus}>
        <DialogContent className='max-w-[98vw] min-w-[1100px] p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#124A69]'>
              Import Status
            </DialogTitle>
            <DialogDescription>
              {importProgress
                ? 'Import in progress...'
                : 'Summary of the import process'}
            </DialogDescription>
          </DialogHeader>

          {importProgress ? (
            <div className='mt-6 space-y-6'>
              <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg border'>
                {importProgress.hasError ? (
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='24'
                    height='24'
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
                ) : (
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-[#124A69]' />
                )}
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-700'>
                    {importProgress.status}
                  </p>
                  {importProgress.error && (
                    <p className='mt-2 text-sm text-red-600'>
                      {importProgress.error}
                    </p>
                  )}
                  {importProgress.total > 0 && !importProgress.hasError && (
                    <div className='mt-2 w-full bg-gray-200 rounded-full h-2.5'>
                      <div
                        className='bg-[#124A69] h-2.5 rounded-full transition-all duration-300'
                        style={{
                          width: `${
                            (importProgress.current / importProgress.total) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {importProgress.hasError && (
                <div className='flex justify-end'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowImportStatus(false);
                      setImportProgress(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          ) : (
            importStatus && (
              <div className='mt-6 space-y-6'>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                    <h3 className='text-sm font-medium text-green-800'>
                      Successfully Imported
                    </h3>
                    <p className='text-2xl font-semibold text-green-600'>
                      {
                        importStatus.detailedFeedback.filter(
                          (f) => f.status === 'imported',
                        ).length
                      }
                    </p>
                  </div>
                  <div className='bg-amber-50 p-4 rounded-lg border border-amber-200'>
                    <h3 className='text-sm font-medium text-amber-800'>
                      Skipped
                    </h3>
                    <p className='text-2xl font-semibold text-amber-600'>
                      {
                        importStatus.detailedFeedback.filter(
                          (f) => f.status === 'skipped',
                        ).length
                      }
                    </p>
                  </div>
                  <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
                    <h3 className='text-sm font-medium text-red-800'>Errors</h3>
                    <p className='text-2xl font-semibold text-red-600'>
                      {
                        importStatus.detailedFeedback.filter(
                          (f) => f.status === 'error',
                        ).length
                      }
                    </p>
                  </div>
                </div>

                {importStatus.detailedFeedback &&
                  importStatus.detailedFeedback.length > 0 && (
                    <div className='border rounded-lg overflow-hidden max-w-[2100px]'>
                      <div className='bg-gray-50 p-4 border-b'>
                        <h3 className='font-medium text-gray-700'>
                          Detailed Import Feedback
                        </h3>
                        <p className='text-sm text-gray-500'>
                          Status of each row processed during import.
                        </p>
                      </div>
                      <div className='max-h-[300px] overflow-auto'>
                        <table className='w-full border-collapse'>
                          <thead className='bg-gray-50 sticky top-0'>
                            <tr>
                              <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                Row
                              </th>
                              <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                Email
                              </th>
                              <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                Status
                              </th>
                              <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                Message
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {importStatus.detailedFeedback.map(
                              (feedback, index) => (
                                <tr
                                  key={index}
                                  className='border-t hover:bg-gray-50'
                                >
                                  <td className='px-4 py-2 text-sm text-gray-900'>
                                    {feedback.row}
                                  </td>
                                  <td className='px-4 py-2 text-sm text-gray-900'>
                                    {feedback.email}
                                  </td>
                                  <td className='px-4 py-2 text-sm font-medium'>
                                    <Badge
                                      variant={
                                        feedback.status === 'imported'
                                          ? 'default'
                                          : feedback.status === 'skipped'
                                          ? 'secondary'
                                          : 'destructive' // error status
                                      }
                                      className={
                                        feedback.status === 'imported'
                                          ? 'bg-green-500 text-white'
                                          : ''
                                      }
                                    >
                                      {feedback.status.charAt(0).toUpperCase() +
                                        feedback.status.slice(1)}
                                    </Badge>
                                  </td>
                                  <td
                                    className={`px-4 py-2 text-sm ${
                                      feedback.status === 'error'
                                        ? 'text-red-600'
                                        : 'text-gray-900'
                                    }`}
                                  >
                                    {feedback.message || '-'}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                <div className='flex justify-end gap-4'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowImportStatus(false);
                      setShowImportPreview(false);
                      setSelectedFile(null);
                      setPreviewData([]);
                      setIsValidFile(false);
                      setImportProgress(null);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    className='bg-[#124A69] hover:bg-[#0D3A54] text-white'
                    onClick={() => {
                      setShowImportStatus(false);
                      setShowImportPreview(true);
                    }}
                  >
                    Import More Users
                  </Button>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
