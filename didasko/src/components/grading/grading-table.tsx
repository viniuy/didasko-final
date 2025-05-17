import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axios';
import GradingTableHeader from './grading-table-header';
import GradingTableRow from './grading-table-row';
import * as XLSX from 'xlsx';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { ExportReporting } from './export-reporting';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  image?: string;
  status?: string;
  attendanceRecords?: any[];
}

interface GradingTableProps {
  courseId: string;
  courseCode: string;
  courseSection: string;
  selectedDate: Date | undefined;
  onDateSelect?: (date: Date | undefined) => void;
  groupId?: string;
  isGroupView?: boolean;
}

interface GradingReport {
  id: string;
  name: string;
  courseId: string;
  userId: string;
  rubrics: RubricDetail[];
  scoringRange: string;
  passingScore: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string;
  };
  isGroupCriteria: boolean;
}

interface RubricDetail {
  name: string;
  percentage: number;
  isGroupRubric?: boolean;
}

interface GradingScore {
  studentId: string;
  scores: number[];
  total: number;
}

export function GradingTable({
  courseId,
  courseCode,
  courseSection,
  selectedDate,
  onDateSelect,
  groupId,
  isGroupView = false,
}: GradingTableProps) {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [showCriteriaDialog, setShowCriteriaDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedReports, setSavedReports] = useState<GradingReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [activeReport, setActiveReport] = useState<GradingReport | null>(null);
  const [scores, setScores] = useState<Record<string, GradingScore>>({});
  const [originalScores, setOriginalScores] = useState<
    Record<string, GradingScore>
  >({});
  const [rubricDetails, setRubricDetails] = useState<RubricDetail[]>([]);
  const [newReport, setNewReport] = useState({
    name: '',
    rubrics: '2',
    scoringRange: '5',
    passingScore: '75',
    rubricDetails: [
      { name: '', weight: 50 },
      { name: '', weight: 50 },
    ],
  });
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<{
    passed: boolean;
    failed: boolean;
    noGrades: boolean;
  }>({
    passed: false,
    failed: false,
    noGrades: false,
  });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    rubrics?: string[];
  }>({});
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportData, setExportData] = useState<{
    header: string[][];
    studentRows: string[][];
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [previousScores, setPreviousScores] = useState<
    Record<string, GradingScore>
  >({});

  // Function to handle dialog close
  const handleDialogClose = () => {
    setShowCriteriaDialog(false);
    // Reset active report and students when closing without applying
    setActiveReport(null);
    setStudents([]);
    setScores({});
    setRubricDetails([]);
    setSelectedReport('');
  };

  // Fetch grades when both date and criteria are available
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !selectedDate || !activeReport) return;
      setIsLoading(true);
      try {
        // 1. Fetch students
        let studentsRes;
        if (isGroupView && groupId) {
          studentsRes = await axiosInstance.get(
            `/courses/${courseId}/groups/${groupId}/students`,
          );
        } else {
          studentsRes = await axiosInstance.get(
            `/courses/${courseId}/students`,
          );
        }
        const studentsData: Student[] = studentsRes.data.students || [];
        setStudents(studentsData);

        // 2. Fetch grades for the selected date/criteria
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const gradesRes = await axiosInstance.get(
          `/courses/${courseId}/grades`,
          {
            params: {
              date: formattedDate,
              courseCode,
              courseSection,
              criteriaId: activeReport.id,
              groupId: isGroupView ? groupId : undefined,
            },
          },
        );
        const grades: GradingScore[] = gradesRes.data || [];

        // 3. Map grades by studentId
        const gradesMap: Record<string, GradingScore> = {};
        grades.forEach((grade: GradingScore) => {
          gradesMap[grade.studentId] = grade;
        });

        // 4. Initialize scores state for all students, even those without grades
        const newScores: Record<string, GradingScore> = {};
        studentsData.forEach((student: Student) => {
          newScores[student.id] = {
            studentId: student.id,
            scores:
              gradesMap[student.id]?.scores ||
              new Array(rubricDetails.length).fill(0),
            total: gradesMap[student.id]?.total || 0,
          };
        });
        setScores(newScores);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    courseId,
    selectedDate,
    activeReport,
    courseCode,
    courseSection,
    groupId,
    isGroupView,
  ]);

  // Check for existing criteria when date is selected or on mount
  useEffect(() => {
    const checkExistingCriteria = async () => {
      if (!selectedDate) {
        setActiveReport(null);
        setRubricDetails([]);
        setSelectedReport('');
        setShowCriteriaDialog(false);
        return;
      }
      setCriteriaLoading(true);
      setShowCriteriaDialog(true); // Always show dialog to let user select
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        // Fetch all criteria for this course
        const endpoint =
          isGroupView && groupId
            ? `/courses/${courseId}/groups/${groupId}/criteria`
            : `/courses/${courseId}/criteria`;

        const response = await axiosInstance.get(endpoint);
        const allReports = response.data;
        // Filter reports for the selected date
        const filteredReports = allReports.filter((report: GradingReport) => {
          const reportDate = new Date(report.date);
          reportDate.setHours(0, 0, 0, 0);
          const selected = new Date(selectedDate);
          selected.setHours(0, 0, 0, 0);
          return reportDate.getTime() === selected.getTime();
        });
        setSavedReports(filteredReports);
      } catch (error) {
        console.error('Error fetching criteria:', error);
        toast.error('Failed to load saved criteria', {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
          },
        });
      } finally {
        setCriteriaLoading(false);
      }
    };
    checkExistingCriteria();
  }, [selectedDate, courseId, isGroupView, groupId]);

  // Reset scores when date changes
  useEffect(() => {
    setScores({});
  }, [selectedDate]);

  // Fetch saved criteria on mount
  useEffect(() => {
    const fetchCriteria = async () => {
      if (!session?.user?.id) {
        console.error('No user ID found in session');
        return;
      }

      try {
        const response = await axiosInstance.get(
          `/courses/${courseId}/criteria`,
        );
        setSavedReports(response.data);
      } catch (error: any) {
        console.error('Error fetching criteria:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast.error(
          error.response?.data?.error || 'Failed to load saved criteria',
        );
      }
    };

    if (session?.user?.id) {
      fetchCriteria();
    }
  }, [courseId, session?.user?.id]);

  // Update originalScores when scores are first loaded
  useEffect(() => {
    if (
      Object.keys(scores).length > 0 &&
      Object.keys(originalScores).length === 0
    ) {
      // Only set originalScores on initial load
      setOriginalScores(JSON.parse(JSON.stringify(scores)));
    }
  }, [activeReport, selectedDate, scores]);

  // Reset originalScores when changing report or date
  useEffect(() => {
    setOriginalScores({});
  }, [activeReport, selectedDate]);

  // Check if there are any changes
  const hasChanges = () => {
    // If we're still loading or no scores are loaded yet, return false
    if (isLoading || Object.keys(scores).length === 0) return false;

    if (Object.keys(scores).length !== Object.keys(originalScores).length)
      return true;

    return Object.entries(scores).some(([studentId, score]) => {
      const originalScore = originalScores[studentId];
      if (!originalScore) return true;

      // Check if scores array is different
      if (score.scores.length !== originalScore.scores.length) return true;
      if (score.scores.some((s, i) => s !== originalScore.scores[i]))
        return true;

      // Check if total is different
      return score.total !== originalScore.total;
    });
  };

  const handleSaveGrades = async () => {
    if (!session?.user?.id || !selectedDate || !activeReport) {
      toast.error('Missing required information to save grades', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
      return;
    }

    setIsSaving(true);
    const savePromise = new Promise<string>(async (resolve, reject) => {
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];

        // Ensure all students have the correct number of scores
        const gradesToSave = Object.values(scores).map((score) => {
          const correctScores = new Array(activeReport.rubrics.length).fill(0);
          score.scores.forEach((s, i) => {
            if (i < correctScores.length) {
              correctScores[i] = s;
            }
          });

          const total = calculateTotal(correctScores);

          return {
            studentId: score.studentId,
            scores: correctScores,
            total: total,
          };
        });

        const payload = {
          date: formattedDate,
          criteriaId: activeReport.id,
          courseCode,
          courseSection,
          grades: gradesToSave,
        };

        const response = await axiosInstance.post(
          `/courses/${courseId}/grades`,
          payload,
        );

        if (response.data) {
          // Update original scores after successful save
          setOriginalScores(JSON.parse(JSON.stringify(scores)));
          resolve('Grades saved successfully');
        }
      } catch (error: any) {
        console.error('Error saving grades:', {
          error,
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });

        if (error.response?.status === 500) {
          reject(
            'Server error occurred while saving grades. Please try again.',
          );
        } else if (error.response?.data?.message) {
          reject(error.response.data.message);
        } else {
          reject(
            'Failed to save grades. Please check your data and try again.',
          );
        }
      } finally {
        setIsSaving(false);
      }
    });

    toast.promise(savePromise, {
      loading: 'Saving Grades',
      success: (message: string) => 'Grades saved successfully',
      error: (err: string) => err,
    });
  };

  const handleApplyCriteria = async () => {
    if (selectedReport) {
      setIsLoadingStudents(true);
      const selected = savedReports.find((c) => c.id === selectedReport);
      if (selected) {
        setActiveReport(selected);
        setRubricDetails(selected.rubrics);
      }
      setShowCriteriaDialog(false);
      // Add a small delay to ensure smooth transition
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsLoadingStudents(false);
    }
  };

  const handleScoreChange = async (
    studentId: string,
    rubricIndex: number,
    value: number | '',
  ) => {
    // If value is empty (Select Grade), delete the grades
    if (value === '') {
      try {
        setIsLoading(true);
        const formattedDate = selectedDate?.toISOString().split('T')[0];

        // Delete grades for this student
        await axiosInstance.delete(`/courses/${courseId}/grades`, {
          data: {
            date: formattedDate,
            criteriaId: activeReport?.id,
            studentId: studentId,
            courseCode,
            courseSection,
          },
        });

        // Update local state
        setScores((prev) => {
          const newScores = { ...prev };
          delete newScores[studentId];
          return newScores;
        });

        toast.success('Grades deleted successfully');
      } catch (error: any) {
        console.error('Error deleting grades:', error);
        toast.error(error.response?.data?.message || 'Failed to delete grades');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Otherwise, update the grade as normal
    setScores((prev) => {
      const rubricCount = activeReport?.rubrics.length || 0;
      const studentScores =
        prev[studentId]?.scores || new Array(rubricCount).fill(0);
      const newScores = [...studentScores];
      newScores[rubricIndex] = value;

      return {
        ...prev,
        [studentId]: {
          studentId,
          scores: newScores,
          total: calculateTotal(newScores),
        },
      };
    });
  };

  const calculateTotal = (scores: number[]): number => {
    if (!rubricDetails.length) return 0;

    // Calculate the maximum possible score based on the scoring range
    const maxScore = Number(activeReport?.scoringRange) || 5;

    // Ensure we only use scores up to the number of rubrics
    const validScores = scores.slice(0, rubricDetails.length);

    // Calculate weighted percentage for each rubric
    const weightedScores = validScores.map((score, index) => {
      const weight = rubricDetails[index]?.percentage || 0;
      // Convert score to percentage based on max score, then apply weight
      return (score / maxScore) * weight;
    });

    // Sum up all weighted scores and round to 2 decimal places
    return Number(
      weightedScores.reduce((sum, score) => sum + score, 0).toFixed(2),
    );
  };

  const validateReportName = (name: string) => {
    if (!name.trim()) {
      return 'Report name is required';
    }
    if (name.length > 25) {
      return 'Report name must not exceed 25 characters';
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      return 'Report name can only contain letters, numbers, and spaces';
    }
    return '';
  };

  const validateRubricName = (name: string) => {
    if (!name.trim()) {
      return 'Rubric name is required';
    }
    if (name.length > 15) {
      return 'Rubric name must not exceed 15 characters';
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      return 'Rubric name can only contain letters, numbers, and spaces';
    }
    return '';
  };

  const handleReportNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const error = validateReportName(value);
    setValidationErrors((prev) => ({ ...prev, name: error }));

    if (value.length <= 25 && /^[a-zA-Z0-9\s]*$/.test(value)) {
      setNewReport((prev) => ({
        ...prev,
        name: value,
      }));
    }
  };

  const handleRubricCountChange = (value: string) => {
    const count = parseInt(value);

    if (isGroupView) {
      // For group view: Reserve 20% for Participation
      const baseWeight = Math.floor(80 / (count - 1));
      const remainder = 80 % (count - 1);

      // Create array of weights, distributing remainder to first elements
      const weights = Array(count - 1).fill(baseWeight);
      for (let i = 0; i < remainder; i++) {
        weights[i]++;
      }

      const newRubricDetails = [
        ...Array(count - 1)
          .fill(null)
          .map((_, index) => ({
            name: '',
            weight: weights[index],
            isGroupRubric: true, // Mark as group rubric
          })),
        {
          name: 'Participation',
          weight: 20, // Default 20% for Participation
          isGroupRubric: false, // Mark as individual rubric
        },
      ];

      setNewReport((prev) => ({
        ...prev,
        rubrics: value,
        rubricDetails: newRubricDetails,
      }));
    } else {
      // For individual view: Keep original behavior
      const baseWeight = Math.floor(100 / count);
      const remainder = 100 % count;

      // Create array of weights, distributing remainder to first elements
      const weights = Array(count).fill(baseWeight);
      for (let i = 0; i < remainder; i++) {
        weights[i]++;
      }

      const newRubricDetails = Array(count)
        .fill(null)
        .map((_, index) => ({
          name: '',
          weight: weights[index],
          isGroupRubric: false, // All rubrics are individual in non-group view
        }));

      setNewReport((prev) => ({
        ...prev,
        rubrics: value,
        rubricDetails: newRubricDetails,
      }));
    }
  };

  const updateRubricDetail = (
    index: number,
    field: 'name' | 'weight',
    value: string | number,
  ) => {
    // For group view, only allow weight changes for the last rubric
    if (
      isGroupView &&
      index === newReport.rubricDetails.length - 1 &&
      field === 'name'
    ) {
      return;
    }

    setNewReport((prev) => {
      const newDetails = [...prev.rubricDetails];

      if (field === 'weight') {
        // Ensure weight is a valid number between 1 and 100
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 100) {
          return prev;
        }

        // For group view, when changing the last rubric's weight, adjust other weights proportionally
        if (isGroupView && index === newReport.rubricDetails.length - 1) {
          const remainingWeight = 100 - numValue;
          const otherRubrics = newDetails.slice(0, -1);
          const totalOtherWeight = otherRubrics.reduce(
            (sum, r) => sum + r.weight,
            0,
          );

          // Adjust other weights proportionally
          otherRubrics.forEach((rubric, i) => {
            const proportion = rubric.weight / totalOtherWeight;
            newDetails[i].weight = Math.round(remainingWeight * proportion);
          });

          // Add any rounding errors to the first rubric
          const actualTotal = newDetails.reduce((sum, r) => sum + r.weight, 0);
          if (actualTotal !== 100) {
            newDetails[0].weight += 100 - actualTotal;
          }
        }

        newDetails[index] = {
          ...newDetails[index],
          weight: numValue,
        };
      } else {
        // Validate name input
        const nameValue = value as string;
        const error = validateRubricName(nameValue);
        setValidationErrors((prev) => ({
          ...prev,
          rubrics: prev.rubrics
            ? prev.rubrics.map((err, i) => (i === index ? error : err))
            : new Array(newDetails.length).fill(''),
        }));

        if (nameValue.length <= 15 && /^[a-zA-Z0-9\s]*$/.test(nameValue)) {
          newDetails[index] = {
            ...newDetails[index],
            name: nameValue,
          };
        }
      }

      return {
        ...prev,
        rubricDetails: newDetails,
      };
    });
  };

  const handleCreateReport = async () => {
    // Validate report name
    const nameError = validateReportName(newReport.name);
    if (nameError) {
      setValidationErrors((prev) => ({ ...prev, name: nameError }));
      toast.error(nameError, {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
      return;
    }

    // Validate all rubric names
    const rubricErrors = newReport.rubricDetails.map((rubric, idx, arr) => {
      if (isGroupView && idx === arr.length - 1) {
        // Skip validation for Participation rubric in group view
        return '';
      }
      return validateRubricName(rubric.name);
    });
    const hasRubricErrors = rubricErrors.some((error) => error);
    if (hasRubricErrors) {
      setValidationErrors((prev) => ({ ...prev, rubrics: rubricErrors }));
      toast.error('Please fix the rubric name errors', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
      return;
    }

    // Check if total weight equals 100%
    const totalWeight = newReport.rubricDetails.reduce(
      (sum, rubric) => sum + rubric.weight,
      0,
    );
    if (totalWeight !== 100) {
      toast.error('Total weight must equal 100%', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
      return;
    }

    if (!session?.user?.id) {
      console.log('No session user ID');
      return;
    }

    const loadingToast = toast.loading('Creating report...', {
      position: 'top-center',
      duration: Infinity,
      style: {
        background: '#fff',
        color: '#124A69',
        border: '1px solid #e5e7eb',
      },
    });

    try {
      setIsLoading(true);
      // Prepare rubrics as array of { name, percentage, isGroupRubric }
      const rubrics = newReport.rubricDetails.map((r, idx, arr) => ({
        name: isGroupView && idx === arr.length - 1 ? 'Participation' : r.name,
        percentage: r.weight, // Convert weight to percentage
        isGroupRubric: isGroupView ? idx !== arr.length - 1 : false, // Set isGroupRubric based on view mode and position
      }));

      // Choose endpoint and isGroupCriteria flag
      const endpoint =
        isGroupView && groupId
          ? `/courses/${courseId}/groups/${groupId}/criteria`
          : `/courses/${courseId}/criteria`;

      // Ensure date is set to midnight UTC to avoid timezone issues
      const dateToSend = selectedDate ? new Date(selectedDate) : undefined;
      if (dateToSend) {
        dateToSend.setHours(0, 0, 0, 0);
      }

      const response = await axiosInstance.post(endpoint, {
        name: newReport.name,
        rubrics,
        scoringRange: newReport.scoringRange,
        passingScore: newReport.passingScore,
        userId: session.user.id,
        date: dateToSend ? dateToSend.toISOString() : undefined,
        isGroupCriteria: isGroupView,
      });
      const created = response.data;

      // Update the saved reports with the new report at the beginning of the array
      setSavedReports((prev) => [created, ...prev]);

      // Set the active report and rubric details
      setActiveReport(created);
      setRubricDetails(created.rubrics);
      setSelectedReport(created.id);

      // Close the dialog
      setShowCriteriaDialog(false);

      // Reset the form
      setNewReport({
        name: '',
        rubrics: '2',
        scoringRange: '5',
        passingScore: '75',
        rubricDetails: [
          { name: '', weight: 50 },
          { name: '', weight: 50 },
        ],
      });

      // Clear validation errors
      setValidationErrors({});

      toast.dismiss(loadingToast);
      toast.success('Report created successfully', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#124A69',
          border: '1px solid #e5e7eb',
        },
      });
    } catch (error) {
      console.error('Error creating report:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to create report', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new useEffect to fetch reports when dialog opens or date changes
  useEffect(() => {
    const fetchReports = async () => {
      if (selectedDate) {
        try {
          const endpoint =
            isGroupView && groupId
              ? `/courses/${courseId}/groups/${groupId}/criteria`
              : `/courses/${courseId}/criteria`;

          const response = await axiosInstance.get(endpoint);
          const allReports = response.data;
          // Filter reports for the selected date
          const filteredReports = allReports.filter((report: GradingReport) => {
            const reportDate = new Date(report.date);
            reportDate.setHours(0, 0, 0, 0);

            const selected = new Date(selectedDate);
            selected.setHours(0, 0, 0, 0);

            return reportDate.getTime() === selected.getTime();
          });
          setSavedReports(filteredReports);
        } catch (error) {
          console.error('Error fetching reports:', error);
          toast.error('Failed to load saved reports', {
            duration: 3000,
            style: {
              background: '#fff',
              color: '#dc2626',
              border: '1px solid #e5e7eb',
            },
          });
        }
      }
    };

    fetchReports();
  }, [selectedDate, courseId, isGroupView, groupId]);

  const prepareExportData = () => {
    if (!activeReport || !selectedDate) return null;

    const formattedDate = selectedDate.toISOString().split('T')[0];

    // Create header rows
    const header = [
      [`${courseCode} - ${courseSection} GRADING REPORT`],
      [''],
      ['Date:', formattedDate],
      ['Grading Report:', activeReport.name],
      [''],
      // Column headers
      [
        'Student Name',
        ...rubricDetails.map((r) => `${r.name} (${r.percentage}%)`),
        'Total Grade',
        'Remarks',
      ],
    ];

    // Create student data rows
    const studentRows = students.map((student) => {
      const studentScore = scores[student.id] || {
        studentId: student.id,
        scores: new Array(rubricDetails.length).fill(0),
        total: 0,
      };

      return [
        `${student.lastName}, ${student.firstName}${
          student.middleInitial ? ` ${student.middleInitial}.` : ''
        }`,
        ...studentScore.scores.map((score) =>
          score ? score.toString() : '---',
        ),
        `${studentScore.total.toFixed(0)}%`,
        studentScore.scores.some((score) => score === 0)
          ? '---'
          : studentScore.total >= Number(activeReport.passingScore)
          ? 'PASSED'
          : 'FAILED',
      ];
    });

    return { header, studentRows };
  };

  const handleExport = () => {
    if (!activeReport || !selectedDate) {
      toast.error('Please select a date and grading report first', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
      return;
    }

    const data = prepareExportData();
    if (!data) return;

    setExportData(data);
    setShowExportPreview(true);
  };

  const handleConfirmExport = () => {
    if (!exportData) return;

    try {
      const { header, studentRows } = exportData;
      const ws = XLSX.utils.aoa_to_sheet([...header, ...studentRows]);

      // Configure column widths
      ws['!cols'] = [
        { wch: 30 }, // Student Name
        ...rubricDetails.map(() => ({ wch: 15 })), // Rubric scores
        { wch: 15 }, // Total Grade
        { wch: 15 }, // Remarks
      ];

      // Style configurations
      const headerStyle = {
        fill: { fgColor: { rgb: '124A69' } }, // Dark blue background
        font: { color: { rgb: 'FFFFFF' }, bold: true }, // White bold text
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };

      const subHeaderStyle = {
        fill: { fgColor: { rgb: 'F5F6FA' } }, // Light gray background
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };

      const cellStyle = {
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };

      // Apply styles to cells
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

      // Style the title row
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellRef]) ws[cellRef] = { v: '' };
        ws[cellRef].s = headerStyle;
      }

      // Style the subheader row (column headers)
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: 5, c: C });
        if (!ws[cellRef]) ws[cellRef] = { v: '' };
        ws[cellRef].s = subHeaderStyle;
      }

      // Style all other cells
      for (let R = 6; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) ws[cellRef] = { v: '' };

          // Special styling for remarks column
          if (C === range.e.c) {
            const value = ws[cellRef].v;
            if (value === 'PASSED') {
              ws[cellRef].s = {
                ...cellStyle,
                font: { color: { rgb: '008000' }, bold: true }, // Green for PASSED
              };
            } else if (value === 'FAILED') {
              ws[cellRef].s = {
                ...cellStyle,
                font: { color: { rgb: 'FF0000' }, bold: true }, // Red for FAILED
              };
            } else {
              ws[cellRef].s = cellStyle;
            }
          } else {
            ws[cellRef].s = cellStyle;
          }
        }
      }

      // Merge cells for title and info rows
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }, // Title row
        { s: { r: 1, c: 0 }, e: { r: 1, c: range.e.c } }, // Empty row
        { s: { r: 2, c: 1 }, e: { r: 2, c: range.e.c } }, // Date row
        { s: { r: 3, c: 1 }, e: { r: 3, c: range.e.c } }, // Report name row
        { s: { r: 4, c: 0 }, e: { r: 4, c: range.e.c } }, // Empty row
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Grades');

      // Generate filename with date
      const formattedDate = selectedDate?.toISOString().split('T')[0];
      const filename = `${courseCode}-${courseSection}-${formattedDate}-grades.xlsx`;
      XLSX.writeFile(wb, filename);

      setShowExportPreview(false);
      toast.success('Grades exported successfully', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#124A69',
          border: '1px solid #e5e7eb',
        },
      });
    } catch (error) {
      console.error('Error exporting grades:', error);
      toast.error('Failed to export grades', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
    }
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
    const total = studentScore?.total || 0;
    const hasGrades = studentScore?.scores.some((score) => score > 0) || false;

    if (
      gradeFilter.passed &&
      hasGrades &&
      total >= Number(activeReport?.passingScore)
    )
      return true;
    if (
      gradeFilter.failed &&
      hasGrades &&
      total < Number(activeReport?.passingScore)
    )
      return true;
    if (gradeFilter.noGrades && !hasGrades) return true;
    return false;
  };

  const handleResetGrades = () => {
    if (hasChanges()) {
      toast.error('Cannot reset grades while there are unsaved changes', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
        },
      });
      setShowResetDialog(false);
      return;
    }

    // Store current scores before resetting
    const currentScores = { ...scores };
    setPreviousScores(currentScores);
    setScores({});
    setShowResetDialog(false);

    toast.success(
      (t) => (
        <div className='flex items-center gap-2'>
          <span>Grades reset successfully</span>
          <button
            onClick={() => {
              // Restore the scores from before the reset
              setScores(currentScores);
              toast.dismiss(t.id);
              toast.success('Grades restored', {
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#124A69',
                  border: '1px solid #e5e7eb',
                },
              });
            }}
            className='px-3 py-1 bg-[#124A69] text-white rounded hover:bg-[#0d3a56] transition-colors text-sm'
          >
            Undo
          </button>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#fff',
          color: '#124A69',
          border: '1px solid #e5e7eb',
        },
      },
    );
  };

  const getPaginatedStudents = (students: Student[]) => {
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

  // Add useEffect to update pagination state
  useEffect(() => {
    const filteredStudents = students.filter((student) => {
      const name = `${student.lastName || ''} ${student.firstName || ''} ${
        student.middleInitial || ''
      }`.toLowerCase();
      const nameMatch = name.includes(searchQuery.toLowerCase());
      return nameMatch && studentMatchesFilter(student);
    });

    setTotalPages(Math.ceil(filteredStudents.length / studentsPerPage));
    setTotalStudents(filteredStudents.length);
  }, [students, searchQuery, gradeFilter, studentsPerPage]);

  // Add helper to get index of Participation rubric in group view
  const participationIndex = isGroupView
    ? newReport.rubricDetails.length - 1
    : -1;

  const GroupViewTable = ({
    students,
    scores,
    rubricDetails,
    activeReport,
    handleScoreChange,
  }: {
    students: Student[];
    scores: Record<string, GradingScore>;
    rubricDetails: RubricDetail[];
    activeReport: GradingReport | null;
    handleScoreChange: (
      studentId: string,
      rubricIndex: number,
      value: number | '',
    ) => void;
  }) => {
    const { paginatedStudents } = getPaginatedStudents(students);

    if (paginatedStudents.length === 0) {
      return (
        <tr>
          <td
            colSpan={rubricDetails.length + 3}
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
        scores: new Array(rubricDetails.length).fill(0),
        total: 0,
      };
      return (
        <tr
          key={student.id}
          className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6FA]'}
        >
          <td className='sticky left-0 z-10 bg-white px-4 py-2 align-middle w-[300px]'>
            <div className='flex items-center gap-3'>
              <img
                src={student.image}
                alt=''
                className='w-8 h-8 rounded-full object-cover'
              />
              <span>{`${student.lastName}, ${student.firstName}${
                student.middleInitial ? ` ${student.middleInitial}.` : ''
              }`}</span>
            </div>
          </td>
          {rubricDetails.map((rubric, rubricIdx) => {
            // If this is not the last rubric (should be merged)
            if (rubricIdx !== rubricDetails.length - 1) {
              // Only render for the first student row
              if (idx === 0) {
                // Find how many rubrics to merge (all except last)
                const mergeCount = rubricDetails.length - 1;
                // Only render the merged cell for the first rubric
                if (rubricIdx === 0) {
                  // Get the value from the first student
                  const groupValue =
                    students.length > 0 &&
                    scores[students[0].id]?.scores[rubricIdx] !== undefined
                      ? scores[students[0].id].scores[rubricIdx]
                      : '';
                  let cellBg = '';
                  if (groupValue) {
                    if (groupValue <= 3) {
                      cellBg = 'bg-red-50';
                    } else {
                      cellBg = 'bg-green-50';
                    }
                  }
                  return (
                    <td
                      key={'group-rubric-merged'}
                      rowSpan={paginatedStudents.length}
                      colSpan={mergeCount}
                      className={`text-center px-4 py-2 align-middle w-[${
                        120 * mergeCount
                      }px] ${cellBg}`}
                    >
                      <div className='flex flex-col items-center gap-2'>
                        <select
                          className='w-full border rounded px-2 py-1'
                          value={groupValue}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setScores((prev) => {
                              const updated = { ...prev };
                              students.forEach((student) => {
                                const studentScores =
                                  updated[student.id]?.scores ||
                                  new Array(rubricDetails.length).fill(0);
                                // Set all merged rubric scores
                                rubricDetails.forEach((r, i) => {
                                  if (i !== rubricDetails.length - 1) {
                                    studentScores[i] = value;
                                  }
                                });
                                updated[student.id] = {
                                  ...updated[student.id],
                                  scores: studentScores,
                                  total: calculateTotal(studentScores),
                                };
                              });
                              return updated;
                            });
                          }}
                        >
                          <option value=''>Select grade</option>
                          {Array.from(
                            { length: Number(activeReport?.scoringRange) || 5 },
                            (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    </td>
                  );
                } else {
                  // Don't render for other group rubric columns
                  return null;
                }
              } else {
                // Don't render for other student rows
                return null;
              }
            } else {
              // Individual rubric (Participation)
              const value = studentScore.scores[rubricIdx] || '';
              let cellBg = '';
              if (value) {
                if (value <= 3) {
                  cellBg = 'bg-red-50';
                } else {
                  cellBg = 'bg-green-50';
                }
              }
              return (
                <td
                  key={rubricIdx}
                  className={`text-center px-4 py-2 align-middle w-[120px] ${cellBg}`}
                >
                  <select
                    className='w-full border rounded px-2 py-1'
                    value={value}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      handleScoreChange(student.id, rubricIdx, v);
                    }}
                  >
                    <option value=''>Select grade</option>
                    {Array.from(
                      { length: Number(activeReport?.scoringRange) || 5 },
                      (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ),
                    )}
                  </select>
                </td>
              );
            }
          })}
          <td className='text-center px-4 py-2 align-middle font-bold w-[100px]'>
            {studentScore.total ? `${studentScore.total.toFixed(0)}%` : '--'}
          </td>
          <td className='text-center px-4 py-2 align-middle w-[100px]'>
            {studentScore.scores.some((score) => score === 0) ? (
              <span className='px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600'>
                ---
              </span>
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  studentScore.total >= Number(activeReport?.passingScore)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {studentScore.total >= Number(activeReport?.passingScore)
                  ? 'PASSED'
                  : 'FAILED'}
              </span>
            )}
          </td>
        </tr>
      );
    });
  };

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
        {/* x */}
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
              <div className='relative w-64'>
                <svg
                  className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <circle cx='11' cy='11' r='8' />
                  <path d='m21 21-4.3-4.3' />
                </svg>
                <Input
                  placeholder='Search a name'
                  className='w-full pl-9 rounded-full border-gray-200 h-9 bg-[#F5F6FA]'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[200px] justify-start text-left font-normal h-9',
                      !selectedDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {selectedDate ? (
                      format(selectedDate, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='end'>
                  <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={onDateSelect}
                    initialFocus
                    disabled={(date) => date > new Date()}
                    defaultMonth={new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Button
                onClick={handleExport}
                className='ml-2 h-9 px-4 bg-[#124A69] text-white rounded shadow flex items-center gap-2'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 5v14m7-7H5' />
                </svg>
                Export to Excel
              </Button>
            </div>
          </div>
        </div>
        <Dialog open={showCriteriaDialog} onOpenChange={handleDialogClose}>
          <DialogContent className='sm:max-w-[450px]'>
            <DialogHeader>
              <DialogTitle className='text-[#124A69] text-2xl font-bold'>
                Grading Report
              </DialogTitle>
              <DialogDescription className='text-gray-500'>
                Select existing report or create new ones
              </DialogDescription>
            </DialogHeader>
            {criteriaLoading ? (
              <div className='flex justify-center items-center py-8'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : (
              <Tabs defaultValue='existing' className='w-full'>
                <TabsList className='grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg'>
                  <TabsTrigger
                    value='existing'
                    className='data-[state=active]:bg-white data-[state=active]:shadow-sm'
                  >
                    Use Existing
                  </TabsTrigger>
                  <TabsTrigger
                    value='new'
                    className='data-[state=active]:bg-white data-[state=active]:shadow-sm'
                  >
                    Create New
                  </TabsTrigger>
                </TabsList>
                <TabsContent value='existing'>
                  <div className='space-y-4 py-4'>
                    {savedReports.filter((report) => {
                      if (!selectedDate) return false;

                      // Convert both dates to local midnight for accurate comparison
                      const reportDate = new Date(report.date);
                      reportDate.setHours(0, 0, 0, 0);

                      const selected = new Date(selectedDate);
                      selected.setHours(0, 0, 0, 0);

                      return reportDate.getTime() === selected.getTime();
                    }).length > 0 ? (
                      <div className='flex flex-col items-center'>
                        <Select
                          value={selectedReport}
                          onValueChange={setSelectedReport}
                        >
                          <SelectTrigger className='bg-gray-50 border-gray-200 w-full max-w-[400px]'>
                            <SelectValue placeholder='Select saved report' />
                          </SelectTrigger>
                          <SelectContent>
                            {savedReports
                              .filter((report) => {
                                if (!selectedDate) return false;

                                // Convert both dates to local midnight for accurate comparison
                                const reportDate = new Date(report.date);
                                reportDate.setHours(0, 0, 0, 0);

                                const selected = new Date(selectedDate);
                                selected.setHours(0, 0, 0, 0);

                                return (
                                  reportDate.getTime() === selected.getTime()
                                );
                              })
                              .map((report) => {
                                // Count students without grades for this report
                                const ungradedCount = students.filter(
                                  (student) => {
                                    const studentScore = scores[student.id];
                                    // Check if student has no scores or if any of their scores are 0
                                    return (
                                      !studentScore ||
                                      studentScore.scores.length === 0 ||
                                      studentScore.scores.every(
                                        (score) => score === 0,
                                      )
                                    );
                                  },
                                ).length;

                                return (
                                  <SelectItem key={report.id} value={report.id}>
                                    {report.name}
                                    <span className='text-sm text-gray-500 ml-2'>
                                      ({ungradedCount} students ungraded)
                                    </span>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        {selectedReport && (
                          <div className='text-sm text-gray-500 mt-2'>
                            Created by:{' '}
                            {savedReports.find((c) => c.id === selectedReport)
                              ?.user?.name || 'Unknown'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500 text-center py-4'>
                        No saved reports found for this date.
                        <br />
                        Create new ones in the other tab.
                      </p>
                    )}
                    <DialogFooter className='gap-2 sm:gap-2'>
                      <Button
                        variant='outline'
                        onClick={handleDialogClose}
                        className='border-gray-200'
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleApplyCriteria}
                        disabled={!selectedReport}
                        className='bg-[#124A69] hover:bg-[#0d3a56]'
                      >
                        Apply Selected Report
                      </Button>
                    </DialogFooter>
                  </div>
                </TabsContent>
                <TabsContent value='new'>
                  <div className='space-y-4 py-4'>
                    <div className='grid gap-4'>
                      <div className='grid gap-2'>
                        <label
                          htmlFor='name'
                          className='text-sm font-medium text-gray-700'
                        >
                          Report Name
                        </label>
                        <Input
                          id='name'
                          value={newReport.name}
                          onChange={handleReportNameChange}
                          placeholder='e.g., Midterm Exam'
                          maxLength={25}
                          className={`bg-gray-50 border-gray-200 ${
                            validationErrors.name ? 'border-red-500' : ''
                          }`}
                        />
                        <div className='flex justify-between mt-1'>
                          {validationErrors.name && (
                            <p className='text-sm text-red-500'>
                              {validationErrors.name}
                            </p>
                          )}
                          <p className='text-xs text-gray-500 -mt-2 ml-auto'>
                            {newReport.name.length}/25
                          </p>
                        </div>
                      </div>
                      <div className='grid gap-2'>
                        <label
                          htmlFor='rubrics'
                          className='text-sm font-medium text-gray-700'
                        >
                          Number of Rubrics
                        </label>
                        <Select
                          value={newReport.rubrics}
                          onValueChange={handleRubricCountChange}
                        >
                          <SelectTrigger className='bg-gray-50 border-gray-200'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='2'>2 Rubrics</SelectItem>
                            <SelectItem value='3'>3 Rubrics</SelectItem>
                            <SelectItem value='4'>4 Rubrics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div className='grid gap-2'>
                          <label
                            htmlFor='scoringRange'
                            className='text-sm font-medium text-gray-700'
                          >
                            Scoring Range
                          </label>
                          <Select
                            value={newReport.scoringRange}
                            onValueChange={(value) =>
                              setNewReport((prev) => ({
                                ...prev,
                                scoringRange: value,
                              }))
                            }
                          >
                            <SelectTrigger className='bg-gray-50 border-gray-200'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='5'>1-5</SelectItem>
                              <SelectItem value='10'>1-10</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='grid gap-2'>
                          <label
                            htmlFor='passingScore'
                            className='text-sm font-medium text-gray-700'
                          >
                            Passing Score (%)
                          </label>
                          <Select
                            value={newReport.passingScore}
                            onValueChange={(value) =>
                              setNewReport((prev) => ({
                                ...prev,
                                passingScore: value,
                              }))
                            }
                          >
                            <SelectTrigger className='bg-gray-50 border-gray-200'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='60'>60%</SelectItem>
                              <SelectItem value='65'>65%</SelectItem>
                              <SelectItem value='70'>70%</SelectItem>
                              <SelectItem value='75'>75%</SelectItem>
                              <SelectItem value='80'>80%</SelectItem>
                              <SelectItem value='85'>85%</SelectItem>
                              <SelectItem value='90'>90%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className='grid gap-4 mt-2'>
                        <label className='text-sm font-medium text-gray-700'>
                          Rubric Details
                        </label>
                        <div className='space-y-4 max-h-[200px] overflow-y-auto pr-2'>
                          {newReport.rubricDetails.map((rubric, index) => (
                            <div
                              key={index}
                              className='flex items-center gap-2'
                            >
                              <div className='relative w-[400px]'>
                                <Input
                                  value={
                                    isGroupView &&
                                    index === newReport.rubricDetails.length - 1
                                      ? 'Participation'
                                      : rubric.name
                                  }
                                  onChange={(e) =>
                                    updateRubricDetail(
                                      index,
                                      'name',
                                      e.target.value,
                                    )
                                  }
                                  placeholder={`Rubric ${index + 1} name`}
                                  className={`bg-gray-50 border-gray-200 ${
                                    validationErrors.rubrics?.[index]
                                      ? 'border-red-500'
                                      : ''
                                  } ${
                                    isGroupView &&
                                    index === newReport.rubricDetails.length - 1
                                      ? 'bg-gray-100 cursor-not-allowed'
                                      : ''
                                  }`}
                                  disabled={
                                    isGroupView &&
                                    index === newReport.rubricDetails.length - 1
                                  }
                                />
                                {validationErrors.rubrics?.[index] && (
                                  <p className='text-sm text-red-500'>
                                    {validationErrors.rubrics[index]}
                                  </p>
                                )}
                                <p className='text-xs text-gray-500 -mt-1 ml-auto'>
                                  {rubric.name.length}/15
                                </p>
                              </div>
                              <div className='relative w-[200px] -mt-4'>
                                <div className='flex items-center gap-2'>
                                  <Slider
                                    value={[rubric.weight]}
                                    onValueChange={(value: number[]) =>
                                      updateRubricDetail(
                                        index,
                                        'weight',
                                        value[0],
                                      )
                                    }
                                    max={100}
                                    step={1}
                                    className='w-[100px]'
                                  />
                                  <Input
                                    value={rubric.weight}
                                    onChange={(e) =>
                                      updateRubricDetail(
                                        index,
                                        'weight',
                                        parseInt(e.target.value),
                                      )
                                    }
                                    type='number'
                                    min={0}
                                    max={100}
                                    className='w-[60px] bg-gray-50 border-gray-200'
                                  />
                                  <span className='text-sm text-gray-500'>
                                    %
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className='flex justify-end mt-2'>
                          <p className='text-sm font-medium'>
                            Total Weight:{' '}
                            <span
                              className={
                                newReport.rubricDetails.reduce(
                                  (sum, r) => sum + r.weight,
                                  0,
                                ) === 100
                                  ? 'text-green-600'
                                  : 'text-red-500'
                              }
                            >
                              {newReport.rubricDetails.reduce(
                                (sum, r) => sum + r.weight,
                                0,
                              )}
                              %
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className='gap-2 sm:gap-2'>
                      <Button
                        variant='outline'
                        onClick={handleDialogClose}
                        className='border-gray-200'
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateReport}
                        disabled={!newReport.name || !newReport.rubrics}
                        className='bg-[#124A69] hover:bg-[#0d3a56]'
                      >
                        Create New Report
                      </Button>
                    </DialogFooter>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {!showCriteriaDialog && activeReport && (
          <div className='space-y-4 p-0 rounded-lg shadow-md'>
            {/* Grading Table */}
            <div className='overflow-x-auto max-h-[calc(100vh-300px)]'>
              <table className='w-full border-separate border-spacing-0 table-fixed'>
                <GradingTableHeader rubricDetails={rubricDetails} />
                {isGroupView ? (
                  <tbody>
                    {isLoadingStudents ? (
                      <tr>
                        <td
                          colSpan={rubricDetails.length + 3}
                          className='text-center py-8'
                        >
                          <div className='flex flex-col items-center gap-2'>
                            <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
                            <p className='text-gray-500'>Loading students...</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <GroupViewTable
                        students={students}
                        scores={scores}
                        rubricDetails={rubricDetails}
                        activeReport={activeReport}
                        handleScoreChange={handleScoreChange}
                      />
                    )}
                  </tbody>
                ) : (
                  <tbody>
                    {isLoadingStudents ? (
                      <tr>
                        <td
                          colSpan={rubricDetails.length + 3}
                          className='text-center py-8'
                        >
                          <div className='flex flex-col items-center gap-2'>
                            <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
                            <p className='text-gray-500'>Loading students...</p>
                          </div>
                        </td>
                      </tr>
                    ) : isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr
                          key={idx}
                          className={
                            idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6FA]'
                          }
                        >
                          <td className='sticky left-0 z-10 bg-white px-4 py-2 align-middle w-[300px]'>
                            <div className='flex items-center gap-3'>
                              <div className='w-8 h-8 rounded-full bg-gray-200 animate-pulse' />
                              <div className='h-4 w-32 bg-gray-200 rounded animate-pulse' />
                            </div>
                          </td>
                          {rubricDetails.map((_, rubricIdx) => (
                            <td
                              key={rubricIdx}
                              className='text-center px-4 py-2 align-middle w-[120px]'
                            >
                              <div className='h-8 w-full bg-gray-200 rounded animate-pulse' />
                            </td>
                          ))}
                          <td className='text-center px-4 py-2 align-middle w-[100px]'>
                            <div className='h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto' />
                          </td>
                          <td className='text-center px-4 py-2 align-middle w-[100px]'>
                            <div className='h-6 w-20 bg-gray-200 rounded-full animate-pulse mx-auto' />
                          </td>
                        </tr>
                      ))
                    ) : (
                      (() => {
                        const { paginatedStudents, totalPages, totalStudents } =
                          getPaginatedStudents(students);

                        if (paginatedStudents.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan={rubricDetails.length + 3}
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
                            scores: new Array(rubricDetails.length).fill(0),
                            total: 0,
                          };
                          return (
                            <GradingTableRow
                              key={student.id}
                              student={student}
                              rubricDetails={rubricDetails}
                              activeReport={activeReport}
                              studentScore={studentScore}
                              handleScoreChange={handleScoreChange}
                              idx={idx}
                            />
                          );
                        });
                      })()
                    )}
                  </tbody>
                )}
              </table>
            </div>
            {/* Footer Bar */}
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-white'>
              <div className='flex flex-col sm:flex-row items-center gap-4 w-full'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm text-gray-500 whitespace-nowrap'>
                    {totalStudents > 0 ? (
                      <>
                        {currentPage * studentsPerPage - (studentsPerPage - 1)}-
                        {Math.min(currentPage * studentsPerPage, totalStudents)}{' '}
                        of {totalStudents} students
                      </>
                    ) : (
                      'No students found'
                    )}
                  </p>
                </div>
                <div className='flex-1 flex justify-end'>
                  <Pagination className='w-full flex justify-end'>
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
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
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
          </div>
        )}
        {!showCriteriaDialog && !activeReport && (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            {criteriaLoading ? (
              <div className='flex flex-col items-center gap-4'>
                <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
                <p className='text-gray-500'>Loading grading criteria...</p>
              </div>
            ) : (
              <>
                <div className='text-2xl font-semibold text-[#124A69] mb-2'>
                  No Report Selected
                </div>
                <p className='text-gray-500'>
                  Please select a date and create or choose a grading report to
                  begin.
                </p>
              </>
            )}
          </div>
        )}
        <div className='flex justify-end mt-3 gap-2'>
          <Button
            variant='outline'
            onClick={() => setShowResetDialog(true)}
            className='h-9 px-4 border-gray-200 text-gray-600 hover:bg-gray-50'
          >
            Reset
          </Button>
          <Button
            onClick={handleSaveGrades}
            disabled={isLoading || !hasChanges() || isSaving}
            className='h-9 px-4 bg-[#124A69] text-white hover:bg-[#0d3a56] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden'
          >
            {isSaving ? (
              <>
                <span className='absolute inset-0 flex items-center justify-center bg-[#124A69]'>
                  <Loader2 className='h-4 w-4 animate-spin text-white' />
                </span>
                <span className='opacity-0'>Save Grades</span>
              </>
            ) : (
              'Save Grades'
            )}
          </Button>
        </div>
      </div>

      <div className='max-w-6xl mx-auto'>
        {/* Reset Confirmation Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
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
            <DialogFooter className='gap-2 sm:gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowResetDialog(false)}
                className='border-gray-200'
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetGrades}
                className='bg-[#124A69] hover:bg-[#0d3a56] text-white'
              >
                Reset Grades
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Preview Dialog */}
        <ExportReporting
          showExportPreview={showExportPreview}
          setShowExportPreview={setShowExportPreview}
          exportData={exportData}
          selectedDate={selectedDate}
          courseCode={courseCode}
          courseSection={courseSection}
          rubricDetails={rubricDetails}
        />
      </div>
    </div>
  );
}
