'use client';

import { useEffect, useRef, useState } from 'react';

export default function HtmlBlockIframe({ srcDoc, initialHeight }: { srcDoc: string; initialHeight: number }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(initialHeight);

  const updateHeight = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const nextHeight = Math.max(
      initialHeight,
      doc.documentElement?.scrollHeight || 0,
      doc.body?.scrollHeight || 0,
    );
    setHeight(nextHeight + 12);
  };

  useEffect(() => {
    // Measures the iframe's rendered content height via the DOM — this is
    // a post-paint layout measurement, not something derivable during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateHeight();
    const timers = [100, 350, 800].map(delay => window.setTimeout(updateHeight, delay));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [srcDoc, initialHeight]);

  return (
    <iframe
      ref={iframeRef}
      title="HTML block"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation"
      scrolling="no"
      className="w-full border-0 bg-transparent"
      style={{ height: `${height}px`, display: 'block', overflow: 'hidden' }}
      onLoad={updateHeight}
    />
  );
}
