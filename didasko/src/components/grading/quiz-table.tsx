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
import { Calendar as CalendarIcon, Search, Loader2 } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { toast } from 'react-hot-toast';
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

    if (gradeFilter.passed && hasGrades && total >= passingRate) return true;
    if (gradeFilter.failed && hasGrades && total < passingRate) return true;
    if (gradeFilter.noGrades && !hasGrades) return true;
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
      return name.includes(searchQuery.toLowerCase());
    });

    setTotalPages(Math.ceil(filteredStudents.length / studentsPerPage));
    setTotalStudents(filteredStudents.length);
  }, [students, searchQuery, studentsPerPage]);

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
    const newQuiz = {
      name: quizName,
      quizDate: quizDate,
      maxScore: maxScore,
      passingRate: modalPassingRate,
      attendanceRangeStart: modalDateRange?.from,
      attendanceRangeEnd: modalDateRange?.to,
    };

    axios
      .post(`/api/courses/${course_slug}/quizzes`, newQuiz)
      .then((response) => {
        setSelectedQuiz(response.data);
        setShowSetupModal(false);
        setPassingRate(modalPassingRate);
        setDateRange(modalDateRange);
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
      });
  };

  return (
    <div className='max-w-6xl mx-auto'>
      <div className='bg-white rounded-lg shadow-md'>
        {/* Card Header */}
        <div className='flex items-center justify-between px-4 py-3 border-b'>
          <div className='flex items-center gap-4'>
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
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-500' />
              <Input
                placeholder='Search students...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8 w-[200px]'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-[140px] h-9 rounded-full border-gray-200 bg-[#F5F6FA] justify-between'
                  >
                    <span>Filter</span>
                    <svg
                      className='h-4 w-4 text-gray-500'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <path d='M19 9l-7 7-7-7' />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[200px] p-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='passed'
                        checked={gradeFilter.passed}
                        onCheckedChange={() => handleFilterChange('passed')}
                      />
                      <label
                        htmlFor='passed'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        Passed
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='failed'
                        checked={gradeFilter.failed}
                        onCheckedChange={() => handleFilterChange('failed')}
                      />
                      <label
                        htmlFor='failed'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        Failed
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='noGrades'
                        checked={gradeFilter.noGrades}
                        onCheckedChange={() => handleFilterChange('noGrades')}
                      />
                      <label
                        htmlFor='noGrades'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        No Grades
                      </label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {Object.entries(gradeFilter).some(([_, value]) => !value) && (
                <div className='flex items-center gap-1.5'>
                  {gradeFilter.passed && (
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                      Passed
                    </span>
                  )}
                  {gradeFilter.failed && (
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700'>
                      Failed
                    </span>
                  )}
                  {gradeFilter.noGrades && (
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
                      No Grades
                    </span>
                  )}
                </div>
              )}
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
              {selectedDate ? format(selectedDate, 'PPP') : 'Pick a quiz date'}
            </Button>
            <Button
              variant='outline'
              onClick={() => setShowSetupModal(true)}
              className='bg-[#124A69] text-white hover:bg-[#0d3a56]'
            >
              Quiz Manager
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
              {loading ? (
                <tr>
                  <td colSpan={6} className='text-center py-8'>
                    <div className='flex flex-col items-center gap-2'>
                      <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
                      <p className='text-sm text-gray-600'>{loadingMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : !selectedQuiz ? (
                <tr>
                  <td colSpan={6} className='text-center py-8'>
                    <div className='flex flex-col items-center gap-2'>
                      <p className='text-lg font-medium text-gray-900'>
                        No quiz selected yet
                      </p>
                      <p className='text-sm text-gray-500'>
                        Please select a quiz from the Quiz Manager to start
                        grading
                      </p>
                      <Button
                        variant='outline'
                        onClick={() => setShowSetupModal(true)}
                        className='mt-2 bg-[#124A69] text-white hover:bg-[#0d3a56]'
                      >
                        Open Quiz Manager
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                (() => {
                  const { paginatedStudents } = getPaginatedStudents(students);

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
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6FA]'}
                      >
                        <td className='sticky left-0 z-10 bg-inherit px-4 py-2'>
                          <div className='flex items-center gap-3'>
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
                            <span>{`${student.lastName}, ${student.firstName}${
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
                                  : Math.max(0, parseInt(e.target.value));
                              const maxScore = selectedQuiz?.maxScore || 100;
                              handleScoreChange(
                                student.id,
                                'quizScore',
                                Math.min(value, maxScore),
                              );
                            }}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className='w-20 p-1 border rounded text-center'
                            placeholder='Score'
                          />
                        </td>
                        <td className='px-4 py-2 text-center'>
                          {(() => {
                            if (!studentStat)
                              return (
                                <span className='text-red-700 font-medium'></span>
                              );

                            const totalRecords =
                              (studentStat.present || 0) +
                              (studentStat.late || 0) +
                              (studentStat.absent || 0) +
                              (studentStat.excused || 0);
                            // Only count as missing if there are no attendance records at all
                            const missingRecords =
                              totalRecords === 0
                                ? attendanceStats?.totalClasses || 0
                                : 0;

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
          <Tabs value={modalTab} onValueChange={setModalTab} className='w-full'>
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
                      onChange={(e) => setQuizName(e.target.value.slice(0, 25))}
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
                        value={maxScore}
                        onChange={(e) => setMaxScore(Number(e.target.value))}
                        className='bg-gray-50 border-gray-200'
                      />
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
                        !modalDateRange?.to
                      }
                      onClick={handleCreateQuiz}
                    >
                      Save & Continue
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      {/* Action Buttons */}
      <div className='flex justify-end mt-3 gap-2'>
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
              // Show reset confirmation modal
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
    </div>
  );
}
