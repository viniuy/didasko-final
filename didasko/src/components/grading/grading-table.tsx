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
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import GradingTableHeader from './grading-table-header';
import GradingTableRow from './grading-table-row';
import * as XLSX from 'xlsx';

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
}

interface RubricDetail {
  name: string;
  percentage: number;
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
  const [gradeFilter, setGradeFilter] = useState<
    'all' | 'passed' | 'failed' | 'no-grades'
  >('all');
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    rubrics?: string[];
  }>({});

  // Function to handle dialog close
  const handleDialogClose = () => {
    setShowCriteriaDialog(false);
  };

  // Fetch grades when both date and criteria are available
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !selectedDate || !activeReport) return;
      setIsLoading(true);
      try {
        // 1. Fetch students
        const studentsRes = await axiosInstance.get(
          `/courses/${courseId}/students`,
        );
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
        console.error('Error fetching students or grades:', error);
        // Don't clear students on error, only clear scores
        setScores({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // Only run when courseId, selectedDate, activeReport, or rubricDetails change
  }, [
    courseId,
    selectedDate,
    activeReport,
    rubricDetails,
    courseCode,
    courseSection,
  ]);

  // Check for existing criteria when date is selected or on mount
  useEffect(() => {
    const checkExistingCriteria = async () => {
      if (!selectedDate) return;
      setCriteriaLoading(true);
      setShowCriteriaDialog(false);
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        // Fetch all criteria for this course
        const response = await axiosInstance.get(
          `/courses/${courseId}/criteria`,
        );
        const allReports = response.data;
        // Find a criteria for this date
        const found = allReports.find((c: any) => {
          // If your criteria has a date field, compare it here
          // If not, you may need to fetch grades for this date and get the criteriaId from there
          return c.date === formattedDate;
        });
        if (found) {
          setActiveReport(found);
          setRubricDetails(found.rubrics);
          setSelectedReport(found.id);
          setShowCriteriaDialog(false);
        } else {
          setActiveReport(null);
          setRubricDetails([]);
          setSelectedReport('');
          setShowCriteriaDialog(true);
        }
      } catch (error) {
        setActiveReport(null);
        setRubricDetails([]);
        setSelectedReport('');
        setShowCriteriaDialog(true);
      } finally {
        setCriteriaLoading(false);
      }
    };
    checkExistingCriteria();
  }, [selectedDate, courseId]);

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

  const handleSaveGrades = async () => {
    if (!session?.user?.id || !selectedDate || !activeReport) {
      toast.error('Missing required information to save grades');
      return;
    }

    try {
      setIsLoading(true);
      const formattedDate = selectedDate.toISOString().split('T')[0];

      const response = await axiosInstance.post(`/courses/${courseId}/grades`, {
        date: formattedDate,
        criteriaId: activeReport.id,
        courseCode,
        courseSection,
        grades: Object.values(scores).map((score) => ({
          studentId: score.studentId,
          scores: score.scores,
          total: score.total,
        })),
      });

      if (response.data) {
        toast.success('Grades saved successfully');
        // Optionally refresh the data
        // await fetchData();
      }
    } catch (error: any) {
      console.error('Error saving grades:', error);
      toast.error(error.response?.data?.message || 'Failed to save grades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCriteria = () => {
    if (selectedReport) {
      const selected = savedReports.find((c) => c.id === selectedReport);
      if (selected) {
        setActiveReport(selected);
        setRubricDetails(selected.rubrics);
      }
    }
    setShowCriteriaDialog(false);
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
      const rubricCount = activeReport?.rubrics || 0;
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

    // Calculate weighted percentage for each rubric
    const weightedScores = scores.map((score, index) => {
      const weight = rubricDetails[index]?.percentage || 0;
      // Convert score to percentage based on max score, then apply weight
      return (score / maxScore) * weight;
    });

    // Sum up all weighted scores
    return weightedScores.reduce((sum, score) => sum + score, 0);
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
    const defaultWeight = Math.floor(100 / count);
    const newRubricDetails = Array(count)
      .fill(null)
      .map(() => ({
        name: '',
        weight: defaultWeight,
      }));
    setNewReport((prev) => ({
      ...prev,
      rubrics: value,
      rubricDetails: newRubricDetails,
    }));
  };

  const updateRubricDetail = (
    index: number,
    field: 'name' | 'weight',
    value: string | number,
  ) => {
    setNewReport((prev) => {
      const newDetails = [...prev.rubricDetails];

      if (field === 'weight') {
        // Ensure weight is a valid number between 1 and 100
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 100) {
          return prev;
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
      toast.error(nameError);
      return;
    }

    // Validate all rubric names
    const rubricErrors = newReport.rubricDetails.map((rubric) =>
      validateRubricName(rubric.name),
    );
    const hasRubricErrors = rubricErrors.some((error) => error);
    if (hasRubricErrors) {
      setValidationErrors((prev) => ({ ...prev, rubrics: rubricErrors }));
      toast.error('Please fix the rubric name errors');
      return;
    }

    // Check if total weight equals 100%
    const totalWeight = newReport.rubricDetails.reduce(
      (sum, rubric) => sum + rubric.weight,
      0,
    );
    if (totalWeight !== 100) {
      toast.error('Total weight must equal 100%');
      return;
    }

    if (!session?.user?.id) {
      console.log('No session user ID');
      return;
    }

    try {
      setIsLoading(true);
      // Prepare rubrics as array of { name, percentage }
      const rubrics = newReport.rubricDetails.map((r) => ({
        name: r.name,
        percentage: r.weight, // Convert weight to percentage
      }));

      // Create criteria with rubrics in a single step
      const response = await axiosInstance.post(
        `/courses/${courseId}/criteria`,
        {
          name: newReport.name,
          rubrics,
          scoringRange: newReport.scoringRange,
          passingScore: newReport.passingScore,
          userId: session.user.id,
          date: selectedDate ? selectedDate.toISOString() : undefined,
        },
      );
      const created = response.data;

      // Update the saved reports
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

      toast.success('Report created successfully');
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!activeReport || !selectedDate) {
      toast.error('Please select a date and grading report first');
      return;
    }

    try {
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
          ...studentScore.scores.map((score) => score || '---'),
          `${studentScore.total.toFixed(0)}%`,
          studentScore.scores.some((score) => score === 0)
            ? '---'
            : studentScore.total >= Number(activeReport.passingScore)
            ? 'PASSED'
            : 'FAILED',
        ];
      });

      // Combine header and data
      const ws = XLSX.utils.aoa_to_sheet([...header, ...studentRows]);

      // Configure column widths
      ws['!cols'] = [
        { wch: 30 }, // Student Name
        ...rubricDetails.map(() => ({ wch: 15 })), // Rubric scores
        { wch: 15 }, // Total Grade
        { wch: 15 }, // Remarks
      ];

      // Merge cells for title
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: rubricDetails.length + 3 } }, // Merge first row across all columns
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Grades');

      // Generate filename with date
      const filename = `${courseCode}-${courseSection}-${formattedDate}-grades.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success('Grades exported successfully');
    } catch (error) {
      console.error('Error exporting grades:', error);
      toast.error('Failed to export grades');
    }
  };

  return (
    <div className='min-h-screen w-full  p-0'>
      <div className='max-w-6xl mx-auto'>
        {/* x */}
        <div className='bg-white rounded-lg shadow-md'>
          {/* Card Header */}
          <div className='flex items-center gap-2 px-4 py-3 border-b'>
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
              <Select
                value={gradeFilter}
                onValueChange={(
                  value: 'all' | 'passed' | 'failed' | 'no-grades',
                ) => setGradeFilter(value)}
              >
                <SelectTrigger className='w-[140px] h-9 rounded-full border-gray-200 bg-[#F5F6FA]'>
                  <SelectValue placeholder='Filter by grade' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Students</SelectItem>
                  <SelectItem value='passed'>Passed</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                  <SelectItem value='no-grades'>No Grades</SelectItem>
                </SelectContent>
              </Select>
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
                        const reportDate = new Date(report.date)
                          .toISOString()
                          .split('T')[0];
                        const selected = selectedDate
                          .toISOString()
                          .split('T')[0];
                        return reportDate === selected;
                      }).length > 0 ? (
                        <>
                          <Select
                            value={selectedReport}
                            onValueChange={setSelectedReport}
                          >
                            <SelectTrigger className='bg-gray-50 border-gray-200'>
                              <SelectValue placeholder='Select saved report' />
                            </SelectTrigger>
                            <SelectContent>
                              {savedReports
                                .filter((report) => {
                                  if (!selectedDate) return false;
                                  const reportDate = new Date(report.date)
                                    .toISOString()
                                    .split('T')[0];
                                  const selected = selectedDate
                                    .toISOString()
                                    .split('T')[0];
                                  return reportDate === selected;
                                })
                                .map((report) => (
                                  <SelectItem key={report.id} value={report.id}>
                                    {report.name}
                                    <span className='text-sm text-gray-500 ml-2'>
                                      (by {report.user?.name || 'Unknown'})
                                    </span>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {selectedReport && (
                            <div className='text-sm text-gray-500'>
                              Created by:{' '}
                              {savedReports.find((c) => c.id === selectedReport)
                                ?.user?.name || 'Unknown'}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className='text-sm text-gray-500 text-center py-4'>
                          No saved reports found. Create new ones in the other
                          tab.
                        </p>
                      )}
                      <DialogFooter className='gap-2 sm:gap-0'>
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
                                <SelectItem value='75'>75%</SelectItem>
                                <SelectItem value='80'>80%</SelectItem>
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
                                    value={rubric.name}
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
                                    }`}
                                  />
                                  <div className='flex justify-between mt-1'>
                                    {validationErrors.rubrics?.[index] && (
                                      <p className='text-sm text-red-500'>
                                        {validationErrors.rubrics[index]}
                                      </p>
                                    )}
                                    <p className='text-xs text-gray-500 -mt-1 ml-auto'>
                                      {rubric.name.length}/15
                                    </p>
                                  </div>
                                </div>
                                <div className='relative w-[100px] -mt-4'>
                                  <Input
                                    value={rubric.weight}
                                    onChange={(e) =>
                                      updateRubricDetail(
                                        index,
                                        'weight',
                                        parseInt(e.target.value),
                                      )
                                    }
                                    placeholder={`Weight`}
                                    className='bg-gray-50 border-gray-200'
                                  />
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
                      <DialogFooter className='gap-2 sm:gap-0'>
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
            <div className='space-y-4 p-0'>
              {/* Grading Table */}
              <div className='overflow-x-auto'>
                <table className='w-full border-separate border-spacing-0 table-fixed'>
                  <GradingTableHeader rubricDetails={rubricDetails} />
                  <tbody>
                    {isLoading
                      ? // Loading skeleton
                        Array.from({ length: 5 }).map((_, idx) => (
                          <tr
                            key={idx}
                            className={
                              idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6FA]'
                            }
                          >
                            <td className='sticky left-0 z-10 bg-white px-4 py-2 align-middle'>
                              <div className='flex items-center gap-3'>
                                <div className='w-8 h-8 rounded-full bg-gray-200 animate-pulse' />
                                <div className='h-4 w-32 bg-gray-200 rounded animate-pulse' />
                              </div>
                            </td>
                            {rubricDetails.map((_, rubricIdx) => (
                              <td
                                key={rubricIdx}
                                className='text-center px-4 py-2 align-middle'
                              >
                                <div className='h-8 w-full bg-gray-200 rounded animate-pulse' />
                              </td>
                            ))}
                            <td className='text-center px-4 py-2 align-middle'>
                              <div className='h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto' />
                            </td>
                            <td className='text-center px-4 py-2 align-middle'>
                              <div className='h-6 w-20 bg-gray-200 rounded-full animate-pulse mx-auto' />
                            </td>
                          </tr>
                        ))
                      : (() => {
                          const filteredStudents = students.filter(
                            (student) => {
                              const name = `${student.lastName || ''} ${
                                student.firstName || ''
                              } ${student.middleInitial || ''}`.toLowerCase();
                              const nameMatch = name.includes(
                                searchQuery.toLowerCase(),
                              );

                              // Get student's score
                              const studentScore = scores[student.id];
                              const total = studentScore?.total || 0;
                              const hasGrades =
                                studentScore?.scores.some(
                                  (score) => score > 0,
                                ) || false;

                              // Apply grade filter
                              let gradeMatch = true;
                              if (gradeFilter === 'passed') {
                                gradeMatch =
                                  hasGrades &&
                                  total >= Number(activeReport?.passingScore);
                              } else if (gradeFilter === 'failed') {
                                gradeMatch =
                                  hasGrades &&
                                  total < Number(activeReport?.passingScore);
                              } else if (gradeFilter === 'no-grades') {
                                gradeMatch = !hasGrades;
                              }

                              return nameMatch && gradeMatch;
                            },
                          );

                          if (filteredStudents.length === 0) {
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

                          return filteredStudents.map((student, idx) => {
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
                        })()}
                  </tbody>
                </table>
              </div>
              {/* Footer Bar */}
              <div className='flex items-center justify-between px-4 py-3 border-t bg-white'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-600'>Total Students:</span>
                  <span className='font-medium text-[#124A69]'>
                    {students.length}
                  </span>
                </div>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      className='h-8 px-3 text-sm border-gray-200 text-gray-600 hover:bg-gray-50'
                    >
                      Previous
                    </Button>
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='outline'
                        className='h-8 w-8 p-0 text-sm border-gray-200 text-[#124A69] hover:bg-gray-50'
                      >
                        1
                      </Button>
                      <Button
                        variant='outline'
                        className='h-8 w-8 p-0 text-sm border-gray-200 text-gray-600 hover:bg-gray-50'
                      >
                        2
                      </Button>
                      <Button
                        variant='outline'
                        className='h-8 w-8 p-0 text-sm border-gray-200 text-gray-600 hover:bg-gray-50'
                      >
                        3
                      </Button>
                    </div>
                    <Button
                      variant='outline'
                      className='h-8 px-3 text-sm border-gray-200 text-gray-600 hover:bg-gray-50'
                    >
                      Next
                    </Button>
                  </div>
                  <div className='h-6 w-px bg-gray-200'></div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => setShowResetDialog(true)}
                      className='h-9 px-4 border-gray-200 text-gray-600 hover:bg-gray-50'
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={handleSaveGrades}
                      disabled={isLoading || Object.keys(scores).length === 0}
                      className='h-9 px-4 bg-[#124A69] text-white hover:bg-[#0d3a56] disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isLoading ? (
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
              </div>
            </div>
          )}
        </div>
      </div>

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
              onClick={() => {
                setScores({});
                setShowResetDialog(false);
                toast.success('Grades reset successfully');
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
