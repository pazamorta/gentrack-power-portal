import React, { useCallback, useState } from 'react';
import {
  LightningOutPublicQuoteWizard,
  type QuoteWizardTraceEntry
} from '../components/LightningOutPublicQuoteWizard';
import { QuoteWizardEventInspector } from '../components/QuoteWizardEventInspector';
import { QuoteWizardVersionBanner } from '../components/QuoteWizardVersionBanner';

const MAX_ENTRIES = 200;

/** SPIKE: the same journey built from event-based step components. */
export const QuoteWizardSpikePage: React.FC = () => {
  const [entries, setEntries] = useState<QuoteWizardTraceEntry[]>([]);
  const onTrace = useCallback(
    (entry: QuoteWizardTraceEntry) => setEntries((current) => [...current, entry].slice(-MAX_ENTRIES)),
    []
  );

  return (
    <div className="pt-32 pb-16 min-h-screen container mx-auto px-4">
      <h1 className="text-3xl font-semibold text-white text-center mb-8">
        Get an energy quote <span className="text-amber-300">(spike)</span>
      </h1>
      <QuoteWizardVersionBanner version="spike" />
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start">
        <LightningOutPublicQuoteWizard
          appName="c:PublicQuoteSpikeOutApp"
          componentName="c:publicQuoteWizardSpike"
          containerId="public-quote-wizard-spike"
          className="min-w-0"
          trace
          onTrace={onTrace}
        />
        <QuoteWizardEventInspector entries={entries} onClear={() => setEntries([])} />
      </div>
    </div>
  );
};
