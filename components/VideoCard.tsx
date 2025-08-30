import React from 'react';
import { VideoLink } from '../types';
import { YoutubeIcon, FacebookIcon, InstagramIcon, TwitterIcon, TiktokIcon, OtherLinkIcon, ShareIcon, EditIcon, DeleteIcon } from './Icons';

interface VideoCardProps {
  video: VideoLink;
  onEdit: () => void;
  onDelete: () => void;
}

const platformIcons: { [key in VideoLink['platform']]: JSX.Element } = {
  youtube: <YoutubeIcon />,
  facebook: <FacebookIcon />,
  instagram: <InstagramIcon />,
  twitter: <TwitterIcon />,
  tiktok: <TiktokIcon />,
  other: <OtherLinkIcon />,
};

const VideoCard: React.FC<VideoCardProps> = ({ video, onEdit, onDelete }) => {
  const handleShare = async () => {
    const shareData = {
      title: video.title,
      text: `شاهد هذا الفيديو الإسلامي: ${video.title}`,
      url: video.url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(video.url);
        alert('تم نسخ الرابط إلى الحافظة!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(video.url);
        alert('لم تنجح المشاركة، ولكن تم نسخ الرابط إلى الحافظة!');
      } catch (copyError) {
        alert('فشلت المشاركة والنسخ.');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform transform hover:scale-105 duration-300">
      <a href={video.url} target="_blank" rel="noopener noreferrer" className="block relative">
        <img
          src={video.thumbnailUrl && video.thumbnailUrl.trim() ? video.thumbnailUrl : 'https://picsum.photos/400/225'}
          alt={video.title}
          className="w-full h-40 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = 'https://picsum.photos/400/225';
          }}
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1.5">
          {platformIcons[video.platform]}
        </div>
      </a>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-md flex-grow mb-3 text-gray-800 dark:text-gray-100 h-12 overflow-hidden">
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            {video.title}
          </a>
        </h3>
        <div className="flex justify-end items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-3 mt-auto">
           <button onClick={handleShare} className="text-gray-500 hover:text-blue-500 p-2 rounded-full transition-colors" title="مشاركة">
             <ShareIcon />
           </button>
           <button onClick={onEdit} className="text-gray-500 hover:text-yellow-500 p-2 rounded-full transition-colors" title="تعديل">
             <EditIcon />
           </button>
           <button onClick={onDelete} className="text-gray-500 hover:text-red-500 p-2 rounded-full transition-colors" title="حذف">
             <DeleteIcon />
           </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
