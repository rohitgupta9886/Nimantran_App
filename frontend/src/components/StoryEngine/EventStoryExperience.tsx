import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Calendar,
  Volume2,
  VolumeX,
  Split,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  MessageSquare,
} from 'lucide-react';

interface EventStoryExperienceProps {
  eventType: string;
  hostName: string;
  eventTitle: string;
  memories: any[];
  thenNowPairs?: any[];
  storyDetails?: any;
}

export const EventStoryExperience: React.FC<EventStoryExperienceProps> = ({
  eventType,
  hostName,
  eventTitle,
  memories = [],
  thenNowPairs = [],
  storyDetails,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeTabMode, setActiveTabMode] = useState<'MAGAZINE' | 'THEN_NOW' | 'TIMELINE'>('MAGAZINE');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  if (!memories || memories.length === 0) return null;

  const currentMem = memories[activeIdx] || memories[0];
  const strategy = storyDetails?.strategy || {};
  const category = strategy?.category || 'WEDDING';

  const storyTitle = storyDetails?.story_title || strategy?.default_title || 'Two Stories. One Journey.';
  const storySubtitle = storyDetails?.story_subtitle || strategy?.subtitle || 'Before We Say Forever...';

  // Category Theme CSS
  let containerBg = 'from-[#1A030A] via-[#0D0205] to-[#1F040E]';
  let borderStyle = 'border-amber-500/40';
  let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';

  if (category === 'BIRTHDAY_KIDS') {
    containerBg = 'from-[#0F172A] via-[#0B0F19] to-[#1E1B4B]';
    borderStyle = 'border-cyan-400/40';
    badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40';
  } else if (category === 'CORPORATE') {
    containerBg = 'from-[#0F172A] via-[#020617] to-[#1E293B]';
    borderStyle = 'border-slate-500/40';
    badgeColor = 'bg-slate-500/20 text-slate-300 border-slate-500/40';
  } else if (category === 'HOUSEWARMING') {
    containerBg = 'from-[#1A1208] via-[#0C0803] to-[#24170A]';
    borderStyle = 'border-amber-600/40';
    badgeColor = 'bg-amber-600/20 text-amber-300 border-amber-500/40';
  } else if (category === 'FESTIVAL') {
    containerBg = 'from-[#1A0900] via-[#0A0400] to-[#240D00]';
    borderStyle = 'border-orange-500/40';
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  }

  const toggleAudio = (url: string) => {
    if (playingAudio === url) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(url);
    }
  };

  return (
    <section id="event-story" className="space-y-8 py-8 px-2 sm:px-4">
      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-4 right-4 text-white p-2">
            <X className="w-6 h-6" />
          </button>
          <img src={selectedImage} alt="Full Screen Memory" className="max-w-full max-h-[90vh] rounded-3xl border-2 border-amber-400 shadow-2xl object-contain" />
        </div>
      )}

      {/* Main Container Card */}
      <div className={`rounded-3xl p-6 sm:p-10 border ${borderStyle} bg-gradient-to-b ${containerBg} shadow-2xl space-y-8 relative overflow-hidden`}>
        {/* Shloka / Header Badge */}
        <div className="text-center space-y-3">
          <span className={`inline-block px-4 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase border ${badgeColor}`}>
            {strategy.shloka_header || '|| NIMANTRAN AI STORY ENGINE ||'}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            {storyTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 italic font-serif max-w-xl mx-auto">
            "{storySubtitle}"
          </p>
        </div>

        {/* Story View Navigation Bar */}
        <div className="flex justify-center items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTabMode('MAGAZINE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTabMode === 'MAGAZINE' ? 'bg-amber-500 text-black border-amber-300 shadow-md' : 'bg-black/40 text-slate-300 border-amber-500/20'
            }`}
          >
            📖 Digital Magazine Experience
          </button>
          {thenNowPairs && thenNowPairs.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTabMode('THEN_NOW')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTabMode === 'THEN_NOW' ? 'bg-amber-500 text-black border-amber-300 shadow-md' : 'bg-black/40 text-slate-300 border-amber-500/20'
              }`}
            >
              🔄 Then → Now ({thenNowPairs.length})
            </button>
          )}
        </div>

        {/* VIEW MODE 1: DIGITAL MAGAZINE CINEMATIC SHOWCASE */}
        {activeTabMode === 'MAGAZINE' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center glass-panel p-6 sm:p-8 rounded-3xl gold-border shadow-2xl">
              {/* Photo Showcase */}
              <div className="space-y-3">
                <div
                  onClick={() => setSelectedImage(currentMem.image_url)}
                  className="h-80 sm:h-96 w-full rounded-3xl overflow-hidden relative border-2 border-amber-500/40 shadow-2xl group cursor-pointer"
                >
                  <img
                    src={currentMem.image_url}
                    alt={currentMem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] text-amber-300 font-mono font-bold border border-amber-500/30">
                    📅 {currentMem.date || 'Milestone'}
                  </div>

                  <button className="absolute bottom-3 right-3 p-2 rounded-full bg-black/70 text-amber-300 border border-amber-500/30 text-xs flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                  </button>
                </div>

                {/* Audio Voice Note Player */}
                {currentMem.voice_audio_url && (
                  <button
                    type="button"
                    onClick={() => toggleAudio(currentMem.voice_audio_url)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    {playingAudio === currentMem.voice_audio_url ? (
                      <>
                        <VolumeX className="w-4 h-4 text-rose-400" /> Playing Host Voice Note... (Tap to Pause)
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-amber-400" /> ▶ Hear This Memory (Host Audio)
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Story Copy Showcase (Hindi + English) */}
              <div className="space-y-5 text-left">
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
                    CHAPTER #{activeIdx + 1} OF {memories.length}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white gold-gradient-text flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500 inline" /> {currentMem.title}
                  </h3>
                </div>

                {/* HINDI PORTION */}
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 backdrop-blur-md space-y-1">
                  <span className="text-[9px] font-mono text-amber-300 font-bold uppercase block">
                    🇮🇳 प्रथमाध: हिंदी संस्मरण
                  </span>
                  <p className="text-sm text-amber-100 font-hindi leading-relaxed whitespace-pre-line">
                    "{currentMem.hindi_story || currentMem.story?.split('───────────────────────')[0] || currentMem.story}"
                  </p>
                </div>

                {/* ENGLISH PORTION */}
                {(currentMem.english_story || currentMem.story?.includes('───────────────────────')) && (
                  <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 backdrop-blur-md space-y-1">
                    <span className="text-[9px] font-mono text-rose-300 font-bold uppercase block">
                      🇬🇧 ENGLISH TRANSLATION
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 font-serif italic leading-relaxed whitespace-pre-line">
                      "{currentMem.english_story || currentMem.story?.split('───────────────────────')[1] || ''}"
                    </p>
                  </div>
                )}

                {/* Carousel Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
                  <button
                    type="button"
                    onClick={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : memories.length - 1))}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <span className="text-xs font-mono text-slate-400">
                    {activeIdx + 1} / {memories.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveIdx((prev) => (prev < memories.length - 1 ? prev + 1 : 0))}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center justify-center gap-3 overflow-x-auto py-2">
              {memories.map((m: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`h-14 w-20 rounded-xl overflow-hidden border-2 relative transition-all ${
                    activeIdx === idx ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={m.image_url} alt={m.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW MODE 2: THEN -> NOW COMPARISON SLIDER / SHOWCASE */}
        {activeTabMode === 'THEN_NOW' && thenNowPairs && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {thenNowPairs.map((pair: any, pIdx: number) => (
                <div key={pIdx} className="glass-panel p-6 rounded-3xl gold-border shadow-2xl space-y-4 text-center">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                    🔄 {pair.label}
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">{pair.before_label}</span>
                      <div className="h-44 rounded-2xl overflow-hidden border border-amber-500/30">
                        <img src={pair.before_image_url} alt={pair.before_label} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-amber-300 block uppercase font-bold">{pair.after_label}</span>
                      <div className="h-44 rounded-2xl overflow-hidden border border-amber-500/50 shadow-lg">
                        <img src={pair.after_image_url} alt={pair.after_label} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic font-serif">
                    "{pair.caption}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
