import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { Emotions } from '../types/emotion';
import { EmotionContext } from './EmotionContextInstance';

export const EmotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [emotions, setEmotions] = useState<Emotions>({
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    neutral: 1,
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>(null);
  const emotionsRef = useRef<Emotions>(emotions);
  const lastDetectionTimeRef = useRef<number>(0);

  const startDetection = useCallback(() => {
    if (!faceLandmarkerRef.current || !videoRef.current) return;

    const detect = (time: number) => {
      if (videoRef.current && faceLandmarkerRef.current && videoRef.current.readyState >= 2) {
        // Limit detection to ~30fps to save resources
        if (time - lastDetectionTimeRef.current >= 33) {
          try {
            const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, time);

            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
              const shapes = results.faceBlendshapes[0].categories;
              const getShape = (name: string) => shapes.find(s => s.categoryName === name)?.score || 0;

              const happy = (getShape('mouthSmileLeft') + getShape('mouthSmileRight')) / 2;
              const sad = (getShape('browDownLeft') + getShape('browDownRight') + getShape('mouthFrownLeft') + getShape('mouthFrownRight')) / 4;
              const angry = (getShape('browDownLeft') + getShape('browDownRight') + getShape('jawForward')) / 3;
              const surprised = (getShape('jawOpen') + getShape('browInnerUp')) / 2;
              
              const maxEmotion = Math.max(happy, sad, angry, surprised);
              const neutral = Math.max(0, 1 - maxEmotion);

              const nextEmotions = { happy, sad, angry, surprised, neutral };
              emotionsRef.current = nextEmotions;
              
              // Only update React state at a lower frequency for UI (e.g. ~15fps)
              if (time - lastDetectionTimeRef.current >= 66) {
                setEmotions(nextEmotions);
              }
            }
            lastDetectionTimeRef.current = time;
          } catch (e) {
            console.error("Detection error:", e);
          }
        }
      }
      requestRef.current = requestAnimationFrame(detect);
    };

    requestRef.current = requestAnimationFrame(detect);
  }, []);

  useEffect(() => {
    let active = true;

    const setupVision = async () => {
      // Set ready early to avoid blocking UI
      setIsReady(true);
      
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        if (!active) return;

        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
          });
          if (videoRef.current && active) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadeddata = () => {
              if (active) startDetection();
            };
          }
        } else {
          setError("Camera access not supported in this browser.");
        }
      } catch (err) {
        console.error("Vision setup failed:", err);
        setError("Face tracking unavailable (Model or WASM failed to load).");
      }
    };

    setupVision();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      faceLandmarkerRef.current?.close();
    };
  }, [startDetection]);

  return (
    <EmotionContext.Provider value={{ emotions, emotionsRef, isReady, videoRef }}>
      {children}
      {error && (
        <div style={{ position: 'fixed', bottom: 10, left: 10, color: '#ff4444', zIndex: 1000, fontSize: '0.7rem', background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: '5px' }}>
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
      />
    </EmotionContext.Provider>
  );
};
