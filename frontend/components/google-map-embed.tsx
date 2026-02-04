"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GoogleMapEmbed() {
    const [isLoaded, setIsLoaded] = useState(false)

    if (isLoaded) {
        return (
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3246.112107536213!2d6.152370775781929!3d35.55093337262969!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12f4118a5cea3d7b%3A0x38c349e09f059365!2sLoud%20Brands!5e0!3m2!1sfr!2sdz!4v1765862219182!5m2!1sfr!2sdz"
                width="100%"
                height="100%"
                style={{ border: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
        )
    }

    return (
        <div
            className="absolute inset-0 w-full h-full bg-muted/20 flex flex-col items-center justify-center cursor-pointer group hover:bg-muted/30 transition-colors"
            onClick={() => setIsLoaded(true)}
        >
            <div className="absolute inset-0 bg-[url('/images/map-placeholder-pattern.png')] opacity-10" />
            <div className="z-10 text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-2">View Location</p>
                <Button variant="outline" size="sm" className="bg-background/80 hover:bg-background">
                    Load Google Maps
                </Button>
            </div>
        </div>
    )
}
