import React, { useState } from 'react';
import { Check, Plus, Minus } from 'lucide-react';

const assets = {
  heroLandscape: '/gentrack-portal/assets/oxygen/hero_landscape.png',
  officeTeam: '/gentrack-portal/assets/oxygen/office_team.png',
  grid1: '/gentrack-portal/assets/oxygen/grid_img_1.png',
  grid2: '/gentrack-portal/assets/oxygen/grid_img_2.png',
  grid3: '/gentrack-portal/assets/oxygen/grid_img_3.png',
  circleGraphic: '/gentrack-portal/assets/oxygen/circle_graphic.svg',
  circleGraphicNew: '/gentrack-portal/assets/oxygen/circle_graphic_new.png',
  oxygenLogo: '/gentrack-portal/assets/oxygen/oxygen_logo.svg',
  maskGraphic: '/gentrack-portal/assets/oxygen/mask_graphic.svg', // Vector 18
  maskGraphicLayer2: '/gentrack-portal/assets/oxygen/mask_graphic_layer2.svg', // Vector 19
  whyChooseBg: '/gentrack-portal/assets/oxygen/why_choose_bg.svg',
  customerSupport: '/gentrack-portal/assets/oxygen/customer_support.png',
  pricingBlur1: '/gentrack-portal/assets/oxygen/pricing_blur_1.svg',
  pricingBlur2: '/gentrack-portal/assets/oxygen/pricing_blur_2.svg',
  featureCheck: '/gentrack-portal/assets/oxygen/feature_check.svg',
  planIconBasic: '/gentrack-portal/assets/oxygen/product_icon_basic.png',
  planIconPro: '/gentrack-portal/assets/oxygen/product_icon_pro.png',
  planIconEnterprise: '/gentrack-portal/assets/oxygen/product_icon_enterprise.png',
  footerLinkedin: '/gentrack-portal/assets/oxygen/footer_linkedin.svg',
  footerInstagram: '/gentrack-portal/assets/oxygen/footer_instagram.svg',
  footerFacebook: '/gentrack-portal/assets/oxygen/footer_facebook.svg',
  footerTwitter: '/gentrack-portal/assets/oxygen/footer_twitter.svg',
  footerLogo: '/gentrack-portal/assets/oxygen/footer_logo.svg',
};

const pricingPlans = [
  {
    name: 'Basic',
    price: '£500',
    desc: 'Per month',
    features: [
      'Up to 10,000 kWh per month',
      'Standard Customer Support',
      '1 Month Trial',
      'Access to Energy Usage Dashboard',
      'Basic Renewable Options'
    ]
  },
  {
    name: 'Professional',
    price: '£1,200',
    desc: 'Per month',
    highlight: true,
    features: [
      'Up to 100,000 kWh per month',
      'Priority Customer Support',
      '1 Month Trial',
      'Advanced Energy Usage Dashboard',
      '50% Renewable Energy Mix'
    ]
  },
  {
    name: 'Enterprise',
    price: '£2,000',
    desc: 'Per month',
    features: [
      'Up to 500,000 kWh per month',
      '24/7 Dedicated Support',
      '1 Month Trial',
      'Full Analytics & Reporting Dashboard',
      '100% Renewable Energy'
    ],
    icon: null, // Enterprise uses CSS fallback
  }
];

const faqs = [
  { q: "What services does Oxygen provide?", a: "From renewable energy sourcing and energy efficiency consulting to smart grid integration and sustainability planning, we work to help companies reduce costs, lower their carbon footprint, and future-proof their energy strategy." },
  { q: "How can I become an Oxygen partner?", a: "Simply click the 'Get a strict quote' button or contact our sales team to discuss partnership opportunities." },
  { q: "What industries does Oxygen serve?", a: "We serve a wide range of industries including manufacturing, retail, logistics, and public sector organizations." },
  { q: "How does Oxygen promote sustainability?", a: "We prioritize 100% renewable energy sources and help clients implement circular economy practices." }
];

const FAQItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-bold text-gray-900 text-lg">{q}</span>
        {isOpen ? <Minus className="text-gray-400" /> : <Plus className="text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-gray-600 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
};

export const SolutionsPage: React.FC = () => {
  console.log('Rendering SolutionsPage (Oxygen Design)');
  const [activeSegment, setActiveSegment] = useState('SME');

  return (
    <div className="bg-white min-h-screen text-gray-900 font-['Roboto'] selection:bg-[#2CD8A6]/30">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center overflow-hidden">
        <img src={assets.heroLandscape} alt="Green Energy Landscape" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center text-white">
           <h1 className="text-[59.146px] font-['Space_Grotesk'] font-bold mb-6 max-w-5xl mx-auto leading-[0.97] tracking-[-5.032px] drop-shadow-lg" style={{ fontFeatureSettings: "'ss01' on, 'ss04' on" }}>
             Integrated Energy Solutions<br />for a Sustainable Future
           </h1>
           <p className="text-xl md:text-2xl font-light opacity-90 max-w-2xl mx-auto">
             Empowering businesses with reliable, low-carbon and cost-effective energy strategies.
           </p>
        </div>
        
        {/* Mask Divider */}
        <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
           {/* Vector 19 (Layer 2) - Behind, slightly offset or different opacity if needed by design, though SVG has opacity 0.4 */}
           <img src={assets.maskGraphicLayer2} className="absolute bottom-0 left-0 w-full h-auto object-cover" alt="" />
           {/* Vector 18 (Layer 1) - Front */}
           <img src={assets.maskGraphic} className="relative w-full h-auto object-cover" alt="" />
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div>
              <img src={assets.oxygenLogo} alt="Oxygen" className="mb-6 w-[122px] h-[47.118px]" />
              <h2 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold mb-6 text-gray-900">
                One partner, multiple energy capabilities
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Oxygen delivers end-to-end energy solutions tailored to meet the complex needs of modern businesses. From energy supply and modernization to innovative generation, storage and trading, we help you procure clean power, optimize costs and accelerate your journey to Net Zero.
              </p>
              <button className="px-8 py-3 bg-[#3ACDFA] text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                Get a quick quote
              </button>
           </div>
           <div className="relative flex justify-center">
              <div className="relative w-[400px] h-[400px]">
                 <div className="w-full h-full rounded-full overflow-hidden shadow-2xl relative z-10">
                    <img src={assets.circleGraphicNew} className="w-full h-full object-cover scale-110" alt="AI Powered Solutions" />
                 </div>
                 <div className="absolute -right-12 top-1/2 -translate-y-1/2 bg-[#00D084] text-[#0b0d17] px-6 py-3 rounded-full font-bold flex items-center shadow-lg z-20">
                    AI Assistant
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Segments / Tabs Section */}
      <section className="bg-gray-50 py-24 px-4 md:px-8">
         <div className="max-w-7xl mx-auto">
            <div className="flex justify-center gap-4 mb-16">
               {['Micro Business', 'Small & Medium Enterprise', 'Large Business'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveSegment(tab === 'Small & Medium Enterprise' ? 'SME' : tab)}
                   className={`px-6 py-2 rounded-full font-medium transition-all ${
                     (activeSegment === 'SME' && tab.includes('Small')) || activeSegment === tab 
                     ? 'bg-[#A55FEE] text-white shadow-md' 
                     : 'bg-white text-gray-500 hover:bg-gray-100'
                   }`}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white rounded-[32px] p-8 md:p-12 shadow-sm">
                <img src={assets.officeTeam} alt="Office" className="rounded-2xl w-full h-[400px] object-cover shadow-md" />
                <div>
                   <span className="text-[#A55FEE] font-bold">Small & Medium Enterprise</span>
                   <h3 className="text-4xl font-['Space_Grotesk'] font-bold mb-6 mt-2">Business Energy Solutions</h3>
                   <p className="text-gray-600 mb-6">
                     Oxygen provides tailored electricity supply solutions for businesses, large and small. We offer reliable supply, accurate billing and expert account management alongside energy efficiency advice.
                   </p>
                   <ul className="space-y-3 mb-8">
                      {['Clean energy consumption and carbon reporting', 'Zero cost, app-first interface upgrades', 'Total sustainability strategy and net zero ambitions'].map(item => (
                        <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                           <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                           {item}
                        </li>
                      ))}
                   </ul>
                   <button className="px-8 py-3 bg-[#3ACDFA] text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all">
                      Get a strict quote
                   </button>
                </div>
            </div>
         </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-24 px-4 md:px-8 max-w-[1373px] mx-auto">
         {/* Background Blur Gradients */}
         <div className="absolute top-[297px] right-[67px] w-[590px] h-[590px] pointer-events-none z-0">
            <img src={assets.pricingBlur1} className="w-full h-full object-cover" alt="" />
         </div>
         <div className="absolute top-[135px] right-[750px] w-[556px] h-[556px] pointer-events-none z-0">
             <img src={assets.pricingBlur2} className="w-full h-full object-cover" alt="" />
         </div>

         <div className="relative z-10 text-center mb-16">
            <h2 className="text-4xl md:text-[56px] font-['Space_Grotesk'] font-bold mb-4 leading-[1.1] text-[#1d2130]">
              Energy Plans That Power Your Business
            </h2>
            <p className="text-[#6d6e76] text-lg font-['Roboto'] mt-4 max-w-2xl mx-auto">
              Reliable and flexible energy solutions tailored to your company's needs.
            </p>
            
            <div className="flex justify-center gap-2 mt-8 bg-[#F5F7FA] p-1 rounded-full w-fit mx-auto border border-[#EBEBEB]">
               <button className="px-6 py-3 bg-[#1d2130] text-white rounded-full text-sm font-bold shadow-sm">Yearly</button>
               <button className="px-6 py-3 text-[#6d6e76] rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">Monthly</button>
            </div>
         </div>

         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {pricingPlans.map((plan, idx) => (
               <div key={plan.name} className={`relative flex flex-col h-full bg-white rounded-[24px] p-8 transition-all duration-300 ${plan.highlight ? 'shadow-2xl scale-105 border border-[#3ACDFA]' : 'border border-transparent hover:border-gray-200 hover:shadow-xl'}`}>
                  {/* Card specific styles based on index or highlight */}
                  
                  {/* Header: Icon & Plan Name */}
                  <div className="flex flex-col items-start gap-4 mb-2">
                     <div className="w-[54px] h-[54px] relative">
                        {idx === 0 && <img src={assets.planIconBasic} className="w-full h-full object-contain" alt="Basic Plan" />}
                        {idx === 1 && <img src={assets.planIconPro} className="w-full h-full object-contain" alt="Pro Plan" />}
                        {idx === 2 && <img src={assets.planIconEnterprise} className="w-full h-full object-contain" alt="Enterprise Plan" />}
                     </div>
                     <span className="text-[#1d2130] font-bold text-2xl font-['Roboto']">{plan.name}</span>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-[#EBEBEB] my-6"></div>

                  <ul className="space-y-4 mb-8 flex-grow">
                     {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-4 text-[16px] font-normal text-[#1d2130] leading-[1.5]">
                           <img src={assets.featureCheck} className="w-6 h-6 flex-shrink-0 mt-0.5" alt="check" />
                           <span>{f}</span>
                        </li>
                     ))}
                  </ul>

                  <div className="pt-4 mt-auto">
                     <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-[36px] font-bold text-[#1d2130]">{plan.price}</span>
                        <span className="text-[12px] font-normal text-[#1d2130] opacity-60 uppercase tracking-wide">{plan.desc}</span>
                     </div>
                     <button className={`w-full py-4 rounded-[12px] font-bold text-[16px] transition-all mt-4 ${plan.highlight ? 'bg-[#3ACDFA] text-white shadow-lg hover:shadow-xl hover:bg-[#2cbcf0]' : 'bg-[#1d2130] text-white hover:bg-black shadow-md'}`}>
                        Get started
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </section>



      {/* Why Choose Oxygen Section */}
      <section className="relative py-32 px-4 md:px-8 overflow-hidden">
         {/* Background Gradient/Mask */}
         <div className="absolute inset-0 z-0">
             <img src={assets.whyChooseBg} className="w-full h-full object-cover" alt="" />
         </div>
         
         <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div>
                <h2 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold mb-8 text-[#1d2130]">
                  Why Choose Oxygen for Your Business Energy Needs?
                </h2>
                <div className="space-y-6 text-[#6d6e76] text-lg font-['Roboto'] leading-relaxed">
                   <p>
                     Oxygen is a forward-thinking business energy provider, helping companies take control of their energy costs, lower their environmental impact, and rely on a stable, future-proof energy supply. At Oxygen, we believe clean energy is not just an option — it’s a responsibility.
                   </p>
                   <p>
                     Our expertise in business energy solutions, from small enterprises to large, complex organisations, ensures access to flexible electricity, gas, and renewable energy options tailored to your operational needs. We help your business grow sustainably while staying competitive in a rapidly changing energy landscape.
                   </p>
                   <p className="border-l-4 border-[#3ACDFA] pl-6 font-medium text-[#1d2130]">
                     Oxygen offers 100% renewable electricity solutions, sourced from clean energy production that generates zero carbon emissions and preserves natural resources for future generations.
                   </p>
                   <p>
                     Driven by innovation and transparency, Oxygen is committed to powering your business with clarity, efficiency, and purpose — towards a cleaner, smarter, and more sustainable future.
                   </p>
                </div>
             </div>
             
             <div className="flex justify-center lg:justify-end">
                <div className="relative w-[500px] h-[500px] rounded-full overflow-hidden shadow-2xl border-8 border-white/20">
                   <img src={assets.customerSupport} className="w-full h-full object-cover" alt="Customer Support" />
                </div>
             </div>
         </div>
      </section>

      {/* Smart Solutions Grid */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
         <div className="flex justify-between items-end mb-12">
            <div>
               <span className="text-[#3ACDFA] font-bold uppercase tracking-wider text-sm">Energizing Your Business Responsibly</span>
               <h2 className="text-4xl font-['Space_Grotesk'] font-bold mt-2">Smart Solutions for Every Enterprise</h2>
            </div>
            <button className="px-6 py-2 bg-[#DAEDFF] text-[#1d2130] rounded-full text-sm font-bold hover:bg-[#cce5ff]">
               View more strategies
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[ 
               { title: 'Electricity and Gas', img: assets.heroLandscape },
               { title: 'Green Gas', img: assets.grid1 },
               { title: 'Green Power', img: assets.grid3 }
            ].map(item => (
               <div key={item.title} className="group cursor-pointer">
                  <div className="rounded-2xl overflow-hidden mb-4 aspect-[4/3]">
                     <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-2">Sustainable alternatives to traditional gas, helping reduce carbon footprints.</p>
               </div>
            ))}
         </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto bg-[#F5F7FA] rounded-[48px] flex flex-col lg:flex-row gap-16">
         <div className="lg:w-1/3">
            <h2 className="text-4xl font-['Space_Grotesk'] font-bold mb-6 text-gray-900">
               Frequently Asked Questions
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
               Below you'll find answers to some of the most common questions from our B2B partners. If you don't see what you're looking for, feel free to reach out to our team directly.
            </p>
            <button className="px-8 py-3 bg-[#3ACDFA] text-white rounded-full font-bold shadow-md hover:shadow-lg">
               Let's discuss
            </button>
         </div>
         <div className="lg:w-2/3">
            {faqs.map((faq, i) => (
               <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
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
