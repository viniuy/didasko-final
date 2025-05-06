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
import { Calendar as CalendarIcon, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import axiosInstance from '@/lib/axios';
import { DataTable } from '@/app/dashboard/admin/_components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import GradingTableHeader from './grading-table-header';
import GradingTableRow from './grading-table-row';
import GradingTableFooter from './grading-table-footer';

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
        const studentsRes = await axiosInstance.get(`/courses/${courseId}/students`);
        const studentsData: Student[] = studentsRes.data.students || [];
        setStudents(studentsData);

        // 2. Fetch grades for the selected date/criteria
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const gradesRes = await axiosInstance.get(`/courses/${courseId}/grades`, {
          params: {
            date: formattedDate,
            courseCode,
            courseSection,
            criteriaId: activeReport.id,
          },
        });
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
            scores: gradesMap[student.id]?.scores || new Array(rubricDetails.length).fill(0),
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
  }, [courseId, selectedDate, activeReport, rubricDetails, courseCode, courseSection]);

  // Check for existing criteria when date is selected or on mount
  useEffect(() => {
    const checkExistingCriteria = async () => {
      if (!selectedDate) return;
      setCriteriaLoading(true);
      setShowCriteriaDialog(false);
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        // Fetch all criteria for this course
        const response = await axiosInstance.get(`/courses/${courseId}/criteria`);
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
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await axiosInstance.post(`/courses/${courseId}/grades`, {
        date: selectedDate,
        criteriaId: activeReport?.id,
        grades: Object.values(scores).map((score) => ({
          studentId: score.studentId,
          scores: score.scores,
          total: score.total,
        })),
      });

      const created = response.data;
      setScores({});
      toast.success('Grades saved successfully');
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
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

  const handleScoreChange = (
    studentId: string,
    rubricIndex: number,
    value: number,
  ) => {
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

  const handleCreateReport = async () => {
    console.log('Button clicked!');
    console.log('Current state:', {
      name: newReport.name,
      isLoading,
      rubricNames: newReport.rubricDetails.map((r) => r.name),
      totalWeight: newReport.rubricDetails.reduce(
        (sum, r) => sum + r.weight,
        0,
      ),
      session: session?.user?.id,
    });

    if (!session?.user?.id) {
      console.log('No session user ID');
      return;
    }

    try {
      setIsLoading(true);
      // Prepare rubrics as array of { name, weight }
      const rubrics = newReport.rubricDetails.map((r) => ({
        name: r.name,
        weight: r.weight,
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
      setSavedReports((prev) => [created, ...prev]);
      setSelectedReport(created.id);
      setActiveReport(created);
      setShowCriteriaDialog(false);
      toast.success('Report created successfully');
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
    } finally {
      setIsLoading(false);
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
      newDetails[index] = {
        ...newDetails[index],
        [field]: value,
      };
      return {
        ...prev,
        rubricDetails: newDetails,
      };
    });
  };

  return (
    <div className="min-h-screen w-full  p-0">
      <div className="max-w-6xl mx-auto">
        {/* x */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Card Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <div className="flex flex-col mr-4">
              <span className="text-lg font-bold text-[#124A69] leading-tight">{courseCode}</span>
              <span className="text-sm text-gray-500">{courseSection}</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className="relative w-64">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <Input
                  placeholder="Search a name"
                  className="w-full pl-9 rounded-full border-gray-200 h-9 bg-[#F5F6FA]"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="ml-2 h-9 rounded bg-white border border-gray-200 text-gray-500">Add filter +</Button>
            </div>
            <div className="flex items-center gap-2">
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
              <Button className="ml-2 h-9 px-4 bg-[#124A69] text-white rounded shadow flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
                Export to PDF
              </Button>
            </div>
          </div>
          <Dialog open={showCriteriaDialog} onOpenChange={handleDialogClose}>
            <DialogContent className='sm:max-w-[450px]'>
              <DialogHeader>
                <DialogTitle>Grading Report</DialogTitle>
                <DialogDescription>
                  Select existing report or create new ones
                </DialogDescription>
              </DialogHeader>
              {criteriaLoading ? (
                <div className='flex justify-center items-center py-8'>
                  <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
              ) : (
                <Tabs defaultValue='existing' className='w-full'>
                  <TabsList className='grid w-full grid-cols-2'>
                    <TabsTrigger value='existing'>Use Existing</TabsTrigger>
                    <TabsTrigger value='new'>Create New</TabsTrigger>
                  </TabsList>
                  <TabsContent value='existing'>
                    <div className='space-y-4 py-4'>
                      {savedReports.filter(report => {
                        if (!selectedDate) return false;
                        const reportDate = new Date(report.date).toISOString().split('T')[0];
                        const selected = selectedDate.toISOString().split('T')[0];
                        return reportDate === selected;
                      }).length > 0 ? (
                        <>
                          <Select
                            value={selectedReport}
                            onValueChange={setSelectedReport}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select saved report' />
                            </SelectTrigger>
                            <SelectContent>
                              {savedReports.filter(report => {
                                if (!selectedDate) return false;
                                const reportDate = new Date(report.date).toISOString().split('T')[0];
                                const selected = selectedDate.toISOString().split('T')[0];
                                return reportDate === selected;
                              }).map((report) => (
                                <SelectItem key={report.id} value={report.id}>
                                  {report.name}
                                  <span className='text-sm text-muted-foreground ml-2'>
                                    (by {report.user?.name || 'Unknown'})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedReport && (
                            <div className='text-sm text-muted-foreground'>
                              Created by:{' '}
                              {savedReports.find((c) => c.id === selectedReport)?.user?.name || 'Unknown'}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className='text-sm text-muted-foreground text-center py-4'>
                          No saved reports found. Create new ones in the other tab.
                        </p>
                      )}
                      <DialogFooter>
                        <Button variant='outline' onClick={handleDialogClose}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleApplyCriteria}
                          disabled={!selectedReport}
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
                          <label htmlFor='name'>Report Name</label>
                          <Input
                            id='name'
                            value={newReport.name}
                            onChange={(e) =>
                              setNewReport((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder='e.g., Midterm Exam'
                          />
                        </div>
                        <div className='grid gap-2'>
                          <label htmlFor='rubrics'>Number of Rubrics</label>
                          <Select
                            value={newReport.rubrics}
                            onValueChange={handleRubricCountChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='2'>2 Rubrics</SelectItem>
                              <SelectItem value='3'>3 Rubrics</SelectItem>
                              <SelectItem value='4'>4 Rubrics</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='grid gap-2'>
                          <label htmlFor='scoringRange'>Scoring Range</label>
                          <Select
                            value={newReport.scoringRange}
                            onValueChange={(value) =>
                              setNewReport((prev) => ({
                                ...prev,
                                scoringRange: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='5'>1-5</SelectItem>
                              <SelectItem value='10'>1-10</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='grid gap-2'>
                          <label htmlFor='passingScore'>Passing Score (%)</label>
                          <Select
                            value={newReport.passingScore}
                            onValueChange={(value) =>
                              setNewReport((prev) => ({
                                ...prev,
                                passingScore: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='75'>75%</SelectItem>
                              <SelectItem value='80'>80%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='grid gap-4 mt-2'>
                          <label className='text-sm font-medium'>
                            Rubric Details
                          </label>
                          <div className='space-y-4 max-h-[200px] overflow-y-auto pr-2'>
                            {newReport.rubricDetails.map((rubric, index) => (
                              <div key={index} className='flex items-center gap-2'>
                                <div className='relative w-[400px]'>
                                  <Input
                                    value={rubric.name}
                                    onChange={(e) =>
                                      updateRubricDetail(
                                        index,
                                        'name',
                                        e.target.value.slice(0, 15),
                                      )
                                    }
                                    placeholder={`Rubric ${index + 1} name`}
                                  />
                                </div>
                                <div className='relative w-[100px]'>
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
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant='outline' onClick={handleDialogClose}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateReport}
                          disabled={!newReport.name || !newReport.rubrics}
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
            <div className="space-y-4 p-0">
              {/* Grading Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <GradingTableHeader rubricDetails={rubricDetails} />
                  <tbody>
                    {(() => {
                      const filteredStudents = students.filter(student => {
                        const name = `${student.lastName || ''} ${student.firstName || ''} ${student.middleInitial || ''}`.toLowerCase();
                        return name.includes(searchQuery.toLowerCase());
                      });
                      if (filteredStudents.length === 0) {
                        return (
                          <tr>
                            <td colSpan={rubricDetails.length + 4} className="text-center py-8 text-muted-foreground">
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
              <GradingTableFooter totalStudents={students.length} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}