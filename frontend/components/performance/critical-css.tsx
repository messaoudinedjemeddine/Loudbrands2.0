/**
 * Critical CSS component for above-the-fold content
 * This CSS is inlined to prevent render-blocking
 */
export function CriticalCSS() {
  return (
    <style jsx global>{`
      /* Critical above-the-fold styles for loud-styles pages */
      .hero-section {
        min-height: 100vh;
        position: relative;
        overflow: hidden;
      }
      
      .hero-content {
        position: relative;
        z-index: 20;
      }
      
      .hero-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 10;
      }
      
      /* Prevent layout shift */
      .product-card {
        contain: layout style paint;
      }
      
      /* Critical font loading */
      @font-face {
        font-family: 'Cairo';
        font-display: swap;
      }
      
      /* Critical button styles */
      .btn-primary {
        background-color: #bfa36a;
        border-color: #bfa36a;
        color: white;
        transition: all 0.3s;
      }
      
      /* Critical navbar styles */
      .navbar-fixed {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50;
      }
    `}</style>
  )
}


