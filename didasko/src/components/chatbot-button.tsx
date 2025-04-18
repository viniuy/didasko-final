import React, { useState, useRef, useEffect, useCallback } from 'react';

const ChatbotButton = () => {
  const [position, setPosition] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth - 100 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight - 100 : 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && buttonRef.current && typeof window !== 'undefined') {
        const newX = Math.min(
          Math.max(0, e.clientX - dragStart.x),
          window.innerWidth - buttonRef.current.offsetWidth,
        );
        const newY = Math.min(
          Math.max(0, e.clientY - dragStart.y),
          window.innerHeight - buttonRef.current.offsetHeight,
        );

        setPosition({ x: newX, y: newY });
      }
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging && typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Don't render anything during server-side rendering
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div
      ref={buttonRef}
      className='fixed w-16 h-16 rounded-full bg-[#124A69] text-white flex items-center justify-center cursor-move shadow-lg hover:bg-[#1a6998] transition-colors z-50'
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='h-8 w-8'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
        />
      </svg>
    </div>
  );
};

export default ChatbotButton;
