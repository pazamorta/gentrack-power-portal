import React from 'react';
import { ScrollToTop } from '../components/ScrollToTop';

const assets = {
  heroBg: '/gentrack-portal/customer/hero-bg.png',
  icon1: '/gentrack-portal/customer/icon1.svg',
  vector: '/gentrack-portal/customer/vector.svg',
  blurGradient: '/gentrack-portal/customer/blur-gradient.svg',
  icon2: '/gentrack-portal/customer/icon2.svg',
  icon3: '/gentrack-portal/customer/icon3.svg',
  icon4: '/gentrack-portal/customer/icon4.svg',
  icon5: '/gentrack-portal/customer/icon5.svg',
  icon6: '/gentrack-portal/customer/icon6.svg',
  icon7: '/gentrack-portal/customer/icon7.svg',
  icon8: '/gentrack-portal/customer/icon8.svg',
  icon9: '/gentrack-portal/customer/icon9.svg',
  vector18: '/gentrack-portal/customer/vector18.svg',
  vector19: '/gentrack-portal/customer/vector19.svg',
};

export const CustomerInformationPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen text-gray-900 font-['Roboto'] selection:bg-[#2CD8A6]/30">
      <ScrollToTop />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <img src={assets.heroBg} alt="Customer Information Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-['Space_Grotesk'] font-bold mb-6 max-w-5xl mx-auto leading-tight drop-shadow-lg">
            To be defined
          </h1>
          <p className="text-lg font-['Roboto'] font-bold opacity-90">
            Lorem
          </p>
        </div>
        
        {/* Wavy Bottom Divider */}

      </section>

      {/* Content Area with Gradient Background */}
      <section className="relative py-24 px-4 md:px-8">
        {/* Blur Gradient Background */}
        <div className="absolute inset-0 pointer-events-none">
          <img src={assets.blurGradient} className="w-full h-full object-cover opacity-50" alt="" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Placeholder content - can be expanded based on actual requirements */}
          <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-gray-500 text-xl">Content to be defined</p>
          </div>
        </div>
      </section>

      {/* Footer Section */}

    </div>
  );
};
