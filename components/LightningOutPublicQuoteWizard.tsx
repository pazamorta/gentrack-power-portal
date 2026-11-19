import React, { useEffect, useRef, useState } from 'react';

// Experience Cloud site that serves Lightning Out to guest users (site URL with
// its path prefix, without "/s"; the My Domain URL returns 401).
const SITE_URL = (
  import.meta.env.VITE_SF_LIGHTNING_OUT_SITE_URL ||
  'https://gentrack--develop.sandbox.my.site.com/contractor'
).replace(/\/s\/?$|\/$/g, '');
// Cloudflare Turnstile site key. The default is Cloudflare's public test key,
// which always passes; production must set its own key.
const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
// Optional presentation overrides, in the same format as the signed-in Quote
// Wizard (Lightning Out 2.0) launcher's stylingJson.
const STYLING_JSON = import.meta.env.VITE_QUOTE_WIZARD_STYLING || '';
const APP_NAME = 'c:PublicQuoteOutApp';
const COMPONENT_NAME = 'c:publicQuoteWizard';
const CONTAINER_ID = 'public-quote-wizard';

type Status = 'loading' | 'ready' | 'error';

/**
 * Lifecycle message shared with the signed-in Quote Wizard launcher: the
 * component publishes `wizardhostevent` with a JSON string detail. The public
 * wizard returns its visitor reference, never Salesforce record ids.
 */
export type QuoteWizardHostMessage =
  | { type: 'wizardcomplete'; result: { reference?: string; quoteId?: string; status?: string } }
  | { type: 'wizardcancel' }
  | { type: 'wizarderror'; code?: string }
  | { type: 'wizardtrace'; entry: QuoteWizardTraceEntry };

/**
 * SPIKE ONLY: one step of how the wizard's components talk, sent when the
 * host page creates the spike wizard with trace: true. It carries visitor
 * input, so only test pages turn it on.
 */
export interface QuoteWizardTraceEntry {
  seq: number;
  at: string;
  step: string;
  kind: 'input' | 'state' | 'message' | 'apex' | 'handoff';
  from: string;
  to: string;
  event: string;
  data: unknown;
  api?: { calls: string[]; server: string } | null;
}

export function parseHostMessage(detail: unknown): QuoteWizardHostMessage | null {
  if (typeof detail !== 'string') return null;
  try {
    const message = JSON.parse(detail);
    return message && typeof message.type === 'string' ? message : null;
  } catch {
    return null;
  }
}

interface Props {
  /** Lightning Out app; defaults to the current wizard's app. */
  appName?: string;
  /** Wizard component inside that app. */
  componentName?: string;
  /** DOM id of the wizard container; unique per page. */
  containerId?: string;
  stylingJson?: string;
  /** SPIKE ONLY: ask the wizard for wizardtrace messages (see onTrace). */
  trace?: boolean;
  onTrace?: (entry: QuoteWizardTraceEntry) => void;
  /** Layout classes of the outer element. */
  className?: string;
  onComplete?: (result: { reference?: string; quoteId?: string; status?: string }) => void;
  onError?: (code?: string) => void;
}

interface LightningComponent {
  set?: (name: string, value: unknown) => void;
}

interface LightningOut {
  use: (app: string, callback: () => void, endpoint: string) => void;
  createComponent: (
    name: string,
    attributes: Record<string, unknown>,
    containerId: string,
    callback: (component: LightningComponent, status: string, errorMessage: string) => void
  ) => void;
}

interface Turnstile {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
}

declare global {
  interface Window {
    $Lightning?: LightningOut;
    turnstile?: Turnstile;
  }
}

const scripts = new Map<string, Promise<void>>();

function loadScript(src: string, ready: () => boolean): Promise<void> {
  if (ready()) return Promise.resolve();
  if (!scripts.has(src)) {
    scripts.set(
      src,
      new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
          scripts.delete(src);
          reject(new Error(`Could not load ${src}`));
        };
        document.head.appendChild(script);
      })
    );
  }
  return scripts.get(src)!;
}

export const LightningOutPublicQuoteWizard: React.FC<Props> = ({
  appName = APP_NAME,
  componentName = COMPONENT_NAME,
  containerId = CONTAINER_ID,
  stylingJson = STYLING_JSON,
  trace = false,
  onTrace,
  className = 'max-w-3xl mx-auto',
  onComplete,
  onError
}) => {
  const [status, setStatus] = useState<Status>('loading');
  const started = useRef(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const component = useRef<LightningComponent | null>(null);
  const handlers = useRef({ onComplete, onError, onTrace });
  handlers.current = { onComplete, onError, onTrace };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const listener = (event: Event) => {
      const message = parseHostMessage((event as CustomEvent).detail);
      if (!message) return;
      if (message.type === 'wizardcomplete') handlers.current.onComplete?.(message.result);
      if (message.type === 'wizarderror') handlers.current.onError?.(message.code);
      if (message.type === 'wizardtrace') handlers.current.onTrace?.(message.entry);
    };
    container.addEventListener('wizardhostevent', listener);
    return () => container.removeEventListener('wizardhostevent', listener);
  }, []);

  useEffect(() => {
    // StrictMode runs effects twice in development; start once.
    if (started.current) return;
    started.current = true;

    const createWizard = (token: string) => {
      window.$Lightning!.use(
        appName,
        () => {
          window.$Lightning!.createComponent(
            componentName,
            {
              captchaToken: token,
              ...(stylingJson ? { stylingJson } : {}),
              ...(trace ? { trace: true } : {})
            },
            containerId,
            (created, createStatus, errorMessage) => {
              if (createStatus === 'SUCCESS') {
                component.current = created;
                setStatus('ready');
              } else {
                console.error('Lightning Out createComponent failed:', createStatus, errorMessage);
                setStatus('error');
              }
            }
          );
        },
        SITE_URL
      );
    };

    Promise.all([
      loadScript(`${SITE_URL}/lightning/lightning.out.js`, () => Boolean(window.$Lightning)),
      loadScript(
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
        () => Boolean(window.turnstile)
      )
    ])
      .then(() => {
        window.turnstile!.render(captchaRef.current!, {
          sitekey: TURNSTILE_SITE_KEY,
          'refresh-expired': 'auto',
          callback: (token: string) => {
            // Turnstile tokens are single use and expire; keep the wizard's copy current.
            if (component.current) component.current.set?.('captchaToken', token);
            else createWizard(token);
          },
          'error-callback': () => setStatus('error')
        });
      })
      .catch((error) => {
        console.error(error);
        setStatus('error');
      });
  }, []);

  return (
    <div className={className}>
      {status === 'loading' && (
        <p className="text-secondary text-sm" role="status">
          Loading the quote wizard…
        </p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm" role="alert">
          The quote wizard could not be loaded. Try again later.
        </p>
      )}
      <div ref={captchaRef} className="mb-4" />
      <div ref={containerRef} id={containerId} className="rounded-xl overflow-hidden bg-white" />
    </div>
  );
};
