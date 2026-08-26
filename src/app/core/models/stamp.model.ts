export interface Stamp {
  id: string;
  name: string;
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
