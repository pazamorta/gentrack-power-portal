import React from 'react';

type Version = 'current' | 'spike' | 'spike2';

const VERSIONS: Record<Version, { route: string; title: string; detail: string }> = {
  current: {
    route: '/quote-wizard',
    title: 'Current version',
    detail: 'One Lightning web component (c:publicQuoteWizard) with all four steps inside it.'
  },
  spike: {
    route: '/quote-wizard-spike',
    title: 'SPIKE: event-based step components',
    detail:
      'A container (c:publicQuoteWizardSpike) and one component per step, talking through events. Same Salesforce saves, platform event and 24-hour resume.'
  },
  spike2: {
    route: '/quote-wizard-spike2',
    title: 'SPIKE 2: the Opportunity Quote Wizard',
    detail:
      'The unchanged configured Quote Wizard (c:quoteWizardLauncher) that the Opportunity action opens, loaded for a guest through Lightning Out 1.0, to see what breaks.'
  }
};

// Lightning Out 1.0 loads one app per page, so switching versions reloads the page.
function openVersion(route: string) {
  window.location.hash = route;
  window.location.reload();
}

/** Tells testers which wizard version this page runs and links to the other one. */
export const QuoteWizardVersionBanner: React.FC<{ version: Version }> = ({ version }) => {
  const current = VERSIONS[version];
  const others = (Object.keys(VERSIONS) as Version[]).filter((key) => key !== version);
  const spike = version !== 'current';
  return (
    <div
      className={`max-w-3xl mx-auto mb-6 rounded-xl border px-4 py-3 text-sm ${
        spike ? 'border-amber-400 bg-amber-400/10 text-amber-100' : 'border-sky-400 bg-sky-400/10 text-sky-100'
      }`}
      role="note"
    >
      <p className="font-semibold">{current.title}</p>
      <p className="mt-1">{current.detail}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {others.map((key) => (
          <button
            key={key}
            type="button"
            className="underline underline-offset-2 hover:opacity-80"
            onClick={() => openVersion(VERSIONS[key].route)}
          >
            Open {VERSIONS[key].title}
          </button>
        ))}
      </div>
    </div>
  );
};
