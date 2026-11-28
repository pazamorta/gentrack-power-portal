import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { LightningOutPublicQuoteWizard } from '../components/LightningOutPublicQuoteWizard';
import '../styles/quote-wizard-platform.css';

const HERO_BG = '/gentrack-power-portal/customer/hero-bg.png';

// The configured B2C journey (QW_B2C_Demo) the New sale utility item runs. A site guest
// runs it as a New sale through the Salesforce guest bridge (QuoteWizardGuestBridge).
// Another journey still opens with ?launchKey= (and ?recordId= when it needs a record).
const DEFAULT_LAUNCH_KEY = 'OPPORTUNITY_QUOTE_B2C';

/**
 * SPIKE 2: the unchanged Opportunity Quote Wizard (c:quoteWizardLauncher, the
 * component the Opportunity action opens) loaded for a guest through Lightning
 * Out 1.0. Load errors are written to the browser console.
 */
export const QuoteWizardSpike2Page: React.FC = () => {
  const [params] = useSearchParams();
  const launchKey = params.get('launchKey') || DEFAULT_LAUNCH_KEY;
  const recordId = params.get('recordId') || '';

  return (
    <div className="bg-white min-h-screen text-gray-900 font-['Roboto'] selection:bg-[#2CD8A6]/30 relative overflow-hidden">
      {/* Hero, as on /platform */}
      <section className="relative h-[60vh] min-h-[480px] flex items-center justify-center overflow-hidden">
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center text-white">
          <h1
            className="text-white text-center font-['Space_Grotesk'] font-bold mb-6 max-w-5xl mx-auto leading-[0.97] drop-shadow-lg text-4xl md:text-[59px] md:tracking-[-3px]"
            style={{ fontFeatureSettings: "'ss01' on, 'ss04' on" }}
          >
            Get an energy quote
          </h1>
          <p className="text-xl md:text-2xl font-light opacity-90 max-w-3xl mx-auto">
            Tell us about your business and supplies, and get a price in a few minutes.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 w-full leading-none z-20 -mb-px">
          <div className="relative w-full">
            <svg className="absolute bottom-0 left-0 w-full h-auto" viewBox="0 0 1350 184" fill="none" preserveAspectRatio="none" style={{ height: '184px', display: 'block' }} aria-hidden="true">
              <path opacity="0.4" d="M624.5 50.3562C917.7 -40.8438 1230 12.3562 1349.5 50.3562V183.356H-134V8.85644C-3.33337 60.6897 331.3 141.556 624.5 50.3562Z" fill="white" />
            </svg>
            <svg className="relative bottom-0 left-0 w-full h-auto" viewBox="0 0 1440 184" fill="none" preserveAspectRatio="none" style={{ height: '184px', display: 'block' }} aria-hidden="true">
              <path d="M715 50.3562C1008.2 -40.8438 1320.5 12.3562 1440 50.3562V183.356H-43.5V8.85644C87.1666 60.6897 421.8 141.556 715 50.3562Z" fill="white" />
            </svg>
          </div>
        </div>
      </section>

      <section className="pt-16 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold mb-4 text-gray-900">Your quote</h2>
            <p className="text-xl text-gray-600">Fill in the steps below. You can go back to any step before you get your price.</p>
          </div>

          {/* The Salesforce Quote Wizard, themed by styles/quote-wizard-platform.css */}
          <div className="qw-platform bg-white border border-gray-200 shadow-xl rounded-3xl px-5 py-8 md:px-14 md:py-12">
            <LightningOutPublicQuoteWizard
              appName="c:QuoteWizardSpike2OutApp"
              componentName="c:quoteWizardLauncher"
              containerId="quote-wizard-spike2"
              className="min-w-0"
              captcha={false}
              stylingJson=""
              attributes={{ launchKey, autoStart: true, hideHeading: true, ...(recordId ? { recordId } : {}) }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
