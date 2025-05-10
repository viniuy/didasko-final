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
import axiosInstance from '@/lib/axios';

interface Student {
  id: string;
  name: string;
  content: number | null;
  clarity: number | null;
  totalGrade: string;
  remarks: string;
}

export function TableDemo() {
  const { courseId } = useParams();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    fetchGrades();
  }, [courseId]);

  const fetchGrades = async () => {
    try {
      const response = await axiosInstance.get(`/courses/${courseId}/grades`);
      setStudents(response.data);
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
                <TableCell className='font-medium'>{student.name}</TableCell>
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
    </div>
  );
}
