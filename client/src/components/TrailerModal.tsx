import React from 'react';
import { X } from 'lucide-react';

interface TrailerModalProps {
  youtubeKey: string | null;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ youtubeKey, title, isOpen, onClose }) => {
  if (!isOpen || !youtubeKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <div className="relative w-full max-w-4xl bg-[#0D0F14] rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-fade-in">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141720] border-b border-white/10">
          <h3 className="font-bold text-lg text-white truncate max-w-md">
            Official Trailer — {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Embed */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1`}
            title={`${title} Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
