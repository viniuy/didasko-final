import React, { useState, useEffect, useRef } from 'react';
import { Student } from '@/types/student';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Search,
  Loader2,
  Filter,
  Camera,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { DateRange } from 'react-day-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
  DialogTrigger,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { toast, Toaster } from 'react-hot-toast';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';
import { ExportQuiz } from '@/components/grading/export-quiz';
import { prepareExportData } from '@/lib/prepare-export-data';

interface QuizTableProps {
  course_slug: string;
  courseCode: string;
  courseSection: string;
  selectedDate: Date | undefined;
  onDateSelect?: (date: Date | undefined) => void;
}

interface QuizScore {
  studentId: string;
  quizScore: number;
  attendance: 'PRESENT' | 'LATE' | 'ABSENT';
  plusPoints: number;
  totalGrade: number;
  remarks: string;
}

interface AttendanceStats {
  totalClasses: number;
  studentStats: {
    studentId: string;
    firstName: string;
    lastName: string;
    middleInitial: string | null;
    present: number;
    late: number;
    absent: number;
    attendanceRate: number;
    excused: number;
  }[];
  uniqueDates: string[];
}

interface StudentProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onAddImage: (index: number, file: File) => void;
  onRemoveImage: (student: Student) => void;
  students: Student[];
}

export function QuizTable({
  course_slug,
  courseCode,
  courseSection,
  selectedDate,
  onDateSelect,
}: QuizTableProps) {
  const { data: session } = useSession();
  const [scores, setScores] = useState<Record<string, QuizScore>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [attendanceStats, setAttendanceStats] =
    useState<AttendanceStats | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: selectedDate ? addDays(selectedDate, -30) : undefined,
    to: selectedDate,
  });
  const [passingRate, setPassingRate] = useState<number>(75);
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [quizName, setQuizName] = useState('');
  const [quizDate, setQuizDate] = useState<Date | undefined>(selectedDate);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [modalPassingRate, setModalPassingRate] = useState<number>(75);
  const [modalDateRange, setModalDateRange] = useState<DateRange | undefined>(
    dateRange,
  );
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [modalTab, setModalTab] = useState('existing');
  const datePickerButtonRef = useRef<HTMLButtonElement>(null);
  const [gradeFilter, setGradeFilter] = useState<{
    passed: boolean;
    failed: boolean;
    noGrades: boolean;
  }>({
    passed: false,
    failed: false,
    noGrades: false,
  });
  const [previousScores, setPreviousScores] = useState<Record<
    string,
    QuizScore
  > | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportData, setExportData] = useState<{
    header: string[][];
    studentRows: string[][];
  } | null>(null);
  const [originalScores, setOriginalScores] = useState<
    Record<string, QuizScore>
  >({});
  const [saving, setSaving] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showUndoButton, setShowUndoButton] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editQuizName, setEditQuizName] = useState('');
  const [editQuizDate, setEditQuizDate] = useState<Date | undefined>();
  const [editMaxScore, setEditMaxScore] = useState<number>(100);
  const [editPassingRate, setEditPassingRate] = useState<number>(75);
  const [editDateRange, setEditDateRange] = useState<DateRange | undefined>();
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [imageToRemove, setImageToRemove] = useState<Student | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [maxScoreError, setMaxScoreError] = useState<string>('');
  const [attendanceDates, setAttendanceDates] = useState<Date[]>([]);

  // Fetch quizzes for the course when modal opens
  useEffect(() => {
    if (showSetupModal && course_slug) {
      setLoadingMessage('Loading quizzes...');
      axios.get(`/api/courses/${course_slug}/quizzes`).then((res) => {
        setQuizzes(res.data || []);
        setLoadingMessage('');
      });
    }
  }, [showSetupModal, course_slug]);

  // Only fetch students and attendance stats if a quiz is selected/created
  useEffect(() => {
    if (!selectedQuiz) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingMessage('Loading students...');

        // Fetch students
        const studentsResponse = await axios.get(
          `/api/courses/${course_slug}/students`,
        );
        if (Array.isArray(studentsResponse.data.students)) {
          setStudents(studentsResponse.data.students);
        } else {
          console.error('Invalid students data format');
          setStudents([]);
        }

        // Fetch attendance stats for the date range
        if (dateRange?.from && dateRange?.to) {
          setLoadingMessage('Loading attendance stats...');
          const statsResponse = await axios.get(
            `/api/courses/${course_slug}/attendance/range?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`,
          );
          setAttendanceStats(statsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setStudents([]);
        setAttendanceStats(null);
      } finally {
        setLoading(false);
        setLoadingMessage('');
      }
    };

    fetchData();
  }, [selectedQuiz, course_slug, dateRange]);

  // Calculate total grade
  const calculateTotalGrade = (
    quizScore: number,
    plusPoints: number,
    maxScore: number,
  ): number => {
    // Add plus points to the raw score first, then calculate percentage
    const totalRawScore = quizScore + plusPoints;
    // Convert total raw score to percentage based on max score
    return Math.min(100, (totalRawScore / maxScore) * 100);
  };

  // Handle score change
  const handleScoreChange = (
    studentId: string,
    field: keyof QuizScore,
    value: any,
  ) => {
    setScores((prev) => {
      const currentScore = prev[studentId] || {
        studentId,
        quizScore: 0,
        attendance: 'PRESENT',
        plusPoints: 0,
        totalGrade: 0,
        remarks: '',
      };

      let updatedScore = { ...currentScore, [field]: value };

      // Recalculate total grade if quiz score or plus points change
      if (field === 'quizScore' || field === 'plusPoints') {
        const quizScore =
          field === 'quizScore' ? value : currentScore.quizScore;
        const plusPoints =
          field === 'plusPoints' ? value : currentScore.plusPoints;
        updatedScore.totalGrade = calculateTotalGrade(
          quizScore,
          plusPoints,
          selectedQuiz?.maxScore || 100,
        );
      }

      return { ...prev, [studentId]: updatedScore };
    });
  };

  // Function to handle filter changes
  const handleFilterChange = (key: keyof typeof gradeFilter) => {
    const newFilter = {
      ...gradeFilter,
      [key]: !gradeFilter[key],
    };

    // If all options are checked, set all to true
    if (Object.values(newFilter).every(Boolean)) {
      setGradeFilter({
        passed: true,
        failed: true,
        noGrades: true,
      });
    } else {
      setGradeFilter(newFilter);
    }
  };

  // Function to check if a student matches the current filters
  const studentMatchesFilter = (student: Student) => {
    // If no filters are checked, show all students
    if (!gradeFilter.passed && !gradeFilter.failed && !gradeFilter.noGrades) {
      return true;
    }

    const studentScore = scores[student.id];
    const total = studentScore?.totalGrade || 0;
    const hasGrades = studentScore?.quizScore > 0;

    // Check each filter condition
    if (gradeFilter.passed && hasGrades && total >= passingRate) return true;
    if (gradeFilter.failed && hasGrades && total < passingRate) return true;
    if (gradeFilter.noGrades && !hasGrades) return true;

    // If any filter is checked but student doesn't match any condition, return false
    return false;
  };

  // Update getPaginatedStudents to include filter
  const getPaginatedStudents = (students: Student[]) => {
    if (!Array.isArray(students)) {
      return {
        paginatedStudents: [],
        totalPages: 0,
        totalStudents: 0,
      };
    }

    const filteredStudents = students.filter((student) => {
      const name = `${student.lastName || ''} ${student.firstName || ''} ${
        student.middleInitial || ''
      }`.toLowerCase();
      const nameMatch = name.includes(searchQuery.toLowerCase());
      return nameMatch && studentMatchesFilter(student);
    });

    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    return {
      paginatedStudents: filteredStudents.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredStudents.length / studentsPerPage),
      totalStudents: filteredStudents.length,
    };
  };

  // Update pagination state
  useEffect(() => {
    if (!Array.isArray(students)) {
      setTotalPages(0);
      setTotalStudents(0);
      return;
    }

    const filteredStudents = students.filter((student) => {
      const name = `${student.lastName || ''} ${student.firstName || ''} ${
        student.middleInitial || ''
      }`.toLowerCase();
      const nameMatch = name.includes(searchQuery.toLowerCase());
      return nameMatch && studentMatchesFilter(student);
    });

    setTotalPages(Math.ceil(filteredStudents.length / studentsPerPage));
    setTotalStudents(filteredStudents.length);
  }, [
    students,
    searchQuery,
    studentsPerPage,
    gradeFilter,
    passingRate,
    scores,
  ]);

  // When a quiz is selected or created, set selectedQuiz and close modal
  const handleSelectQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setShowSetupModal(false);
    setQuizName(quiz.name);
    setQuizDate(new Date(quiz.quizDate));
    setMaxScore(quiz.maxScore);
    setPassingRate(quiz.passingRate);
    setDateRange({
      from: new Date(quiz.attendanceRangeStart),
      to: new Date(quiz.attendanceRangeEnd),
    });
    if (quiz.quizDate) onDateSelect?.(new Date(quiz.quizDate));

    // Fetch existing scores for this quiz
    setLoading(true);
    setLoadingMessage('Loading quiz scores...');
    axios
      .get(`/api/quizzes/${quiz.id}/scores`)
      .then((response) => {
        const existingScores = response.data.reduce(
          (acc: Record<string, QuizScore>, score: any) => {
            acc[score.studentId] = {
              studentId: score.studentId,
              quizScore: score.score,
              attendance: score.attendance,
              plusPoints: score.plusPoints,
              totalGrade: score.totalGrade,
              remarks: '',
            };
            return acc;
          },
          {},
        );
        setScores(existingScores);
        setOriginalScores(existingScores);
      })
      .catch((error) => {
        console.error('Error fetching quiz scores:', error);
        // Initialize with empty scores for new quizzes
        const emptyScores = students.reduce(
          (acc: Record<string, QuizScore>, student) => {
            acc[student.id] = {
              studentId: student.id,
              quizScore: 0,
              attendance: 'PRESENT',
              plusPoints: 0,
              totalGrade: 0,
              remarks: '',
            };
            return acc;
          },
          {},
        );
        setScores(emptyScores);
        setOriginalScores(emptyScores);
        toast.error('Failed to load quiz scores', {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
          },
        });
      })
      .finally(() => {
        setLoading(false);
        setLoadingMessage('');
      });
  };

  const handleChooseAnotherDate = () => {
    setShowSetupModal(false);
    setTimeout(() => {
      datePickerButtonRef.current?.focus();
    }, 100);
  };

  // Open modal when selectedDate changes and no quiz is selected for that date

  const validateQuizName = (name: string) => {
    if (!name.trim()) {
      return 'Quiz name is required';
    }
    if (name.length > 25) {
      return 'Quiz name must not exceed 25 characters';
    }
    // Only allow letters, numbers, spaces, and basic punctuation
    if (!/^[a-zA-Z0-9\s\-_.,]+$/.test(name)) {
      return 'Quiz name can only contain letters, numbers, spaces, and basic punctuation (-_.,)';
    }
    // Check for duplicate names
    const isDuplicate = quizzes.some(
      (quiz) => quiz.name.toLowerCase() === name.toLowerCase(),
    );
    if (isDuplicate) {
      return 'A quiz with this name already exists';
    }
    return '';
  };

  const handleExport = () => {
    if (!selectedQuiz || !selectedDate) {
      toast.error('Please select a quiz first', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
      return;
    }

    const data = prepareExportData({
      courseCode,
      courseSection,
      selectedDate,
      selectedQuiz,
      dateRange,
      students,
      scores,
      attendanceStats,
      passingRate,
    });

    setExportData(data);
    setShowExportPreview(true);
  };

  // Add function to check if there are any changes
  const hasChanges = () => {
    // For new quizzes, if there are any scores with non-zero values, consider it changed
    if (Object.keys(originalScores).length === 0) {
      return Object.values(scores).some(
        (score) => score.quizScore > 0 || score.plusPoints > 0,
      );
    }

    return Object.entries(scores).some(([studentId, currentScore]) => {
      const originalScore = originalScores[studentId];
      if (!originalScore) return true;

      return (
        currentScore.quizScore !== originalScore.quizScore ||
        currentScore.attendance !== originalScore.attendance ||
        currentScore.plusPoints !== originalScore.plusPoints ||
        currentScore.totalGrade !== originalScore.totalGrade
      );
    });
  };

  // Update the quiz creation API call
  const handleCreateQuiz = () => {
    // Validate required fields
    if (
      !quizName ||
      !quizDate ||
      !maxScore ||
      !modalPassingRate ||
      !modalDateRange?.from ||
      !modalDateRange?.to
    ) {
      toast.error('Please fill in all required fields', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
      return;
    }

    setCreating(true);
    const quizData = {
      name: quizName,
      quizDate: quizDate.toISOString(),
      maxScore: maxScore,
      passingRate: modalPassingRate,
      attendanceRangeStart: modalDateRange.from.toISOString(),
      attendanceRangeEnd: modalDateRange.to.toISOString(),
    };

    // Create new quiz
    axios
      .post(`/api/courses/${course_slug}/quizzes`, quizData)
      .then((response) => {
        setSelectedQuiz(response.data);
        setShowSetupModal(false);
        setPassingRate(modalPassingRate);
        setDateRange(modalDateRange);
        // Update quizzes list
        setQuizzes([...quizzes, response.data]);
        toast.success('Quiz created successfully', {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
          },
        });
      })
      .catch((error) => {
        console.error('Error creating quiz:', error);
        toast.error('Failed to create quiz', {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
          },
        });
      })
      .finally(() => {
        setCreating(false);
      });
  };

  // Add new function to handle edit quiz
  const handleEditQuiz = () => {
    // Validate required fields
    if (
      !editQuizName ||
      !editQuizDate ||
      !editMaxScore ||
      !editPassingRate ||
      !editDateRange?.from ||
      !editDateRange?.to
    ) {
      toast.error('Please fill in all required fields', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
      return;
    }

    setEditing(true);
    const quizData = {
      name: editQuizName,
      quizDate: editQuizDate.toISOString(),
      maxScore: editMaxScore,
      passingRate: editPassingRate,
      attendanceRangeStart: editDateRange.from.toISOString(),
      attendanceRangeEnd: editDateRange.to.toISOString(),
    };

    axios
      .put(`/api/quizzes/${selectedQuiz?.id}`, quizData)
      .then((response) => {
        setSelectedQuiz(response.data);
        setShowEditModal(false);
        setPassingRate(editPassingRate);
        setDateRange(editDateRange);
        // Update quizzes list
        setQuizzes(
          quizzes.map((q) => (q.id === selectedQuiz?.id ? response.data : q)),
        );
        toast.success('Quiz updated successfully', {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
          },
        });
      })
      .catch((error) => {
        console.error('Error updating quiz:', error);
        toast.error('Failed to update quiz', {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
          },
        });
      })
      .finally(() => {
        setEditing(false);
      });
  };

  // Add function to reset create quiz form
  const resetCreateQuizForm = () => {
    setQuizName('');
    setQuizDate(selectedDate);
    setMaxScore(100);
    setModalPassingRate(75);
    setModalDateRange({
      from: selectedDate ? addDays(selectedDate, -30) : undefined,
      to: selectedDate,
    });
    setShowSetupModal(true);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const student = students[index];
      if (!student) return;

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `/api/courses/${course_slug}/students/${student.id}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data) {
        // Update the student's image in the local state
        setStudents((prevStudents) =>
          prevStudents.map((s) =>
            s.id === student.id ? { ...s, image: response.data.imageUrl } : s,
          ),
        );
        toast.success('Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile picture');
      throw error;
    }
  };

  const handleRemoveImage = async (student: Student) => {
    try {
      await axios.delete(
        `/api/courses/${course_slug}/students/${student.id}/image`,
      );

      // Update the student's image in the local state
      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s.id === student.id ? { ...s, image: undefined } : s,
        ),
      );
      toast.success('Profile picture removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove profile picture');
      throw error;
    }
  };

  const handleImageClick = (student: Student) => {
    setSelectedStudent(student);
    setShowImageDialog(true);
  };

  const StudentProfileDialog = ({
    open,
    onOpenChange,
    student,
    onAddImage,
    onRemoveImage,
    students,
  }: StudentProfileDialogProps) => {
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    if (!student) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = () => {
          setTempImage(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Find the student's index
        const studentIndex = students.findIndex(
          (s: Student) => s.id === student.id,
        );
        if (studentIndex !== -1) {
          await onAddImage(studentIndex, file);
          // Close the dialog after successful upload
          onOpenChange(false);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    };

    const handleRemoveImage = () => {
      setShowRemoveDialog(true);
    };

    const handleConfirmRemove = async () => {
      try {
        await onRemoveImage(student);
        setShowRemoveDialog(false);
        setTempImage(null);
      } catch (error) {
        console.error('Error removing image:', error);
        toast.error('Failed to remove profile picture');
      }
    };

    return (
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            setTempImage(null);
            setShowRemoveDialog(false);
          }
          onOpenChange(newOpen);
        }}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle className='text-[#124A69] text-xl font-bold'>
              {student.firstName}'s Profile Picture
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col items-center gap-4 py-4'>
            <div className='relative'>
              {isUploading ? (
                <div className='w-48 h-48 rounded-full bg-gray-100 flex items-center justify-center'>
                  <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
                </div>
              ) : tempImage ? (
                <img
                  src={tempImage}
                  alt={`${student.firstName} ${student.lastName}`}
                  className='w-48 h-48 rounded-full object-cover'
                />
              ) : student.image ? (
                <img
                  src={student.image}
                  alt={`${student.firstName} ${student.lastName}`}
                  className='w-48 h-48 rounded-full object-cover'
                />
              ) : (
                <div className='w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center'>
                  <span className='text-gray-400 text-4xl'>
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </span>
                </div>
              )}
            </div>
            <div className='flex gap-2'>
              <input
                type='file'
                id='profile-picture'
                accept='image/*'
                onChange={handleFileChange}
                className='hidden'
                disabled={isUploading}
              />
              <Button
                variant='outline'
                onClick={() => {
                  const input = document.getElementById('profile-picture');
                  if (input) input.click();
                }}
                className='flex items-center gap-2 bg-[#124A69] text-white hover:bg-[#0D3A54] hover:text-white border-none'
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className='h-4 w-4' />
                    {student.image ? 'Change Picture' : 'Add Picture'}
                  </>
                )}
              </Button>
              {student.image && !isUploading && (
                <Button
                  variant='outline'
                  onClick={handleRemoveImage}
                  className='flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50'
                  disabled={isUploading}
                >
                  <X className='h-4 w-4' />
                  Remove Picture
                </Button>
              )}
            </div>
          </div>
        </DialogContent>

        {/* Remove Image Confirmation Dialog */}
        <AlertDialog
          open={showRemoveDialog}
          onOpenChange={(newOpen) => {
            if (!newOpen) {
              setShowRemoveDialog(false);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-[#124A69] text-xl font-bold'>
                Remove Profile Picture
              </AlertDialogTitle>
              <AlertDialogDescription className='text-gray-500'>
                Are you sure you want to remove the profile picture? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='gap-2 sm:gap-2'>
              <AlertDialogCancel
                onClick={() => setShowRemoveDialog(false)}
                className='border-gray-200'
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmRemove}
                className='bg-[#124A69] hover:bg-[#0D3A54] text-white'
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Dialog>
    );
  };

  // Add function to fetch attendance dates
  const fetchAttendanceDates = async () => {
    if (!course_slug) return;

    try {
      const response = await axios.get(
        `/api/courses/${course_slug}/attendance/dates`,
      );

      if (!response.data || !Array.isArray(response.data.dates)) {
        console.error('Invalid response structure:', response.data);
        return;
      }

      const uniqueDates = response.data.dates
        .map((dateStr: string) => {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        })
        .filter((date: Date | null): date is Date => date !== null)
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());

      setAttendanceDates(uniqueDates);
    } catch (error) {
      console.error('Error fetching attendance dates:', error);
    }
  };

  // Add useEffect to fetch attendance dates when course_slug changes
  useEffect(() => {
    if (course_slug) {
      fetchAttendanceDates();
    }
  }, [course_slug]);

  return (
    <div className='min-h-screen w-full p-0'>
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
      <div className='max-w-6xl mx-auto'>
        <div className='bg-white rounded-lg shadow-md'>
          {/* Card Header */}
          <div className='flex items-center gap-2 px-4 py-3 border-b'>
            <Button
              variant='ghost'
              className='h-9 w-9 p-0 hover:bg-gray-100'
              onClick={() => window.history.back()}
            >
              <svg
                className='h-5 w-5 text-gray-500'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path d='M15 18l-6-6 6-6' />
              </svg>
            </Button>
            <div className='flex flex-col mr-4'>
              <span className='text-lg font-bold text-[#124A69] leading-tight'>
                {courseCode}
              </span>
              <span className='text-sm text-gray-500'>{courseSection}</span>
            </div>
            <div className='flex-1 flex items-center gap-2'>
              {/* Header Controls */}
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-500' />
                  <Input
                    placeholder='Search students...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-8 w-[200px]'
                  />
                  {searchQuery && (
                    <button
                      type='button'
                      onClick={() => setSearchQuery('')}
                      className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                      tabIndex={-1}
                    >
                      &#10005;
                    </button>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  className='rounded-full relative flex items-center gap-2 px-3 bg-white text-[#124A69] hover:bg-gray-100 border border-gray-200'
                  onClick={() => setIsFilterOpen(true)}
                >
                  <Filter className='h-4 w-4' />
                  <span>Filter</span>
                  {(gradeFilter.passed ||
                    gradeFilter.failed ||
                    gradeFilter.noGrades) && (
                    <span className='absolute -top-1 -right-1 bg-[#124A69] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                      {Number(gradeFilter.passed) +
                        Number(gradeFilter.failed) +
                        Number(gradeFilter.noGrades)}
                    </span>
                  )}
                </Button>
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetContent
                    side='right'
                    className='w-[340px] sm:w-[400px] p-0'
                  >
                    <div className='p-6 border-b'>
                      <SheetHeader>
                        <SheetTitle className='text-xl font-semibold'>
                          Filter Options
                        </SheetTitle>
                      </SheetHeader>
                    </div>
                    <div className='p-6 space-y-6'>
                      <div className='space-y-4'>
                        <label className='text-sm font-medium text-gray-700'>
                          Remarks
                        </label>
                        <div className='space-y-3 border rounded-lg p-4 bg-white'>
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={gradeFilter.passed}
                              onChange={() => handleFilterChange('passed')}
                              className='rounded border-gray-300 text-[#124A69] focus:ring-[#124A69]'
                            />
                            <span className='text-sm text-gray-700'>
                              Passed
                            </span>
                          </label>
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={gradeFilter.failed}
                              onChange={() => handleFilterChange('failed')}
                              className='rounded border-gray-300 text-[#124A69] focus:ring-[#124A69]'
                            />
                            <span className='text-sm text-gray-700'>
                              Failed
                            </span>
                          </label>
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={gradeFilter.noGrades}
                              onChange={() => handleFilterChange('noGrades')}
                              className='rounded border-gray-300 text-[#124A69] focus:ring-[#124A69]'
                            />
                            <span className='text-sm text-gray-700'>
                              No Grades
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-4 p-6 border-t mt-auto'>
                      <Button
                        variant='outline'
                        className='flex-1 rounded-lg'
                        onClick={() => {
                          setGradeFilter({
                            passed: false,
                            failed: false,
                            noGrades: false,
                          });
                          setIsFilterOpen(false);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        className='flex-1 rounded-lg bg-[#124A69] hover:bg-[#0D3A54] text-white'
                        onClick={() => setIsFilterOpen(false)}
                      >
                        Apply
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                className={cn(
                  'w-[180px] justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {selectedDate
                  ? format(selectedDate, 'PPP')
                  : 'Pick a quiz date'}
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  resetCreateQuizForm();
                  setShowSetupModal(true);
                }}
                className='bg-[#124A69] text-white hover:bg-[#0d3a56]'
                disabled={hasChanges()}
              >
                Manage Quiz
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            <table className='w-full border-separate border-spacing-0 table-fixed'>
              <thead className='bg-white'>
                <tr>
                  <th className='sticky left-0 z-10 bg-white border-b font-bold text-[#124A69] text-left px-4 py-3 w-[300px]'>
                    Students
                  </th>
                  <th className='border-b font-bold text-[#124A69] text-center px-4 py-3 w-[120px]'>
                    Quiz Score
                    {selectedQuiz && (
                      <div className='text-xs font-normal text-gray-500'>
                        (Max: {selectedQuiz.maxScore})
                      </div>
                    )}
                  </th>
                  <th className='border-b font-bold text-[#124A69] text-center px-4 py-3 w-[180px]'>
                    Attendance
                    {attendanceStats && (
                      <div className='text-xs font-normal text-gray-500'>
                        ({attendanceStats.totalClasses} meetings)
                      </div>
                    )}
                  </th>
                  <th className='border-b font-bold text-[#124A69] text-center px-4 py-3 w-[120px]'>
                    Plus Points{' '}
                    <div className='text-xs font-normal text-gray-500'>
                      (Max: 20)
                    </div>
                  </th>
                  <th className='border-b font-bold text-[#124A69] text-center px-4 py-3 w-[120px]'>
                    Total Grade
                  </th>
                  <th className='border-b font-bold text-[#124A69] text-center px-4 py-3 w-[150px]'>
                    Remarks
                  </th>
                </tr>
                <tr>
                  <td colSpan={6} className='border-b px-4 py-2 bg-gray-50'>
                    <div className='flex items-center justify-center gap-4 text-xs text-gray-600'>
                      <span className='flex items-center gap-1'>
                        <span className='w-2 h-2 rounded-full bg-green-700'></span>
                        Present
                      </span>
                      <span className='flex items-center gap-1'>
                        <span className='w-2 h-2 rounded-full bg-yellow-700'></span>
                        Late
                      </span>
                      <span className='flex items-center gap-1'>
                        <span className='w-2 h-2 rounded-full bg-blue-700'></span>
                        Excused
                      </span>
                      <span className='flex items-center gap-1'>
                        <span className='w-2 h-2 rounded-full bg-red-700'></span>
                        Absent
                      </span>
                      <span className='flex items-center gap-1'>
                        <span className='w-2 h-2 rounded-full bg-gray-700'></span>
                        No Attendance
                      </span>
                    </div>
                  </td>
                </tr>
              </thead>
              <tbody>
                {!selectedQuiz ? (
                  <tr>
                    <td colSpan={6} className='text-center py-8'>
                      <div className='flex flex-col items-center gap-2'>
                        <p className='text-lg font-medium text-[#124A69]'>
                          No Quiz Selected
                        </p>
                        <p className='text-sm text-gray-500'>
                          Please select or create a new quiz using the Manage
                          Quiz button
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={6} className='text-center py-8'>
                      <div className='flex flex-col items-center gap-2'>
                        <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
                        <p className='text-sm text-gray-500'>
                          {loadingMessage || 'Loading students...'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const { paginatedStudents } =
                      getPaginatedStudents(students);

                    if (paginatedStudents.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={6}
                            className='text-center py-8 text-muted-foreground'
                          >
                            No students found
                          </td>
                        </tr>
                      );
                    }

                    return paginatedStudents.map((student, idx) => {
                      const studentScore = scores[student.id] || {
                        studentId: student.id,
                        quizScore: 0,
                        attendance: 'PRESENT',
                        plusPoints: 0,
                        totalGrade: 0,
                        remarks: '',
                      };

                      const studentStat = attendanceStats?.studentStats.find(
                        (stat) => stat.studentId === student.id,
                      );

                      return (
                        <tr
                          key={student.id}
                          className={
                            idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6FA]'
                          }
                        >
                          <td className='sticky left-0 z-10 bg-inherit px-4 py-2'>
                            <div className='flex items-center gap-3'>
                              <div
                                className='cursor-pointer'
                                onClick={() => handleImageClick(student)}
                              >
                                {student.image ? (
                                  <img
                                    src={student.image}
                                    alt=''
                                    className='w-8 h-8 rounded-full object-cover'
                                  />
                                ) : (
                                  <span className='inline-flex w-8 h-8 rounded-full bg-gray-200 text-gray-400 items-center justify-center'>
                                    <svg
                                      width='20'
                                      height='20'
                                      fill='none'
                                      stroke='currentColor'
                                      strokeWidth='2'
                                      viewBox='0 0 24 24'
                                    >
                                      <circle cx='12' cy='8' r='4' />
                                      <path d='M6 20c0-2.2 3.6-4 6-4s6 1.8 6 4' />
                                    </svg>
                                  </span>
                                )}
                              </div>
                              <span>{`${student.lastName}, ${
                                student.firstName
                              }${
                                student.middleInitial
                                  ? ` ${student.middleInitial}.`
                                  : ''
                              }`}</span>
                            </div>
                          </td>
                          <td className='px-4 py-2 text-center'>
                            <input
                              type='number'
                              min='0'
                              max={selectedQuiz?.maxScore || 100}
                              value={studentScore.quizScore || ''}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ''
                                    ? 0
                                    : Math.min(
                                        selectedQuiz?.maxScore || 100,
                                        Math.max(0, parseInt(e.target.value)),
                                      );
                                handleScoreChange(
                                  student.id,
                                  'quizScore',
                                  value,
                                );
                              }}
                              onKeyPress={(e) => {
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              className={cn(
                                'w-20 p-1 border rounded text-center',
                                maxScoreError &&
                                  'border-red-500 focus-visible:ring-red-500',
                              )}
                              placeholder='Score'
                            />
                            {maxScoreError && (
                              <p className='text-[10px] text-red-500 mt-0.5'>
                                {maxScoreError}
                              </p>
                            )}
                          </td>
                          <td className='px-4 py-2 text-center'>
                            {(() => {
                              if (!studentStat) {
                                return (
                                  <span className='text-gray-500'>--</span>
                                );
                              }

                              const totalRecords =
                                (studentStat.present || 0) +
                                (studentStat.late || 0) +
                                (studentStat.absent || 0) +
                                (studentStat.excused || 0);

                              // If there are no records at all, show "--"
                              if (totalRecords === 0) {
                                return (
                                  <span className='text-gray-500'>--</span>
                                );
                              }

                              // Calculate missing records as the difference between total classes and total records
                              const missingRecords = Math.max(
                                0,
                                (attendanceStats?.totalClasses || 0) -
                                  totalRecords,
                              );

                              return (
                                <div className='flex items-center justify-center gap-2 text-sm'>
                                  {studentStat.present > 0 && (
                                    <span className='text-green-700 font-medium flex items-center gap-1 group relative'>
                                      <span className='w-2 h-2 rounded-full bg-green-700'></span>
                                      {studentStat.present}
                                      <span className='absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                                        Present
                                      </span>
                                    </span>
                                  )}
                                  {studentStat.late > 0 && (
                                    <span className='text-yellow-700 font-medium flex items-center gap-1 group relative'>
                                      <span className='w-2 h-2 rounded-full bg-yellow-700'></span>
                                      {studentStat.late}
                                      <span className='absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                                        Late
                                      </span>
                                    </span>
                                  )}
                                  {studentStat.excused > 0 && (
                                    <span className='text-blue-700 font-medium flex items-center gap-1 group relative'>
                                      <span className='w-2 h-2 rounded-full bg-blue-700'></span>
                                      {studentStat.excused}
                                      <span className='absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                                        Excused
                                      </span>
                                    </span>
                                  )}
                                  {studentStat.absent > 0 && (
                                    <span className='text-red-700 font-medium flex items-center gap-1 group relative'>
                                      <span className='w-2 h-2 rounded-full bg-red-700'></span>
                                      {studentStat.absent}
                                      <span className='absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                                        Absent
                                      </span>
                                    </span>
                                  )}
                                  {missingRecords > 0 && (
                                    <span className='text-gray-700 font-medium flex items-center gap-1 group relative'>
                                      <span className='w-2 h-2 rounded-full bg-gray-700'></span>
                                      {missingRecords}
                                      <span className='absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                                        No Attendance
                                      </span>
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className='px-4 py-2 text-center'>
                            <input
                              type='number'
                              min='0'
                              max='20'
                              value={studentScore.plusPoints || ''}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ''
                                    ? 0
                                    : Math.max(0, parseInt(e.target.value));
                                handleScoreChange(
                                  student.id,
                                  'plusPoints',
                                  Math.min(value, 20),
                                );
                              }}
                              onKeyPress={(e) => {
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              className='w-20 p-1 border rounded text-center'
                              placeholder='Points'
                            />
                          </td>
                          <td className='px-4 py-2 text-center font-semibold'>
                            {studentScore.totalGrade
                              ? studentScore.totalGrade.toFixed(1) + '%'
                              : '---'}
                          </td>
                          <td className='px-4 py-2 text-center'>
                            {studentScore.totalGrade ? (
                              <span
                                className={
                                  studentScore.totalGrade >= passingRate
                                    ? 'text-green-700 font-semibold'
                                    : 'text-red-700 font-semibold'
                                }
                              >
                                {studentScore.totalGrade >= passingRate
                                  ? 'Passed'
                                  : 'Failed'}
                              </span>
                            ) : (
                              '---'
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Bar */}
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-white'>
            <div className='flex items-center gap-2'>
              <p className='text-sm text-gray-500 whitespace-nowrap'>
                {totalStudents > 0 ? (
                  <>
                    {currentPage * studentsPerPage - (studentsPerPage - 1)}-
                    {Math.min(currentPage * studentsPerPage, totalStudents)} of{' '}
                    {totalStudents} students
                  </>
                ) : (
                  'No students found'
                )}
              </p>
            </div>

            {/* Pagination Controls */}
            <div className='flex justify-end'>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={
                        currentPage === 1
                          ? 'pointer-events-none opacity-50'
                          : 'hover:bg-gray-100'
                      }
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`${
                          currentPage === i + 1
                            ? 'bg-[#124A69] text-white hover:bg-[#0d3a56]'
                            : 'hover:bg-gray-100'
                        }`}
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
                          : 'hover:bg-gray-100'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>

        {/* Setup Modal with Tabs */}
        <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
          <DialogContent className='sm:max-w-[450px]'>
            <DialogHeader>
              <DialogTitle className='text-[#124A69] text-2xl font-bold'>
                Quiz Manager
              </DialogTitle>
              <DialogDescription className='text-gray-500'>
                Select an existing quiz or create a new one for this course.
              </DialogDescription>
            </DialogHeader>
            <Tabs
              value={modalTab}
              onValueChange={(value) => {
                setModalTab(value);
                if (value === 'new') {
                  resetCreateQuizForm();
                }
              }}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg -mb-2'>
                <TabsTrigger
                  value='existing'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm'
                >
                  Existing Quizzes
                </TabsTrigger>
                <TabsTrigger
                  value='new'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm'
                >
                  Create New Quiz
                </TabsTrigger>
              </TabsList>
              <TabsContent value='existing'>
                <div className='space-y-4 py-4'>
                  <div className='text-sm font-medium text-gray-700 mb-2'>
                    Select a quiz
                  </div>
                  {loadingMessage ? (
                    <div className='flex flex-col items-center justify-center py-8'>
                      <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
                      <p className='text-sm text-gray-500 mt-2'>
                        {loadingMessage}
                      </p>
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className='text-gray-500 text-center py-4'>
                      No quizzes found.
                    </div>
                  ) : (
                    <div className='flex flex-col gap-4'>
                      <Select
                        value={selectedQuizId}
                        onValueChange={setSelectedQuizId}
                      >
                        <SelectTrigger className='w-full bg-gray-50 border-gray-200'>
                          <SelectValue placeholder='Select a quiz' />
                        </SelectTrigger>
                        <SelectContent>
                          {quizzes.map((quiz) => (
                            <SelectItem key={quiz.id} value={quiz.id}>
                              <div className='flex flex-col items-start'>
                                <span className='font-medium text-[#124A69]'>
                                  {quiz.name}
                                </span>
                                <span className='text-xs text-gray-500'>
                                  {quiz.quizDate
                                    ? format(new Date(quiz.quizDate), 'PPP')
                                    : 'No date'}{' '}
                                  | Max Score: {quiz.maxScore} | Passing Rate:{' '}
                                  {quiz.passingRate}%
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <DialogFooter className='gap-2 sm:gap-2'>
                        <Button
                          variant='outline'
                          onClick={() => setShowSetupModal(false)}
                          className='border-gray-200'
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            const selectedQuiz = quizzes.find(
                              (q) => q.id === selectedQuizId,
                            );
                            if (selectedQuiz) {
                              handleSelectQuiz(selectedQuiz);
                            }
                          }}
                          disabled={!selectedQuizId}
                          className='bg-[#124A69] hover:bg-[#0d3a56] text-white'
                        >
                          Apply Selected Quiz
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value='new'>
                <div className='space-y-4 py-4'>
                  <div className='grid gap-4'>
                    <div className='grid gap-2'>
                      <label className='text-sm font-medium text-gray-700'>
                        Quiz Name <span className='text-red-500'>*</span>
                      </label>
                      <Input
                        value={quizName}
                        onChange={(e) =>
                          setQuizName(e.target.value.slice(0, 25))
                        }
                        placeholder='Enter quiz name'
                        maxLength={25}
                        className='bg-gray-50 border-gray-200'
                      />
                      <div className='text-xs text-gray-500 text-right'>
                        {quizName.length}/25
                      </div>
                    </div>
                    <div className='grid gap-2'>
                      <label className='text-sm font-medium text-gray-700'>
                        Attendance Date Range{' '}
                        <span className='text-red-500'>*</span>
                      </label>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className='w-full justify-start text-left font-normal bg-gray-50 border-gray-200'
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {modalDateRange?.from ? (
                              modalDateRange.to ? (
                                <>
                                  {format(modalDateRange.from, 'LLL dd, y')} -{' '}
                                  {format(modalDateRange.to, 'LLL dd, y')}
                                </>
                              ) : (
                                format(modalDateRange.from, 'LLL dd, y')
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='range'
                            selected={modalDateRange}
                            onSelect={setModalDateRange}
                            numberOfMonths={2}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            modifiers={{
                              hasAttendance: (date) => {
                                return attendanceDates.some(
                                  (attendanceDate) =>
                                    attendanceDate.getFullYear() ===
                                      date.getFullYear() &&
                                    attendanceDate.getMonth() ===
                                      date.getMonth() &&
                                    attendanceDate.getDate() === date.getDate(),
                                );
                              },
                            }}
                            classNames={{
                              day_selected:
                                'bg-[#124A69] text-white hover:bg-[#124A69] hover:text-white focus:bg-[#124A69] focus:text-white',
                              day_range_start:
                                'bg-[#124A69] text-white rounded-l-md',
                              day_range_end:
                                'bg-[#124A69] text-white rounded-r-md',
                              day_range_middle: 'bg-[#e3eef5]',
                              day_today:
                                'border border-[#124A69] text-[#124A69] bg-white',
                              day_outside: 'text-gray-400 opacity-50',
                              day_disabled: 'text-gray-400 opacity-50',
                              day_hidden: 'invisible',
                            }}
                            modifiersStyles={{
                              hasAttendance: {
                                border: '1px solid #124A69',
                                color: '#000000', // Black text for attendance dates
                                borderRadius: '50%',
                              },
                              selected: {
                                color: '#ffffff', // White text for selected dates
                              },
                              selected_hasAttendance: {
                                border: '1px solid #124A69',
                                backgroundColor: '#124A69', // Text color for attendance dates not in range
                                color: '#124A69', // Text color for attendance dates not in range
                                borderRadius: '50%',
                              },
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='grid gap-2'>
                        <label className='text-sm font-medium text-gray-700'>
                          Max Score <span className='text-red-500'>*</span>
                        </label>
                        <Input
                          type='number'
                          min={1}
                          max={100}
                          value={maxScore}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value > 100) {
                              setMaxScoreError(
                                'Maximum score cannot exceed 100',
                              );
                            } else {
                              setMaxScoreError('');
                            }
                            setMaxScore(Math.min(100, Math.max(1, value)));
                          }}
                          className={cn(
                            'bg-gray-50 border-gray-200',
                            maxScoreError &&
                              'border-red-500 focus-visible:ring-red-500',
                          )}
                        />
                        {maxScoreError && (
                          <p className='text-[10px] text-red-500 mt-0.5'>
                            {maxScoreError}
                          </p>
                        )}
                      </div>
                      <div className='grid gap-2'>
                        <label className='text-sm font-medium text-gray-700'>
                          Passing Rate <span className='text-red-500'>*</span>
                        </label>
                        <Select
                          value={modalPassingRate.toString()}
                          onValueChange={(v) => setModalPassingRate(Number(v))}
                        >
                          <SelectTrigger className='w-full bg-gray-50 border-gray-200'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[50, 60, 70, 75, 80, 85, 90].map((rate) => (
                              <SelectItem key={rate} value={rate.toString()}>
                                {rate}%
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className='gap-2 sm:gap-2 mt-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleChooseAnotherDate}
                      className='border-gray-200'
                    >
                      Cancel
                    </Button>
                    <DialogClose asChild>
                      <Button
                        type='button'
                        className='bg-[#124A69] hover:bg-[#0d3a56] text-white'
                        disabled={
                          !quizName.trim() ||
                          !modalDateRange?.from ||
                          !modalDateRange?.to ||
                          creating
                        }
                        onClick={handleCreateQuiz}
                      >
                        {creating ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Creating...
                          </>
                        ) : (
                          'Save & Continue'
                        )}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
        {/* Action Buttons */}
        <div className='flex justify-between mt-3'>
          <div className='flex items-center text-sm text-gray-500'>
            Quiz:{' '}
            <span className='font-medium text-[#124A69] ml-1 mr-6'>
              {selectedQuiz?.name}
            </span>
            {selectedQuiz && dateRange?.from && dateRange?.to && (
              <span className='text-gray-500 ml-2'>
                Date Range:{' '}
                <span className='font-medium text-[#124A69]'>
                  {' '}
                  ({format(dateRange.from, 'MMM dd')} -{' '}
                  {format(dateRange.to, 'MMM dd')})
                </span>
              </span>
            )}
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                if (previousScores) {
                  // Undo action
                  if (!previousScores) return;

                  // Create a new object to ensure state update triggers re-render
                  const restoredScores = { ...previousScores };

                  // Recalculate total grades for all students
                  Object.keys(restoredScores).forEach((studentId) => {
                    const score = restoredScores[studentId];
                    score.totalGrade = calculateTotalGrade(
                      score.quizScore,
                      score.plusPoints,
                      selectedQuiz?.maxScore || 100,
                    );
                  });

                  // Update states in sequence to ensure proper re-render
                  setScores({}); // Clear current scores first
                  setTimeout(() => {
                    setScores(restoredScores);
                    setPreviousScores(null);
                    toast.success('Grades restored', {
                      duration: 3000,
                      style: {
                        background: '#fff',
                        color: '#124A69',
                        border: '1px solid #e5e7eb',
                      },
                    });
                  }, 0);
                } else {
                  setShowResetConfirmation(true);
                }
              }}
              className={
                previousScores
                  ? 'h-9 px-4 bg-[#124A69] text-white hover:bg-[#0d3a56] border-none'
                  : 'h-9 px-4 border-gray-200 text-gray-600 hover:bg-gray-50'
              }
              disabled={loading || (!previousScores && hasChanges())}
            >
              {previousScores ? 'Undo Reset' : 'Reset Grades'}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                if (selectedQuiz) {
                  setEditQuizName(selectedQuiz.name);
                  setEditQuizDate(new Date(selectedQuiz.quizDate));
                  setEditMaxScore(selectedQuiz.maxScore);
                  setEditPassingRate(selectedQuiz.passingRate);
                  setEditDateRange({
                    from: new Date(selectedQuiz.attendanceRangeStart),
                    to: new Date(selectedQuiz.attendanceRangeEnd),
                  });
                  setShowEditModal(true);
                }
              }}
              className='h-9 px-4 border-gray-200 text-gray-600 hover:bg-gray-50'
              disabled={loading || !selectedQuiz || hasChanges()}
            >
              Edit Quiz Criteria
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExport}
              className='h-9 px-4 border-gray-200 text-gray-600 hover:bg-gray-50'
              disabled={loading || !selectedQuiz || hasChanges()}
            >
              Export to Excel
            </Button>
            <Button
              variant='default'
              size='sm'
              className='h-9 px-4 bg-[#124A69] text-white hover:bg-[#0d3a56] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden'
              onClick={async () => {
                if (!selectedQuiz?.id) return;

                try {
                  setSaving(true);
                  toast.loading('Saving grades...', {
                    id: 'saveGrades',
                    duration: Infinity,
                    style: {
                      background: '#fff',
                      color: '#124A69',
                      border: '1px solid #e5e7eb',
                    },
                  });

                  // Convert scores object to array and format each score
                  const scoresArray = Object.values(scores).map((score) => ({
                    studentId: score.studentId,
                    score: score.quizScore,
                    attendance: score.attendance,
                    plusPoints: score.plusPoints,
                    totalGrade: score.totalGrade,
                  }));

                  // Save all scores in one request
                  await axios.post(`/api/quizzes/${selectedQuiz.id}/scores`, {
                    scores: scoresArray,
                  });

                  // Update original scores after successful save
                  setOriginalScores(scores);
                  setPreviousScores(null); // Clear previous scores after saving

                  toast.success('Grades saved successfully', {
                    id: 'saveGrades',
                    duration: 3000,
                    style: {
                      background: '#fff',
                      color: '#124A69',
                      border: '1px solid #e5e7eb',
                    },
                  });
                } catch (error) {
                  console.error('Error saving quiz scores:', error);
                  toast.error('Failed to save grades', {
                    id: 'saveGrades',
                    duration: 3000,
                    style: {
                      background: '#fff',
                      color: '#dc2626',
                      border: '1px solid #e5e7eb',
                    },
                  });
                } finally {
                  setSaving(false);
                }
              }}
              disabled={loading || !hasChanges() || saving}
            >
              {saving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Grades'
              )}
            </Button>
          </div>
        </div>

        {/* Export Preview Dialog */}
        <ExportQuiz
          showExportPreview={showExportPreview}
          setShowExportPreview={setShowExportPreview}
          exportData={exportData}
          selectedDate={selectedDate}
          courseCode={courseCode}
          courseSection={courseSection}
          selectedQuiz={selectedQuiz}
        />

        {/* Reset Confirmation Modal */}
        <Dialog
          open={showResetConfirmation}
          onOpenChange={setShowResetConfirmation}
        >
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle className='text-[#124A69] text-xl font-bold'>
                Reset Grades
              </DialogTitle>
              <DialogDescription className='text-gray-500'>
                Are you sure you want to reset all grades? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='gap-2 sm:gap-2 mt-4'>
              <Button
                variant='outline'
                onClick={() => setShowResetConfirmation(false)}
                className='border-gray-200'
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setPreviousScores(scores);
                  setScores({});
                  students.forEach((student) => {
                    handleScoreChange(student.id, 'quizScore', 0);
                  });
                  setShowResetConfirmation(false);
                  toast.success('Grades reset successfully', {
                    duration: 5000,
                    style: {
                      background: '#fff',
                      color: '#124A69',
                      border: '1px solid #e5e7eb',
                    },
                  });
                }}
                className='bg-[#124A69] hover:bg-[#0d3a56] text-white'
              >
                Reset Grades
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Quiz Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className='sm:max-w-[450px]'>
            <DialogHeader>
              <DialogTitle className='text-[#124A69] text-2xl font-bold'>
                Edit Quiz
              </DialogTitle>
              <DialogDescription className='text-gray-500'>
                Modify the details of the selected quiz.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='grid gap-4'>
                <div className='grid gap-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Quiz Name <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    value={editQuizName}
                    onChange={(e) =>
                      setEditQuizName(e.target.value.slice(0, 25))
                    }
                    placeholder='Enter quiz name'
                    maxLength={25}
                    className='bg-gray-50 border-gray-200'
                  />
                  <div className='text-xs text-gray-500 text-right'>
                    {editQuizName.length}/25
                  </div>
                </div>
                <div className='grid gap-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Attendance Date Range{' '}
                    <span className='text-red-500'>*</span>
                  </label>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-start text-left font-normal bg-gray-50 border-gray-200'
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {editDateRange?.from ? (
                          editDateRange.to ? (
                            <>
                              {format(editDateRange.from, 'LLL dd, y')} -{' '}
                              {format(editDateRange.to, 'LLL dd, y')}
                            </>
                          ) : (
                            format(editDateRange.from, 'LLL dd, y')
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='range'
                        selected={editDateRange}
                        onSelect={setEditDateRange}
                        numberOfMonths={2}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <label className='text-sm font-medium text-gray-700'>
                      Max Score <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      type='number'
                      min={1}
                      max={100}
                      value={editMaxScore}
                      onChange={(e) => setEditMaxScore(Number(e.target.value))}
                      className='bg-gray-50 border-gray-200'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <label className='text-sm font-medium text-gray-700'>
                      Passing Rate <span className='text-red-500'>*</span>
                    </label>
                    <Select
                      value={editPassingRate.toString()}
                      onValueChange={(v) => setEditPassingRate(Number(v))}
                    >
                      <SelectTrigger className='w-full bg-gray-50 border-gray-200'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[50, 60, 70, 75, 80, 85, 90].map((rate) => (
                          <SelectItem key={rate} value={rate.toString()}>
                            {rate}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className='gap-2 sm:gap-2 mt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowEditModal(false)}
                  className='border-gray-200'
                >
                  Cancel
                </Button>
                <Button
                  type='button'
                  className='bg-[#124A69] hover:bg-[#0d3a56] text-white'
                  disabled={
                    !editQuizName.trim() ||
                    !editDateRange?.from ||
                    !editDateRange?.to ||
                    editing
                  }
                  onClick={handleEditQuiz}
                >
                  {editing ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add the StudentProfileDialog */}
        <StudentProfileDialog
          open={showImageDialog}
          onOpenChange={setShowImageDialog}
          student={selectedStudent}
          onAddImage={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          students={students}
        />
      </div>
    </div>
  );
}
