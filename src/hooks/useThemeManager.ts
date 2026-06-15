import { useEffect, useRef } from 'react';
import { useEmotion } from './useEmotion';

export const useThemeManager = () => {
  const { emotions } = useEmotion();
  const lastThemeRef = useRef<string>('');

  useEffect(() => {
    const root = document.documentElement;
    
    let currentTheme = 'neutral';
    let primary = 'var(--color-yellow)';
    let bg = 'var(--color-peach)';
    let speed = '10s';

    const maxEmotion = Math.max(emotions.happy, emotions.angry, emotions.sad, emotions.surprised);
    
    if (maxEmotion > 0.3) { // Lower threshold for higher sensitivity
      if (emotions.happy === maxEmotion) {
        currentTheme = 'happy';
        primary = 'var(--color-yellow)';
        bg = 'var(--color-acid)';
        speed = '5s';
      } else if (emotions.angry === maxEmotion) {
        currentTheme = 'angry';
        primary = 'var(--color-coral)';
        bg = '#FFC1C1';
        speed = '2s';
      } else if (emotions.sad === maxEmotion) {
        currentTheme = 'sad';
        primary = 'var(--color-blue)';
        bg = '#D1E8E2';
        speed = '20s';
      } else if (emotions.surprised === maxEmotion) {
        currentTheme = 'surprised';
        primary = 'var(--color-purple)';
        bg = '#EBD9FC';
        speed = '8s';
      }
    }

    if (lastThemeRef.current !== currentTheme) {
      root.style.setProperty('--primary-color', primary);
      root.style.setProperty('--bg-color', bg);
      root.style.setProperty('--blob-speed', speed);
      lastThemeRef.current = currentTheme;
    }

  }, [emotions]);
};
