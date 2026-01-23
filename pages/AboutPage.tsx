import React from 'react';
import { Link } from 'react-router-dom';

const assets = {
  heroBg: '/gentrack-portal/assets/about/hero-bg.png',
  aboutOxygenTeam: '/gentrack-portal/assets/about/about-oxygen-team.png',
  oxygenLogo: '/gentrack-portal/assets/oxygen/oxygen_logo.svg',
  footerFacebook: '/gentrack-portal/assets/oxygen/footer_facebook.svg',
  footerTwitter: '/gentrack-portal/assets/oxygen/footer_twitter.svg',
  footerInstagram: '/gentrack-portal/assets/oxygen/footer_instagram.svg',
  footerLinkedin: '/gentrack-portal/assets/oxygen/footer_linkedin.svg',
  coreTeam: '/gentrack-portal/assets/about/core-team.png',
  coreHydro: '/gentrack-portal/assets/about/core-hydro.png',
  coreEnergy: '/gentrack-portal/assets/about/core-energy.png',
  solarPanels: '/gentrack-portal/assets/about/solar-panels.png',
  cleanTech: '/gentrack-portal/assets/about/clean-tech.png',
  windTurbine: '/gentrack-portal/assets/about/wind-turbine.png',
  powerPlant: '/gentrack-portal/assets/about/power-plant.png',
  engineer: '/gentrack-portal/assets/about/engineer.png',
  lightSpeed: '/gentrack-portal/assets/about/light-speed.png',
  newsTech: '/gentrack-portal/assets/about/news-tech.png',
  newsCity: '/gentrack-portal/assets/about/news-city.png',
};

export const AboutPage: React.FC = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${assets.heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/60 via-purple-800/40 to-blue-900/60 mix-blend-multiply"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center mt-[-50px]">
          <h1 
            className="text-white mb-4"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '84px',
              fontWeight: 700,
              lineHeight: '1.0',
              letterSpacing: '-2px',
            }}
          >
            Powering Business<br />with Smart Energy
          </h1>
          
          <p 
            className="text-white/90 mb-8 font-bold"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '24px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            How can I help you today?
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl transition-all duration-300 group-hover:bg-white/30"></div>
            <div className="relative bg-white rounded-full p-2 pl-6 flex items-center shadow-2xl">
              <input 
                type="text" 
                placeholder="Ask Anything About Your Energy Operations..." 
                className="flex-grow bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 font-medium text-lg font-roboto"
              />
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <button className="bg-[#00D06C] hover:bg-[#00b05b] text-white p-3 rounded-full transition-colors flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20">
          <svg className="relative block w-full h-[120px] md:h-[180px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="#FFFFFF"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="#FFFFFF"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#FFFFFF"></path>
          </svg>
        </div>
      </section>

      {/* About Oxygen Section */}
      <section className="py-24 px-4 bg-white relative z-30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Content */}
            <div className="pt-8">
              <h2 
                className="text-[#1D2130] mb-8"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '48px',
                  fontWeight: 700,
                  lineHeight: '1.2',
                }}
              >
                About Oxygen
              </h2>
              <div 
                className="text-gray-600 space-y-6"
                style={{
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '1.6',
                }}
              >
                <p>
                  Oxygen is a leading provider of low-carbon energy solutions, helping businesses and organizations transition to a sustainable, flexible, and efficient energy future.
                </p>
                <p>
                  We develop, own, and operate renewable energy assets, including wind farms and offshore wind farms, solar parks, and bio-resource facilities, to supply clean power and gas to our clients.
                </p>
                <p>
                  Oxygen is a trusted partner for energy storage, offering advanced solutions for electricity and gas. Our portfolio includes large-scale storage facilities and innovative grid-balancing projects designed to drive efficiency and reliability.
                </p>
                <p>
                  We serve thousands of business customers and organizations, supporting them in decarbonising operations, reducing energy costs, and managing market risks with sophisticated products.
                </p>
                <p>
                  Oxygen is shaping the future of energy — clean, affordable, and dependable. We’re committed to building a carbon-neutral economy and providing the power for generations to come. Join us in driving the energy transformation!
                </p>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative w-full rounded-[32px] overflow-hidden">
                <img 
                  src={assets.aboutOxygenTeam} 
                  alt="Oxygen team"
                  className="w-full h-auto object-cover"
                />
                
                {/* Green Pill Overlay */}
                <div className="absolute top-8 right-8 bg-[#00D06C] rounded-full px-6 py-3 flex items-center gap-3 shadow-lg">
                  <div className="bg-white/20 p-1.5 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
                      <path d="M8.5 8.5v.01"/>
                      <path d="M16 15.5v.01"/>
                      <path d="M12 12v.01"/>
                    </svg>
                  </div>
                  <span className="text-white font-bold font-roboto">AI Assistant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Power networks & tailored solutions */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#3ACDFA] font-bold mb-2 font-roboto tracking-wide uppercase text-sm">Power networks & tailored solutions</p>
          <h2 
            className="text-[#1D2130] mb-12"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '48px',
              fontWeight: 700,
              lineHeight: '1.2',
            }}
          >
            Core expertise
          </h2>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                image: assets.coreTeam,
                title: 'Energy Supply',
                description: 'We provide energy for 17,000 UK businesses, leveraging 20 years of expertise alongside exceptional customer service.'
              },
              {
                image: assets.coreEnergy,
                title: 'Biomethane',
                description: 'Our anaerobic digestion facilities across the South West generate green energy, supplying homes and businesses in the local community.'
              },
              {
                image: assets.coreHydro,
                title: 'Pumped storage hydro',
                description: 'We plan and pumped storage hydro plants used the UK in power storage and grid flexibility with a combined capacity of 2.1 GW.'
              }
            ].map((item, index) => (
              <div key={index} className="flex flex-col">
                <div className="rounded-3xl overflow-hidden mb-6 h-[260px]">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 
                  className="text-[#1D2130] mb-3"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif", // Changed to Space Grotesk based on Design screenshot
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '1.4',
                  }}
                >
                  {item.title}
                </h3>
                <p 
                  className="text-gray-600 text-sm"
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    lineHeight: '1.6',
                  }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Oxygen in Numbers Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] relative overflow-hidden">
        {/* Background Overlay or Pattern if needed */}
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="text-white/80 font-bold mb-2 font-roboto uppercase text-sm">Key figures</p>
          <h2 
            className="text-white mb-16"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '48px',
              fontWeight: 700,
              lineHeight: '1.2',
            }}
          >
            Oxygen in numbers
          </h2>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 border-t border-white/20 pt-12">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ), // Plant icon replacement
                number: '2.1 GW',
                label: 'Low-carbon power, featuring Europe\'s largest pumped storage hydro power plant at Dinorwig, Wales.'
              },
              {
                icon: (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                number: 'No. 1',
                label: 'A leading provider of energy storage and flexibility services both gas and electricity.'
              },
              {
                 icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                ),
                number: '20,000',
                label: 'One of the largest power purchase suppliers, trading around 20,000 business customers with 20 years of expertise.'
              }
            ].map((stat, index) => (
              <div key={index} className="text-white">
                <div className="mb-6">{stat.icon}</div>
                <div 
                  className="mb-3"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '36px',
                    fontWeight: 700,
                  }}
                >
                  {stat.number}
                </div>
                <p 
                  className="text-white/80 text-sm leading-relaxed"
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Powering Progress Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#3ACDFA] font-bold mb-2 font-roboto tracking-wide uppercase text-sm">Why Oxygen?</p>
          <h2 
            className="text-[#1D2130] mb-12 max-w-2xl"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '48px',
              fontWeight: 700,
              lineHeight: '1.2',
            }}
          >
            Powering Progress with Positive Energy
          </h2>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
            {[
              {
                image: assets.solarPanels,
                title: 'Demand Response & Flexibility',
                description: 'Leverage our energy management expertise to optimize your assets and unlock greater flexibility and value.'
              },
              {
                image: assets.cleanTech,
                title: 'Green Gas',
                description: 'A sustainable alternative to traditional gas, reducing your carbon footprint.'
              },
              {
                image: assets.windTurbine,
                title: 'Green Power',
                description: '100% renewable electricity tailored for your environmental and CSR goals.'
              },
              {
                image: assets.powerPlant,
                title: 'Power Purchase Agreements',
                description: 'Tailored, bankable PPA solutions designed to meet your business needs and lock in long-term rates.'
              },
              {
                image: assets.engineer,
                title: 'Gas Purchasing Agreements',
                description: 'Whether you are an energy producer or a business looking to secure stable gas supply, we define tailored plans around your objectives.'
              },
              {
                image: assets.lightSpeed,
                title: 'Market Access',
                description: 'Our expert traders connect your assets to a wide range of energy markets across the globe.'
              }
            ].map((item, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden mb-6">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div>
                  <h3 
                    className="text-[#1D2130] mb-3"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '20px',
                      fontWeight: 700,
                      lineHeight: '1.4',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="text-gray-600 text-sm"
                    style={{
                      fontFamily: "'Roboto', sans-serif",
                      lineHeight: '1.6',
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* What's New Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 
            className="text-[#1D2130] mb-12 text-center"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '48px',
              fontWeight: 700,
              lineHeight: '1.2',
            }}
          >
            What's new?
          </h2>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                image: assets.newsTech,
                title: 'Powering Smarter Business Energy',
                description: 'Oxygen is helping businesses take control of their energy costs with next-generation storage and smart meter solutions – designed for resilience, sustainability, and long-term performance.',
                date: 'Luke Mathieson | February 5, 2024'
              },
              {
                image: assets.newsCity,
                title: 'Accelerating the Transition to Clean Energy',
                description: 'At Oxygen, we partner with businesses to deliver flexible, low-carbon energy solutions that reduce risk, improve efficiency, and unlock new sources of value.',
                date: 'Luke Mathieson | February 5, 2024'
              },
              {
                 image: assets.lightSpeed, // Reusing existing image as placeholder for third item if needed or generic
                 title: 'Clean Energy Built for Business',
                 description: 'From renewable generation to advanced storage and market optimization, Oxygen delivers positive energy solutions powering wealth creators to sustainable success.',
                 date: 'Luke Mathieson | February 5, 2024'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white group cursor-pointer">
                 <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-6">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                 <div className="pr-4">
                  <h3 
                    className="text-[#1D2130] mb-3"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '20px',
                      fontWeight: 700,
                      lineHeight: '1.4',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="text-gray-600 text-sm mb-4 line-clamp-3"
                    style={{
                      fontFamily: "'Roboto', sans-serif",
                      lineHeight: '1.6',
                    }}
                  >
                    {item.description}
                  </p>
                  <p className="text-gray-400 text-xs font-roboto">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-white to-blue-50/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            className="text-[#1D2130] mb-6"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '48px',
              fontWeight: 700,
            }}
          >
            Are you ready to grow your<br/>business with us?
          </h2>
          <p className="text-gray-500 mb-8 font-roboto">Talk to our AI and take your business to the next level today.</p>
          <Link 
            to="/get-started"
            className="inline-flex items-center justify-center px-10 py-3 rounded-full text-white font-medium transition-all hover:opacity-90 hover:scale-105"
            style={{
              background: '#3ACDFA',
              fontFamily: "'Roboto', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(58, 205, 250, 0.3)',
            }}
          >
            Get started
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
    </>
  );
};
