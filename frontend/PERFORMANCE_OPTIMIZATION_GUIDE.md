# Performance Optimization Guide

## Image Optimization Recommendations

### For Best Performance:
1. **Compress images before uploading** (Recommended):
   - Use tools like:
     - **Squoosh** (https://squoosh.app/) - Free, browser-based
     - **TinyPNG** (https://tinypng.com/) - Free, online
     - **ImageOptim** (Mac) or **FileOptimizer** (Windows)
   - Target sizes:
     - Hero images: Max 200KB, 1920x1080px
     - Product images: Max 150KB, 1200x1200px
     - Thumbnails: Max 50KB, 400x400px
   - Format: Convert to WebP or AVIF when possible

2. **Video Optimization**:
   - Compress hero video to:
     - Max 5MB for full-screen videos
     - Use H.264 codec
     - Resolution: 1920x1080 (1080p) is sufficient
     - Frame rate: 30fps (24fps acceptable)
   - Tools:
     - **HandBrake** (Free, desktop)
     - **FFmpeg** (Command line)
     - **CloudConvert** (Online)

### Current Optimizations Applied:
- ✅ Next.js Image Optimization (automatic WebP/AVIF conversion)
- ✅ Lazy loading for all non-critical images
- ✅ Responsive image sizes
- ✅ Video lazy loading with IntersectionObserver
- ✅ Bundle code splitting for better caching

## Code Optimizations Applied

### 1. Bundle Splitting
- Framer Motion: Loaded asynchronously when needed
- Radix UI: Separate chunk for better caching
- Lucide Icons: Lazy loaded
- Vendor code: Separated from app code

### 2. Image Optimization
- AVIF format prioritized (best compression)
- WebP fallback
- Proper `sizes` attribute for responsive images
- Quality set to 85% (good balance)

### 3. Video Optimization
- Lazy loading with IntersectionObserver
- `preload="metadata"` instead of full video
- Poster image loads immediately
- Uses `requestIdleCallback` for better performance

### 4. JavaScript Modernization
- ES2020+ output (no legacy polyfills)
- Console removal in production
- Tree shaking enabled
- Package import optimization

## Next Steps for Maximum Performance

1. **Compress existing images**:
   ```bash
   # Use ImageMagick or similar
   convert input.jpg -quality 85 -strip output.jpg
   ```

2. **Compress hero video**:
   ```bash
   # Using FFmpeg
   ffmpeg -i hero-video.mp4 -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k hero-video-optimized.mp4
   ```

3. **Monitor bundle size**:
   - Check Vercel Analytics
   - Use `@next/bundle-analyzer` if needed

4. **Consider CDN**:
   - Use Cloudinary or similar for image delivery
   - Automatic format conversion
   - Responsive image generation

## Expected Performance Improvements

After applying these optimizations:
- **Homepage**: 70+ score (from 58)
- **Loud Styles**: 60+ score (from 27)
- **Product Detail**: 70+ score (from 51)

Key metrics to improve:
- LCP (Largest Contentful Paint): < 2.5s
- FCP (First Contentful Paint): < 1.8s
- TBT (Total Blocking Time): < 200ms
- CLS (Cumulative Layout Shift): < 0.1

