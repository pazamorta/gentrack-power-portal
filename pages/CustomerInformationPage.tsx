import React from 'react';
import { ScrollToTop } from '../components/ScrollToTop';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [isManual, setIsManual] = React.useState(false);
  const [entryType, setEntryType] = React.useState<'company' | 'tpi'>('company');

  return (
    <div className="bg-white min-h-screen text-gray-900 font-['Roboto'] selection:bg-[#2CD8A6]/30 relative overflow-hidden">
      <ScrollToTop />
      
      {/* Decorative Radial Gradient Background */}
      <div 
        className="absolute pointer-events-none z-0"
        style={{
          width: '1977px',
          height: '1154px',
          borderRadius: '1977px',
          background: 'radial-gradient(2762.36% 537.65% at -49.5% -250%, #D798E1 17.55%, #9BFFA5 27.56%, #AED3FF 49.89%, #C9D4EF 56.53%, #CACFFA 65.69%)',
          filter: 'blur(200px)',
          opacity: 0.5,
          top: '20%',
          right: '-800px',
        }}
      />
      
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
      <section className="py-24 px-4 md:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold mb-6 text-gray-900">Get Started Today</h2>
            <p className="text-xl text-gray-600">Fill out the form below and our team will get back to you with a tailored energy solution for your business.</p>
          </div>
          
          <section id="get-started" className="py-12 bg-transparent" style={{ scrollMarginTop: '100px' }}>
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 bg-[#3ACDFA] text-white scale-110">1</div>
                    <div className="mt-2 text-center">
                      <div className="text-xs font-medium text-gray-900">Company & Contact</div>
                      <div className="text-xs text-gray-500 mt-1 hidden md:block">Basic information</div>
                    </div>
                  </div>
                  <div className="h-1 flex-1 mx-2 transition-all duration-500 bg-gray-200" style={{ marginTop: '-24px' }}></div>
                </div>
                
                <div className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 bg-gray-200 text-gray-400 border-2 border-gray-300">2</div>
                    <div className="mt-2 text-center">
                      <div className="text-xs font-medium text-gray-400">Business Details</div>
                      <div className="text-xs text-gray-500 mt-1 hidden md:block">About your business</div>
                    </div>
                  </div>
                  <div className="h-1 flex-1 mx-2 transition-all duration-500 bg-gray-200" style={{ marginTop: '-24px' }}></div>
                </div>
                
                <div className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 bg-gray-200 text-gray-400 border-2 border-gray-300">3</div>
                    <div className="mt-2 text-center">
                      <div className="text-xs font-medium text-gray-400">Requirements</div>
                      <div className="text-xs text-gray-500 mt-1 hidden md:block">What you need</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-lg">
              {!isManual ? (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">Company and Contact Information</h3>
                  <p className="text-gray-600 mb-8">Let's start with the basics. Upload your invoice to auto-fill details.</p>
                  
                  <div className="flex justify-center mb-8">
                    <div className="bg-gray-100 p-1 rounded-full inline-flex border border-gray-300">
                      <button 
                        type="button" 
                        onClick={() => setEntryType('company')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${entryType === 'company' ? 'bg-[#00E599] text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>
                        For Your Company
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEntryType('tpi')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${entryType === 'tpi' ? 'bg-[#00E599] text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>
                        As A TPI
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="w-full mb-8">
                      <div className="relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 border-gray-200 hover:border-[#3ACDFA] bg-gray-50">
                        <input type="file" accept="image/*,application/pdf" className="hidden" />
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="mb-6 p-3 bg-white rounded-lg border border-gray-200 max-w-md">
                            <label className="flex items-start gap-3 cursor-pointer group text-left">
                              <div className="relative flex items-center mt-1">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="w-4 h-4 border-2 border-gray-300 rounded bg-white peer-checked:bg-[#00E599] peer-checked:border-[#00E599] transition-all"></div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                                I agree to the <a href="#" className="underline text-gray-900 hover:text-[#00E599]">Privacy Policy</a> and consent to the processing of my personal data.
                              </span>
                            </label>
                          </div>
                          
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#3ACDFA]">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" x2="12" y1="3" y2="15"></line>
                            </svg>
                          </div>
                          
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your latest invoice</h3>
                          <p className="text-gray-500 text-sm max-w-sm mb-6">Drag and drop or click to upload. We'll extract your company details, sites, and meter points automatically.</p>
                          <button type="button" className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors">Select File</button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <button 
                        type="button" 
                        onClick={() => setIsManual(true)}
                        className="text-sm text-gray-500 hover:text-gray-900 underline transition-colors">
                        Or enter details manually
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">Company and Contact Information</h3>
                  <p className="text-gray-600 mb-8">Let's start with the basics. Please provide the company information below.</p>
                  
                  <div className="flex justify-center mb-8">
                    <div className="bg-gray-100 p-1 rounded-full inline-flex border border-gray-300">
                      <button 
                        type="button" 
                        onClick={() => setEntryType('company')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${entryType === 'company' ? 'bg-[#00E599] text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>
                        For Your Company
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEntryType('tpi')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${entryType === 'tpi' ? 'bg-[#00E599] text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>
                        As A TPI
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 animate-fade-in">
                    {entryType === 'tpi' && (
                      <div className="mb-6">
                        <label htmlFor="tpiIdentifier" className="block text-sm font-bold text-gray-900 mb-2">TPI Identifier *</label>
                        <input 
                          type="text" 
                          id="tpiIdentifier" 
                          name="tpiIdentifier" 
                          required 
                          className="w-full px-4 py-3 bg-white border-2 border-gray-400 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#3ACDFA] focus:ring-2 focus:ring-[#3ACDFA]/20 transition-colors font-medium" 
                          placeholder="Enter your TPI Identifier" 
                        />
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-bold text-gray-900 mb-2">
                        {entryType === 'company' ? 'Company Name *' : 'Client Account Name *'}
                      </label>
                      <input 
                        type="text" 
                        id="companyName" 
                        name="companyName" 
                        required 
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3ACDFA] transition-colors" 
                        placeholder={entryType === 'company' ? "Enter company name" : "Enter client account name"} 
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="companyNumber" className="block text-sm font-bold text-gray-900 mb-2">Company Number *</label>
                      <input 
                        type="text" 
                        id="companyNumber" 
                        name="companyNumber" 
                        required 
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3ACDFA] transition-colors" 
                        placeholder="Enter company number" 
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="website" className="block text-sm font-bold text-gray-900 mb-2">Company Website</label>
                      <input 
                        type="url" 
                        id="website" 
                        name="website" 
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3ACDFA] transition-colors" 
                        placeholder="https://example.com" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="contactName" className="block text-sm font-bold text-gray-900 mb-2">Full Name *</label>
                        <input 
                          type="text" 
                          id="contactName" 
                          name="contactName" 
                          required 
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3ACDFA] transition-colors" 
                          placeholder="Your full name" 
                        />
                      </div>
                      <div>
                        <label htmlFor="jobTitle" className="block text-sm font-bold text-gray-900 mb-2">Job Title *</label>
                        <input 
                          type="text" 
                          id="jobTitle" 
                          name="jobTitle" 
                          required 
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3ACDFA] transition-colors" 
                          placeholder="e.g., Operations Manager" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">Email Address *</label>
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          required 
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3ACDFA] transition-colors" 
                          placeholder="your.email@company.com" 
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-bold text-gray-900 mb-2">Phone Number *</label>
                        <input 
                          type="tel" 
                          id="phone" 
                          name="phone" 
                          required 
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3ACDFA] transition-colors" 
                          placeholder="+1 (555) 123-4567" 
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 bg-white text-[#00E599] focus:ring-2 focus:ring-[#00E599]/50 cursor-pointer" />
                        <span className="text-sm text-gray-700">I consent to the processing of my personal data in accordance with the Privacy Policy and GDPR regulations. *</span>
                      </label>
                    </div>

                    <div className="text-center mt-6">
                      <button 
                        type="button" 
                        onClick={() => setIsManual(false)}
                        className="text-sm text-gray-500 hover:text-gray-900 underline transition-colors">
                        Back to upload
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => isManual ? setIsManual(false) : null}
                  disabled={!isManual}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${!isManual ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}>
                  <ChevronLeft size={20} />
                  Previous
                </button>
                <button type="button" className="flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all bg-gray-900 text-white hover:bg-black">
                  Next
                  <ChevronRight size={20} />
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>

      {/* Footer Section */}

    </div>
  );
};
