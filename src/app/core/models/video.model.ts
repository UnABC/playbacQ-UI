export interface Video {
  video_id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnailUrl: string;
  uploadUrl: string;
  thumbUploadUrl: string;
  created_at: string;
  view_count: number;
  status: number;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  timestamp: number;
  userId: string;
}

export interface Progress {
  progress: number;
  // 0:pending, 1:processing, 2:completed, 3:failed
  status: number;
}
