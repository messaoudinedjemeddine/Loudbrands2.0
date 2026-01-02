'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

// Meta Pixel ID - Make sure this matches your Meta Business Suite Pixel ID
const FB_PIXEL_ID = '1319752822409584'
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // Placeholder

declare global {
    interface Window {
        fbq: any;
        gtag: any;
        _fbq: any;
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

            {/* Meta Pixel - Standard implementation for better detection */}
            <Script
                id="fb-pixel"
                strategy="afterInteractive"
                onLoad={() => {
                    // Ensure fbq is available globally
                    if (typeof window !== 'undefined' && window.fbq) {
                        // Mark pixel as loaded
                        (window as any).fbq.loaded = true;
                        if (process.env.NODE_ENV === 'development') {
                            console.log('✅ Meta Pixel loaded successfully', { pixelId: FB_PIXEL_ID });
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
            fbq('track', 'PageView');
          `,
                }}
            />
            
            {/* Meta Pixel noscript fallback for better detection */}
            <noscript>
                <img 
                    height="1" 
                    width="1" 
                    style={{ display: 'none' }}
                    src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
        </>
    )
}
