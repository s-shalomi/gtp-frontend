"use client";

import { useRouter } from 'next/navigation';
import AppHeader from './components/header';
import './globals.css';
import { useState } from 'react';
import { Spin } from 'antd';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const navigateTo = (path) => {
    setLoading(true)
    router.push(path);
  };
  

  return (
    <div className="min-h-screen text-black font-sans"
    style={{backgroundImage: 'url(/images/bg1.jpg)',
      backgroundSize: 'cover', 

    }}>
      {/* Header Section */}
      <div className='bg-cover bg-center bg-no-repeat'>
        <AppHeader/>
      </div>
      <section className={`${isMobile ? 'pt-4' : ''} relative w-full min-h-screen flex flex-col justify-center items-center bg-cover bg-center bg-no-repeat`}>
        <div className="absolute inset-0 bg-black opacity-40"></div>

        {/* Main Content */}
        <div className="relative z-10 text-center px-6 sm:px-12">
          {/* Title */}
          <h1 className={`${isMobile ? 'text-5xl' : 'text-6xl'} sm:text-7xl font-extrabold text-white mb-3 mt-0 leading-tight drop-shadow-md`}>
            Plan Your Perfect Group Trip
          </h1>
          
          {/* Description */}
          <p className="text-lg sm:text-2xl text-white mb-4 max-w-3xl mx-auto opacity-90 drop-shadow-md">
            Organize your dream trips with ease—track your budget, create itineraries, and make unforgettable memories with friends and family.
          </p>
          
          {/* Call to Action Button */}
          <div className="py-5 pb-10">
            <a
              onClick={() => navigateTo('/auth/signup')}
              className="px-6 py-3 bg-[#6CB4EE] text-white text-xl font-semibold rounded-full shadow-lg transform hover:scale-110 hover:bg-[#0066b2] hover:text-white transition ease-in-out duration-300"
            >
              Start Planning
            </a>
          </div>
          
          {/* Features Section */}
          <div className="mt-4 text-center mb-12">
            <h2 className={`${isMobile ? 'text-4xl' : 'text-5xl'} font-bold text-white mb-4`}>Features</h2>
            <p className="text-lg text-white mb-8">Make your trip planning effortless and fun!</p>
          </div>

          <div className="flex flex-wrap justify-center align-items-center gap-6 pb-4">
            <div className={`flex flex-col items-center bg-gradient-to-r from-[#0066b2] to-[#6CB4EE] ${isMobile ? 'p-8' : 'p-10'} max-w-sm rounded-lg shadow-2xl mx-auto hover:scale-105 transform transition`}>
              <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold mb-4 text-white`}>Plan Trips</h3>
              <p className="text-base text-white">Create, customize, and manage your trip details in one place.</p>
            </div>
            <div className={`flex flex-col items-center bg-gradient-to-r from-[#0066b2] to-[#6CB4EE] ${isMobile ? 'p-8' : 'p-10'} max-w-sm rounded-lg shadow-2xl mx-auto hover:scale-105 transform transition`}>
              <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold mb-4 text-white`}>Track Expenses</h3>
              <p className="text-base text-white">Split costs easily and keep track of payments to ensure fairness.</p>
            </div>
            <div className={`flex flex-col items-center bg-gradient-to-r from-[#0066b2] to-[#6CB4EE] ${isMobile ? 'p-8' : 'p-10'}  max-w-sm rounded-lg shadow-2xl mx-auto hover:scale-105 transform transition`}>
              <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold mb-4 text-white`}>Itinerary</h3>
              <p className="text-base text-white">Effortlessly organize activities and destinations for the perfect trip.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-transparent z-70 text-white text-center">
        <p>© 2024 Group Trip Planner. All rights reserved.</p>
      </footer>
      {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <Spin size="large" tip="Loading..." className="text-white" />
        </div>
        )}
    </div>
  );
}
