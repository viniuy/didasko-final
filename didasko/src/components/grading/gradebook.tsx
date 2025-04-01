import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Student {
    id: string;
    name: string;
    reporting: number | string;
    recitation: number | string;
    quiz: number | string;
    total: number | string;
    remarks: "PASSED" | "FAILED" | "DROPPED";
}

const students: Student[] = [
    { id: "BR", name: "Babagay, Realyn", reporting: 5, recitation: 1, quiz: 5, total: 6, remarks: "PASSED" },
    { id: "BLJ", name: "Batac, Lean Jared", reporting: 2, recitation: 3, quiz: 2, total: 5, remarks: "PASSED" },
    { id: "BMJ", name: "Bausa, Mark Jecil", reporting: 5, recitation: 4, quiz: 5, total: 9, remarks: "PASSED" },
    { id: "CJR", name: "Calinog, Josh Raizen", reporting: 5, recitation: 5, quiz: 5, total: 10, remarks: "PASSED" },
    { id: "CAR", name: "Cayer, Allyza Rose", reporting: 5, recitation: 5, quiz: 5, total: 10, remarks: "PASSED" },
    { id: "CJF", name: "Corpuz, Jonathan Francis", reporting: 5, recitation: 5, quiz: 5, total: 10, remarks: "PASSED" },
    { id: "JMEO", name: "Del Mundo, Elijah Oscar", reporting: "--", recitation: "--", quiz: "--", total: "--", remarks: "DROPPED" },
    { id: "DM", name: "Despi, Mj", reporting: 5, recitation: 4, quiz: 5, total: 9, remarks: "PASSED" },
    { id: "DBJ", name: "Diaz, Brandon Jake", reporting: 4, recitation: 4, quiz: 4, total: 8, remarks: "PASSED" },
    { id: "DJK", name: "Dimaano, John Keith", reporting: 1, recitation: 2, quiz: 1, total: 3, remarks: "FAILED" },
];

const ITEMS_PER_PAGE = 8;

export function TableDemo() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [date, setDate] = useState<Date>();
    const [gradeStatus, setGradeStatus] = useState<string[]>(["all"]);

    // Filter students based on all criteria
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = gradeStatus.includes("all") || 
            gradeStatus.includes(student.remarks.toLowerCase());
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

    const getPaginatedStudents = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    };

    const getScoreBackground = (score: number | string) => {
        if (score === "--") return "";
        const numScore = Number(score);
        if (numScore >= 5) return "bg-green-50";
        if (numScore >= 3) return "bg-yellow-50";
        return "bg-red-50";
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    return (
        <div className="flex flex-col h-full w-322">
            <div className="border-b p-4">
                <div className="flex items-center gap-4 mb-4">
                <Button asChild variant="secondary" className= "text-black text-sm">
                <a href="/grading">
                Back
                </a>
                </Button>
                    <div>
                        <h2 className="text-xl font-semibold">MIS</h2>
                        <p className="text-sm text-muted-foreground">BSIT 111</p>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="relative w-[300px]">
                        <Input
                            placeholder="Search a name"
                            className="pl-3 h-9"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm">Add filter +</Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[400px] p-5 sm:w-[400px]">
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <SheetTitle className="text-lg font-semibold">Add filter</SheetTitle>
                                </div>
                                
                                <div className="flex-1 py-6 space-y-8">
                                    {/* Updated Date Filter */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-medium">Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !date && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {date ? format(date, "PPP") : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={setDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Grade Status Filter */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-medium">Grade Status</label>
                                        <Select
                                            value={gradeStatus}
                                            onValueChange={setGradeStatus}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select grade status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="passed">Passed</SelectItem>
                                                <SelectItem value="failed">Failed</SelectItem>
                                                <SelectItem value="dropped">Dropped</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 border-t pt-4">
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="w-24">Cancel</Button>
                                    </SheetTrigger>
                                    <SheetTrigger asChild>
                                    <Button 
                                        className="w-24"
                                        onClick={() => { setCurrentPage(1); }}
                                          style={{ backgroundColor: '#124A69', color: 'white' }}
                                            >
                                         Apply
                                        </Button>

                                    </SheetTrigger>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex-1 p-4">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b">
                            <TableHead className="w-[300px] py-3 text-[#124A69] font-bold" style={{ fontFamily: 'Poppins' }}>Students</TableHead>
                            <TableHead className="text-center py-3 text-[#124A69] font-bold" style={{ fontFamily: 'Poppins' }}>Reporting</TableHead>
                            <TableHead className="text-center py-3 text-[#124A69] font-bold" style={{ fontFamily: 'Poppins' }}>Recitation</TableHead>
                            <TableHead className="text-center py-3 text-[#124A69] font-bold" style={{ fontFamily: 'Poppins' }}>Quiz</TableHead>
                            <TableHead className="text-center py-3 text-[#124A69] font-bold" style={{ fontFamily: 'Poppins' }}>Total Grade</TableHead>
                            <TableHead className="py-3 text-[#124A69] font-bold" style={{ fontFamily: 'Poppins' }}>Remarks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {getPaginatedStudents().map((student) => (
                            <TableRow key={student.id} className="border-b">
                                <TableCell className="py-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 w-8 h-8 rounded flex items-center justify-center text-xs font-medium">
                                            {student.id}
                                        </div>
                                        <span className="font-bold" style={{ fontFamily: 'Poppins', color: '#124A69' }}>{student.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className={`text-center py-2.5 font-bold ${getScoreBackground(student.reporting)}`} style={{ fontFamily: 'Poppins', color: '#124A69' }}>
                                    {student.reporting}
                                </TableCell>
                                <TableCell className={`text-center py-2.5 font-bold ${getScoreBackground(student.recitation)}`} style={{ fontFamily: 'Poppins', color: '#124A69' }}>
                                    {student.recitation}
                                </TableCell>
                                <TableCell className={`text-center py-2.5 font-bold ${getScoreBackground(student.quiz)}`} style={{ fontFamily: 'Poppins', color: '#124A69' }}>
                                    {student.quiz}
                                </TableCell>
                                <TableCell className="text-center py-2.5 font-bold" style={{ fontFamily: 'Poppins', color: '#124A69' }}>
                                    {student.total}
                                </TableCell>
                                <TableCell className="py-2.5">
                                    <span className={`font-bold ${
                                        student.remarks === 'FAILED' ? 'text-red-500' : 
                                        student.remarks === 'DROPPED' ? 'text-gray-500' :
                                        'text-green-500'
                                    }`} style={{ fontFamily: 'Poppins' }}>
                                        {student.remarks}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-end mt-4 gap-1">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 border-gray-200"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <Button 
                            key={pageNum}
                            variant="outline"
                            size="sm"
                            className={`h-8 w-8 ${
                                pageNum === currentPage 
                                    ? "bg-[#124A69] text-white hover:bg-[#124A69]/90 hover:text-white border-none" 
                                    : "border-gray-200"
                            }`}
                            onClick={() => setCurrentPage(pageNum)}
                        >
                            {pageNum}
                        </Button>
                    ))}
                    
                    <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8 border-gray-200"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}