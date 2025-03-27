'use client';

import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  return (
    <div className='w-[102.6%] -ml-5 bg-white border-b border-gray-400 flex justify-between shadow-lg items-center'>
      <img src='/didasko-logo.png' alt='Logo' className='w-60 h-19' />
    </div>
  );
}
