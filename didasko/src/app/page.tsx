'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import VantaBackground from '@/components/VantaBackground';

export default function Home() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleO365Login = async () => {
    try {
      await signIn('google', { callbackUrl: '/dashboard/academic-head' });
    } catch (err) {
      setError('Failed to sign in with Gmail' + err);
    }
  };

  return (
    <div className='flex h-screen w-full'>
      {/* Left Side - Vanta Effect */}
      <div className='relative w-1/2 flex flex-col justify-center items-center text-white p-10 text-center overflow-hidden'>
        {/* Vanta Effect Layer */}
        <div className='absolute inset-0 z-0'>
          <VantaBackground />
        </div>

        <div className='relative z-10'>
          <motion.img
            src='/Logo.png'
            alt='Didasko Logo'
            className='w-60 mb-3 ml-6 '
            animate={{ rotate: isSignUp ? 360 : 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 10 }}
          />
          <h1 className='text-3xl drop-shadow-md font-bold mb-4 z-1'>Welcome to Didasko</h1>
          
        </div>
      </div>

      {/* Right Side - Authentication Panel */}
      <div className='w-1/2 flex flex-col justify-center items-center p-10 bg-gray-100'>
        <div className='relative w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden'>
          <div className='w-full overflow-hidden'>
            <motion.div
              animate={{ x: isSignUp ? '-100%' : '0%' }}
              transition={{ type: 'spring', stiffness: 80 }}
              className='flex w-full'
            >
              {/* Microsoft Login Panel */}
              <div className='w-full flex-shrink-0 flex flex-col justify-center items-center p-10'>
                <h2 className='text-2xl font-semibold mb-4 text-gray-800'>
                  Sign in with Microsoft 365
                </h2>
                {error && <p className='text-red-500 text-sm mb-2'>{error}</p>}
                <button
                  className='flex items-center justify-center bg-[#EA4727] text-white px-6 py-2 rounded-md w-full shadow-md hover:bg-opacity-90 transition'
                  onClick={handleO365Login}
                >
                  <img
                    src='https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg'
                    alt='Microsoft Logo'
                    className='w-5 h-5 mr-2'
                  />
                  Sign in with Microsoft 365
                </button>
                <p className='mt-4 text-sm text-gray-700 font-semibold'>
                  Sign in as super admin{' '}
                  <button
                    onClick={() => setIsSignUp(true)}
                    className='text-blue-500'
                  >
                    Click me
                  </button>
                </p>
              </div>

              {/* Super Admin Login Panel */}
              <div className='w-full flex-shrink-0 flex flex-col justify-center items-center p-10 bg-white text-gray-800'>
                <h2 className='text-2xl font-semibold mb-4'>
                  Super Admin Login
                </h2>
                <input
                  type='email'
                  placeholder='Email'
                  className='w-full px-4 py-2 border rounded-md mb-2 bg-transparent border-black placeholder-gray'
                />
                <input
                  type='password'
                  placeholder='Password'
                  className='w-full px-4 py-2 border rounded-md mb-4 bg-transparent border-black placeholder-gray'
                />
                <button className='bg-green-500 text-white px-6 py-2 rounded-md w-full hover:bg-green-600'>
                  Login
                </button>
                <p className='mt-4 text-sm font-semibold'>
                  Sign in using O365{' '}
                  <button
                    onClick={() => setIsSignUp(false)}
                    className='text-green-300'
                  >
                    Login
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
