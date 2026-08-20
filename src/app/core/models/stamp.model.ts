export interface Stamp {
  id: string;
  name: string;
  creatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  fileId?: string;
  isUnicode?: boolean;
  hasThumbnail?: boolean;
}

//GIF用
export interface StampFrame {
  bitmap: ImageBitmap;
  delay: number;
}

export interface AnimatedStampData {
  isAnimated: boolean;
  staticImage?: HTMLImageElement;
  frames?: StampFrame[];
  totalDuration?: number;
}
