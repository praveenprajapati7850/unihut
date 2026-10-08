import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
} from 'lucide-react';
import { compressImageFile } from '../lib/imageUtils';

export interface ImagePreset {
  label: string;
  url: string;
}

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  presets?: ImagePreset[];
  label?: string;
  required?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  presets = [],
  label = 'Item Photo',
  required = false,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ sizeKb: number; width: number; height: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState(value && !value.startsWith('data:') ? value : '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDataUrl = value?.startsWith('data:image/');

  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    try {
      setIsCompressing(true);
      const result = await compressImageFile(file, 900, 0.78);
      onChange(result.dataUrl);
      setCompressionInfo({
        sizeKb: result.sizeKb,
        width: result.width,
        height: result.height,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setCompressionInfo(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCustomUrlApply = () => {
    if (customUrlInput.trim()) {
      onChange(customUrlInput.trim());
      setCompressionInfo(null);
      setUploadError(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
          {label} {required && '*'}
        </label>
        <span className="text-[11px] text-stone-500 font-medium">
          Upload photo, pick campus sample, or paste link
        </span>
      </div>

      {/* Mode selection tabs */}
      <div className="flex p-1 bg-stone-100 rounded-2xl gap-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-amber-600" />
          <span>Upload File / Camera</span>
        </button>

        {presets.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Campus Presets</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'url'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5 text-amber-600" />
          <span>Web URL</span>
        </button>
      </div>

      {/* Tab 1: File Upload / Drag & Drop */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="campus-image-input"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-50/70 scale-[0.99]'
                : 'border-stone-300 hover:border-amber-400 bg-stone-50/50 hover:bg-stone-50'
            }`}
          >
            {isCompressing ? (
              <div className="py-4 flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                <p className="text-xs font-bold text-stone-800">
                  Optimizing photo for Firestore...
                </p>
                <p className="text-[11px] text-stone-500">
                  Resizing and compressing to lightweight format
                </p>
              </div>
            ) : (
              <div className="py-2 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center shadow-xs">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-stone-800">
                    Click to browse files or drag & drop photo here
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Supports JPG, PNG, WebP • Auto-compressed for persistent Firestore storage
                  </p>
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-100 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Choose Photo from Device</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Campus Presets */}
      {activeTab === 'preset' && presets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {presets.map((sample) => {
            const isSelected = value === sample.url;
            return (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  onChange(sample.url);
                  setCompressionInfo(null);
                  setUploadError(null);
                }}
                className={`p-2 rounded-2xl border text-left transition-all flex items-center gap-2 group cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <img
                  src={sample.url}
                  alt={sample.label}
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                  loading="lazy"
                />
                <span className="text-[11px] font-semibold text-stone-700 leading-tight">
                  {sample.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 3: Web Image Link */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or any image URL"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomUrlApply();
                }
              }}
              className="flex-1 px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl outline-none"
            />
            <button
              type="button"
              onClick={handleCustomUrlApply}
              className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Apply Link
            </button>
          </div>
          <p className="text-[11px] text-stone-500">
            Paste a public direct link to an image on Google Drive, Unsplash, or Imgur.
          </p>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Active Image Preview & Status Card */}
      {value ? (
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center gap-3">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-200 border border-stone-200 shrink-0">
            <img
              src={value}
              alt="Selected listing preview"
              className="w-full h-full object-cover"
              onError={() => {
                setUploadError('Image failed to load. Please verify the link or upload a new photo.');
              }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs font-bold text-stone-900 truncate">
                {isDataUrl ? 'Photo Uploaded & Compressed' : 'Image Ready'}
              </p>
            </div>

            <p className="text-[11px] text-stone-500 truncate">
              {isDataUrl
                ? compressionInfo
                  ? `Optimized: ${compressionInfo.sizeKb} KB (${compressionInfo.width}×${compressionInfo.height}px) • Stored in Firestore`
                  : 'Embedded optimized image • Stored in Firestore'
                : value.length > 55
                ? value.substring(0, 55) + '...'
                : value}
            </p>

            <div className="pt-0.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'upload') {
                    setActiveTab('upload');
                  }
                  fileInputRef.current?.click();
                }}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
              >
                Change photo
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-stone-600 text-xs flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            No photo selected yet. Please upload a photo from your device or pick a campus preset.
          </span>
        </div>
      )}
    </div>
  );
};
