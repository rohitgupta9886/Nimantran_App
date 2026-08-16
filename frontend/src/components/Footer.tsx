import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#E9D3D0] bg-[#FFFDFC] py-12 text-[#51484A] text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="font-serif text-2xl gold-gradient-text font-bold">NIMANTRAN AI</div>
        <p className="text-[#9E6F6D] italic text-base font-serif">"Every celebration begins with a beautiful invitation."</p>
        <p className="text-xs text-[#8C7E80] max-w-xl mx-auto">
          Premier AI-powered Celebration Companion, Digital Invitation Creator, Guest Management & Event Storytelling Platform.
        </p>
        <div className="pt-6 border-t border-[#E9D3D0]/60 flex items-center justify-between text-xs text-[#8C7E80] max-w-4xl mx-auto flex-wrap gap-4">
          <span>&copy; {new Date().getFullYear()} Nimantran AI. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for Unforgettable Celebrations
          </span>
        </div>
      </div>
    </footer>
  );
};
