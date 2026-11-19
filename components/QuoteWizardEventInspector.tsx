import React, { useMemo, useState } from 'react';
import type { QuoteWizardTraceEntry } from './LightningOutPublicQuoteWizard';

const CONTAINER = 'c-public-quote-wizard-spike';

interface StepContract {
  step: string;
  title: string;
  component: string;
  receives: string[];
  emits: string[];
  apex: string[];
  sendsNext: string;
}

/** The documented contract of each step component of the spike. */
const CONTRACTS: StepContract[] = [
  {
    step: 'contact',
    title: '1. Contact',
    component: 'c-public-quote-contact-step',
    receives: ['@api state: the saved contact details when the visitor comes back (null at first)'],
    emits: [
      'wizardstatechange { state: { company, firstName, lastName, email, phone, segment, sites, startDate, consent, ready } }'
    ],
    apex: ['None: the container calls saveStep'],
    sendsNext:
      'The container calls saveStep(step "contact", payload { company, firstName, lastName, email, phone, segment, startDate, consent, multiSite }, captchaToken). The next component receives @api reference and state null.'
  },
  {
    step: 'servicePoints',
    title: '2. Service points',
    component: 'c-public-quote-service-points-step',
    receives: ['@api reference: visitor reference (UUID)', '@api state: { identifierText, rows, ready }', '@api stylingJson: styling tokens'],
    emits: [
      'wizardstatechange { state: { identifierText, rows: [{ identifier, found, serviceType }], ready } }',
      'wizardstepmessage { kind: invalid | error, code: IDENTIFIERS_LIMIT | REQUEST_FAILED, message }',
      'wizardstepcall { apex, params, response | error }'
    ],
    apex: ['PublicQuoteController.discover({ reference, identifiers }) in batches of 10'],
    sendsNext:
      'The container calls saveStep(step "servicePoints", payload null): the sites are already in the server cache. The next component receives @api reference and state null.'
  },
  {
    step: 'products',
    title: '3. Products',
    component: 'c-public-quote-products-step',
    receives: ['@api reference: visitor reference', '@api state: { groups, selections, ready }'],
    emits: [
      'wizardstatechange { state: { groups: [{ key, identifiers, offers }], selections: { groupKey: offerCode }, ready } }',
      'wizardstepmessage { kind: error, code: REQUEST_FAILED, message }',
      'wizardstepcall { apex, params, response | error }'
    ],
    apex: ['PublicQuoteController.getOffers({ reference })'],
    sendsNext:
      'The container calls saveStep(step "products", payload { groupKey: offerCode }). The next component receives @api reference and state null.'
  },
  {
    step: 'quote',
    title: '4. Price',
    component: 'c-public-quote-price-step',
    receives: ['@api reference: visitor reference', '@api state: { summary, ready }'],
    emits: [
      'wizardstatechange { state: { summary: { status, currencyCode, totalExVat, totalVat }, ready } }',
      'wizardstepmessage { kind: error, code: PRICE_FAILED | PRICE_TIMEOUT | REQUEST_FAILED, message }',
      'wizardstepcall { apex, params, response | error }'
    ],
    apex: [
      'PublicQuoteController.price({ reference }) once',
      'PublicQuoteController.priceStatus({ reference }) every 3 s, at most 20 times'
    ],
    sendsNext:
      'The container calls saveStep(step "quote", payload null), then sends wizardcomplete { result: { reference, status: Received } } to the host page.'
  }
];

const KIND_STYLE: Record<QuoteWizardTraceEntry['kind'], string> = {
  input: 'bg-sky-500/20 text-sky-200',
  state: 'bg-emerald-500/20 text-emerald-200',
  message: 'bg-rose-500/20 text-rose-200',
  apex: 'bg-violet-500/20 text-violet-200',
  handoff: 'bg-amber-500/20 text-amber-200'
};

const KIND_LABEL: Record<QuoteWizardTraceEntry['kind'], string> = {
  input: 'received',
  state: 'event up',
  message: 'message up',
  apex: 'Apex / API',
  handoff: 'sent to next'
};

function Json({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-black/40 p-2 text-[11px] leading-snug text-slate-200 whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
      <div className="mt-1 text-sm">{children}</div>
    </section>
  );
}

function ApexCall({ entry }: { entry: QuoteWizardTraceEntry }) {
  const data = (entry.data || {}) as { params?: unknown; response?: unknown; error?: string };
  return (
    <div className="mt-2 rounded-lg border border-violet-400/30 p-2">
      <p className="font-mono text-xs text-violet-200">
        #{entry.seq} {entry.event}
      </p>
      {entry.api && (
        <>
          <p className="mt-1 text-xs text-slate-400">Utility Ops request (server side)</p>
          {entry.api.calls.length ? (
            <ul className="list-disc pl-4 font-mono text-[11px] text-slate-200">
              {entry.api.calls.map((call) => (
                <li key={call} className="break-all">
                  {call}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-slate-300">No Utility Ops call.</p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">{entry.api.server}</p>
        </>
      )}
      <p className="mt-2 text-xs text-slate-400">Apex parameters sent</p>
      <Json value={data.params} />
      <p className="mt-2 text-xs text-slate-400">{data.error === undefined ? 'Response' : 'Error'}</p>
      <Json value={data.error === undefined ? data.response : data.error} />
    </div>
  );
}

/**
 * SPIKE ONLY: the column beside the spike wizard. It shows the step component
 * on screen, what it receives, what it reports, its Apex and Utility Ops calls
 * and what goes to the next component, from the wizard's wizardtrace messages.
 */
export const QuoteWizardEventInspector: React.FC<{
  entries: QuoteWizardTraceEntry[];
  onClear: () => void;
}> = ({ entries, onClear }) => {
  const [showLog, setShowLog] = useState(false);
  const step = entries.length ? entries[entries.length - 1].step : 'contact';
  const contract = CONTRACTS.find((item) => item.step === step) || CONTRACTS[0];

  const forStep = useMemo(() => entries.filter((entry) => entry.step === step), [entries, step]);
  const last = (kind: QuoteWizardTraceEntry['kind']) =>
    [...forStep].reverse().find((entry) => entry.kind === kind);
  const input = last('input');
  const state = last('state');
  const message = last('message');
  const apexCalls = forStep.filter((entry) => entry.kind === 'apex').slice(-4).reverse();
  const handoffs = entries.filter((entry) => entry.kind === 'handoff');
  const handoff = handoffs[handoffs.length - 1];

  return (
    <aside
      className="rounded-xl border border-amber-400/40 bg-slate-900/80 p-4 text-slate-100 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-auto"
      aria-label="Event inspector"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-amber-200">Event inspector (spike)</h3>
        <button type="button" className="text-xs underline underline-offset-2 hover:opacity-80" onClick={onClear}>
          Clear
        </button>
      </div>

      <Section title="LWC on screen">
        <p className="font-mono text-amber-100">{contract.component}</p>
        <p className="text-xs text-slate-400">
          {contract.title}, inside {CONTAINER}
        </p>
      </Section>

      <Section title="Receives (from the container, via @api)">
        <ul className="list-disc pl-4 text-xs text-slate-300">
          {contract.receives.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {input ? <Json value={input.data} /> : <p className="text-xs text-slate-500">Nothing yet.</p>}
      </Section>

      <Section title="Sends up (events to the container)">
        <ul className="list-disc pl-4 text-xs text-slate-300">
          {contract.emits.map((item) => (
            <li key={item} className="break-words">
              {item}
            </li>
          ))}
        </ul>
        {state && (
          <>
            <p className="mt-2 text-xs text-slate-400">Last wizardstatechange (#{state.seq})</p>
            <Json value={state.data} />
          </>
        )}
        {message && (
          <>
            <p className="mt-2 text-xs text-slate-400">Last wizardstepmessage (#{message.seq})</p>
            <Json value={message.data} />
          </>
        )}
      </Section>

      <Section title="Apex and API calls">
        <ul className="list-disc pl-4 text-xs text-slate-300">
          {contract.apex.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {apexCalls.length ? (
          apexCalls.map((entry) => <ApexCall key={entry.seq} entry={entry} />)
        ) : (
          <p className="text-xs text-slate-500">No call yet on this step.</p>
        )}
      </Section>

      <Section title="Sends to the next component">
        <p className="text-xs text-slate-300">{contract.sendsNext}</p>
        {handoff && (
          <>
            <p className="mt-2 text-xs text-slate-400">
              Last hand-off (#{handoff.seq}): {handoff.from} → {handoff.to}
            </p>
            <Json value={handoff.data} />
          </>
        )}
      </Section>

      <Section title={`Event log (${entries.length})`}>
        <button
          type="button"
          className="text-xs underline underline-offset-2 hover:opacity-80"
          onClick={() => setShowLog((value) => !value)}
          aria-expanded={showLog}
        >
          {showLog ? 'Hide the log' : 'Show the log'}
        </button>
        {showLog && (
          <ol className="mt-2 space-y-2">
            {[...entries].reverse().map((entry) => (
              <li key={entry.seq} className="rounded-md border border-white/10 p-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-mono text-slate-400">#{entry.seq}</span>
                  <span className={`rounded px-1.5 py-0.5 ${KIND_STYLE[entry.kind]}`}>{KIND_LABEL[entry.kind]}</span>
                  <span className="font-mono">{entry.event}</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-400 break-all">
                  {entry.from} → {entry.to}
                </p>
                <details className="mt-1">
                  <summary className="cursor-pointer text-[11px] text-slate-400">Details</summary>
                  <Json value={entry.data} />
                </details>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </aside>
  );
};
