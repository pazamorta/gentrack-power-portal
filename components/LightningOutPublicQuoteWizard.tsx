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
const APP_NAME = 'c:PublicQuoteOutApp';
const COMPONENT_NAME = 'c:publicQuoteWizard';
const CONTAINER_ID = 'public-quote-wizard';

type Status = 'loading' | 'ready' | 'error';

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

export const LightningOutPublicQuoteWizard: React.FC = () => {
  const [status, setStatus] = useState<Status>('loading');
  const started = useRef(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const component = useRef<LightningComponent | null>(null);

  useEffect(() => {
    // StrictMode runs effects twice in development; start once.
    if (started.current) return;
    started.current = true;

    const createWizard = (token: string) => {
      window.$Lightning!.use(
        APP_NAME,
        () => {
          window.$Lightning!.createComponent(
            COMPONENT_NAME,
            { captchaToken: token },
            CONTAINER_ID,
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
    <div className="max-w-3xl mx-auto">
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
      <div id={CONTAINER_ID} className="rounded-xl overflow-hidden bg-white" />
    </div>
  );
};
