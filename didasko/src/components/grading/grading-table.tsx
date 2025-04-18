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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Student {
  id: string;
  name: string;
}

interface GradingTableProps {
  courseId: string;
  searchQuery: string;
  selectedDate: Date | undefined;
  onDateSelect?: (date: Date | undefined) => void;
}

interface GradingCriteria {
  id: string;
  name: string;
  courseId: string;
  userId: string;
  rubrics: number;
  scoringRange: number;
  passingScore: number;
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
  searchQuery,
  selectedDate,
  onDateSelect,
}: GradingTableProps) {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [showCriteriaDialog, setShowCriteriaDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedCriteria, setSavedCriteria] = useState<GradingCriteria[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string>('');
  const [activeCriteria, setActiveCriteria] = useState<GradingCriteria | null>(
    null,
  );
  const [scores, setScores] = useState<Record<string, GradingScore>>({});
  const [rubricDetails, setRubricDetails] = useState<RubricDetail[]>([]);
  const [newCriteria, setNewCriteria] = useState({
    name: '',
    rubrics: '2',
    scoringRange: '5',
    passingScore: '75',
  });

  // Function to handle dialog close
  const handleDialogClose = () => {
    setShowCriteriaDialog(false);
    // Clear the selected date if no criteria was selected
    if (!activeCriteria) {
      // Using the onDateSelect prop to clear the date in the parent component
      onDateSelect?.(undefined);
    }
  };

  // Show criteria dialog when date is selected but no criteria is active
  useEffect(() => {
    if (selectedDate && !activeCriteria && !showCriteriaDialog) {
      console.log('Date selected but no criteria - showing dialog');
      setShowCriteriaDialog(true);
    }
  }, [selectedDate, activeCriteria, showCriteriaDialog]);

  // Fetch grades when both date and criteria are available
  useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedDate || !activeCriteria) {
        console.log('Missing required data:', {
          selectedDate: selectedDate?.toISOString(),
          activeCriteria: activeCriteria?.id,
        });
        return;
      }

      try {
        setIsLoading(true);
        const formattedDate = selectedDate.toISOString().split('T')[0];
        console.log('Fetching grades for:', {
          courseId,
          date: formattedDate,
          criteriaId: activeCriteria.id,
        });

        const response = await fetch(
          `/api/courses/${courseId}/grades?date=${formattedDate}&criteriaId=${activeCriteria.id}`,
        );

        if (!response.ok) {
          console.error('Failed to fetch grades:', response.status);
          throw new Error('Failed to fetch grades');
        }

        const existingGrades = await response.json();
        console.log('Received grades:', existingGrades);

        if (existingGrades && existingGrades.length > 0) {
          const gradesMap: Record<string, GradingScore> = {};
          existingGrades.forEach((grade: any) => {
            console.log('Processing grade:', grade);
            gradesMap[grade.studentId] = {
              studentId: grade.studentId,
              scores: grade.scores,
              total: grade.total,
            };
          });
          setScores(gradesMap);
          console.log('Updated scores state:', gradesMap);
        } else {
          console.log('No grades found for this date and criteria');
          setScores({});
        }
      } catch (error) {
        console.error('Error fetching grades:', error);
        toast.error('Failed to fetch existing grades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, [selectedDate, activeCriteria, courseId]);

  // Fetch saved criteria on mount
  useEffect(() => {
    const fetchCriteria = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/courses/${courseId}/criteria`);
        if (!response.ok) throw new Error('Failed to fetch criteria');
        const data = await response.json();
        setSavedCriteria(data);
      } catch (error) {
        console.error('Error fetching criteria:', error);
        toast.error('Failed to load saved criteria');
      }
    };

    if (session?.user?.id) {
      fetchCriteria();
    }
  }, [courseId, session?.user?.id]);

  // Fetch students when needed
  useEffect(() => {
    if (!showCriteriaDialog && activeCriteria && session?.user?.id) {
      fetchStudents();
    }
  }, [courseId, showCriteriaDialog, activeCriteria, session?.user?.id]);

  const fetchStudents = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/students`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSaveGrades = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          criteriaId: activeCriteria?.id,
          grades: Object.values(scores).map((score) => ({
            studentId: score.studentId,
            scores: score.scores,
            total: score.total,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save grades');
      }

      toast.success('Grades saved successfully');
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCriteria = () => {
    if (selectedCriteria) {
      const selected = savedCriteria.find((c) => c.id === selectedCriteria);
      if (selected) {
        setActiveCriteria(selected);
        setRubricDetails(
          Array(selected.rubrics)
            .fill(null)
            .map((_, i) => ({
              name: `Rubric ${i + 1}`,
              percentage: Math.floor(100 / selected.rubrics),
            })),
        );
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
      const rubricCount = activeCriteria?.rubrics || 0;
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
    return scores.reduce((sum, score, index) => {
      const percentage = rubricDetails[index]?.percentage || 0;
      return sum + (score * percentage) / 100;
    }, 0);
  };

  const handleCreateCriteria = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/criteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCriteria.name,
          rubrics: parseInt(newCriteria.rubrics),
          scoringRange: parseInt(newCriteria.scoringRange),
          passingScore: parseInt(newCriteria.passingScore),
          userId: session.user.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to create criteria');

      const created = await response.json();
      setSavedCriteria((prev) => [created, ...prev]);
      setSelectedCriteria(created.id);
      toast.success('Criteria created successfully');
    } catch (error) {
      console.error('Error creating criteria:', error);
      toast.error('Failed to create criteria');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <Dialog open={showCriteriaDialog} onOpenChange={handleDialogClose}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Grading Criteria</DialogTitle>
            <DialogDescription>
              Select existing criteria or create new ones
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue='existing' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='existing'>Use Existing</TabsTrigger>
              <TabsTrigger value='new'>Create New</TabsTrigger>
            </TabsList>

            <TabsContent value='existing'>
              <div className='space-y-4 py-4'>
                {savedCriteria.length > 0 ? (
                  <>
                    <Select
                      value={selectedCriteria}
                      onValueChange={setSelectedCriteria}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select saved criteria' />
                      </SelectTrigger>
                      <SelectContent>
                        {savedCriteria.map((criteria) => (
                          <SelectItem key={criteria.id} value={criteria.id}>
                            {criteria.name}
                            <span className='text-sm text-muted-foreground ml-2'>
                              (by {criteria.user?.name || 'Unknown'})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCriteria && (
                      <div className='text-sm text-muted-foreground'>
                        Created by:{' '}
                        {savedCriteria.find((c) => c.id === selectedCriteria)
                          ?.user?.name || 'Unknown'}
                      </div>
                    )}
                  </>
                ) : (
                  <p className='text-sm text-muted-foreground text-center py-4'>
                    No saved criteria found. Create new ones in the other tab.
                  </p>
                )}
                <DialogFooter>
                  <Button variant='outline' onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApplyCriteria}
                    disabled={!selectedCriteria}
                  >
                    Apply Selected Criteria
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>

            <TabsContent value='new'>
              <div className='space-y-4 py-4'>
                <div className='grid gap-4'>
                  <div className='grid gap-2'>
                    <label htmlFor='name'>Criteria Name</label>
                    <Input
                      id='name'
                      value={newCriteria.name}
                      onChange={(e) =>
                        setNewCriteria((prev) => ({
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
                      value={newCriteria.rubrics}
                      onValueChange={(value) =>
                        setNewCriteria((prev) => ({ ...prev, rubrics: value }))
                      }
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
                      value={newCriteria.scoringRange}
                      onValueChange={(value) =>
                        setNewCriteria((prev) => ({
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
                      value={newCriteria.passingScore}
                      onValueChange={(value) =>
                        setNewCriteria((prev) => ({
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
                </div>
                <DialogFooter>
                  <Button variant='outline' onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCriteria}
                    disabled={!newCriteria.name || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Creating...
                      </>
                    ) : (
                      'Create & Apply'
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {!showCriteriaDialog && activeCriteria && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span>Created by: {activeCriteria.user?.name || 'You'}</span>
              <span>•</span>
              <span>Rubrics: {activeCriteria.rubrics}</span>
              <span>•</span>
              <span>Scoring: 1-{activeCriteria.scoringRange}</span>
              <span>•</span>
              <span>Passing: {activeCriteria.passingScore}%</span>
            </div>
            <Button onClick={handleSaveGrades} disabled={isLoading}>
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {rubricDetails.map((rubric, i) => (
                  <TableHead key={i}>
                    {rubric.name} ({rubric.percentage}%)
                  </TableHead>
                ))}
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const studentScore = scores[student.id] || {
                  studentId: student.id,
                  scores: new Array(activeCriteria.rubrics).fill(0),
                  total: 0,
                };

                return (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    {studentScore.scores.map((score, index) => (
                      <TableCell key={index}>
                        <Input
                          type='number'
                          min={1}
                          max={activeCriteria.scoringRange}
                          value={score}
                          onChange={(e) =>
                            handleScoreChange(
                              student.id,
                              index,
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell>{studentScore.total.toFixed(2)}%</TableCell>
                    <TableCell>
                      {studentScore.total >= Number(activeCriteria.passingScore)
                        ? 'Pass'
                        : 'Fail'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
