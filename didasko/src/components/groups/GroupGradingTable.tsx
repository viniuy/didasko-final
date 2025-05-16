import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Group } from './types';

interface GroupGradingTableProps {
  group: Group;
  onClose: () => void;
}

export function GroupGradingTable({ group, onClose }: GroupGradingTableProps) {
  const [date, setDate] = React.useState<Date>();
  const [showTable, setShowTable] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setShowTable(true);
    }
  };

  if (!showTable) {
    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-[#124A69] mb-4">Select Date for Grading</h2>
        <div className="flex flex-col items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#124A69]">Group {group.number}</h2>
          {group.name && <p className="text-gray-600">{group.name}</p>}
          <p className="text-sm text-gray-500">
            Grading Date: {date ? format(date, "PPP") : "Not selected"}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Student</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Attendance</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Participation</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Notes</th>
            </tr>
          </thead>
          <tbody>
            {group.students.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="px-4 py-3">
                  {student.firstName} {student.middleInitial} {student.lastName}
                </td>
                <td className="px-4 py-3">
                  <select className="w-full p-2 border rounded">
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select className="w-full p-2 border rounded">
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Input type="text" placeholder="Add notes..." />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#124A69] text-white">
          Save Grades
        </Button>
      </div>
    </Card>
  );
} 