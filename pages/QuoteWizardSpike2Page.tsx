import React, { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LightningOutPublicQuoteWizard,
  type QuoteWizardHostMessage
} from '../components/LightningOutPublicQuoteWizard';
import { QuoteWizardVersionBanner } from '../components/QuoteWizardVersionBanner';
import '../styles/quote-wizard-platform.css';

const HERO_BG = '/gentrack-power-portal/customer/hero-bg.png';

// The only journey with Allow_Guest__c; OPPORTUNITY_QUOTE and _B2C are hidden from guests (NO_AVAILABLE_JOURNEY).
const DEFAULT_LAUNCH_KEY = 'GUEST_QUOTE_SPIKE2';
const MAX_EVENTS = 100;

interface LogEntry {
  at: string;
  kind: 'message' | 'load error';
  data: unknown;
}

/**
 * SPIKE 2: the unchanged Opportunity Quote Wizard (c:quoteWizardLauncher, the
 * component the Opportunity action opens) loaded for a guest through Lightning
 * Out 1.0, so we can see what works and what has to change for the portal.
 */
export const QuoteWizardSpike2Page: React.FC = () => {
  const [params] = useSearchParams();
  const launchKey = params.get('launchKey') || DEFAULT_LAUNCH_KEY;
  const recordId = params.get('recordId') || '';
  const [form, setForm] = useState({ launchKey: launchKey || DEFAULT_LAUNCH_KEY, recordId });
  const [log, setLog] = useState<LogEntry[]>([]);

  const add = useCallback(
    (kind: LogEntry['kind'], data: unknown) =>
      setLog((current) => [...current, { at: new Date().toISOString(), kind, data }].slice(-MAX_EVENTS)),
    []
  );
  const onMessage = useCallback((message: QuoteWizardHostMessage) => add('message', message), [add]);
  const onLoadError = useCallback((message: string) => add('load error', message), [add]);

  // Lightning Out 1.0 loads one app per page, so a new launch reloads the page.
  const start = (event: React.FormEvent) => {
    event.preventDefault();
    const query = new URLSearchParams();
    query.set('launchKey', form.launchKey.trim());
    if (form.recordId.trim()) query.set('recordId', form.recordId.trim());
    window.location.hash = `/quote-wizard-spike2?${query.toString()}`;
    window.location.reload();
  };

  const input =
    'mt-1 w-full px-3 py-2 rounded-xl bg-white border-2 border-gray-400 text-gray-900 font-mono text-sm focus:outline-none focus:border-[#3ACDFA] focus:ring-2 focus:ring-[#3ACDFA]/20';

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

      <section className="pt-16 pb-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-['Space_Grotesk'] font-bold mb-4 text-gray-900">Your quote</h2>
            <p className="text-xl text-gray-600">Fill in the steps below. You can go back to any step before you get your price.</p>
          </div>

          {/* The Salesforce Quote Wizard, themed by styles/quote-wizard-platform.css */}
          <div className="qw-platform bg-white border border-gray-200 shadow-xl rounded-2xl p-4 md:p-10">
            {launchKey ? (
              <LightningOutPublicQuoteWizard
                appName="c:QuoteWizardSpike2OutApp"
                componentName="c:quoteWizardLauncher"
                containerId="quote-wizard-spike2"
                className="min-w-0"
                captcha={false}
                stylingJson=""
                attributes={{ launchKey, autoStart: true, hideHeading: true, ...(recordId ? { recordId } : {}) }}
                onMessage={onMessage}
                onLoadError={onLoadError}
              />
            ) : (
              <p className="text-gray-600 text-sm">Enter a launch key (and a record Id if the journey needs one), then Start.</p>
            )}
          </div>

          {/* SPIKE 2 tools */}
          <details className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-6 text-sm">
            <summary className="cursor-pointer font-['Space_Grotesk'] font-bold text-gray-900">Spike 2 tools</summary>
            <div className="mt-4 [&_.max-w-3xl]:max-w-none">
              <QuoteWizardVersionBanner version="spike2" />
            </div>
            <form onSubmit={start} className="mt-2 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end text-gray-900">
              <label className="font-bold">
                Launch key
                <input
                  className={input}
                  value={form.launchKey}
                  onChange={(event) => setForm({ ...form, launchKey: event.target.value })}
                  required
                />
              </label>
              <label className="font-bold">
                Opportunity or Account Id
                <input
                  className={input}
                  value={form.recordId}
                  placeholder="006… (optional)"
                  onChange={(event) => setForm({ ...form, recordId: event.target.value })}
                />
              </label>
              <button type="submit" className="bg-[#00E599] hover:bg-[#00cc88] text-black px-6 py-2.5 rounded-full font-medium transition-all">
                Start
              </button>
            </form>
            <div className="mt-6" aria-label="Wizard messages">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-gray-900">Wizard messages</h3>
                <button type="button" className="text-xs underline underline-offset-2 text-gray-600 hover:text-gray-900" onClick={() => setLog([])}>
                  Clear
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Host messages and load errors. Apex and Aura errors also show in the browser console.</p>
              {log.length === 0 && <p className="mt-3 text-xs text-gray-500">Nothing yet.</p>}
              {[...log].reverse().map((entry, index) => (
                <div key={log.length - index} className="mt-3 border-t border-gray-200 pt-2">
                  <p className={`text-xs font-semibold ${entry.kind === 'load error' ? 'text-red-600' : 'text-gray-700'}`}>
                    {entry.kind} <span className="font-normal text-gray-500">{entry.at.slice(11, 19)}</span>
                  </p>
                  <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-white border border-gray-200 p-2 text-[11px] leading-snug text-gray-800 whitespace-pre-wrap break-all">
                    {JSON.stringify(entry.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>
    </div>
  );
};
