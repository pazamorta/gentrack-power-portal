import React from 'react';
import { LightningOutPublicQuoteWizard } from '../components/LightningOutPublicQuoteWizard';
import { QuoteWizardVersionBanner } from '../components/QuoteWizardVersionBanner';

/** SPIKE: the same journey built from event-based step components. */
export const QuoteWizardSpikePage: React.FC = () => {
  return (
    <div className="pt-32 pb-16 min-h-screen container mx-auto px-4">
      <h1 className="text-3xl font-semibold text-white text-center mb-8">
        Get an energy quote <span className="text-amber-300">(spike)</span>
      </h1>
      <QuoteWizardVersionBanner version="spike" />
      <LightningOutPublicQuoteWizard
        appName="c:PublicQuoteSpikeOutApp"
        componentName="c:publicQuoteWizardSpike"
        containerId="public-quote-wizard-spike"
      />
    </div>
  );
};
