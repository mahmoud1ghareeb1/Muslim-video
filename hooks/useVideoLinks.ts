import { useState, useEffect, useCallback } from 'react';
import { VideoLink, Platform } from '../types';

const getPlatformFromUrl = (url: string): Platform => {
    if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
    if (/facebook\.com|fb\.watch/.test(url)) return 'facebook';
    if (/instagram\.com/.test(url)) return 'instagram';
    if (/twitter\.com|x\.com/.test(url)) return 'twitter';
    if (/tiktok\.com/.test(url)) return 'tiktok';
    return 'other';
};

const initialData: VideoLink[] = [];

export const useVideoLinks = () => {
    const [videoLinks, setVideoLinks] = useState<VideoLink[]>(() => {
        try {
            const item = window.localStorage.getItem('videoLinks');
            return item ? JSON.parse(item) : initialData;
        } catch (error) {
            console.error(error);
            return initialData;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('videoLinks', JSON.stringify(videoLinks));
        } catch (error) {
            console.error(error);
        }
    }, [videoLinks]);

    const addVideoLink = useCallback((video: Omit<VideoLink, 'id' | 'platform'>) => {
        const newVideo: VideoLink = {
            id: new Date().toISOString(),
            ...video,
            platform: getPlatformFromUrl(video.url),
        };
        setVideoLinks(prevLinks => [newVideo, ...prevLinks]);
    }, []);

    const updateVideoLink = useCallback((id: string, updatedVideo: Partial<VideoLink>) => {
        setVideoLinks(prevLinks =>
            prevLinks.map(link =>
                link.id === id ? { ...link, ...updatedVideo, platform: getPlatformFromUrl(updatedVideo.url || link.url) } : link
            )
        );
    }, []);

    const deleteVideoLink = useCallback((id: string) => {
        setVideoLinks(prevLinks => prevLinks.filter(link => link.id !== id));
    }, []);
    
    return { videoLinks, addVideoLink, updateVideoLink, deleteVideoLink };
};