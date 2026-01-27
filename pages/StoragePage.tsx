import React from 'react';
import { Navbar } from '../components/Navbar';
// import { Footer } from '../components/Footer';
import { ScrollToTop } from '../components/ScrollToTop';

import { Link } from 'react-router-dom';

const assets = {
  heroLandscape: '/gentrack-power-portal/assets/oxygen/hero_landscape.png',
  heroBg: '/gentrack-power-portal/assets/oxygen/storage/hero_bg.png',
  contentImg: '/gentrack-power-portal/assets/oxygen/storage/content_img.png', // Leaving for potential re-use
  batteryImg: '/gentrack-power-portal/assets/oxygen/storage/battery_img.png',
  hydroImg: '/gentrack-power-portal/assets/oxygen/storage/hydro_img.png',
  customerStoryImg: '/gentrack-power-portal/assets/oxygen/storage/customer_story_bg.png',
  // fullWidthDisplay: '/gentrack-power-portal/assets/oxygen/storage/full_width_storage.png', // Replaced
  wideSectionBg: '/gentrack-power-portal/assets/oxygen/storage/wide_section_bg.png', // New background
  circularFeature: '/gentrack-power-portal/assets/oxygen/storage/circular_feature.png', // Reverted to original
  controlRoom: '/gentrack-power-portal/assets/oxygen/storage/control_room.jpg', // Specific asset for control room
  storageFeature: '/gentrack-power-portal/assets/oxygen/storage/storage_feature.png',
  grid1: '/gentrack-power-portal/assets/oxygen/storage/office_environment.jpg', // New office image
  maskGraphic: '/gentrack-power-portal/assets/oxygen/mask_graphic.svg',
  maskGraphicLayer2: '/gentrack-power-portal/assets/oxygen/mask_graphic_layer2.svg',
  customerStoryReplacement: '/gentrack-power-portal/assets/oxygen/storage/customer_story_replacement.svg',
  // Footer Assets
  oxygenLogo: '/gentrack-power-portal/assets/oxygen/oxygen_logo.svg',
  footerLinkedin: '/gentrack-power-portal/assets/oxygen/footer_linkedin.svg',
  footerInstagram: '/gentrack-power-portal/assets/oxygen/footer_instagram.svg',
  footerFacebook: '/gentrack-power-portal/assets/oxygen/footer_facebook.svg',
  footerTwitter: '/gentrack-power-portal/assets/oxygen/footer_twitter.svg',
};

export const StoragePage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen text-gray-900 font-['Roboto'] selection:bg-[#2CD8A6]/30">
      <ScrollToTop />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center overflow-hidden">
        <img src={assets.heroBg} alt="Storage Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center text-white">
           <h1 className="text-white text-center font-['Space_Grotesk'] font-bold mb-6 max-w-5xl mx-auto leading-[0.97] tracking-[-5.032px] drop-shadow-lg" style={{ fontSize: '59.146px', fontFeatureSettings: "'ss01' on, 'ss04' on" }}>
             Building resilient, clean power and energy storage solutions for business needs
           </h1>
           <p className="text-xl md:text-2xl font-light opacity-90 max-w-3xl mx-auto">
             As energy systems evolve, Oxygen supports organisations with renewable generation and flexible storage infrastructure that improve reliability, reduce carbon emissions and enhance operational agility.
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

      {/* Generation Section */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div>
              <h2 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold mb-6 text-gray-900">
                Clean power assets built for the future
              </h2>
              <div className="text-gray-600 text-lg leading-relaxed mb-8 whitespace-pre-line">
                Oxygen invests in, develops and operates a broad portfolio of renewable energy generation assets that help businesses access locally sourced clean energy and reduce dependence on fossil fuels.
                
                <strong className="block mt-4 text-gray-900">Our generation capabilities include:</strong>
                
                <span className="block mt-2"><strong className="text-gray-900">Solar Energy</strong><br/>High‑performance solar generation facilities provide scalable clean electricity that supports commercial and industrial demand throughout the day.</span>
                
                <span className="block mt-2"><strong className="text-gray-900">Onshore Wind Projects</strong><br/>Strategically located onshore wind farms harness wind resources to deliver consistent, zero‑carbon power.</span>
                
                <span className="block mt-2"><strong className="text-gray-900">Offshore Wind Partnerships</strong><br/>Through collaborations and joint ventures, Oxygen expands offshore wind capacity to meet large‑scale corporate power needs.</span>
                
                <span className="block mt-4">Each renewable asset contributes to a more secure, sustainable energy mix for business clients, helping meet environmental goals and operational reliability targets.</span>
              </div>
           </div>
           
           <div className="relative flex justify-center">
              <div className="relative w-full max-w-[554px] aspect-square rounded-full overflow-hidden shadow-2xl">
                 <img src={assets.contentImg} className="w-full h-full object-cover" alt="Renewable Generation" />
              </div>
           </div>
        </div>
      </section>

      {/* Full Width Image Divider (Updated with Design Image) */}
      <section className="relative w-full h-[559px] my-24 overflow-hidden">
         <div className="absolute inset-0 w-full h-full">
            <img src={assets.circularFeature} className="w-full h-full object-cover" alt="Renewable Energy Future" />
         </div>
      </section>

      {/* Storage Technologies & Grid Flexibility */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Image */}
            <div className="relative">
               <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img src={assets.storageFeature} className="w-full h-auto object-cover" alt="Battery Storage Systems" />
               </div>
               {/* Blur Gradient Effect */}
               <div className="absolute -z-10 -bottom-12 -left-12 w-full h-full bg-[#3ACDFA]/20 blur-[100px] rounded-full" />
            </div>

            {/* Right Content */}
            <div className="flex flex-col">
               <span className="font-['Roboto'] text-2xl font-bold leading-[1.2] bg-clip-text text-transparent bg-gradient-to-br from-[#AE47EA] to-[#3ACDFA]" style={{ background: 'linear-gradient(54deg, #AE47EA 15.02%, #3ACDFA 82.83%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Energy Storage & Grid Flexibility
               </span>
               <h2 className="text-4xl font-['Space_Grotesk'] font-bold mb-6 leading-tight text-gray-900">
                  Storing energy for reliability and performance
               </h2>
               <p className="text-gray-600 text-[16px] leading-[1.5] mb-8">
                  Energy storage plays a central role in a future‑ready energy system — capturing power when supply is ample, and releasing it when demand spikes. Oxygen’s storage solutions help businesses and grid operators balance supply and demand.
               </p>

               {/* Pumped Hydro */}
               <h3 className="text-2xl font-['Roboto'] font-bold mb-4 text-gray-900">Pumped Hydropower Storage</h3>
               <p className="text-gray-600 text-[16px] leading-[1.5] mb-8">
                  We deploy large‑scale pumped storage facilities that act like natural batteries, storing energy as potential energy and releasing it instantly to stabilise the grid when needed.
               </p>

               {/* BESS */}
               <h3 className="text-2xl font-['Roboto'] font-bold mb-4 text-gray-900">Battery Energy Storage Systems (BESS)</h3>
               <p className="text-gray-600 text-[16px] leading-[1.5] mb-6">
                  Advanced battery systems allow us to store renewable energy from solar or wind and discharge it during peak times, reducing reliance on conventional peaking power and improving carbon performance. These systems also offer:
               </p>
               <ul className="space-y-3">
                  {['Peak shaving and demand response', 'Enhanced energy resilience', 'Integration support for intermittent renewables'].map(item => (
                    <li key={item} className="flex items-start gap-3">
                       <div className="mt-2 w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
                       <span className="text-gray-700 text-[16px] font-['Roboto'] font-bold">{item}</span>
                    </li>
                  ))}
               </ul>
            </div>
         </div>
      </section>

      {/* Solutions designed for today's challenges */}
      <section className="bg-white py-24 px-4 md:px-8">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
               <span className="font-['Roboto'] text-2xl font-bold leading-[1.2] bg-clip-text text-transparent bg-gradient-to-br from-[#AE47EA] to-[#3ACDFA] mb-4 block" style={{ background: 'linear-gradient(54deg, #AE47EA 15.02%, #3ACDFA 82.83%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Integrated Generation + Storage for Your Business
               </span>
               <h2 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold mb-8 text-[#1d2130] leading-tight">
                  Solutions designed for today’s challenges
               </h2>
               
               <div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                     Oxygen doesn’t just build assets — we deliver integrated generation and storage services that help businesses manage energy risk, improve sustainability metrics, and unlock new value streams. Our flexible approach includes:
                  </p>
                  
                  <ul className="space-y-3 mb-6">
                     {[
                        'On-site generation & storage planning',
                        'Hybrid energy system deployment',
                        'Commercial structuring and performance optimisation',
                        'Grid and market integration for flexible assets'
                     ].map(item => (
                        <li key={item} className="flex items-start gap-3">
                           <div className="mt-2 w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
                           <span className="text-gray-700 font-bold">{item}</span>
                        </li>
                     ))}
                  </ul>

                  <p className="text-gray-600 leading-relaxed text-sm">
                     These offerings enable enterprises to make the most of clean power, while smoothing intermittency and enhancing system reliability.
                  </p>
               </div>
            </div>

            {/* Right Image (Circular) - Updated */}
            <div className="relative flex justify-center">
               <div className="relative w-full max-w-[500px] aspect-square rounded-full overflow-hidden shadow-2xl">
                   <img src={assets.controlRoom} className="w-full h-full object-cover" alt="Control Room" />
               </div>
            </div>
         </div>
      </section>

      {/* Why Choose Oxygen */}
      <section className="bg-gray-50 py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center md:text-left grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Left */}
            <div className="relative flex justify-center">
               <div className="relative w-full max-w-[500px] aspect-square rounded-full overflow-hidden shadow-2xl">
                  <img src={assets.grid1} className="w-full h-full object-cover" alt="Why Choose Oxygen" /> 
               </div>
            </div>

            {/* Text Right */}
            <div>
               <span className="font-['Roboto'] text-2xl font-bold leading-[1.2] bg-clip-text text-transparent bg-gradient-to-br from-[#AE47EA] to-[#3ACDFA] mb-2 block" style={{ background: 'linear-gradient(54deg, #AE47EA 15.02%, #3ACDFA 82.83%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Why Choose Oxygen for Generation & Storage?
               </span>
               <h2 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold mb-8 text-gray-900">
                  Resilience, Sustainability & Performance
               </h2>
               
               <ul className="space-y-6">
                  {[
                     { 
                        title: 'Reliable, scalable clean energy capacity', 
                        desc: 'We deploy generation assets that support business continuity and long‑term decarbonisation targets.' 
                     },
                     { 
                        title: 'Advanced storage infrastructure', 
                        desc: 'With both pumped and battery storage solutions, we deliver grid‑ready energy flexibility and operational resilience.' 
                     },
                     { 
                        title: 'Expert integration and optimisation', 
                        desc: 'Our technical teams ensure that generation and storage work together efficiently to meet evolving energy needs.' 
                     }
                  ].map(item => (
                     <li key={item.title}>
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
                           <h3 className="text-gray-900 font-bold text-lg">{item.title}</h3>
                        </div>
                        <p className="text-gray-600 ml-5 leading-relaxed">
                           {item.desc}
                        </p>
                     </li>
                  ))}
               </ul>

               <p className="text-gray-600 mt-8 ml-5 leading-relaxed">
                  Whether you’re reducing carbon footprint, strengthening energy security, or seeking new energy revenue opportunities, Oxygen’s generation and storage ecosystem is engineered for business success.
               </p>
            </div>
        </div>
      </section>



      {/* CTA Section (Updated Branding) */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Background Gradient */}
        <div 
          className="absolute inset-0 z-0 opacity-40"
          style={{
            background: 'radial-gradient(2762.36% 537.65% at -49.5% -250%, #D798E1 17.55%, #9BFFA5 27.56%, #AED3FF 49.89%, #C9D4EF 56.53%, #CACFFA 65.69%)',
            filter: 'blur(100px)',
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-[#1D2130] text-5xl md:text-6xl font-['Space_Grotesk'] font-bold mb-6 leading-[0.97] tracking-[-4px]" style={{ fontFeatureSettings: "'ss01' on, 'ss04' on" }}>
            Are you ready to grow your<br/>business with us?
          </h2>
          <p className="text-gray-600 text-lg mb-8 font-roboto font-medium opacity-80">Talk to our AI and take your business to the next level today.</p>
          <Link 
            to="/platform#get-started"
            className="inline-flex items-center justify-center px-10 py-4 rounded-full text-white font-bold transition-all hover:opacity-90 hover:scale-105 shadow-lg"
            style={{
              background: '#3ACDFA',
              fontSize: '18px',
            }}
          >
            Get a quote now
          </Link>
        </div>
      </section>

      {/* Footer Section (Oxygen Design) */}
      <section className="bg-[#1d2130] text-white py-16 px-4 md:px-8">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 pb-12 mb-12">
            {/* Column 1: Company */}
            <div>
               <h4 className="font-['Roboto'] font-bold text-lg mb-6">Company</h4>
               <ul className="space-y-4 text-gray-400 text-sm font-['Roboto']">
                  <li><a href="#" className="hover:text-white transition-colors">Company Overview</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Values</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Partners & Community</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Team & Leadership</a></li>
               </ul>
            </div>

            {/* Column 2: Solutions & Infrastructure */}
            <div>
               <h4 className="font-['Roboto'] font-bold text-lg mb-6">Solutions & Infrastructure</h4>
               <ul className="space-y-4 text-gray-400 text-sm font-['Roboto']">
                  <li><a href="#" className="hover:text-white transition-colors">Energy Supply</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Energy Management</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Renewable Energy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Power Storage</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Gas Storage</a></li>
               </ul>
            </div>

            {/* Column 3: Customer Resources */}
            <div>
               <h4 className="font-['Roboto'] font-bold text-lg mb-6">Customer Resources</h4>
               <ul className="space-y-4 text-gray-400 text-sm font-['Roboto']">
                  <li><a href="#" className="hover:text-white transition-colors">Supply Information</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Help & Support</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Latest News</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
               </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div>
               <img src={assets.oxygenLogo} alt="Oxygen" className="w-[101px] h-[36.191px] mb-8" />
               
               <h4 className="font-['Roboto'] font-bold text-lg mb-4">Subscribe to our Newsletter</h4>
               <div className="flex bg-[#2B2E3C] rounded-[8px] p-1 border border-white/10">
                  <input 
                    type="email" 
                    placeholder="Enter your Email" 
                    className="bg-transparent text-white text-sm px-4 py-2 w-full focus:outline-none placeholder-gray-500"
                  />
                  <button className="bg-white text-[#1d2130] font-bold text-sm px-6 py-2 rounded-[6px] hover:bg-gray-100 transition-colors">
                     Subscribe
                  </button>
               </div>
            </div>
         </div>
         
         <div className="max-w-7xl mx-auto flex items-center justify-center gap-8 text-xs text-gray-500 font-['Roboto']">
            <div className="h-px bg-white/10 flex-grow"></div>
            
            <div className="flex items-center gap-8 flex-shrink-0">
               <p>© Copyright Oxygen 2026</p>
               <div className="flex gap-6">
                  <a href="#" className="hover:opacity-100 transition-opacity opacity-70"><img src={assets.footerFacebook} className="h-5 w-5" alt="Facebook" /></a>
                  <a href="#" className="hover:opacity-100 transition-opacity opacity-70"><img src={assets.footerTwitter} className="h-5 w-5" alt="Twitter" /></a>
                  <a href="#" className="hover:opacity-100 transition-opacity opacity-70"><img src={assets.footerInstagram} className="h-5 w-5" alt="Instagram" /></a>
                  <a href="#" className="hover:opacity-100 transition-opacity opacity-70"><img src={assets.footerLinkedin} className="h-5 w-5" alt="LinkedIn" /></a>
               </div>
            </div>

            <div className="h-px bg-white/10 flex-grow"></div>
         </div>
      </section>

    </div>
  );
};
