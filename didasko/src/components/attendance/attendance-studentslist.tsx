'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import {
  Download,
  Search,
  ChevronLeft,
  CalendarIcon,
  MoreHorizontal,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import toast, { Toaster } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { StudentCard } from './student-card';
import { FilterSheet } from './filter-sheet';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AddStudentSheet } from './add-student-sheet';
import { AttendanceStatus } from '@prisma/client';
import { FilterState } from '@/types/attendance';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import axiosInstance from '@/lib/axios';

// Add interface for Excel data
interface ExcelRow {
  Students: string;
  Name: string;
  Status: string;
  Date: string;
}

interface StudentCardProps {
  student: {
    name: string;
    status: AttendanceStatusWithNotSet;
    image?: string;
    date?: string;
    semester?: string;
  };
  index: number;
  tempImage: { index: number; dataUrl: string } | null;
  onImageUpload: (index: number, name: string) => void;
  onSaveChanges: (index: number) => void;
  onRemoveImage: (index: number, name: string) => void;
  onStatusChange: (index: number, status: AttendanceStatus) => void;
}

interface AddStudentSheetProps {
  onAddStudent: (student: {
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => Promise<void>;
  onSelectExistingStudent: (student: {
    id: string;
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => Promise<void>;
  onStudentsRemoved: () => void;
}

interface ApiStudent {
  id: string;
  name: string;
  image?: string;
}

interface Student {
  id: string;
  name: string;
  image?: string;
  status: AttendanceStatusWithNotSet;
  attendanceRecords: AttendanceRecord[];
}

type AttendanceStatusWithNotSet = AttendanceStatus | 'NOT_SET';

interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
  reason: string | null;
}

interface ImportedAttendanceRecord {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  date: string;
}

export default function StudentList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [courseInfo, setCourseInfo] = useState<{
    code: string;
    section: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDate] = useState<'newest' | 'oldest' | ''>('');
  const [imageToRemove, setImageToRemove] = useState<{
    index: number;
    name: string;
  } | null>(null);
  const itemsPerPage = 10;
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
  });
  const [tempImage, setTempImage] = useState<{
    index: number;
    dataUrl: string;
  } | null>(null);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState<{
    [key: string]: AttendanceStatus;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<{
    [key: number]: boolean;
  }>({});
  const [isDateLoading, setIsDateLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<{
    totalAbsents: number;
    lastAttendanceDate: string | null;
  }>({
    totalAbsents: 0,
    lastAttendanceDate: null,
  });
  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [attendanceDates, setAttendanceDates] = useState<Date[]>([]);

  const fetchStudents = async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/courses/${courseId}/students`);
      const students = response.data.students.map((student: any) => ({
        ...student,
        name: `${student.lastName}, ${student.firstName}${
          student.middleInitial ? ` ${student.middleInitial}.` : ''
        }`,
        status: 'NOT_SET' as AttendanceStatusWithNotSet,
        attendanceRecords: [],
      }));
      setStudentList(students);
      setCourseInfo(response.data.course);

      // Fetch attendance for the selected date after getting students
      if (selectedDate) {
        await fetchAttendance(selectedDate);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudentList([]);
      toast.error('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async (date: Date) => {
    if (!courseId) return;

    try {
      setIsDateLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const attendanceResponse = await axiosInstance.get<{
        attendance: AttendanceRecord[];
      }>(`/courses/${courseId}/attendance`, {
        params: {
          date: dateStr,
          limit: 1000, // Increase limit to get all records
        },
      });

      const attendanceData = attendanceResponse.data.attendance;
      const attendanceMap = new Map<string, AttendanceRecord>(
        attendanceData.map((record) => [record.studentId, record]),
      );

      // Update the entire student list with attendance records
      setStudentList((prevStudents) =>
        prevStudents.map((student) => {
          const record = attendanceMap.get(student.id);
          return {
            ...student,
            status: record?.status || 'NOT_SET',
            attendanceRecords: record
              ? [
                  {
                    id: record.id,
                    studentId: student.id,
                    courseId: courseId,
                    status: record.status,
                    date: dateStr,
                    reason: record.reason,
                  },
                ]
              : [],
          };
        }),
      );

      // Clear any unsaved changes when fetching new attendance
      setUnsavedChanges({});
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance records');
    } finally {
      setIsDateLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    if (!courseId) return;

    try {
      const response = await axiosInstance.get(
        `/courses/${courseId}/attendance/stats`,
      );
      setAttendanceStats(response.data);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const fetchAttendanceDates = async () => {
    if (!courseId) return;

    try {
      // Get the start date (January 2025) and end date (today)
      const startDate = new Date(2025, 0, 1);
      const endDate = new Date();

      console.log(
        'Fetching attendance dates from:',
        startDate.toISOString(),
        'to:',
        endDate.toISOString(),
      );

      // Get all attendance records for the date range
      const response = await axiosInstance.get(
        `/courses/${courseId}/attendance/range`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        },
      );

      console.log('Attendance API response:', response.data);

      // Extract unique dates from the response
      const uniqueDates = response.data.uniqueDates.map(
        (dateStr: string) => new Date(dateStr),
      );
      console.log('Unique attendance dates:', uniqueDates);

      setAttendanceDates(uniqueDates);
    } catch (error) {
      console.error('Error fetching attendance dates:', error);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchStudents();
      fetchAttendanceStats();
      fetchAttendanceDates();
    }
  }, [courseId]);

  // Get attendance records for the selected date
  const getAttendanceForDate = (student: Student, date: Date | undefined) => {
    if (!date) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = student.attendanceRecords.find((record) => {
      const recordDate = record.date.split('T')[0];
      return recordDate === dateStr;
    });
    return record;
  };

  // Get attendance status for the selected date
  const getStatusForDate = (
    student: Student,
    selectedDate: string,
  ): AttendanceStatusWithNotSet => {
    const record = student.attendanceRecords.find(
      (record) => record.date === selectedDate,
    );
    return record ? record.status : 'NOT_SET';
  };

  // Filter students based on all filters
  const filteredStudents = useMemo(() => {
    return studentList
      .filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .filter((student) => {
        if (filters.status.length === 0) return true;
        return filters.status.includes(student.status);
      })
      .sort((a, b) => {
        if (!sortDate) return 0;
        const aAttendance = getAttendanceForDate(a, selectedDate);
        const bAttendance = getAttendanceForDate(b, selectedDate);
        if (sortDate === 'newest') {
          return (bAttendance?.date || '').localeCompare(
            aAttendance?.date || '',
          );
        }
        return (aAttendance?.date || '').localeCompare(bAttendance?.date || '');
      });
  }, [studentList, searchQuery, selectedDate, filters.status]);

  const totalPages = useMemo(() => {
    const filtered = studentList
      .filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .filter((student) => {
        if (filters.status.length === 0) return true;
        return filters.status.includes(student.status);
      });
    return Math.ceil(filtered.length / itemsPerPage);
  }, [studentList, searchQuery, filters.status, itemsPerPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const updateStatus = async (index: number, newStatus: AttendanceStatus) => {
    const actualIndex = (currentPage - 1) * itemsPerPage + index;
    const student = filteredStudents[actualIndex];
    if (!student) return;

    const promise = axiosInstance.post(`/courses/${courseId}/attendance`, {
      date: selectedDate.toISOString(),
      attendance: [
        {
          studentId: student.id,
          status: newStatus,
        },
      ],
    });

    toast.promise(
      promise,
      {
        loading: 'Updating attendance...',
        success: 'Attendance updated',
        error: 'Failed to update attendance',
      },
      {
        style: {
          background: '#fff',
          color: '#124A69',
          border: '1px solid #e5e7eb',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        success: {
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
          },
          iconTheme: {
            primary: '#124A69',
            secondary: '#fff',
          },
        },
        error: {
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
          },
        },
        loading: {
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
          },
        },
      },
    );

    try {
      // Update local state immediately for better UX
      setStudentList((prev) =>
        prev.map((s) =>
          s.id === student.id ? { ...s, status: newStatus } : s,
        ),
      );

      await promise;

      // Update attendance records
      const record: AttendanceRecord = {
        id: crypto.randomUUID(),
        studentId: student.id,
        courseId: courseId!,
        status: newStatus,
        date: format(selectedDate, 'yyyy-MM-dd'),
        reason: null,
      };

      setStudentList((prev) =>
        prev.map((s) =>
          s.id === student.id
            ? { ...s, status: newStatus, attendanceRecords: [record] }
            : s,
        ),
      );
    } catch (error) {
      console.error('Error saving attendance:', error);
      // Revert local state on error
      setStudentList((prev) =>
        prev.map((s) =>
          s.id === student.id ? { ...s, status: 'NOT_SET' } : s,
        ),
      );
    }
  };

  const currentStudents = useMemo(() => {
    const filtered = studentList
      .filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .filter((student) => {
        if (filters.status.length === 0) return true;
        return filters.status.includes(student.status);
      })
      .sort((a, b) => {
        if (!sortDate) return 0;
        const aAttendance = getAttendanceForDate(a, selectedDate);
        const bAttendance = getAttendanceForDate(b, selectedDate);
        if (sortDate === 'newest') {
          return (bAttendance?.date || '').localeCompare(
            aAttendance?.date || '',
          );
        }
        return (aAttendance?.date || '').localeCompare(bAttendance?.date || '');
      });

    return filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [
    studentList,
    searchQuery,
    filters.status,
    sortDate,
    selectedDate,
    currentPage,
    itemsPerPage,
  ]);

  const handleImageUpload = async (studentId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axiosInstance.post(
        `/courses/${courseId}/students/${studentId}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      // Update the student's image in the list
      setStudentList((prev) =>
        prev.map((student) =>
          student.id === studentId
            ? { ...student, image: response.data.image }
            : student,
        ),
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleSaveImageChanges = async (index: number) => {
    if (!tempImage || tempImage.index !== index) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      // Convert base64 to blob
      const base64Response = await axiosInstance.get(tempImage.dataUrl, {
        responseType: 'arraybuffer',
      });
      const blob = new Blob([base64Response.data]);

      // Get file extension from data URL
      const ext = tempImage.dataUrl.split(';')[0].split('/')[1];
      const fileName = `image.${ext}`;

      // Create file from blob with proper name and type
      const file = new File([blob], fileName, { type: `image/${ext}` });
      formData.append('image', file);

      const uploadResponse = await axiosInstance.post('/upload', formData);
      const { imageUrl } = uploadResponse.data;

      // Update the student's image in the database
      const student = studentList[index];
      const updateResponse = await axiosInstance.put(
        `/students/${student.id}/image`,
        { imageUrl },
      );
      const updatedStudent = updateResponse.data;

      // Update student list with new image URL
      setStudentList((prev) =>
        prev.map((student, i) =>
          i === index ? { ...student, image: imageUrl } : student,
        ),
      );

      // Clear temp image
      setTempImage(null);

      // Show success message
      setShowSuccessMessage((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setShowSuccessMessage((prev) => ({ ...prev, [index]: false }));
      }, 3000);
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save image',
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
      setIsSaving(false);
    }
  };

  const confirmAndRemoveImage = async () => {
    if (imageToRemove) {
      try {
        const student = studentList[imageToRemove.index];

        // Delete the image file from public/uploads
        if (student.image) {
          const deleteResponse = await axiosInstance.delete('/upload', {
            data: { imageUrl: student.image },
          });
        }

        // Update the database
        const updateResponse = await axiosInstance.put(
          `/students/${student.id}/image`,
          { imageUrl: null },
        );
        const updatedStudent = updateResponse.data;

        // Update local state
        setStudentList((prev) =>
          prev.map((student, idx) =>
            idx === imageToRemove.index
              ? { ...student, image: undefined }
              : student,
          ),
        );
        // Clear temp image if it exists for this student
        if (tempImage?.index === imageToRemove.index) {
          setTempImage(null);
        }
        setImageToRemove(null);
        toast.success('Profile picture removed successfully');
      } catch (error) {
        console.error('Error removing image:', error);
        toast.error('Failed to remove profile picture');
      }
    }
  };

  const markAllAsPresent = async () => {
    if (!selectedDate || !courseId) {
      toast.error('Please select a date first', {
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
      return;
    }

    const attendanceData = studentList.map((student) => ({
      studentId: student.id,
      status: 'PRESENT' as AttendanceStatus,
    }));

    const promise = axiosInstance.post(`/courses/${courseId}/attendance`, {
      date: selectedDate.toISOString(),
      attendance: attendanceData,
    });

    toast.promise(
      promise,
      {
        loading: 'Marking all as present...',
        success: 'All students marked as present',
        error: 'Failed to update attendance',
      },
      {
        style: {
          background: '#fff',
          color: '#124A69',
          border: '1px solid #e5e7eb',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        success: {
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
          },
          iconTheme: {
            primary: '#124A69',
            secondary: '#fff',
          },
        },
        error: {
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
          },
        },
        loading: {
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
          },
        },
      },
    );

    try {
      // Update local state immediately
      setStudentList((prev) =>
        prev.map((student) => ({
          ...student,
          status: 'PRESENT' as AttendanceStatus,
          attendanceRecords: [
            {
              id: crypto.randomUUID(),
              studentId: student.id,
              courseId: courseId,
              status: 'PRESENT',
              date: format(selectedDate, 'yyyy-MM-dd'),
              reason: null,
            },
          ],
        })),
      );

      await promise;
      setShowMarkAllConfirm(false);
    } catch (error) {
      console.error('Error marking all as present:', error);
      // Revert local state on error
      setStudentList((prev) =>
        prev.map((student) => ({
          ...student,
          status: 'NOT_SET',
          attendanceRecords: [],
        })),
      );
    }
  };

  const handleApplyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      status: filters.status,
    }));
    setIsFilterSheetOpen(false);
  };

  const hasIncompleteAttendance = useMemo(() => {
    return filteredStudents.some((student) => student.status === 'NOT_SET');
  }, [filteredStudents]);

  const incompleteAttendanceCount = useMemo(() => {
    return filteredStudents.filter((student) => student.status === 'NOT_SET')
      .length;
  }, [filteredStudents]);

  const handleExport = () => {
    if (!selectedDate) {
      toast.error('Please select a date before exporting');
      return;
    }

    if (hasIncompleteAttendance) {
      toast.error(
        'Please set attendance status for all students before exporting',
      );
      return;
    }

    const formattedDate = format(selectedDate, 'MMMM d, yyyy');

    // Create header rows
    const header = [
      ['ATTENDANCE RECORD'],
      [''],
      ['Date:', formattedDate],
      ['Course:', courseInfo?.code || ''],
      ['Section:', courseInfo?.section || ''],
      [''],
      // Column headers
      ['Student Name', 'Attendance Status'],
    ];

    // Create student data rows using filtered students
    const studentRows = filteredStudents.map((student) => [
      student.name,
      student.status,
    ]);

    // Combine header and data
    const ws = XLSX.utils.aoa_to_sheet([...header, ...studentRows]);

    // Style configurations
    const headerStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center' },
    };

    // Configure column widths
    ws['!cols'] = [
      { wch: 40 }, // Student Name
      { wch: 20 }, // Attendance Status
    ];

    // Merge cells for title
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Merge first row across all columns
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    // Generate filename with course and date
    const filename = `attendance_${courseInfo?.code || 'course'}_${format(
      selectedDate,
      'yyyy-MM-dd',
    )}.xlsx`;

    XLSX.writeFile(wb, filename);
    toast.success('Attendance data exported successfully');
    setShowExportPreview(false);
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

        const newStudents = jsonData.map(
          (row) =>
            ({
              id: row.Students,
              name: row.Name,
              status: 'NOT_SET' as AttendanceStatusWithNotSet,
              attendanceRecords: [
                {
                  id: crypto.randomUUID(),
                  studentId: row.Students,
                  courseId: courseId || '',
                  status: row.Status as AttendanceStatus,
                  date: row.Date,
                  reason: null,
                },
              ] satisfies AttendanceRecord[],
            } satisfies Student),
        );

        setStudentList(newStudents);
        setShowImportDialog(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing Excel file:', error);
      toast.error('Failed to import Excel file');
    }
  };

  const handleAddStudent = async (student: {
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => {
    try {
      const response = await axiosInstance.post('/students', {
        ...student,
        courseId,
      });
      const newStudent = response.data;

      const fullName = `${newStudent.lastName}, ${newStudent.firstName}${
        newStudent.middleInitial ? ` ${newStudent.middleInitial}.` : ''
      }`;

      setStudentList((prev) => [
        ...prev,
        {
          id: newStudent.id,
          name: fullName,
          image: newStudent.image,
          status: 'NOT_SET' as AttendanceStatusWithNotSet,
          attendanceRecords: [],
        },
      ]);

      toast.success('Student added successfully');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    }
  };

  const handleSelectExistingStudent = async (student: {
    id: string;
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => {
    try {
      console.log('Adding student to course:', {
        studentId: student.id,
        courseId: courseId,
      });

      const response = await axiosInstance.post(
        `/courses/${courseId}/students`,
        {
          studentId: student.id,
        },
      );
      const addedStudent = response.data;

      const fullName = `${student.lastName}, ${student.firstName}${
        student.middleInitial ? ` ${student.middleInitial}.` : ''
      }`;

      const newStudent: Student = {
        id: student.id,
        name: fullName,
        image: student.image,
        status: 'NOT_SET' as AttendanceStatusWithNotSet,
        attendanceRecords: [],
      };

      setStudentList((prev) => [...prev, newStudent]);
      toast.success('Student added successfully');
    } catch (error) {
      console.error('Error adding existing student:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to add student',
      );
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const clearAllAttendance = async () => {
    if (!selectedDate || !courseId) {
      toast.error('Please select a date before clearing attendance', {
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
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Get all attendance records for the selected date
    const recordsToDelete = studentList
      .filter((student) => student.status !== 'NOT_SET')
      .map((student) => {
        const record = student.attendanceRecords.find(
          (r) => r.date === dateStr,
        );
        return record?.id;
      })
      .filter((id): id is string => id !== undefined);

    if (recordsToDelete.length === 0) {
      toast.error('No attendance records to clear', {
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
      return;
    }

    const promise = axiosInstance.post(
      `/courses/${courseId}/attendance/clear`,
      {
        date: dateStr,
        recordsToDelete,
      },
    );

    toast.promise(
      promise,
      {
        loading: 'Clearing attendance...',
        success: 'Attendance cleared successfully',
        error: 'Failed to clear attendance',
      },
      {
        style: {
          background: '#fff',
          color: '#124A69',
          border: '1px solid #e5e7eb',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        success: {
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
          },
          iconTheme: {
            primary: '#124A69',
            secondary: '#fff',
          },
        },
        error: {
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
          },
        },
        loading: {
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
          },
        },
      },
    );

    try {
      // Update local state immediately for all students
      setStudentList((prev) =>
        prev.map((student) => ({
          ...student,
          status: 'NOT_SET',
          attendanceRecords: student.attendanceRecords.filter(
            (record) => record.date !== dateStr,
          ),
        })),
      );

      await promise;
      setShowClearConfirm(false);

      // Reset to first page after clearing
      setCurrentPage(1);
    } catch (error) {
      console.error('Error clearing attendance:', error);
      // Revert local state on error
      setStudentList((prev) =>
        prev.map((student) => ({
          ...student,
          status:
            student.attendanceRecords.find((record) => record.date === dateStr)
              ?.status || 'NOT_SET',
        })),
      );
    }
  };

  // Add useEffect to fetch attendance when date changes
  useEffect(() => {
    if (courseId && selectedDate) {
      fetchAttendance(selectedDate);
    }
  }, [selectedDate, courseId]);

  // Add useEffect to reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters.status, sortDate]);

  if (isLoading) {
    return (
      <div className='flex flex-col h-screen'>
        <div className='flex items-center gap-4 p-4 border-b bg-white'>
          <Link href='/attendance'>
            <Button variant='ghost' size='icon' className='hover:bg-gray-100'>
              <ChevronLeft className='h-5 w-5' />
            </Button>
          </Link>
          <div className='flex items-center gap-2'>
            <div>
              <h1 className='text-[#124A69] font-bold text-xl'>Loading...</h1>
              <p className='text-gray-500 text-sm'>Please wait</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (studentList.length === 0) {
    return (
      <div className='flex flex-col h-screen'>
        <div className='flex items-center gap-4 p-4 border-b bg-white'>
          <Link href='/attendance'>
            <Button variant='ghost' size='icon' className='hover:bg-gray-100'>
              <ChevronLeft className='h-5 w-5' />
            </Button>
          </Link>
          <div className='flex items-center gap-2'>
            <div>
              <h1 className='text-[#124A69] font-bold text-xl'>
                No Students Found
              </h1>
              <p className='text-gray-500 text-sm'>
                There are no students enrolled in this course.
              </p>
            </div>
          </div>
          <div className='ml-auto'>
            <AddStudentSheet
              onSelectExistingStudent={handleSelectExistingStudent}
              onStudentsRemoved={() => {
                if (courseId) {
                  fetchStudents();
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen'>
      <Toaster
        toastOptions={{
          className: '',
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          success: {
            style: {
              background: '#fff',
              color: '#124A69',
              border: '1px solid #e5e7eb',
            },
            iconTheme: {
              primary: '#124A69',
              secondary: '#fff',
            },
          },
          error: {
            style: {
              background: '#fff',
              color: '#dc2626',
              border: '1px solid #e5e7eb',
            },
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
          loading: {
            style: {
              background: '#fff',
              color: '#124A69',
              border: '1px solid #e5e7eb',
            },
          },
        }}
      />
      <div className='flex items-center gap-4 p-4 border-b bg-white'>
        <Link href='/attendance'>
          <Button variant='ghost' size='icon' className='hover:bg-gray-100'>
            <ChevronLeft className='h-5 w-5' />
          </Button>
        </Link>
        <div className='flex items-center gap-2'>
          <div>
            <h1 className='text-[#124A69] font-bold text-xl'>
              {courseInfo?.code || 'Course'}
            </h1>
            <p className='text-gray-500 text-sm'>
              Section {courseInfo?.section || 'N/A'}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3 ml-6 flex-grow'>
          <div className='flex items-center gap-3'>
            <div className='relative flex-grow max-w-[300px]'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search a name'
                className='w-full pl-9 bg-white border-gray-200 rounded-full h-10'
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='rounded-full h-10 pl-3 pr-2 flex items-center gap-2 w-[180px] justify-between relative'
                  disabled={isDateLoading}
                >
                  <span className='truncate'>
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </span>
                  {isDateLoading ? (
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent' />
                  ) : (
                    <CalendarIcon className='h-4 w-4 flex-shrink-0' />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='w-auto p-0'
                align='start'
                onInteractOutside={(e) => {
                  if (
                    e.target instanceof HTMLElement &&
                    e.target.closest('.rdp')
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                <Calendar
                  mode='single'
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      const popover = document.querySelector('[role="dialog"]');
                      if (popover) {
                        (popover as HTMLElement).style.display = 'none';
                      }
                    }
                  }}
                  disabled={(date) => {
                    // Disable future dates
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Set January 2025 as the earliest date
                    const jan2025 = new Date(2025, 0, 1);

                    // Disable dates before Jan 2025 and after today
                    return date < jan2025 || date > today;
                  }}
                  modifiers={{
                    hasAttendance: (date) => {
                      const hasAttendance = attendanceDates.some(
                        (attendanceDate) =>
                          attendanceDate.getFullYear() === date.getFullYear() &&
                          attendanceDate.getMonth() === date.getMonth() &&
                          attendanceDate.getDate() === date.getDate(),
                      );
                      console.log(
                        'Checking date:',
                        date,
                        'Has attendance:',
                        hasAttendance,
                      );
                      return hasAttendance;
                    },
                  }}
                  modifiersStyles={{
                    hasAttendance: {
                      border: '1px solid #124A69',
                      color: '#000000',
                      borderRadius: '50%',
                    },
                    selected: {
                      backgroundColor: '#124A69',
                      color: '#ffffff',
                    },
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon' className='rounded-full'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => setShowMarkAllConfirm(true)}
                className='text-[#22C55E] focus:text-[#22C55E] focus:bg-[#22C55E]/10'
              >
                Mark All as Present
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowClearConfirm(true)}
                disabled={isSaving}
                className='text-[#EF4444] focus:text-[#EF4444] focus:bg-[#EF4444]/10'
              >
                {isSaving ? 'Clearing...' : 'Clear Attendance'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className='flex items-center gap-3 ml-auto'>
            <FilterSheet
              isOpen={isFilterSheetOpen}
              onOpenChange={setIsFilterSheetOpen}
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={handleApplyFilters}
            />
            <Button
              variant='outline'
              size='icon'
              className='rounded-full'
              onClick={() => setShowExportPreview(true)}
              title='Export to Excel'
            >
              <Download className='h-4 w-4' />
            </Button>
            <AddStudentSheet
              onSelectExistingStudent={handleSelectExistingStudent}
              onStudentsRemoved={() => {
                if (courseId) {
                  fetchStudents();
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-auto p-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          {isDateLoading ? (
            // Loading skeleton for student cards
            Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className='w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse'
              >
                <div className='flex flex-col items-center gap-3'>
                  <div className='w-16 h-16 bg-gray-200 rounded-full'></div>
                  <div className='w-2/3 h-4 bg-gray-200 rounded'></div>
                  <div className='w-full h-8 bg-gray-200 rounded-full'></div>
                </div>
              </div>
            ))
          ) : currentStudents.length > 0 ? (
            currentStudents.map((student, index) => (
              <StudentCard
                key={student.id}
                student={{
                  name: student.name,
                  status: student.status,
                  image: student.image,
                }}
                index={index}
                tempImage={tempImage}
                onImageUpload={(index) =>
                  handleImageUpload(student.id, new File([], ''))
                }
                onSaveChanges={handleSaveImageChanges}
                onRemoveImage={() =>
                  setImageToRemove({ index, name: student.name })
                }
                onStatusChange={(index, status: AttendanceStatus) =>
                  updateStatus(index, status)
                }
                isSaving={isSaving}
              />
            ))
          ) : (
            <div className='col-span-full flex flex-col items-center justify-center py-12'>
              <div className='text-gray-500 text-lg font-medium mb-2'>
                No students found
              </div>
              <p className='text-gray-400 text-sm'>
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && currentStudents.length > 0 && (
          <div className='flex justify-between items-center px-2 mt-10'>
            <p className='text-sm text-gray-500 w-60  '>
              {currentPage * itemsPerPage - (itemsPerPage - 1)}-
              {Math.min(currentPage * itemsPerPage, filteredStudents.length)}{' '}
              out of {filteredStudents.length} students
            </p>
            <Pagination className='flex justify-end'>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    className={
                      currentPage === 1 ? 'pointer-events-none opacity-50' : ''
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
                        ? 'pointer-events-none opacity-50 '
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!imageToRemove}
        onOpenChange={() => setImageToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this profile picture? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndRemoveImage}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
        <DialogContent className='max-w-[600px] p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#124A69]'>
              Export to Excel
            </DialogTitle>
            <DialogDescription>
              {selectedDate
                ? `Preview of attendance data for ${format(
                    selectedDate,
                    'MMMM d, yyyy',
                  )}:`
                : 'Please select a date to export attendance data.'}
            </DialogDescription>
          </DialogHeader>
          {selectedDate ? (
            <>
              {hasIncompleteAttendance && (
                <div className='mt-2 text-sm text-red-500'>
                  {incompleteAttendanceCount} student
                  {incompleteAttendanceCount !== 1 ? 's' : ''}{' '}
                  {incompleteAttendanceCount !== 1 ? 'do' : 'does'} not have
                  attendance set yet
                </div>
              )}
              <div className='mt-6 max-h-[400px] overflow-auto'>
                <table className='w-full border-collapse'>
                  <thead className='bg-gray-50 sticky top-0'>
                    <tr>
                      <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                        Student Name
                      </th>
                      <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                        Attendance Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className='border-t'>
                        <td className='px-4 py-2 text-sm text-gray-900'>
                          {student.name}
                        </td>
                        <td className='px-4 py-2 text-sm text-gray-900'>
                          {student.status}
                        </td>
                      </tr>
                    ))}
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
                  disabled={!selectedDate || hasIncompleteAttendance}
                >
                  {hasIncompleteAttendance
                    ? 'Complete Attendance First'
                    : 'Export to Excel'}
                </Button>
              </div>
            </>
          ) : (
            <div className='mt-6 flex justify-center'>
              <p className='text-gray-500'>Please select a date first</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className='max-w-[400px] p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#124A69]'>
              Import from Excel
            </DialogTitle>
            <DialogDescription>
              Select an Excel file to import student data.
            </DialogDescription>
          </DialogHeader>
          <div className='mt-6'>
            <Input
              type='file'
              accept='.xlsx, .xls'
              onChange={handleImportExcel}
              className='mb-4'
            />
            <Button
              className='w-full bg-[#124A69] hover:bg-[#0D3A54] text-white'
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showMarkAllConfirm}
        onOpenChange={setShowMarkAllConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark All Students as Present</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark all students as present for{' '}
              {selectedDate ? format(selectedDate, 'PPP') : 'this date'}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={markAllAsPresent}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Attendance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all attendance records for{' '}
              {selectedDate ? format(selectedDate, 'PPP') : 'this date'}? This
              will reset all students' status to "Select Status".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllAttendance}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
