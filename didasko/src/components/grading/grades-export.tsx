import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ExportGradesProps {
  showExportPreview: boolean;
  setShowExportPreview: (show: boolean) => void;
  exportData: {
    header: string[][];
    studentRows: string[][];
  } | null;
  courseCode: string;
  courseSection: string;
  gradebookName: string;
}

export function ExportGrades({
  showExportPreview,
  setShowExportPreview,
  exportData,
  courseCode,
  courseSection,
  gradebookName,
}: ExportGradesProps) {
  const handleConfirmExport = () => {
    if (!exportData) return;

    try {
      const { header, studentRows } = exportData;
      const ws = XLSX.utils.aoa_to_sheet([...header, ...studentRows]);

      // Configure column widths
      ws['!cols'] = [
        { wch: 30 }, // Student Name
        { wch: 15 }, // Reporting Score
        { wch: 15 }, // Recitation Score
        { wch: 15 }, // Quiz Score
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
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: C });
        if (!ws[cellRef]) ws[cellRef] = { v: '' };
        ws[cellRef].s = subHeaderStyle;
      }

      // Style all other cells
      for (let R = 2; R <= range.e.r; ++R) {
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

      // Merge cells for title row
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }, // Title row
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Grades');

      // Extract date range from header
      const dateRow = header.find((row) => row[0]?.startsWith('Date Range:'));
      const dateStr = dateRow
        ? dateRow[0].replace('Date Range:', '').trim()
        : '';

      // Format the date range for filename
      const dateRangeMatch = dateStr.match(
        /(\w+ \d+, \d{4}) - (\w+ \d+, \d{4})/,
      );
      let formattedDate;

      if (dateRangeMatch) {
        try {
          const startDate = new Date(dateRangeMatch[1]);
          const endDate = new Date(dateRangeMatch[2]);
          formattedDate = `${format(startDate, 'yyyy-MM-dd')}-to-${format(
            endDate,
            'yyyy-MM-dd',
          )}`;
        } catch (error) {
          console.error('Error parsing dates:', error);
          formattedDate = format(new Date(), 'yyyy-MM-dd');
        }
      } else {
        formattedDate = format(new Date(), 'yyyy-MM-dd');
      }

      // Sanitize gradebook name for filename
      const sanitizedGradebookName = gradebookName
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase();

      console.log('Export values:', {
        courseCode,
        courseSection,
        gradebookName,
        sanitizedGradebookName,
        formattedDate,
      });

      const filename = `${courseCode}-${courseSection}-${sanitizedGradebookName}-${formattedDate}-grades.xlsx`;
      console.log('Generated filename:', filename); // Debug log
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

  return (
    <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
      <DialogContent className='sm:max-w-[1200px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-[#124A69] text-xl font-bold'>
            Export Preview
          </DialogTitle>
          <DialogDescription className='text-gray-500'>
            Preview how your grades will look in the Excel file
          </DialogDescription>
        </DialogHeader>

        {exportData && (
          <div className='mt-4 overflow-x-auto'>
            <table className='w-full border-collapse min-w-[1000px]'>
              <tbody>
                {exportData.header.map((row, rowIndex) => (
                  <tr key={`header-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`header-cell-${cellIndex}`}
                        className={`border border-gray-200 p-3 ${
                          rowIndex === 0
                            ? 'bg-[#124A69] text-white text-center font-bold text-lg'
                            : rowIndex === 1
                            ? 'bg-gray-100 font-medium'
                            : rowIndex === 2
                            ? 'bg-gray-50 font-medium'
                            : rowIndex === 3
                            ? 'bg-gray-50 font-medium'
                            : ''
                        }`}
                        colSpan={
                          rowIndex === 0 ? exportData.header[1].length : 1
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
                {exportData.studentRows.map((row, rowIndex) => (
                  <tr key={`student-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`student-cell-${cellIndex}`}
                        className={`border border-gray-200 p-3 ${
                          cellIndex === row.length - 1
                            ? cell === 'PASSED'
                              ? 'text-green-600 font-medium'
                              : cell === 'FAILED'
                              ? 'text-red-600 font-medium'
                              : ''
                            : ''
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter className='gap-2 sm:gap-2 mt-6'>
          <Button
            variant='outline'
            onClick={() => setShowExportPreview(false)}
            className='border-gray-200'
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmExport}
            className='bg-[#124A69] hover:bg-[#0d3a56] text-white'
          >
            Export to Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
