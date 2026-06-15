export type Emotions = {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  neutral: number;
};

export interface EmotionContextType {
  emotions: Emotions;
  emotionsRef: React.RefObject<Emotions>;
  isReady: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}
