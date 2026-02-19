import { useState, useRef } from 'react';
import { ChevronDown, Loader2, Volume2, Square } from 'lucide-react';
import { api, type Translation } from '../api/client';

interface LanguageResultProps {
  translation: Translation;
  originalText: string;
  onDetailLoaded?: (translationId: string, detail: string) => void;
}

export default function LanguageResult({ translation, onDetailLoaded }: LanguageResultProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState(translation.detail || '');
  const [detailError, setDetailError] = useState('');

  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsError, setTtsError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<string | null>(null); // cached blob URL

  const handleMore = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (detail) {
      setExpanded(true);
      return;
    }

    setLoadingDetail(true);
    setDetailError('');
    try {
      const res = await api.getDetail(translation.id);
      setDetail(res.detail);
      setExpanded(true);
      onDetailLoaded?.(translation.id, res.detail);
    } catch {
      setDetailError('Failed to load detail. Please try again.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTTS = async () => {
    // If currently playing, stop it
    if (ttsPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setTtsPlaying(false);
      return;
    }

    setTtsLoading(true);
    setTtsError('');
    try {
      // Use cached blob URL if available, otherwise fetch from API
      let url = audioCacheRef.current;
      if (!url) {
        const blob = await api.tts(translation.native_text, translation.language);
        url = URL.createObjectURL(blob);
        audioCacheRef.current = url;
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setTtsPlaying(false);
        audioRef.current = null;
      });
      audio.addEventListener('error', () => {
        setTtsPlaying(false);
        setTtsError('Playback failed.');
        // Invalidate cache on error so next click retries
        audioCacheRef.current = null;
        audioRef.current = null;
      });

      await audio.play();
      setTtsPlaying(true);
    } catch {
      setTtsError('Failed to generate audio.');
    } finally {
      setTtsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4">
        {/* Language badge */}
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
          {translation.language}
        </span>

        {/* Main translation + TTS button */}
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-medium text-slate-800 leading-tight">
              {translation.native_text}
            </p>
            {translation.romanized_text && (
              <p className="text-sm text-slate-500 mt-1 italic">
                {translation.romanized_text}
              </p>
            )}
          </div>

          {/* TTS button */}
          <button
            onClick={handleTTS}
            disabled={ttsLoading}
            title={ttsPlaying ? 'Stop' : 'Listen'}
            className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
              ${ttsPlaying
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
              }`}
          >
            {ttsLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : ttsPlaying ? (
              <Square size={14} fill="currentColor" />
            ) : (
              <Volume2 size={16} />
            )}
          </button>
        </div>

        {ttsError && (
          <p className="text-xs text-red-500 mt-1">{ttsError}</p>
        )}

        {/* More button */}
        <button
          onClick={handleMore}
          disabled={loadingDetail}
          className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer bg-transparent border-0 p-0 disabled:opacity-50"
        >
          {loadingDetail ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
              {expanded ? 'Less' : 'More'}
            </>
          )}
        </button>
      </div>

      {/* Expandable detail */}
      {expanded && detail && (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{detail}</p>
        </div>
      )}

      {detailError && (
        <div className="border-t border-red-100 bg-red-50 p-3">
          <p className="text-sm text-red-600">{detailError}</p>
        </div>
      )}
    </div>
  );
}
