import React, { useEffect, useRef, useState } from 'react';

// Experience Cloud site that serves Lightning Out to guest users. It must be the
// site URL (with its path prefix, without "/s"): the My Domain URL returns 401.
const SITE_URL = (
  import.meta.env.VITE_SF_LIGHTNING_OUT_SITE_URL ||
  'https://gentrack--develop.sandbox.my.site.com/contractor'
).replace(/\/s\/?$|\/$/g, '');
const APP_NAME = 'c:PortalOpportunityRequestOutApp';
const COMPONENT_NAME = 'c:portalOpportunityRequest';
const CONTAINER_ID = 'portal-opportunity-request';

type Status = 'loading' | 'ready' | 'error';

interface LightningOut {
  use: (app: string, callback: () => void, endpoint: string) => void;
  createComponent: (
    name: string,
    attributes: Record<string, unknown>,
    containerId: string,
    callback: (component: unknown, status: string, errorMessage: string) => void
  ) => void;
}

declare global {
  interface Window {
    $Lightning?: LightningOut;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadLightningOut(): Promise<void> {
  if (window.$Lightning) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${SITE_URL}/lightning/lightning.out.js`;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error(`Could not load ${script.src}`));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export const LightningOutOpportunityRequest: React.FC = () => {
  const [status, setStatus] = useState<Status>('loading');
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development; create the component once.
    if (started.current) return;
    started.current = true;

    loadLightningOut()
      .then(() => {
        window.$Lightning!.use(
          APP_NAME,
          () => {
            window.$Lightning!.createComponent(
              COMPONENT_NAME,
              {},
              CONTAINER_ID,
              (_component, createStatus, errorMessage) => {
                if (createStatus === 'SUCCESS') {
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
      })
      .catch((error) => {
        console.error(error);
        setStatus('error');
      });
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      {status === 'loading' && (
        <p className="text-secondary text-sm" role="status">
          Loading the request form…
        </p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm" role="alert">
          The request form could not be loaded. Try again later.
        </p>
      )}
      <div id={CONTAINER_ID} className="rounded-xl overflow-hidden bg-white" />
    </div>
  );
};
