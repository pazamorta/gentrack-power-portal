import React from 'react';
import { ScrollToTop } from '../components/ScrollToTop';
import { B2BForm } from '../components/B2BForm';

const assets = {
  heroBg: '/gentrack-power-portal/customer/hero-bg.png',
  icon1: '/gentrack-power-portal/customer/icon1.svg',
  vector: '/gentrack-power-portal/customer/vector.svg',
  blurGradient: '/gentrack-power-portal/customer/blur-gradient.svg',
  icon2: '/gentrack-power-portal/customer/icon2.svg',
  icon3: '/gentrack-power-portal/customer/icon3.svg',
  icon4: '/gentrack-power-portal/customer/icon4.svg',
  icon5: '/gentrack-power-portal/customer/icon5.svg',
  icon6: '/gentrack-power-portal/customer/icon6.svg',
  icon7: '/gentrack-power-portal/customer/icon7.svg',
  icon8: '/gentrack-power-portal/customer/icon8.svg',
  icon9: '/gentrack-power-portal/customer/icon9.svg',
  vector18: '/gentrack-power-portal/customer/vector18.svg',
  vector19: '/gentrack-power-portal/customer/vector19.svg',
};

export const CustomerInformationPage: React.FC = () => {

  return (
    <div className="bg-white min-h-screen text-gray-900 font-['Roboto'] selection:bg-[#2CD8A6]/30 relative overflow-hidden">
      <ScrollToTop />
      

      
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <img src={assets.heroBg} alt="Customer Information Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center text-white">
          <h1 className="text-white text-center font-['Space_Grotesk'] font-bold mb-6 max-w-5xl mx-auto leading-[0.97] tracking-[-5.032px] drop-shadow-lg" style={{ fontSize: '59.146px', fontFeatureSettings: "'ss01' on, 'ss04' on" }}>
            Commercial Energy Solutions
          </h1>
          <p className="text-xl md:text-2xl font-light opacity-90 max-w-3xl mx-auto">
            Tailored energy solutions for businesses of all sizes. Get started with a free consultation.
          </p>
        </div>
        
        {/* Unified Wavy Bottom Divider */}
        <div className="absolute bottom-0 left-0 right-0 w-full leading-none z-20 -mb-px">
          <div className="relative w-full">
            <svg className="absolute bottom-0 left-0 w-full h-auto" viewBox="0 0 1350 184" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ height: '184px', display: 'block' }}>
              <path opacity="0.4" d="M624.5 50.3562C917.7 -40.8438 1230 12.3562 1349.5 50.3562V183.356H-134V8.85644C-3.33337 60.6897 331.3 141.556 624.5 50.3562Z" fill="white"></path>
            </svg>
            <svg className="relative bottom-0 left-0 w-full h-auto" viewBox="0 0 1440 184" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ height: '184px', display: 'block' }}>
              <path d="M715 50.3562C1008.2 -40.8438 1320.5 12.3562 1440 50.3562V183.356H-43.5V8.85644C87.1666 60.6897 421.8 141.556 715 50.3562Z" fill="white"></path>
            </svg>
          </div>
        </div>

      </section>

      {/* Get Started Section */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold mb-6 text-gray-900">Get Started Today</h2>
            <p className="text-xl text-gray-600">Fill out the form below and our team will get back to you with a tailored energy solution for your business.</p>
          </div>
          
          <B2BForm theme="light" variant="embedded" />
        </div>
      </section>

      {/* Footer Section */}

    </div>
  );
};
