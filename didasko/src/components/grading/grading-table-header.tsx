import React from 'react';

interface RubricDetail {
  name: string;
  percentage: number;
}

interface GradingTableHeaderProps {
  rubricDetails: RubricDetail[];
}

const GradingTableHeader: React.FC<GradingTableHeaderProps> = ({
  rubricDetails,
}) => (
  <thead className='bg-white'>
    <tr>
      <th className='sticky left-0 z-10 bg-white border-b font-bold text-[#124A69] text-left px-4 py-3'>
        Students
      </th>
      {rubricDetails.map((rubric, i) => (
        <th
          key={rubric.name + i}
          className='border-b font-bold text-[#124A69] text-center px-4 py-3'
        >
          {rubric.name}
          <div className='text-xs text-gray-500 font-normal'>
            ({rubric.percentage}%)
          </div>
        </th>
      ))}
      <th className='border-b font-bold text-[#124A69] text-center px-4 py-3'>
        Total Grade (100%)
      </th>
      <th className='border-b font-bold text-[#124A69] text-center px-4 py-3'>
        Remarks
      </th>
    </tr>
  </thead>
);

export default GradingTableHeader;
