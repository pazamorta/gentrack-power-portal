import React from 'react';
import type { QuoteWizardTraceEntry } from './LightningOutPublicQuoteWizard';

const STEPS = [
  { step: 'contact', component: 'c-public-quote-contact-step' },
  { step: 'servicePoints', component: 'c-public-quote-service-points-step' },
  { step: 'products', component: 'c-public-quote-products-step' },
  { step: 'quote', component: 'c-public-quote-price-step' }
];

function Json({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 max-h-60 overflow-auto rounded-md bg-black/40 p-2 text-[11px] leading-snug text-slate-200 whitespace-pre-wrap break-all">
      {value === undefined ? '—' : JSON.stringify(value, null, 2)}
    </pre>
  );
}

/** "POST callout:Utility_API/v1/quotes with ..." → "POST /v1/quotes". */
function endpoint(call: string) {
  return call.replace('callout:Utility_API', '').split(/ \(| with | Body:/)[0].trim();
}

function last(entries: QuoteWizardTraceEntry[], match: (entry: QuoteWizardTraceEntry) => boolean) {
  for (let index = entries.length - 1; index >= 0; index -= 1) if (match(entries[index])) return entries[index];
  return undefined;
}

/**
 * SPIKE ONLY: beside the spike wizard, the data each step component receives
 * (Input) and sends back (Output), plus its API calls, from wizardtrace messages.
 */
export const QuoteWizardEventInspector: React.FC<{
  entries: QuoteWizardTraceEntry[];
  onClear: () => void;
}> = ({ entries, onClear }) => {
  const current = entries.length ? entries[entries.length - 1].step : 'contact';
  const seen = STEPS.filter(({ step }) => step === current || entries.some((entry) => entry.step === step));

  return (
    <aside
      className="rounded-xl border border-amber-400/40 bg-slate-900/80 p-4 text-slate-100 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-auto"
      aria-label="Component data"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-amber-200">Component data (spike)</h3>
        <button type="button" className="text-xs underline underline-offset-2 hover:opacity-80" onClick={onClear}>
          Clear
        </button>
      </div>

      {[...seen].reverse().map(({ step, component }) => {
        const own = entries.filter((entry) => entry.step === step);
        const input = last(own, (entry) => entry.kind === 'input');
        // The previous component's output, which the container saved (saveStep)
        // before showing this component.
        const index = STEPS.findIndex((item) => item.step === step);
        const previous = index > 0 ? STEPS[index - 1] : undefined;
        const previousOutput = previous
          ? (last(entries, (entry) => entry.step === previous.step && entry.kind === 'state')?.data as
              | { state?: unknown }
              | undefined)?.state
          : undefined;
        const inputValue =
          input || previous
            ? {
                ...((input?.data as object) || {}),
                ...(previous
                  ? { fromPrevious: { component: previous.component, data: previousOutput ?? null } }
                  : {})
              }
            : undefined;
        const output = last(own, (entry) => entry.kind === 'state');
        const apexNames = [...new Set(own.filter((entry) => entry.kind === 'apex').map((entry) => entry.event))];
        return (
          <section
            key={step}
            className={`mt-4 rounded-lg border p-3 ${step === current ? 'border-amber-400/60' : 'border-white/10 opacity-80'}`}
          >
            <p className="text-sm">
              <span className="text-slate-400">Component: </span>
              <span className="font-mono text-amber-100">{component}</span>
            </p>

            <p className="mt-2 text-xs font-semibold text-slate-300">Input</p>
            <Json value={inputValue} />

            <p className="mt-2 text-xs font-semibold text-slate-300">Output</p>
            <Json value={(output?.data as { state?: unknown } | undefined)?.state} />

            {apexNames.map((name) => {
              const call = last(own, (entry) => entry.kind === 'apex' && entry.event === name)!;
              const data = (call.data || {}) as { params?: unknown; response?: unknown; error?: string };
              const calls = call.api?.calls || [];
              return (
                <div key={name} className="mt-3 border-t border-white/10 pt-2">
                  <p className="text-xs font-semibold text-slate-300">
                    API: <span className="font-mono font-normal text-violet-200">{name.replace('PublicQuoteController.', '')}</span>
                  </p>
                  {calls.map((item) => (
                    <p key={item} className="font-mono text-[11px] text-violet-200">
                      {endpoint(item)}
                    </p>
                  ))}
                  <p className="mt-1 text-xs text-slate-400">Request</p>
                  <Json value={data.params} />
                  <p className="mt-1 text-xs text-slate-400">{data.error === undefined ? 'Response' : 'Error'}</p>
                  <Json value={data.error === undefined ? data.response : data.error} />
                </div>
              );
            })}
          </section>
        );
      })}
    </aside>
  );
};
