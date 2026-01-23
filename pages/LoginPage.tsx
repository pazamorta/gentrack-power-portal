import React, { useState } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  const bgMountain = "assets/login/bg-mountain.png";
  const lightFlow1 = "assets/login/light-flow-1.png";
  const lightFlow2 = "assets/login/light-flow-2.png";
  const lightFlow3 = "assets/login/light-flow-3.png";

  return (
    <div className="relative min-h-screen w-full bg-[#06040A] overflow-hidden flex flex-col font-sans">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0">
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
        
        {/* Gradient Overlays to darken and tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#172036]/60 via-transparent to-[#0B0D15]/90 pointer-events-none" />
      </div>

       {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 mt-20">
        
        {/* Main Heading */}
        <h1 className="text-center font-['Roboto'] font-bold text-white text-[56px] md:text-[80px] leading-[1.1] tracking-tight mb-8 drop-shadow-lg">
          Powering Business <br />
          with Smart Energy
        </h1>

        {/* Subheading */}
        <p className="text-center font-['Roboto'] font-bold text-white text-[24px] mb-8 drop-shadow-md">
          How can I help you today?
        </p>

        {/* Search Input */}
        <div className="w-full max-w-[640px] relative">
          <div className="relative bg-white rounded-full h-[64px] flex items-center px-6 shadow-2xl transition-transform hover:scale-[1.01]">
            <input
              type="text"
              placeholder="Ask Anything About Your Energy Operations..."
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 text-lg outline-none font-['Roboto'] font-normal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            
            <div className="flex items-center gap-3 ml-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Paperclip size={24} />
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#00D95F] flex items-center justify-center text-black hover:bg-[#00c055] transition-colors shadow-lg"
              >
                <ArrowUp size={24} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Copyright */}
      <div className="relative z-10 text-center pb-8 opacity-50">
        <p className="font-['Roboto'] text-white text-xs">
          © Copyright Oxygen 2026
        </p>
      </div>
    </div>
  );
};
