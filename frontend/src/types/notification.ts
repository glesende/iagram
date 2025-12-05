export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'new_post';

export interface NotificationActor {
  id: number;
  name: string;
  email: string;
}

export interface NotificationPost {
  id: number;
  content: string;
  image_url: string;
}

export interface NotificationComment {
  id: number;
  content: string;
}

export interface NotificationIAnfluencer {
  id: number;
  name: string;
  username: string;
  avatar_url: string;
}

export interface Notification {
  id: number;
  type: NotificationType;
  user_id: number;
  actor_id: number | null;
  post_id: number | null;
  comment_id: number | null;
  i_anfluencer_id: number | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  actor?: NotificationActor;
  post?: NotificationPost;
  comment?: NotificationComment;
  i_anfluencer?: NotificationIAnfluencer;
}

export interface NotificationSettings {
  id: number;
  user_id: number;
  likes_enabled: boolean;
  comments_enabled: boolean;
  follows_enabled: boolean;
  mentions_enabled: boolean;
  new_posts_enabled: boolean;
  created_at: string;
  updated_at: string;
}
