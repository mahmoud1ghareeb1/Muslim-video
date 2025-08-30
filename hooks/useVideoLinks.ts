import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoLink, Platform } from '../types';
import { getSupabase, hasSupabase } from '../services/supabaseClient';

const getPlatformFromUrl = (url: string): Platform => {
    if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
    if (/facebook\.com|fb\.watch/.test(url)) return 'facebook';
    if (/instagram\.com/.test(url)) return 'instagram';
    if (/twitter\.com|x\.com/.test(url)) return 'twitter';
    if (/tiktok\.com/.test(url)) return 'tiktok';
    return 'other';
};

const initialData: VideoLink[] = [];

type DbRow = {
    id: string;
    url: string;
    title: string;
    thumbnail_url: string;
    platform: string | null;
    created_at?: string;
};

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

    const supabaseEnabled = hasSupabase();
    const supabase = getSupabase();
    const lastLocalInsertIdRef = useRef<string | null>(null);

    // Persist to localStorage as a cache (also used when Supabase is not configured)
    useEffect(() => {
        try {
            window.localStorage.setItem('videoLinks', JSON.stringify(videoLinks));
        } catch (error) {
            console.error(error);
        }
    }, [videoLinks]);

    // Load from Supabase + subscribe to realtime changes
    useEffect(() => {
        if (!supabaseEnabled || !supabase) return;

        let isMounted = true;

        const mapRow = (r: DbRow): VideoLink => ({
            id: r.id,
            url: r.url,
            title: r.title,
            thumbnailUrl: r.thumbnail_url && r.thumbnail_url.trim() ? r.thumbnail_url : 'https://picsum.photos/400/225',
            platform: (r.platform as Platform) || getPlatformFromUrl(r.url),
        });

        const load = async () => {
            const { data, error } = await supabase
                .from('video_links')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error(error);
                return;
            }
            if (!isMounted) return;
            const mapped = (data as DbRow[]).map(mapRow);
            setVideoLinks(mapped);
        };

        load();

        const channel = supabase
            .channel('public:video_links')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'video_links' }, (payload) => {
                if (!isMounted) return;
                if (payload.eventType === 'INSERT') {
                    const newRow = payload.new as DbRow;
                    const video = mapRow(newRow);
                    setVideoLinks(prev => {
                        // avoid duplicating if we already optimistically added with same id
                        if (prev.some(v => v.id === video.id)) return prev;
                        return [video, ...prev];
                    });
                    // Notify app about a newly added video (for in-app notifications)
                    const event = new CustomEvent('video-inserted', { detail: video });
                    window.dispatchEvent(event);
                } else if (payload.eventType === 'UPDATE') {
                    const newRow = payload.new as DbRow;
                    const video = mapRow(newRow);
                    setVideoLinks(prev => prev.map(v => (v.id === video.id ? video : v)));
                } else if (payload.eventType === 'DELETE') {
                    const oldRow = payload.old as DbRow;
                    setVideoLinks(prev => prev.filter(v => v.id !== oldRow.id));
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [supabaseEnabled, supabase]);

    const addVideoLink = useCallback(async (video: Omit<VideoLink, 'id' | 'platform'>) => {
        const platform = getPlatformFromUrl(video.url);
        if (supabaseEnabled && supabase) {
            const { data, error } = await supabase
                .from('video_links')
                .insert({ url: video.url, title: video.title, thumbnail_url: video.thumbnailUrl, platform })
                .select('*')
                .single();
            if (error) {
                console.error(error);
                // fall back to local state so user isn't blocked
                const newVideo: VideoLink = { id: new Date().toISOString(), ...video, platform };
                setVideoLinks(prev => [newVideo, ...prev]);
                return;
            }
            const inserted = data as DbRow;
            const mapped: VideoLink = {
                id: inserted.id,
                url: inserted.url,
                title: inserted.title,
                thumbnailUrl: inserted.thumbnail_url && inserted.thumbnail_url.trim() ? inserted.thumbnail_url : 'https://picsum.photos/400/225',
                platform: (inserted.platform as Platform) || platform,
            };
            setVideoLinks(prev => [mapped, ...prev]);
            lastLocalInsertIdRef.current = mapped.id;
        } else {
            const newVideo: VideoLink = {
                id: new Date().toISOString(),
                ...video,
                platform,
            };
            setVideoLinks(prev => [newVideo, ...prev]);
        }
    }, [supabaseEnabled, supabase]);

    const updateVideoLink = useCallback(async (id: string, updatedVideo: Partial<VideoLink>) => {
        if (supabaseEnabled && supabase) {
            const updates: Partial<DbRow> = {
                url: updatedVideo.url,
                title: updatedVideo.title,
                thumbnail_url: updatedVideo.thumbnailUrl,
                platform: updatedVideo.url ? getPlatformFromUrl(updatedVideo.url) : undefined,
            };
            const { error } = await supabase.from('video_links').update(updates).eq('id', id);
            if (error) {
                console.error(error);
            }
        }
        setVideoLinks(prevLinks =>
            prevLinks.map(link =>
                link.id === id
                    ? { ...link, ...updatedVideo, platform: getPlatformFromUrl(updatedVideo.url || link.url) }
                    : link
            )
        );
    }, [supabaseEnabled, supabase]);

    const deleteVideoLink = useCallback(async (id: string) => {
        if (supabaseEnabled && supabase) {
            const { error } = await supabase.from('video_links').delete().eq('id', id);
            if (error) {
                console.error(error);
            }
        }
        setVideoLinks(prevLinks => prevLinks.filter(link => link.id !== id));
    }, [supabaseEnabled, supabase]);

    return { videoLinks, addVideoLink, updateVideoLink, deleteVideoLink };
};
