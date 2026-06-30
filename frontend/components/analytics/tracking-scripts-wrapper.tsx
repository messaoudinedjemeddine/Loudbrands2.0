'use client';

import dynamic from 'next/dynamic';

const TrackingScripts = dynamic(
  () => import('./tracking-scripts').then((mod) => mod.TrackingScripts),
  { ssr: false }
);

export function TrackingScriptsWrapper() {
  return <TrackingScripts />;
}
