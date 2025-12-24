'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: Array<{ url: string; alt?: string }>;
  onImagesChange: (images: Array<{ url: string; alt?: string }>) => void;
  multiple?: boolean;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({
  images = [],
  onImagesChange,
  multiple = false,
  maxImages = 10,
  className = ''
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('Files selected:', files.length);
    setIsUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
        console.log('Adding file to FormData:', file.name, file.size);
      });

      console.log('Sending upload request...');
      
      // Get token from auth storage
      let authToken = null;
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        try {
          const parsedData = JSON.parse(authData);
          // Zustand persist stores data in a 'state' property
          authToken = parsedData?.state?.token || parsedData?.token;
        } catch (error) {
          console.warn('Failed to parse auth token:', error);
        }
      }

      if (!authToken) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api'}/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      const newImages = result.files.map((file: any) => ({
        url: file.url,
        alt: file.originalName
      }));

      console.log('New images to add:', newImages);

      if (multiple) {
        const updatedImages = [...images, ...newImages].slice(0, maxImages);
        console.log('Updated images array:', updatedImages);
        console.log('Calling onImagesChange with:', updatedImages);
        onImagesChange(updatedImages);
        console.log('onImagesChange called successfully');
      } else {
        console.log('Setting single image:', newImages[0]);
        console.log('Calling onImagesChange with single image:', newImages.slice(0, 1));
        onImagesChange(newImages.slice(0, 1));
        console.log('onImagesChange called successfully');
      }

      toast({
        title: 'Success',
        description: 'Images uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload images',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [images, onImagesChange, multiple, maxImages, toast]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return; // Already primary
    
    const updatedImages = [...images];
    const [removed] = updatedImages.splice(index, 1);
    updatedImages.unshift(removed);
    onImagesChange(updatedImages);
  };

  // Debug: Log images prop on every render
  console.log('ImageUpload render - images prop:', images);
  console.log('ImageUpload render - images.length:', images.length);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className="p-6 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
        onClick={handleUploadAreaClick}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading || (multiple && images.length >= maxImages)}
              className="mb-2"
              onClick={handleButtonClick}
            >
              {isUploading ? 'Uploading...' : 'Choose Images'}
            </Button>
            <input
              id="image-upload"
              type="file"
              multiple={multiple}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading || (multiple && images.length >= maxImages)}
              ref={fileInputRef}
            />
            <p className="text-sm text-muted-foreground">
              {multiple 
                ? `Upload up to ${maxImages} images (${images.length}/${maxImages})`
                : 'Upload a single image'
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <div className="aspect-square relative overflow-hidden rounded-lg">
                <img
                  src={image.url}
                  alt={image.alt || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    {index === 0 && (
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                        Primary
                      </div>
                    )}
                    {index !== 0 && multiple && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrimaryImage(index)}
                        className="h-8 px-2"
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate">
                  {image.alt || `Image ${index + 1}`}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 