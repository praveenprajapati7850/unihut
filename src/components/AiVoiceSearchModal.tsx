import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Search,
  Tag,
  IndianRupee,
  Volume2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Listing, ListingCategory, AiVoiceSearchResult } from '../types';
import { fetchAiVoiceSearch } from '../lib/aiService';

interface AiVoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
  onApplySearch: (query: string, category?: ListingCategory | null, maxPrice?: number | null) => void;
}

// Student voice query presets for instant testing (especially useful when iframe mic is blocked)
const SAMPLE_VOICE_QUERIES = [
  {
    label: 'Engineering Drafter',
    text: 'I need an engineering drafter and mini drafter under 400',
    category: 'Hostel Essentials' as ListingCategory,
    badge: 'Drafter under ₹400',
  },
  {
    label: 'Scientific Calculator',
    text: 'Casio FX-991EX scientific calculator for semester exams',
    category: 'Electronics' as ListingCategory,
    badge: 'Casio Calculator',
  },
  {
    label: 'Hostel Kettle',
    text: 'Hostel electric kettle or induction under 800 rupees',
    category: 'Hostel Essentials' as ListingCategory,
    badge: 'Kettle under ₹800',
  },
  {
    label: 'College Cycle',
    text: 'Second hand bicycle or gear cycle for campus hostel',
    category: 'Cycles & Mobility' as ListingCategory,
    badge: 'Campus Bicycle',
  },
  {
    label: 'Maths Textbook',
    text: 'Higher Engineering Mathematics semester 3 book',
    category: 'Textbooks' as ListingCategory,
    badge: 'Engineering Maths',
  },
];

export const AiVoiceSearchModal: React.FC<AiVoiceSearchModalProps> = ({
  isOpen,
  onClose,
  listings,
  onApplySearch,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [voiceResult, setVoiceResult] = useState<AiVoiceSearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [manualQuery, setManualQuery] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
      setVoiceResult(null);
      setTranscriptPreview('');
      setErrorMessage(null);
      setRecordingSeconds(0);
    }
  }, [isOpen]);

  // Clean up any active stream on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  if (!isOpen) return null;

  // Process search query with Gemini AI
  const processVoicePayload = async (payload: {
    audioBase64?: string;
    mimeType?: string;
    transcript?: string;
  }) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = await fetchAiVoiceSearch(payload);
      setVoiceResult(result);
    } catch {
      // Fallback if network or Gemini call fails: parse locally
      const queryText = payload.transcript || transcriptPreview || 'campus item';
      setVoiceResult({
        transcript: queryText,
        cleanQuery: queryText,
        keywords: queryText.split(/\s+/).filter((w) => w.length > 2),
        category: null,
        maxPrice: null,
        minPrice: null,
        condition: null,
        explanation: `Understood search for "${queryText}".`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Start recording audio using MediaRecorder + optional Web Speech preview
  const startRecording = async () => {
    setErrorMessage(null);
    setTranscriptPreview('');
    setVoiceResult(null);
    setMicPermissionDenied(false);

    // 1. Try starting browser Speech Recognition for live text feedback if supported
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.lang = 'en-IN';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscriptPreview(currentTranscript.trim());
        };

        recognition.onerror = () => {
          // Non-blocking; MediaRecorder will still capture audio
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch {
        // Non-blocking
      }
    }

    // 2. Request microphone stream for genuine audio capture
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone capture not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 100) {
          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            processVoicePayload({
              audioBase64: base64Audio,
              mimeType,
              transcript: transcriptPreview || undefined,
            });
          };
          reader.readAsDataURL(audioBlob);
        } else if (transcriptPreview) {
          // If audio blob was too small but speech recognition got words
          processVoicePayload({ transcript: transcriptPreview });
        } else {
          setErrorMessage("Couldn't capture audio. Please try speaking again or click a sample query.");
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 8) {
            // Auto stop after 8 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setMicPermissionDenied(true);
      setErrorMessage(
        'Microphone access is restricted by the browser in this window. You can speak or test AI Voice Search with any sample query below, or type your query!'
      );
      stopRecordingCleanup();
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsRecording(false);
  };

  const handleSelectSampleQuery = (sample: (typeof SAMPLE_VOICE_QUERIES)[0]) => {
    setErrorMessage(null);
    setTranscriptPreview(sample.text);
    processVoicePayload({ transcript: sample.text });
  };

  // Find how many listings match
  const matchingCount = voiceResult
    ? listings.filter((item) => {
        if (item.status !== 'available') return false;
        if (voiceResult.category && item.category !== voiceResult.category) return false;
        if (voiceResult.maxPrice && item.price > voiceResult.maxPrice) return false;
        if (!voiceResult.cleanQuery) return true;
        const qWords = voiceResult.cleanQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const itemText = `${item.title} ${item.description || ''} ${item.category}`.toLowerCase();
        return qWords.some((w) => itemText.includes(w));
      }).length
    : 0;

  const handleApply = () => {
    if (!voiceResult) return;
    onApplySearch(
      voiceResult.cleanQuery || voiceResult.transcript,
      voiceResult.category,
      voiceResult.maxPrice
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-purple-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-200/60">
              <Mic className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-stone-900 text-base">AI Voice Search</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 tracking-wide uppercase">
                  Gemini Flash
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Speak in English, Hindi, or Hinglish (e.g. &ldquo;Calculator under 500&rdquo;)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close voice search dialog"
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-white/80 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Central Animated Mic Orb */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              {/* Pulsing rings when recording */}
              {isRecording && (
                <>
                  <div className="absolute w-32 h-32 rounded-full bg-rose-400/20 animate-ping" />
                  <div className="absolute w-28 h-28 rounded-full bg-rose-400/30 animate-pulse" />
                </>
              )}

              {/* Main Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                aria-label={isRecording ? 'Stop voice recording' : 'Start speaking voice search query'}
                className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 ${
                  isRecording
                    ? 'bg-rose-500 text-white shadow-rose-500/40 hover:bg-rose-600 ring-4 ring-rose-200'
                    : isProcessing
                    ? 'bg-purple-600 text-white shadow-purple-500/30 ring-4 ring-purple-100'
                    : 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-rose-500/30 hover:scale-105 ring-4 ring-rose-50'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
                <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">
                  {isProcessing ? 'Thinking' : isRecording ? 'Tap to Stop' : 'Tap to Speak'}
                </span>
              </button>
            </div>

            {/* Status indicator */}
            <div className="mt-4 text-center">
              {isRecording ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-sm font-bold text-rose-600">
                      Listening... 0:0{recordingSeconds} / 0:08
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Speak what you need, your budget, or campus hostel items
                  </p>
                </div>
              ) : isProcessing ? (
                <div className="flex items-center justify-center gap-2 text-purple-600 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 animate-spin text-purple-500" />
                  <span>Gemini is transcribing & analyzing your search...</span>
                </div>
              ) : (
                <p className="text-xs text-stone-500 font-medium">
                  Tap microphone to record or test any campus query below
                </p>
              )}
            </div>

            {/* Live speech preview if available */}
            {isRecording && transcriptPreview && (
              <div className="mt-3 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 max-w-sm text-center italic">
                &ldquo;{transcriptPreview}&rdquo;
              </div>
            )}
          </div>

          {/* Error / Permission Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-semibold">{errorMessage}</p>
                {micPermissionDenied && (
                  <p className="text-rose-700/90 text-[11px]">
                    Tip: In browser iframes, microphones can be restricted by browser security policies.
                    Click any sample student query below to experience full AI voice intent filtering!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* AI Result Card */}
          {voiceResult && (
            <div className="p-4 bg-stone-50/80 border border-stone-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>AI Understood:</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {matchingCount} matching items on campus
                </span>
              </div>

              {/* Spoken words */}
              <div className="bg-white p-3 rounded-xl border border-stone-200/80 text-xs text-stone-700">
                <span className="font-medium text-stone-400 mr-1.5">You said:</span>
                <span className="font-semibold text-stone-900 italic">
                  &ldquo;{voiceResult.transcript}&rdquo;
                </span>
              </div>

              {/* Extracted filters */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-xs">
                  <Search className="w-3.5 h-3.5 text-stone-400" />
                  <span>{voiceResult.cleanQuery}</span>
                </div>

                {voiceResult.category && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs font-bold text-purple-700 shadow-xs">
                    <Tag className="w-3.5 h-3.5 text-purple-500" />
                    <span>{voiceResult.category}</span>
                  </div>
                )}

                {voiceResult.maxPrice && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 shadow-xs">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Max ₹{voiceResult.maxPrice}</span>
                  </div>
                )}
              </div>

              {voiceResult.explanation && (
                <p className="text-[11px] text-stone-500 italic">
                  {voiceResult.explanation}
                </p>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleApply}
                className="w-full mt-2 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <span>View {matchingCount} Matching Campus Items</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          )}

          {/* Direct Input Field for speaking or typing query */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualQuery.trim() && !isProcessing) {
                setTranscriptPreview(manualQuery.trim());
                processVoicePayload({ transcript: manualQuery.trim() });
                setManualQuery('');
              }
            }}
            className="flex items-center gap-2 pt-1 border-t border-stone-100"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Or type voice query (e.g. Casio calculator under 500)..."
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                disabled={isRecording || isProcessing}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-100 focus:bg-white border border-stone-200 focus:border-rose-400 rounded-xl outline-none transition-all placeholder:text-stone-400 pr-9"
              />
              <Sparkles className="w-3.5 h-3.5 text-rose-500 absolute right-3 top-3 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={!manualQuery.trim() || isRecording || isProcessing}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
            >
              Understand
            </button>
          </form>

          {/* Quick Voice Simulation Presets */}
          <div className="space-y-2.5 pt-1 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Try Sample Student Voice Queries</span>
              </span>
              <span className="text-[10px] text-stone-400 font-medium">1-Click Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_VOICE_QUERIES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSampleQuery(sample)}
                  disabled={isRecording || isProcessing}
                  className="p-2.5 rounded-xl text-left bg-stone-50 hover:bg-rose-50/60 border border-stone-200/80 hover:border-rose-200 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-stone-800 group-hover:text-rose-700">
                      {sample.badge}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200/60 text-stone-600 font-semibold group-hover:bg-rose-100 group-hover:text-rose-700">
                      {sample.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 mt-1 line-clamp-1 italic group-hover:text-stone-700">
                    &ldquo;{sample.text}&rdquo;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Understands Indian campus slang & accents</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
