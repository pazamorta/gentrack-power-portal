import React from 'react';
import { ChatInterface } from './ChatInterface';

export const Hero: React.FC = () => {

  return (
    <section className="relative z-30 min-h-screen flex flex-col items-center justify-start pt-48 px-4 pb-20 overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#06040A]" /> {/* Base color */}
        
        <div className="absolute inset-0">
             <img 
            src="assets/login/home_hero_bg.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover object-top opacity-100"
          />
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0D15]/30 to-[#0B0D15]/60 pointer-events-none" />
      </div>

      <div className="max-w-5xl w-full text-center z-10 space-y-8 flex flex-col items-center mt-8">
        
        {/* Heading */}
        <h1 
          className="text-white pb-4 px-4"
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: '105.913px',
            fontStyle: 'normal',
            fontWeight: 700,
            lineHeight: '97%', 
            letterSpacing: '-9.01px',
            textAlign: 'center',
            fontFeatureSettings: "'ss01' on, 'ss04' on",
            // @ts-ignore - experimental properties
            leadingTrim: 'both',
            // @ts-ignore - experimental properties
            textEdge: 'cap'
          }}
        >
          Powering Business <br />
          with Smart Energy
        </h1>

        {/* AI Chat Interface - target for "AI Assistant" nav link */}
        <div
          id="ai-assistant"
          className="relative w-full max-w-2xl z-50 animate-fade-in-up delay-300 mt-8"
          style={{ scrollMarginTop: '100px' }}
        >
            <ChatInterface />
        </div>

      </div>
      
      {/* Footer Copyright */}
      <div className="absolute bottom-8 left-0 right-0 z-10 text-center opacity-50 pointer-events-none">
        <p className="font-['Roboto'] text-white text-[12px] font-normal leading-[18px]">
          © Copyright Oxygen 2026
        </p>
      </div>
    </section>
  );
};