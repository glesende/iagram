export interface IAnfluencer {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profileImage: string;
  isVerified: boolean;
  personality: string;
  characteristics: string[];
  followerCount: number;
  followingCount: number;
  postCount: number;
}

export interface Post {
  id: string;
  iAnfluencerId: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  iAnfluencerId: string;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  mentions?: string[];
}

export interface FeedItem {
  post: Post;
  iAnfluencer: IAnfluencer;
  comments: Comment[];
}