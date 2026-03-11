export interface Video {
	id: string;
	title: string;
	description: string;
	url: string;
	thumbnailUrl: string;
	uploadUrl: string;
	upload_thumbnail_url: string;
	created_at: string;
	viewCount: number;
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
	status: 'pending' | 'processing' | 'completed' | 'failed';
}