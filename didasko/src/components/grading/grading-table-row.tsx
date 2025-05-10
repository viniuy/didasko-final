import React from 'react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  image?: string;
}

interface RubricDetail {
  name: string;
  percentage: number;
}

interface GradingTableRowProps {
  student: Student;
  rubricDetails: RubricDetail[];
  activeReport: any;
  studentScore: { scores: number[]; total: number };
  handleScoreChange: (
    studentId: string,
    rubricIdx: number,
    value: number,
  ) => void;
  idx: number;
}

const GradingTableRow: React.FC<GradingTableRowProps> = ({
  student,
  rubricDetails,
  activeReport,
  studentScore,
  handleScoreChange,
  idx,
}) => (
  <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6FA]'}>
    <td className='sticky left-0 z-10 bg-white px-4 py-2 align-middle font-medium w-[300px]'>
      <div className='flex items-center gap-3'>
        {student.image ? (
          <img
            src={student.image}
            alt={student.firstName || '--'}
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
        <span className='text-gray-700 truncate'>
          {student.lastName && student.firstName
            ? `${student.lastName}, ${student.firstName}${
                student.middleInitial ? ` ${student.middleInitial}.` : ''
              }`
            : '--'}
        </span>
      </div>
    </td>
    {rubricDetails.map((rubric, rubricIdx) => {
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
          key={rubric.name + rubricIdx}
          className={`text-center px-4 py-2 align-middle w-[120px] ${cellBg}`}
        >
          <select
            className='w-full rounded border border-gray-300 px-2 py-1'
            value={value}
            onChange={(e) =>
              handleScoreChange(
                student.id,
                rubricIdx,
                parseInt(e.target.value) || 0,
              )
            }
          >
            <option value=''>Select grade</option>
            {Array.from(
              { length: Number(activeReport.scoringRange) },
              (_, i) => i + 1,
            ).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </td>
      );
    })}
    <td className='text-center px-4 py-2 align-middle font-bold w-[100px]'>
      {studentScore.total.toFixed(0)}%
    </td>
    <td className='text-center px-4 py-2 align-middle w-[100px]'>
      {studentScore.scores.some((score) => score === 0) ? (
        <span className='px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600'>
          ---
        </span>
      ) : (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            studentScore.total >= Number(activeReport.passingScore)
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {studentScore.total >= Number(activeReport.passingScore)
            ? 'PASSED'
            : 'FAILED'}
        </span>
      )}
    </td>
  </tr>
);

export default GradingTableRow;
