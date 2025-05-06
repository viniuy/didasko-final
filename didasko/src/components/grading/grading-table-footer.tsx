import React from 'react';
import { Button } from '@/components/ui/button';

interface GradingTableFooterProps {
  totalStudents: number;
  currentPage?: number;
  totalPages?: number;
}

const GradingTableFooter: React.FC<GradingTableFooterProps> = ({ totalStudents, currentPage = 1, totalPages = 2 }) => (
  <div className="flex items-center justify-between px-4 py-2 border-t bg-white rounded-b-lg">
    <span className="text-sm text-gray-500">1-10 out of {totalStudents} students</span>
    <div className="flex gap-1">
      <Button size="sm" variant="outline">&lt;</Button>
      <Button size="sm" className="bg-[#124A69] text-white">{currentPage}</Button>
      {Array.from({ length: totalPages - 1 }, (_, i) => (
        <Button key={i + 2} size="sm" variant="outline">{i + 2}</Button>
      ))}
      <Button size="sm" variant="outline">&gt;</Button>
    </div>
  </div>
);

export default GradingTableFooter; 