import React from 'react';
import { ChatInterface } from './ChatInterface';

export const Hero: React.FC = () => {
  const bgMountain = "assets/login/bg-mountain.png";
  const lightFlow1 = "assets/login/light-flow-1.png";
  const lightFlow2 = "assets/login/light-flow-2.png";
  const lightFlow3 = "assets/login/light-flow-3.png";

  return (
    <section className="relative z-30 min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-20 overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#06040A]" /> {/* Base color */}
        
        {/* Mountain Background - aligned to bottom */}
        <div className="absolute inset-0">
             <img 
            src={bgMountain} 
            alt="Mountain Landscape" 
            className="w-full h-full object-cover object-bottom opacity-80"
          />
        </div>
        
        {/* Light Flows */}
        <div className="absolute inset-0 mix-blend-screen">
          <img src={lightFlow1} alt="" className="absolute top-0 left-0 w-full h-full object-cover opacity-60" />
           <img src={lightFlow2} alt="" className="absolute top-0 left-0 w-full h-full object-cover opacity-50" />
            <img src={lightFlow3} alt="" className="absolute top-0 left-0 w-full h-full object-cover opacity-40" />
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#172036]/60 via-transparent to-[#0B0D15]/90 pointer-events-none" />
      </div>

      <div className="max-w-5xl w-full text-center z-10 space-y-8 flex flex-col items-center mt-8 -translate-y-[150px]">
        
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