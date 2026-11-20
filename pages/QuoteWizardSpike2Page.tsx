import React, { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LightningOutPublicQuoteWizard,
  type QuoteWizardHostMessage
} from '../components/LightningOutPublicQuoteWizard';
import { QuoteWizardVersionBanner } from '../components/QuoteWizardVersionBanner';

const DEFAULT_LAUNCH_KEY = 'OPPORTUNITY_QUOTE';
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
  const launchKey = params.get('launchKey') || '';
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

  const input = 'mt-1 w-full rounded-md border border-white/20 bg-black/30 px-2 py-1 font-mono text-sm text-white';

  return (
    <div className="pt-32 pb-16 min-h-screen container mx-auto px-4">
      <h1 className="text-3xl font-semibold text-white text-center mb-8">
        Get an energy quote <span className="text-amber-300">(spike 2)</span>
      </h1>
      <QuoteWizardVersionBanner version="spike2" />

      <form onSubmit={start} className="max-w-3xl mx-auto mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end text-sm text-slate-200">
        <label>
          Launch key
          <input
            className={input}
            value={form.launchKey}
            onChange={(event) => setForm({ ...form, launchKey: event.target.value })}
            required
          />
        </label>
        <label>
          Opportunity or Account Id
          <input
            className={input}
            value={form.recordId}
            placeholder="006… (optional)"
            onChange={(event) => setForm({ ...form, recordId: event.target.value })}
          />
        </label>
        <button type="submit" className="rounded-md bg-amber-400 px-4 py-1.5 font-semibold text-slate-900 hover:bg-amber-300">
          Start
        </button>
      </form>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start">
        {launchKey ? (
          <LightningOutPublicQuoteWizard
            appName="c:QuoteWizardSpike2OutApp"
            componentName="c:quoteWizardLauncher"
            containerId="quote-wizard-spike2"
            className="min-w-0"
            captcha={false}
            stylingJson=""
            attributes={{ launchKey, autoStart: true, ...(recordId ? { recordId } : {}) }}
            onMessage={onMessage}
            onLoadError={onLoadError}
          />
        ) : (
          <p className="text-slate-300 text-sm">Enter a launch key (and a record Id if the journey needs one), then Start.</p>
        )}
        <aside
          className="rounded-xl border border-amber-400/40 bg-slate-900/80 p-4 text-slate-100 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-auto"
          aria-label="Wizard messages"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-amber-200">Wizard messages (spike 2)</h3>
            <button type="button" className="text-xs underline underline-offset-2 hover:opacity-80" onClick={() => setLog([])}>
              Clear
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Host messages and load errors. Apex and Aura errors also show in the browser console.
          </p>
          {log.length === 0 && <p className="mt-3 text-xs text-slate-400">Nothing yet.</p>}
          {[...log].reverse().map((entry, index) => (
            <div key={log.length - index} className="mt-3 border-t border-white/10 pt-2">
              <p className={`text-xs font-semibold ${entry.kind === 'load error' ? 'text-red-300' : 'text-slate-300'}`}>
                {entry.kind} <span className="font-normal text-slate-500">{entry.at.slice(11, 19)}</span>
              </p>
              <pre className="mt-1 max-h-60 overflow-auto rounded-md bg-black/40 p-2 text-[11px] leading-snug text-slate-200 whitespace-pre-wrap break-all">
                {JSON.stringify(entry.data, null, 2)}
              </pre>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
};
