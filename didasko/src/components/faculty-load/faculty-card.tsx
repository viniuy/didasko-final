import React from "react";

interface FacultyCardProps {
  name: string;
  image: string;
  department: string;
  onDepartmentClick: (department: string) => void;
}

const FacultyCard: React.FC<FacultyCardProps> = ({ name, image, department, onDepartmentClick }) => {
  return (
    <div className="w-full aspect-[3/4] p-3 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center">
      <div className="w-4/5 aspect-square mb-2">
        <div className="w-full h-full rounded-full border-2 border-gray-200 overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <p className="text-center text-gray-700 text-sm font-medium line-clamp-2 mb-1">{name}</p>
      <button
        onClick={() => onDepartmentClick(department)}
        className="text-center text-xs text-[#124A69] hover:text-[#1a6998] font-medium cursor-pointer"
      >
        {department}
      </button>
    </div>
  );
};

export default FacultyCard;
