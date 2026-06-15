import { createContext } from 'react';
import type { EmotionContextType } from '../types/emotion';

export const EmotionContext = createContext<EmotionContextType | undefined>(undefined);
