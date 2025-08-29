
export type Platform = 'youtube' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'other';

export interface VideoLink {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  platform: Platform;
}
