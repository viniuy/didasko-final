import { Student } from '@/types/student';
import { DateRange } from 'react-day-picker';

interface QuizScore {
  studentId: string;
  quizScore: number;
  attendance: 'PRESENT' | 'LATE' | 'ABSENT';
  plusPoints: number;
  totalGrade: number;
  remarks: string;
}

interface StudentAttendanceStats {
  studentId: string;
  firstName: string;
  lastName: string;
  middleInitial: string | null;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
  excused?: number;
}

interface AttendanceStats {
  totalClasses: number;
  studentStats: StudentAttendanceStats[];
}

interface ExportData {
  header: string[][];
  studentRows: string[][];
}

interface PrepareExportDataParams {
  courseCode: string;
  courseSection: string;
  selectedDate: Date;
  selectedQuiz: any;
  dateRange: DateRange | undefined;
  students: Student[];
  scores: Record<string, QuizScore>;
  attendanceStats: AttendanceStats | null;
  passingRate: number;
}

export function prepareExportData({
  courseCode,
  courseSection,
  selectedDate,
  selectedQuiz,
  dateRange,
  students,
  scores,
  attendanceStats,
  passingRate,
}: PrepareExportDataParams): ExportData {
  const formattedDate = selectedDate.toISOString().split('T')[0];
  const formattedStartDate = dateRange?.from?.toISOString().split('T')[0] || '';
  const formattedEndDate = dateRange?.to?.toISOString().split('T')[0] || '';

  // Calculate total attendance counts
  const attendanceCounts = {
    present: 0,
    late: 0,
    excused: 0,
    absent: 0,
    noAttendance: 0,
  };

  students.forEach((student) => {
    const studentStat = attendanceStats?.studentStats.find(
      (stat) => stat.studentId === student.id,
    );
    if (studentStat) {
      attendanceCounts.present += studentStat.present || 0;
      attendanceCounts.late += studentStat.late || 0;
      attendanceCounts.excused += studentStat.excused || 0;
      attendanceCounts.absent += studentStat.absent || 0;
    }
    const totalRecords =
      (studentStat?.present || 0) +
      (studentStat?.late || 0) +
      (studentStat?.absent || 0) +
      (studentStat?.excused || 0);
    const missingRecords = (attendanceStats?.totalClasses || 0) - totalRecords;
    attendanceCounts.noAttendance += missingRecords;
  });

  // Create header rows
  const header = [
    [`${courseCode} - ${courseSection} QUIZ REPORT`],
    [''],
    [`Quiz: ${selectedQuiz.name} (${formattedDate})`],
    [
      `Max Score: ${selectedQuiz.maxScore} | Passing Rate: ${selectedQuiz.passingRate}%`,
    ],
    [''],
    // Column headers
    ['Student Name', 'Quiz Score', 'Plus Points', 'Total Grade', 'Remarks'],
  ];

  // Create student data rows
  const studentRows = students.map((student) => {
    const studentScore = scores[student.id] || {
      studentId: student.id,
      quizScore: 0,
      attendance: 'PRESENT',
      plusPoints: 0,
      totalGrade: 0,
      remarks: '',
    };

    return [
      `${student.lastName}, ${student.firstName}${
        student.middleInitial ? ` ${student.middleInitial}.` : ''
      }`,
      studentScore.quizScore.toString(),
      studentScore.plusPoints.toString(),
      `${studentScore.totalGrade.toFixed(1)}%`,
      studentScore.totalGrade >= passingRate ? 'PASSED' : 'FAILED',
    ];
  });

  return { header, studentRows };
}
