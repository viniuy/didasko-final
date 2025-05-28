import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dialog';
import axiosInstance from '@/lib/axios';

interface Student {
  id: string;
  name: string;
  content: number | null;
  clarity: number | null;
  totalGrade: string;
  remarks: string;
  image?: string;
}

interface CourseDetails {
  code: string;
  section: string;
}

export function TableDemo() {
  const { courseId } = useParams();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(
    null,
  );
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchGrades();
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const response = await axiosInstance.get(`/courses/${courseId}`);
      setCourseDetails({
        code: response.data.code,
        section: response.data.section,
      });
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch course details',
        variant: 'destructive',
      });
    }
  };

  const fetchGrades = async () => {
    try {
      // First get the students with their images
      const studentsResponse = await axiosInstance.get(
        `/courses/${courseId}/students`,
      );
      const studentsData = studentsResponse.data.students;

      // Then get the grades
      const gradesResponse = await axiosInstance.get(
        `/courses/${courseId}/grades`,
      );
      const gradesData = gradesResponse.data;

      // Combine the data
      const combinedData = studentsData.map((student: any) => {
        const grade = gradesData.find((g: any) => g.studentId === student.id);
        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          content: grade?.content || null,
          clarity: grade?.clarity || null,
          totalGrade: grade?.totalGrade || '0',
          remarks: grade?.remarks || 'NO GRADE',
          image: student.image,
        };
      });

      setStudents(combinedData);
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch grades',
        variant: 'destructive',
      });
    }
  };

  const handleGradeChange = async (
    studentId: string,
    gradeType: 'CONTENT' | 'CLARITY',
    value: string,
  ) => {
    try {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue) || numericValue < 0 || numericValue > 10) {
        toast({
          title: 'Invalid grade',
          description: 'Grade must be between 0 and 10',
          variant: 'destructive',
        });
        return;
      }

      await axiosInstance.post(`/courses/${courseId}/grades`, {
        studentId,
        gradeType,
        value: numericValue,
      });

      fetchGrades();
      toast({
        title: 'Success',
        description: 'Grade updated successfully',
      });
    } catch (error) {
      console.error('Error updating grade:', error);
      toast({
        title: 'Error',
        description: 'Failed to update grade',
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const gradeOptions = Array.from({ length: 11 }, (_, i) => i);

  const handleImageClick = (student: Student) => {
    setSelectedStudent(student);
    setShowImageDialog(true);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Input
          placeholder='Search a name'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='max-w-sm'
        />
      </div>
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
          {courseDetails?.code}
        </span>
        <span className='text-sm text-gray-500'>{courseDetails?.section}</span>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50'>
              <TableHead className='w-12'>
                <Checkbox
                  checked={selectedStudents.length === students.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Students</TableHead>
              <TableHead className='text-center'>
                Content
                <br />
                (50%)
              </TableHead>
              <TableHead className='text-center'>
                Clarity
                <br />
                (50%)
              </TableHead>
              <TableHead className='text-center'>
                Total Grade
                <br />
                (100%)
              </TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                </TableCell>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-3'>
                    <div className='relative group'>
                      <div
                        className='cursor-pointer'
                        onClick={() => handleImageClick(student)}
                      >
                        {student.image ? (
                          <img
                            src={student.image}
                            alt={student.name}
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
                    </div>
                    <span className='text-gray-700 truncate'>
                      {student.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={student.content?.toString() || ''}
                    onValueChange={(value) =>
                      handleGradeChange(student.id, 'CONTENT', value)
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select grade' />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((grade) => (
                        <SelectItem key={grade} value={grade.toString()}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={student.clarity?.toString() || ''}
                    onValueChange={(value) =>
                      handleGradeChange(student.id, 'CLARITY', value)
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select grade' />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((grade) => (
                        <SelectItem key={grade} value={grade.toString()}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className='text-center'>
                  {student.totalGrade}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      student.remarks === 'PASSED' ? 'default' : 'destructive'
                    }
                  >
                    {student.remarks}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle className='text-[#124A69] text-xl font-bold'>
              {selectedStudent?.name}'s Profile Picture
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col items-center gap-4 py-4'>
            <div className='relative'>
              {selectedStudent?.image ? (
                <img
                  src={selectedStudent.image}
                  alt={selectedStudent.name}
                  className='w-48 h-48 rounded-full object-cover'
                />
              ) : (
                <div className='w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center'>
                  <svg
                    width='64'
                    height='64'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                    className='text-gray-400'
                  >
                    <circle cx='12' cy='8' r='4' />
                    <path d='M6 20c0-2.2 3.6-4 6-4s6 1.8 6 4' />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className='flex justify-end gap-3 px-6 py-4 border-t mt-4'>
            <Button
              variant='outline'
              onClick={() => setShowImageDialog(false)}
              className='border-gray-300 hover:bg-gray-50'
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
