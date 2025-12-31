'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const FB_PIXEL_ID = '1319752822409584'
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // Placeholder

declare global {
    interface Window {
        fbq: any;
        gtag: any;
    }
}

export function TrackingScripts() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Track pageframe/route changes for GA and Pixel
        if (pathname && window.fbq && window.gtag) {
            window.fbq('track', 'PageView')
            window.gtag('config', GA_MEASUREMENT_ID, {
                page_path: pathname,
            })
        }
    }, [pathname, searchParams])

    return (
        <>
            {/* Google Analytics 4 */}
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

            {/* Meta Pixel - Updated to use modern loading approach */}
            <Script
                id="fb-pixel"
                strategy="afterInteractive"
                onError={(e) => {
                    // Silently handle Facebook Pixel loading errors
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('Facebook Pixel failed to load:', e);
                    }
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
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
                }}
            />
        </>
    )
}
