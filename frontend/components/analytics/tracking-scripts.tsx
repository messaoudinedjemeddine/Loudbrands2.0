'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

// Meta Pixel ID - Make sure this matches your Meta Business Suite Pixel ID
const FB_PIXEL_ID = '1319752822409584'
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // Placeholder
// TikTok Pixel ID - for TikTok Ads conversion tracking
const TIKTOK_PIXEL_ID = 'D26J6SJC77UB6AOKBFTG'

declare global {
    interface Window {
        fbq: any;
        gtag: any;
        _fbq: any;
        ttq: any;
    }
}

export function TrackingScripts() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Track pageview for GA only (Meta Pixel PageView is handled in script)
        if (pathname && window.gtag) {
            window.gtag('config', GA_MEASUREMENT_ID, {
                page_path: pathname,
            })
        }
    }, [pathname, searchParams])

    return (
        <>
            {/* Google Analytics 4 - Only load if a valid ID is provided */}
            {GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX' && (
                <>
                    <Script
                        strategy="afterInteractive"
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                    />
                    <Script
                        id="google-analytics"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `,
                        }}
                    />
                </>
            )}

            {/* Meta Pixel - Initialize only, no automatic tracking */}
            {/* Purchase events are tracked manually on order-success page only */}
            <Script
                id="fb-pixel"
                strategy="afterInteractive"
                onLoad={() => {
                    // Ensure fbq is available globally
                    if (typeof window !== 'undefined' && window.fbq) {
                        // Mark pixel as loaded
                        (window as any).fbq.loaded = true;
                        if (process.env.NODE_ENV === 'development') {
                            console.log('✅ Meta Pixel initialized (no automatic tracking)', { pixelId: FB_PIXEL_ID });
                        }
                    }
                }}
                onError={(e) => {
                    console.error('❌ Meta Pixel failed to load:', e);
                }}
                dangerouslySetInnerHTML={{
                    __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}', {
                autoConfig: true,
                debug: false
            });
            // No automatic PageView tracking - only track Purchase on order-success page
          `,
                }}
            />

            {/* TikTok Pixel - Base code for site-wide detection; SubmitOrder tracked on order-success page */}
            <Script
                id="tiktok-pixel"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${TIKTOK_PIXEL_ID}');
  ttq.page();
}(window, document, 'ttq');
                    `,
                }}
            />
        </>
    )
}
