import React from 'react';

const assets = {
  oxygenLogo: '/gentrack-portal/assets/oxygen/oxygen_logo.svg',
  footerFacebook: '/gentrack-portal/assets/oxygen/footer_facebook.svg',
  footerTwitter: '/gentrack-portal/assets/oxygen/footer_twitter.svg',
  footerInstagram: '/gentrack-portal/assets/oxygen/footer_instagram.svg',
  footerLinkedin: '/gentrack-portal/assets/oxygen/footer_linkedin.svg',
};

export const Footer: React.FC = () => {
  return (
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
  );
};