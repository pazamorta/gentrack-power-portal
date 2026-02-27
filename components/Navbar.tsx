import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from './Button';

const navLinks = [
  { label: 'Solutions & Services', href: '/solutions', isHash: false },
  { label: 'Generation & Storage', href: '/storage', isHash: false },
  { label: 'Customer Information', href: '/platform', isHash: false },
  { label: 'About', href: '/about', isHash: false },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (href: string, isHash: boolean) => {
    if (isHash) {
      // For hash links, navigate to home first if not already there
      if (location.pathname !== '/') {
        navigate(href);
      } else {
        // If already on home page, scroll to the element
        const hash = href.split('#')[1];
        if (hash) {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    }
    setIsOpen(false);
  };

  const handleAIAssistantClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      // Navigate to home page first, then scroll
      navigate('/#ai-assistant');
    } else {
      // Already on home page, just scroll
      const element = document.getElementById('ai-assistant');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-center pt-6 px-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
        <div className="flex items-center gap-2">
           <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="123" height="44" viewBox="0 0 123 44" fill="none" className="h-8 w-auto">
                <path d="M47.302 17.8207H42.3246L38.5177 23.4326L34.7436 17.8207H29.8755L35.9141 26.2003L29.6568 34.5252H34.492L38.6271 28.8148L42.8169 34.5252H47.6193L41.2197 25.8721L47.302 17.8207Z" fill="white"/>
                <path d="M94.812 17.7765C89.9877 17.7765 86.2683 21.4302 86.2683 26.3639C86.2683 31.2976 89.922 34.9514 95.5996 34.9514C98.4767 34.9514 100.763 34.295 101.955 33.6824V30.1927C100.796 30.8819 98.3016 31.5601 95.9059 31.5601C92.7554 31.5601 90.7097 29.9302 90.6112 27.1844H102.546C102.546 26.889 102.645 26.167 102.645 25.4231C102.645 21.3755 99.9426 17.7874 94.812 17.7874V17.7765ZM90.6003 24.8543C90.8081 22.7977 92.274 20.9708 94.7354 20.9708C97.1968 20.9708 98.6298 22.7977 98.597 24.8543H90.6003Z" fill="white"/>
                <path d="M116.21 17.7765C112.961 17.7765 110.707 19.9643 110.018 21.463H109.952C109.952 21.3318 110.083 20.9051 110.083 20.2925L109.985 18.2031H106.123V34.5247H110.291V26.4295C110.291 23.5525 112.304 21.3974 115.148 21.3974C117.468 21.3974 117.949 23.093 117.949 24.9855V34.5247H122.117V24.3073C122.117 20.0956 120.235 17.7765 116.199 17.7765H116.21Z" fill="white"/>
                <path d="M62.5735 17.8207L57.7164 29.5915L52.9905 17.8207H48.4725L55.4519 33.8251L51.0652 43.1783H55.3863L66.7851 17.8207H62.5735Z" fill="white"/>
                <path d="M13.6086 8.56558C6.1042 8.56558 0 14.6698 0 22.1742C0 29.6787 6.1042 35.7829 13.6086 35.7829C21.1131 35.7829 27.2173 29.6787 27.2173 22.1742C27.2173 14.6698 21.1131 8.56558 13.6086 8.56558ZM13.6086 31.4071C8.51087 31.4071 4.37577 27.261 4.37577 22.1742C4.37577 17.0874 8.52181 12.9413 13.6086 12.9413C18.6955 12.9413 22.8415 17.0874 22.8415 22.1742C22.8415 27.261 18.6955 31.4071 13.6086 31.4071Z" fill="white"/>
                <path d="M76.029 17.4156C71.8282 17.4156 68.4151 20.8287 68.4151 25.0295C68.4151 26.3641 68.7652 27.6221 69.3778 28.716C65.9647 29.4709 63.4049 32.512 63.4049 36.1439C63.4049 40.3447 66.818 43.7578 71.0187 43.7578C75.2195 43.7578 78.6326 40.3447 78.6326 36.1439C78.6326 34.8093 78.2825 33.5513 77.6699 32.4573C81.083 31.7025 83.6428 28.6613 83.6428 25.0295C83.6428 20.8287 80.2297 17.4156 76.029 17.4156ZM71.0187 40.4869C68.623 40.4869 66.6867 38.5396 66.6867 36.1549C66.6867 33.7701 68.6339 31.8228 71.0187 31.8228C73.4035 31.8228 75.3507 33.7701 75.3507 36.1549C75.3507 38.5396 73.4035 40.4869 71.0187 40.4869ZM76.029 29.3615C73.6333 29.3615 71.697 27.4143 71.697 25.0295C71.697 22.6447 73.6442 20.6975 76.029 20.6975C78.4138 20.6975 80.361 22.6447 80.361 25.0295C80.361 27.4143 78.4138 29.3615 76.029 29.3615Z" fill="white"/>
                <path d="M40.618 7.61398C40.618 3.41324 37.2049 0.000144958 33.0042 0.000144958C28.8034 0.000144958 25.3903 3.41324 25.3903 7.61398C25.3903 11.8147 28.8034 15.2278 33.0042 15.2278C37.2049 15.2278 40.618 11.8147 40.618 7.61398ZM28.6721 7.61398C28.6721 5.21825 30.6194 3.28197 33.0042 3.28197C35.389 3.28197 37.3362 5.22919 37.3362 7.61398C37.3362 9.99878 35.389 11.946 33.0042 11.946C30.6194 11.946 28.6721 9.99878 28.6721 7.61398Z" fill="white"/>
              </svg>
           </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.isHash ? (
              link.label === 'AI Assistant' ? (
                <a 
                  key={link.label} 
                  href={link.href}
                  onClick={handleAIAssistantClick}
                  className="text-[15px] font-['Roboto'] font-medium text-white/90 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <a 
                  key={link.label} 
                  href={link.href} 
                  className="text-[15px] font-['Roboto'] font-medium text-white/90 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              )
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="text-[15px] font-['Roboto'] font-medium text-white/90 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            )
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a href="https://gtk-emea--gtcx.sandbox.my.site.com/CustomerENGPortal/s/login/?cb=20260226-4" className="inline-flex items-center justify-center gap-[10px] px-[40px] py-[16px] bg-[#1D2130] rounded-[32px] text-white font-['Roboto'] text-sm hover:opacity-90 transition-opacity">
            Customer Login
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute top-24 left-4 right-4 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4 md:hidden animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link) => (
            link.isHash ? (
              link.label === 'AI Assistant' ? (
                <a 
                  key={link.label} 
                  href={link.href}
                  onClick={handleAIAssistantClick}
                  className="text-lg font-medium text-gray-200"
                >
                  {link.label}
                </a>
              ) : (
                <a 
                  key={link.label} 
                  href={link.href} 
                  className="text-lg font-medium text-gray-200"
                  onClick={() => handleNavClick(link.href, link.isHash)}
                >
                  {link.label}
                </a>
              )
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="text-lg font-medium text-gray-200"
                onClick={() => handleNavClick(link.href, link.isHash)}
              >
                {link.label}
              </Link>
            )
          ))}
          <div className="h-px bg-white/10 my-2"></div>
          <a href="https://gtk-emea--gtcx.sandbox.my.site.com/CustomerENGPortal/s/login/?cb=20260226-4" className="w-full">
            <Button variant="primary" className="w-full justify-center">Customer Login</Button>
          </a>
        </div>
      )}
    </nav>
  );
};