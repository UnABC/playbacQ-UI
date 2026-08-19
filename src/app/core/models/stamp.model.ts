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