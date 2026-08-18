import React from 'react';
import { CelebrationTheme } from '../utils/themeCatalog';
import { Invitation3DCard } from './Invitation3DCard';

interface ThemeArtworkCanvasProps {
  theme: CelebrationTheme;
  title?: string;
  hindiTitle?: string;
  dateStr?: string;
  venueName?: string;
  venueAddress?: string;
  hostName?: string;
  className?: string;
  interactive?: boolean;
}

export const ThemeArtworkCanvas: React.FC<ThemeArtworkCanvasProps> = ({
  theme,
  title = 'Rohit & Priya',
  hindiTitle,
  dateStr = '18 Dec 2026',
  venueName = 'The Taj Palace',
  venueAddress,
  hostName,
  className = '',
  interactive = true,
}) => {
  return (
    <Invitation3DCard
      theme={theme}
      title={title}
      hindiTitle={hindiTitle}
      dateStr={dateStr}
      venueName={venueName}
      venueAddress={venueAddress}
      hostName={hostName}
      className={className}
      interactiveTilt={interactive}
    />
  );
};
