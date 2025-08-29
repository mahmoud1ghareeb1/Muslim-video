import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VideoLink } from '../types';
import { CloseIcon, UploadIcon } from './Icons';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (video: Omit<VideoLink, 'id' | 'platform'>, id?: string) => void;
  existingVideo: VideoLink | null;
}

const generateThumbnailDataUrl = (title: string, color: string): string => {
    const escapedTitle = title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const lines = escapedTitle.split(' ').reduce((acc, word) => {
        if (acc.length === 0) return [word];
        const lastLine = acc[acc.length - 1];
        if (lastLine.length + word.length < 30) {
            acc[acc.length - 1] = `${lastLine} ${word}`;
        } else {
            acc.push(word);
        }
        return acc;
    }, [] as string[]);

    const totalLines = Math.min(lines.length, 4);
    const startYOffset = -((totalLines - 1) * 1.4) / 2;

    const textElements = lines.slice(0, 4).map((line, index) => 
        `<tspan x="50%" dy="${index === 0 ? startYOffset : 1.4}em">${line}</tspan>`
    ).join('');

    const svg = `
        <svg width="400" height="225" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225">
            <rect width="100%" height="100%" fill="${color}" />
            <text
                x="50%"
                y="50%"
                dominant-baseline="middle"
                text-anchor="middle"
                fill="#ffffff"
                font-size="22"
                font-family="Tajawal, sans-serif"
                font-weight="700"
                style="text-shadow: 1px 1px 3px rgba(0,0,0,0.6);">
                ${textElements}
            </text>
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

const THUMBNAIL_COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'];

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, onSave, existingVideo }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailOption, setThumbnailOption] = useState<'upload' | 'generate'>('upload');
  const [generatedColor, setGeneratedColor] = useState(THUMBNAIL_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingVideo) {
      setUrl(existingVideo.url);
      setTitle(existingVideo.title);
      setThumbnailUrl(existingVideo.thumbnailUrl);
    } else {
      setUrl('');
      setTitle('');
      setThumbnailUrl('');
    }
    setError(null);
    setThumbnailOption('upload');
    setGeneratedColor(THUMBNAIL_COLORS[0]);
  }, [existingVideo, isOpen]);

  const generatedThumbnailPreview = useMemo(() => {
      return generateThumbnailDataUrl(title || 'اكتب عنواناً', generatedColor);
  }, [title, generatedColor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailUrl(reader.result as string);
      };
      reader.onerror = () => {
        setError('فشل في قراءة الصورة.');
      }
      reader.readAsDataURL(file);
    } else if (file) {
        setError('يرجى اختيار ملف صورة صالح.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) {
      setError('الرابط والعنوان حقول إلزامية.');
      return;
    }
    
    let finalThumbnailUrl = thumbnailUrl;
    if (thumbnailOption === 'generate') {
      finalThumbnailUrl = generateThumbnailDataUrl(title, generatedColor);
    }
    
    onSave({ url, title, thumbnailUrl: finalThumbnailUrl || 'https://picsum.photos/400/225' }, existingVideo?.id);
  };

  if (!isOpen) return null;
  
  const finalPreviewUrl = thumbnailOption === 'upload' ? thumbnailUrl : generatedThumbnailPreview;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-3 left-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-1 rounded-full z-10">
          <CloseIcon />
        </button>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center text-teal-600 dark:text-teal-400">
            {existingVideo ? 'تعديل الرابط' : 'إضافة رابط جديد'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رابط الفيديو
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/video"
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                عنوان الفيديو
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الصورة المصغرة</label>
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-md p-1 bg-gray-100 dark:bg-gray-900">
                    <button type="button" onClick={() => setThumbnailOption('upload')} className={`w-1/2 py-2 text-sm font-medium rounded ${thumbnailOption === 'upload' ? 'bg-white dark:bg-gray-700 shadow text-teal-600' : 'text-gray-500'}`}>رفع صورة</button>
                    <button type="button" onClick={() => setThumbnailOption('generate')} className={`w-1/2 py-2 text-sm font-medium rounded ${thumbnailOption === 'generate' ? 'bg-white dark:bg-gray-700 shadow text-teal-600' : 'text-gray-500'}`}>إنشاء خلفية</button>
                </div>
            </div>

            {thumbnailOption === 'upload' ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <label htmlFor="file-upload" className="cursor-pointer text-teal-600 dark:text-teal-400 font-semibold inline-flex items-center gap-2">
                        <UploadIcon />
                        <span>اختر صورة...</span>
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
            ) : (
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                   <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-2">اختر لون الخلفية</p>
                   <div className="flex justify-center gap-2">
                    {THUMBNAIL_COLORS.map(color => (
                        <button type="button" key={color} onClick={() => setGeneratedColor(color)} style={{ backgroundColor: color }} className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${generatedColor === color ? 'ring-2 ring-offset-2 ring-teal-500 dark:ring-offset-gray-800' : ''}`}></button>
                    ))}
                   </div>
                </div>
            )}
            
            {finalPreviewUrl && (
              <div className="mt-4">
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">معاينة</p>
                <img src={finalPreviewUrl} alt="Preview" className="w-full h-auto aspect-video object-cover rounded-md border dark:border-gray-600" />
              </div>
            )}
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400"
              >
                حفظ
              </button>
            </div>
          </form>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AddLinkModal;