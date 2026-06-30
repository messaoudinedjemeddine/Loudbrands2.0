'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';

interface SingleImageUploadProps {
  image?: string;
  onImageChange: (image: string | undefined) => void;
  className?: string;
}

export function SingleImageUpload({
  image,
  onImageChange,
  className = ''
}: SingleImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('Single file selected:', files[0].name, files[0].size);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', files[0]);

      console.log('Sending single image upload request...');
      
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api'}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      console.log('Single upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Single upload failed:', errorText);
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Single upload result:', result);
      onImageChange(result.url);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Single upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [onImageChange, toast, token]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    onImageChange(undefined);
  };

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
              disabled={isUploading}
              className="mb-2"
              onClick={handleButtonClick}
            >
              {isUploading ? 'Uploading...' : 'Choose Image'}
            </Button>
            <input
              id="single-image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
              ref={fileInputRef}
            />
            <p className="text-sm text-muted-foreground">
              Upload a single image for this category
            </p>
          </div>
        </div>
      </Card>

      {/* Image Preview */}
      {image && (
        <Card className="relative group">
          <div className="aspect-video relative overflow-hidden rounded-lg">
            <img
              src={image}
              alt="Category image"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={removeImage}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 