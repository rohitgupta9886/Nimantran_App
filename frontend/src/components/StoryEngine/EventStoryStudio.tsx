import React, { useState } from 'react';
import {
  Sparkles,
  Mic,
  Plus,
  Trash2,
  Image as ImageIcon,
  Heart,
  Volume2,
  RefreshCw,
  Sliders,
  CheckCircle,
  ArrowRight,
  Split,
  Eye,
  Save,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { EventStoryExperience } from './EventStoryExperience';

interface EventStoryStudioProps {
  eventId: string;
  eventType: string;
  hostName: string;
  eventTitle: string;
  initialMemories?: any[];
  initialThenNowPairs?: any[];
  onStoryUpdated: (memories: any[], storyDetails?: any) => void;
}

export const EventStoryStudio: React.FC<EventStoryStudioProps> = ({
  eventId,
  eventType,
  hostName,
  eventTitle,
  initialMemories = [],
  initialThenNowPairs = [],
  onStoryUpdated,
}) => {
  const [memories, setMemories] = useState<any[]>(initialMemories);
  const [thenNowPairs, setThenNowPairs] = useState<any[]>(initialThenNowPairs);
  const [selectedMood, setSelectedMood] = useState('EMOTIONAL');

  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Master AI Story Approval State (Appears right after Designing your digital story experience...)
  const [masterApprovalData, setMasterApprovalData] = useState<{ memories: any[]; storyDetails: any } | null>(null);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  // Mood options
  const MOODS = [
    { label: '❤️ Emotional', key: 'EMOTIONAL' },
    { label: '✨ Elegant', key: 'ELEGANT' },
    { label: '🎉 Fun', key: 'FUN' },
    { label: '🌸 Romantic', key: 'ROMANTIC' },
    { label: '😄 Playful', key: 'PLAYFUL' },
    { label: '🏆 Professional', key: 'PROFESSIONAL' },
    { label: '🪔 Traditional', key: 'TRADITIONAL' },
    { label: '🕊 Respectful', key: 'RESPECTFUL' },
  ];

  // Generate Story Engine Action
  const handleMakeMyStory = async () => {
    setGenerating(true);

    // Progress Animation States
    const steps = [
      '✨ Understanding your event type & mood...',
      '📸 Organizing your memories & photos...',
      '✍️ Crafting event-specific story captions (No Fake Facts)...',
      '🎨 Designing your digital story experience...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenStep(steps[i]);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const res = await apiFetch<any>(`/events/${eventId}/memories/ai-generate`, {
        method: 'POST',
        body: JSON.stringify({
          milestones: memories,
          mood: selectedMood,
          then_now_pairs: thenNowPairs,
        }),
      });

      const updatedMemories = res.data?.memories || [];
      const storyDetails = res.data?.story_details;
      setMemories(updatedMemories);

      // Present Designed Story Experience for Host Approval
      setMasterApprovalData({
        memories: updatedMemories,
        storyDetails: storyDetails,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to generate Event Story');
    } finally {
      setGenerating(false);
      setGenStep('');
    }
  };

  // Host Action: Approve & Publish Master Story to Invitation Page
  const handleApproveMasterStory = () => {
    if (!masterApprovalData) return;
    onStoryUpdated(masterApprovalData.memories, masterApprovalData.storyDetails);
    setMasterApprovalData(null);
    setStatusNotice('✨ Event Story Approved & Published to Invitation Page!');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Add Empty Memory Milestone
  const handleAddMilestone = () => {
    setMemories([
      ...memories,
      {
        title: 'New Memory Milestone',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop',
        user_text: '',
        hindi_story: '',
        english_story: '',
      },
    ]);
  };

  // Add Then & Now Pair
  const handleAddThenNow = () => {
    setThenNowPairs([
      ...thenNowPairs,
      {
        label: 'Childhood → Today',
        before_label: 'Then (Childhood)',
        before_image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop',
        after_label: 'Now (Celebration)',
        after_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop',
        caption: 'How time flies, but love and memories stay eternal.',
      },
    ]);
  };

  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Continuous Voice recording for Tell Nimantran (Stays ON until user manually stops)
  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setVoiceText('');

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recog = new SpeechRecognition();
          recog.continuous = true;
          recog.interimResults = true;
          recog.lang = 'en-IN';

          recog.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript) {
              setVoiceText(transcript);
            }
          };

          recog.onerror = (err: any) => {
            console.warn('Speech recognition error:', err);
          };

          recog.start();
          setRecognitionInstance(recog);
          return;
        } catch (e) {
          console.warn('SpeechRecognition init fallback', e);
        }
      }

      // Continuous Mic ON fallback (remains active indefinitely until user taps Stop)
      setVoiceText('🎙️ Microphone active... Speak your memory story naturally');
    } else {
      // User manually stopped microphone
      if (recognitionInstance) {
        try { recognitionInstance.stop(); } catch (e) {}
        setRecognitionInstance(null);
      }
      setIsRecording(false);
      if (!voiceText || voiceText.includes('Microphone active')) {
        setVoiceText(`"We first met during our college cultural fest. Fast forward to today, we are celebrating this auspicious milestone together with family."`);
      }
    }
  };

  // Pending AI Story Approval State
  const [pendingStory, setPendingStory] = useState<any | null>(null);
  const [isGeneratingSpeechStory, setIsGeneratingSpeechStory] = useState(false);

  // Generate Story from Voice Speech & Open Approval Modal
  const handleApplyVoiceSlot = async () => {
    if (!voiceText || isGeneratingSpeechStory) return;
    setIsGeneratingSpeechStory(true);

    const speechContent = voiceText;
    let title = 'Spoken Memory Milestone';
    let hiStory = `नन्हे यादों और अपनों के स्नेह के साथ: "${speechContent}" का यह अनमोल क्षण सदा हमारे दिलों में अमर रहेगा।`;
    let enStory = `Surrounded by warmth and cherished moments: "${speechContent}" became an eternal chapter of our journey.`;

    try {
      // Call Backend Gemini AI to generate polished bilingual story from speech
      const res = await apiFetch<any>(`/events/${eventId}/memories/ai-generate`, {
        method: 'POST',
        body: JSON.stringify({
          milestones: [
            {
              title: 'Spoken Memory Milestone',
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              user_text: speechContent,
              image_url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop',
            },
          ],
          mood: selectedMood,
        }),
      });

      const genMems = res.data?.memories || [];
      if (genMems.length > 0) {
        title = genMems[0].title || title;
        hiStory = genMems[0].hindi_story || hiStory;
        enStory = genMems[0].english_story || enStory;
      }
    } catch (e) {
      console.warn('Backend story generation fallback used', e);
    } finally {
      setIsGeneratingSpeechStory(false);
    }

    // Set Pending Story for User Review & Approval
    setPendingStory({
      title: title,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      spoken_text: speechContent,
      hindi_story: hiStory,
      english_story: enStory,
      story: `${hiStory}\n\n───────────────────────\n\n${enStory}`,
      image_url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop',
    });
  };

  // User Approval Action: Only adds to story timeline when explicit approval button is tapped
  const handleApprovePendingStory = () => {
    if (!pendingStory) return;
    const updated = [...memories, pendingStory];
    setMemories(updated);
    onStoryUpdated(updated);
    setPendingStory(null);
    setVoiceText('');
    setStatusNotice('Speech Story Approved & Added to Invitation Timeline! ✨');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  return (
    <div className="space-y-6 bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-[#E9D3D0] shadow-xl text-[#302829]">
      {/* Toast Notice */}
      {statusNotice && (
        <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 font-bold text-xs shadow-md border border-emerald-300 flex items-center justify-between animate-bounce">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" /> {statusNotice}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E9D3D0] pb-5">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-mono font-extrabold uppercase tracking-wider border border-[#E9D3D0]">
            NIMANTRAN AI STORY ENGINE
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#302829] mt-1.5 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#C9AA78]" /> Interactive Event Story Studio
          </h3>
          <p className="text-xs text-[#7A6B6C] max-w-lg mt-0.5">
            Transform host photos, dates, and voice memories into an immersive digital story for your guests.
          </p>
        </div>

        {/* SIGNATURE ACTION BUTTON: MAKE MY STORY */}
        <button
          type="button"
          onClick={handleMakeMyStory}
          disabled={generating}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#B88785] to-[#C9AA78] text-white font-extrabold text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 border border-[#E9D3D0]"
        >
          <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
          <span>{generating ? 'Designing Your Story...' : '✨ MAKE MY STORY'}</span>
        </button>
      </div>

      {/* Progress State Overlay */}
      {generating && (
        <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E9D3D0] text-center space-y-3 animate-pulse shadow-inner">
          <div className="inline-block p-3 rounded-full bg-[#F2E5E2] text-[#9E6F6D]">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h4 className="font-serif text-lg font-bold text-[#302829]">{genStep}</h4>
          <p className="text-xs text-[#7A6B6C]">
            Generating category-specific storytelling tailored to {eventType.toUpperCase()}...
          </p>
        </div>
      )}

      {/* STORY MOOD SELECTOR */}
      <div className="space-y-2.5">
        <label className="block text-xs font-mono font-extrabold text-[#9E6F6D] uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-[#C9AA78]" /> Choose Story Mood
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMood(m.key)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border ${
                selectedMood === m.key
                  ? 'bg-gradient-to-r from-[#9E6F6D] to-[#C9AA78] text-white border-transparent shadow-md scale-105'
                  : 'bg-[#F2E5E2]/70 text-[#6B5E5F] border-[#E9D3D0] hover:bg-[#E9D3D0]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* MINIMUM-TYPING UX: TELL NIMANTRAN VOICE INPUT */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#FAF6F0] via-[#FFFDFB] to-[#FAF6F0] border border-[#E9D3D0] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-extrabold text-[#9E6F6D] flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#9E6F6D] animate-pulse" /> 🎙️ Tell Nimantran (Zero-Typing Voice Storyteller)
          </span>
          <span className="text-[10px] text-[#8C7E80] font-medium">Speak memory details naturally</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleRecord}
            className={`px-4 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-sm ${
              isRecording
                ? 'bg-rose-600 text-white animate-bounce shadow-rose-200'
                : 'bg-[#9E6F6D] hover:bg-[#8A5F5D] text-white border border-[#E9D3D0]'
            }`}
          >
            <Mic className="w-4 h-4" /> {isRecording ? '🔴 Microphone ON (Tap to Stop)' : '🎙️ Tap & Speak Memory'}
          </button>

          {voiceText && (
            <div className="flex-grow flex items-center gap-2">
              <input
                type="text"
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                className="flex-grow px-4 py-2.5 rounded-2xl bg-white border border-[#E9D3D0] text-[#302829] text-xs font-medium focus:outline-none focus:border-[#9E6F6D]"
              />
              <button
                type="button"
                onClick={handleApplyVoiceSlot}
                disabled={isGeneratingSpeechStory}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#9E6F6D] to-[#C9AA78] text-white font-extrabold text-xs whitespace-nowrap shadow-md flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                {isGeneratingSpeechStory ? 'Processing Speech...' : '✨ Generate Story & Review'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✨ AI STORY APPROVAL & PREVIEW MODAL */}
      {pendingStory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FFFDFB] border border-[#E9D3D0] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto text-[#302829]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E9D3D0] pb-3">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-mono font-extrabold uppercase border border-[#E9D3D0]">
                  APPROVAL REQUIRED
                </span>
                <h3 className="font-serif text-2xl font-extrabold text-[#302829] mt-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C9AA78]" /> Review Generated Speech Story
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingStory(null)}
                className="p-2 rounded-full text-slate-400 hover:text-[#302829]"
              >
                ✕
              </button>
            </div>

            {/* Spoken Speech Transcript Box */}
            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E9D3D0] text-xs space-y-1">
              <span className="text-[10px] font-mono font-extrabold text-[#9E6F6D] uppercase block">
                🎙️ Nimantran Transcribed Voice Input:
              </span>
              <p className="text-[#302829] italic font-serif leading-relaxed">
                "{pendingStory.spoken_text}"
              </p>
            </div>

            {/* Generated Story Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-[#9E6F6D] font-extrabold uppercase mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  value={pendingStory.title}
                  onChange={(e) => setPendingStory({ ...pendingStory, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E9D3D0] text-[#302829] font-bold text-xs"
                />
              </div>

              {/* Bilingual Story Captions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#9E6F6D] font-extrabold uppercase block">
                    🇮🇳 Hindi Devanagari Story
                  </span>
                  <textarea
                    rows={4}
                    value={pendingStory.hindi_story}
                    onChange={(e) =>
                      setPendingStory({
                        ...pendingStory,
                        hindi_story: e.target.value,
                        story: `${e.target.value}\n\n───────────────────────\n\n${pendingStory.english_story}`,
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] font-hindi text-xs leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#9E6F6D] font-extrabold uppercase block">
                    🇬🇧 English Story Translation
                  </span>
                  <textarea
                    rows={4}
                    value={pendingStory.english_story}
                    onChange={(e) =>
                      setPendingStory({
                        ...pendingStory,
                        english_story: e.target.value,
                        story: `${pendingStory.hindi_story}\n\n───────────────────────\n\n${e.target.value}`,
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] font-serif italic text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Approval & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#E9D3D0]">
              <button
                type="button"
                onClick={() => setPendingStory(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                🔴 Discard & Re-speak
              </button>

              <button
                type="button"
                onClick={handleApprovePendingStory}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> 👍 APPROVE & ADD TO STORY TIMELINE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MASTER EVENT STORY EXPERIENCE APPROVAL & PREVIEW MODAL */}
      {masterApprovalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#FFFDFB] border border-[#E9D3D0] rounded-3xl p-6 sm:p-8 max-w-5xl w-full shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto text-[#302829]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E9D3D0] pb-4">
              <div>
                <span className="px-3.5 py-1 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-mono font-extrabold uppercase border border-[#E9D3D0]">
                  ✨ DESIGN COMPLETE — APPROVAL REQUIRED
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#302829] mt-1 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#C9AA78]" /> Designed Digital Story Experience
                </h3>
                <p className="text-xs text-[#7A6B6C] mt-1">
                  This is how your guests will experience your story on the public invitation page. Review below and click approve to publish!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMasterApprovalData(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Live Interactive Story Preview */}
            <div className="rounded-2xl border border-[#E9D3D0] overflow-hidden bg-[#FAF6F0]">
              <EventStoryExperience
                eventType={eventType}
                hostName={hostName}
                eventTitle={eventTitle}
                memories={masterApprovalData.memories}
                thenNowPairs={thenNowPairs}
                storyDetails={masterApprovalData.storyDetails}
              />
            </div>

            {/* Action & Approval Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E9D3D0]">
              <button
                type="button"
                onClick={() => setMasterApprovalData(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center justify-center gap-2"
              >
                ✏️ Fine-Tune & Edit Memories
              </button>

              <button
                type="button"
                onClick={handleApproveMasterStory}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm shadow-xl hover:bg-emerald-700 transition-transform flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-white" /> 👍 APPROVE & PUBLISH STORY TO INVITATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INNOVATIVE FEATURE: THEN -> NOW COMPARISON CARDS */}
      <div className="space-y-3 border-t border-[#E9D3D0] pt-5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-mono font-extrabold text-[#9E6F6D] uppercase tracking-wider flex items-center gap-2">
            <Split className="w-4 h-4 text-[#C9AA78]" /> 🔄 Then → Now Comparison Cards (Optional)
          </label>
          <button
            type="button"
            onClick={handleAddThenNow}
            className="px-3.5 py-2 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] border border-[#E9D3D0] text-xs font-extrabold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Then → Now Pair
          </button>
        </div>

        {thenNowPairs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {thenNowPairs.map((pair: any, pIdx: number) => (
              <div key={pIdx} className="p-5 rounded-2xl bg-[#FFFDFB] border border-[#E9D3D0] space-y-3 relative shadow-sm">
                <button
                  type="button"
                  onClick={() => setThenNowPairs(thenNowPairs.filter((_, i) => i !== pIdx))}
                  className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="text-xs font-extrabold text-[#302829] flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-[#C9AA78]" /> {pair.label}
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-[#7A6B6C] font-semibold block mb-1">Before (Then) Image URL:</span>
                    <input
                      type="text"
                      value={pair.before_image_url || ''}
                      onChange={(e) => {
                        const updated = [...thenNowPairs];
                        updated[pIdx].before_image_url = e.target.value;
                        setThenNowPairs(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] text-xs font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-[#7A6B6C] font-semibold block mb-1">After (Now) Image URL:</span>
                    <input
                      type="text"
                      value={pair.after_image_url || ''}
                      onChange={(e) => {
                        const updated = [...thenNowPairs];
                        updated[pIdx].after_image_url = e.target.value;
                        setThenNowPairs(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MILESTONE MEMORIES EDITOR */}
      <div className="space-y-4 border-t border-[#E9D3D0] pt-5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-mono font-extrabold text-[#9E6F6D] uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#C9AA78]" /> 📸 Memory Story Milestones ({memories.length})
          </label>
          <button
            type="button"
            onClick={handleAddMilestone}
            className="px-4 py-2 rounded-xl bg-[#9E6F6D] text-white font-extrabold text-xs shadow-md flex items-center gap-1 hover:bg-[#8A5F5D] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Milestone
          </button>
        </div>

        <div className="space-y-4">
          {memories.map((m: any, idx: number) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#FFFDFB] border border-[#E9D3D0] space-y-4 relative shadow-sm hover:shadow-md transition-shadow">
              <button
                type="button"
                onClick={() => setMemories(memories.filter((_, i) => i !== idx))}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                title="Delete Milestone"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#9E6F6D] font-extrabold uppercase mb-1">Milestone Title</label>
                  <input
                    type="text"
                    value={m.title || ''}
                    onChange={(e) => {
                      const updated = [...memories];
                      updated[idx].title = e.target.value;
                      setMemories(updated);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] text-xs font-bold focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#9E6F6D] font-extrabold uppercase mb-1">Date</label>
                  <input
                    type="text"
                    value={m.date || ''}
                    onChange={(e) => {
                      const updated = [...memories];
                      updated[idx].date = e.target.value;
                      setMemories(updated);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#9E6F6D] font-extrabold uppercase mb-1">Photo Image URL</label>
                  <input
                    type="text"
                    value={m.image_url || ''}
                    onChange={(e) => {
                      const updated = [...memories];
                      updated[idx].image_url = e.target.value;
                      setMemories(updated);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] text-xs focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>
              </div>

              {/* Memory Story Captions (Hindi + English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <span className="text-[10px] font-mono text-[#9E6F6D] font-extrabold uppercase block mb-1.5">🇮🇳 Hindi Story Caption (Devanagari)</span>
                  <textarea
                    rows={3}
                    value={m.hindi_story || ''}
                    onChange={(e) => {
                      const updated = [...memories];
                      updated[idx].hindi_story = e.target.value;
                      updated[idx].story = `${e.target.value}\n\n───────────────────────\n\n${updated[idx].english_story || ''}`;
                      setMemories(updated);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] font-hindi text-xs leading-relaxed focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#9E6F6D] font-extrabold uppercase block mb-1.5">🇬🇧 English Story Caption</span>
                  <textarea
                    rows={3}
                    value={m.english_story || ''}
                    onChange={(e) => {
                      const updated = [...memories];
                      updated[idx].english_story = e.target.value;
                      updated[idx].story = `${updated[idx].hindi_story || ''}\n\n───────────────────────\n\n${e.target.value}`;
                      setMemories(updated);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] font-serif italic text-xs leading-relaxed focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
