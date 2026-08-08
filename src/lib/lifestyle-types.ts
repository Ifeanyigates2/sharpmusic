export type LifestyleVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  coverImageUrl?: string;
  createdAt: string;
};

export type LifestyleVideoInput = {
  title: string;
  description: string;
};
