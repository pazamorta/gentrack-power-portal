import React from 'react';
import { LightningOutPublicQuoteWizard } from '../components/LightningOutPublicQuoteWizard';
import { QuoteWizardVersionBanner } from '../components/QuoteWizardVersionBanner';

export const QuoteWizardPage: React.FC = () => {
  return (
    <div className="pt-32 pb-16 min-h-screen container mx-auto px-4">
      <h1 className="text-3xl font-semibold text-white text-center mb-8">Get an energy quote</h1>
      <QuoteWizardVersionBanner version="current" />
      <LightningOutPublicQuoteWizard />
    </div>
  );
};
