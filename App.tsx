import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { VideoLink } from './types';
import { useVideoLinks } from './hooks/useVideoLinks';
import Header from './components/Header';
import VideoCard from './components/VideoCard';
import AddLinkModal from './components/AddLinkModal';
import { PlusIcon } from './components/Icons';

const App: React.FC = () => {
  const { videoLinks, addVideoLink, updateVideoLink, deleteVideoLink } = useVideoLinks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLink | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => void 0);
      }
      const handler = (e: Event) => {
        const detail = (e as CustomEvent<VideoLink>).detail;
        if (Notification.permission === 'granted') {
          const title = 'تم إضافة رابط جديد';
          const body = detail.title;
          const icon = detail.thumbnailUrl;
          try {
            new Notification(title, { body, icon });
          } catch (_) {
            // ignore
          }
        }
      };
      window.addEventListener('video-inserted', handler as EventListener);
      return () => window.removeEventListener('video-inserted', handler as EventListener);
    }
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingVideo(null);
  }, []);

  const handleSave = useCallback((video: Omit<VideoLink, 'id' | 'platform'>, id?: string) => {
    if (id) {
      const existingVideo = videoLinks.find(v => v.id === id);
      if(existingVideo) {
        updateVideoLink(id, { ...existingVideo, ...video });
      }
    } else {
      addVideoLink(video);
    }
    closeModal();
  }, [addVideoLink, updateVideoLink, closeModal, videoLinks]);

  const handleEdit = useCallback((video: VideoLink) => {
    setEditingVideo(video);
    openModal();
  }, [openModal]);

  const handleDelete = useCallback((id: string) => {
    if(window.confirm('هل أنت متأكد من أنك تريد حذف هذا الرابط؟')) {
        deleteVideoLink(id);
    }
  }, [deleteVideoLink]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredVideos = useMemo(() => {
    if (!searchQuery) {
      return videoLinks;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return videoLinks.filter(video =>
      video.title.toLowerCase().includes(lowercasedQuery) ||
      video.url.toLowerCase().includes(lowercasedQuery)
    );
  }, [videoLinks, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header onAddClick={openModal} onSearch={handleSearch} />

      <main className="container mx-auto p-4 md:p-8">
        {videoLinks.length === 0 ? (
           <div className="text-center py-20">
             <h2 className="text-2xl font-bold text-gray-500">الأرشيف فارغ حاليًا</h2>
             <p className="text-gray-400 mt-2">ابدأ بإضافة أول رابط فيديو إسلامي</p>
             <button
               onClick={openModal}
               className="mt-6 inline-flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors shadow-lg"
             >
               <PlusIcon />
               إضافة رابط جديد
             </button>
           </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-500">لا توجد نتائج بحث</h2>
            <p className="text-gray-400 mt-2">حاول البحث بكلمات مختلفة أو قم بإزالة البحث.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onEdit={() => handleEdit(video)}
                onDelete={() => handleDelete(video.id)}
              />
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <AddLinkModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={handleSave}
          existingVideo={editingVideo}
        />
      )}
    </div>
  );
};

export default App;
