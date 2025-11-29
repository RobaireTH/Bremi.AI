import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Language } from '../types';
import { TRANSLATIONS, Icons } from '../constants';
import { generateSpeech } from '../services/geminiService';
import { PSYCHO_WIKI, PsychoWikiEntry } from '../psychoWiki';

const JOURNAL_PIN_KEY = 'bremi_journal_pin_v1';
const JOURNAL_DATA_KEY = 'bremi_journal_entries_v1';
const MAX_PIN_ATTEMPTS = 5;

interface JournalEntry {
  id: string;
  createdAt: string;
  text: string;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface RelaxationProps {
  language: Language;
}

export const Relaxation: React.FC<RelaxationProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const [step, setStep] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [instruction, setInstruction] = useState(t.breathe_in);
  const [seconds, setSeconds] = useState(4);
  const [selectedTool, setSelectedTool] = useState<
    | '478_breathing'
    | 'box_breathing'
    | 'grounding_54321'
    | 'body_scan'
    | 'pmr'
    | 'safe_place'
    | 'self_compassion'
  >('478_breathing');
  const [activeWikiEntry, setActiveWikiEntry] = useState<PsychoWikiEntry | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [showCalmModal, setShowCalmModal] = useState(false);
  const [showMindModal, setShowMindModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);

  const [journalPinHash, setJournalPinHash] = useState<string | null>(null);
  const [journalUnlocked, setJournalUnlocked] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [newJournalText, setNewJournalText] = useState('');
  const [journalError, setJournalError] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const guideRequestIdRef = useRef(0);
  const journalTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const storedPin = localStorage.getItem(JOURNAL_PIN_KEY);
      if (storedPin) {
        setJournalPinHash(storedPin);
      }
      const storedEntries = localStorage.getItem(JOURNAL_DATA_KEY);
      if (storedEntries) {
        setJournalEntries(JSON.parse(storedEntries));
      }
    } catch (e) {
      console.error('Failed to load journal data', e);
    }
  }, []);

  // 4-7-8 Breathing Technique logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    const runCycle = () => {
      // Inhale (4s)
      setStep('inhale');
      setInstruction(t.breathe_in);
      setSeconds(4);
      
      timer = setTimeout(() => {
        // Hold (7s)
        setStep('hold');
        setInstruction(t.hold);
        setSeconds(7);
        
        timer = setTimeout(() => {
          // Exhale (8s)
          setStep('exhale');
          setInstruction(t.exhale);
          setSeconds(8);
          
          timer = setTimeout(() => {
             runCycle();
          }, 8000);
        }, 7000);
      }, 4000);
    };

    if (selectedTool === '478_breathing') {
      runCycle();
    }

    return () => clearTimeout(timer);
  }, [t, selectedTool]);

  // Countdown effect
  useEffect(() => {
    if (seconds > 0) {
      const timer = setInterval(() => setSeconds(s => s - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [seconds, step]);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const speakGuide = async (id: string, text: string) => {
    // If this audio is already playing, stop it
    if (activeAudioId === id) {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
        sourceNodeRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
        } catch (e) {}
        audioContextRef.current = null;
      }
      // Invalidate any in-flight guide requests
      guideRequestIdRef.current += 1;
      setActiveAudioId(null);
      return;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    const requestId = ++guideRequestIdRef.current;

    // Limit length to keep TTS snappy
    const trimmedText = text.length > 800 ? text.slice(0, 800) : text;

    setActiveAudioId(id);
    try {
      const base64Audio = await generateSpeech(trimmedText);
      if (!base64Audio) throw new Error('No audio data received');

      // If another request started or this one was cancelled, abort
      if (guideRequestIdRef.current !== requestId || activeAudioId !== id) {
        return;
      }

      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      const pcmData = new Int16Array(bytes.buffer);
      const audioBuffer = ctx.createBuffer(1, pcmData.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
      sourceNodeRef.current = source;

      source.onended = () => {
        if (guideRequestIdRef.current === requestId) {
          setActiveAudioId(null);
        }
      };
    } catch (e) {
      console.error('Failed to play guide audio', e);
      setActiveAudioId(null);
    } finally {
      setActiveAudioId(null);
    }
  };

  const getGuideText = () => {
    switch (selectedTool) {
      case '478_breathing':
        return `Let's do a 4-7-8 calming breath together. Gently breathe in through your nose for a slow count of four. Hold that breath softly for seven. Then exhale through your mouth for a full count of eight, like you are blowing stress out of your body. We will repeat this a few times. Move at a pace that feels kind to your body.`;
      case 'box_breathing':
        return `This is box breathing, like tracing a square with your breath. Inhale for four, hold for four, exhale for four, and rest for four. Imagine drawing the sides of a square in your mind as you go. This helps your nervous system reset and feel steadier.`;
      case 'grounding_54321':
        return `We are going to ground you in the present using five, four, three, two, one. Notice five things you can see around you. Four things you can feel with your body. Three things you can hear. Two things you can smell. And one thing you can taste or imagine tasting. Take your time, there is no rush.`;
      case 'body_scan':
        return `Let’s do a gentle body scan. Start from the top of your head and slowly move your attention down: your forehead, eyes, jaw, neck, shoulders, chest, belly, hips, legs, and feet. At each point, notice any tension and invite it to soften, even by one percent. You don’t have to force relaxation; just give your body permission to loosen a little.`;
      case 'pmr':
        return `We are going to do progressive muscle relaxation. Gently tense a muscle group as you breathe in, hold for a moment, and then release as you breathe out. Start with your hands, then your arms, shoulders, face, chest, belly, and legs. The goal is not to squeeze hard, but to notice the difference between tension and softness. Move slowly and stop if anything feels painful.`;
      case 'safe_place':
        return `Let’s build a safe place in your mind. Picture somewhere you feel calm or protected: it could be a real place, a childhood memory, or a place you have never visited. Notice the colours, sounds, smells, and temperature there. Imagine sitting or lying there while your body loosens. This becomes a mental home you can return to whenever life outside feels too loud.`;
      case 'self_compassion':
        return `We will practise a short self-compassion break. First, notice what you are feeling and name it gently. Then remind yourself: many humans feel this way; you are not alone or broken. Finally, speak to yourself like you would talk to a close friend you love. You can place a hand on your chest or cheek as you say something kind to yourself, even if it feels awkward at first.`;
      default:
        return '';
    }
  };

  const handleSaveJournalEntry = () => {
    const text = newJournalText.trim();
    if (!text) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      text,
    };
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    setNewJournalText('');
    try {
      localStorage.setItem(JOURNAL_DATA_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save journal entry', e);
    }
  };

  const handleSetPin = async () => {
    setJournalError(null);
    if (!newPin || newPin.length < 4) {
      setJournalError('PIN should be at least 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setJournalError('PINs do not match.');
      return;
    }
    try {
      const hash = await hashPin(newPin);
      setJournalPinHash(hash);
      setJournalUnlocked(true);
      setNewPin('');
      setConfirmPin('');
      localStorage.setItem(JOURNAL_PIN_KEY, hash);
    } catch (e) {
      console.error('Failed to set PIN', e);
      setJournalError('Something went wrong while setting your PIN.');
    }
  };

  const handleUnlockJournal = async () => {
    setJournalError(null);
    if (!journalPinHash) {
      setJournalUnlocked(true);
      setPinAttempts(0);
      return;
    }
    try {
      const hash = await hashPin(pinInput);
      if (hash === journalPinHash) {
        setJournalUnlocked(true);
        setPinInput('');
        setPinAttempts(0);
      } else {
        setPinAttempts((prev) => prev + 1);
        if (pinAttempts + 1 >= MAX_PIN_ATTEMPTS) {
          setJournalError(
            'Too many incorrect attempts. To protect your privacy, you can reset this journal (this clears existing notes) and set a new PIN.'
          );
        } else {
          setJournalError('Incorrect PIN. Please try again.');
        }
      }
    } catch (e) {
      console.error('Failed to verify PIN', e);
      setJournalError('Something went wrong while verifying your PIN.');
    }
  };

  const handleResetJournal = () => {
    try {
      localStorage.removeItem(JOURNAL_PIN_KEY);
      localStorage.removeItem(JOURNAL_DATA_KEY);
    } catch (e) {
      console.error('Failed to reset journal storage', e);
    }
    setJournalEntries([]);
    setJournalPinHash(null);
    setJournalUnlocked(false);
    setEditingEntryId(null);
    setEditingText('');
    setPinInput('');
    setNewPin('');
    setConfirmPin('');
    setPinAttempts(0);
    setJournalError(null);
  };

  const insertAtCursor = (snippet: string) => {
    const el = journalTextareaRef.current;
    if (!el) {
      setNewJournalText((prev) => prev + snippet);
      return;
    }
    const start = el.selectionStart ?? newJournalText.length;
    const end = el.selectionEnd ?? newJournalText.length;
    const before = newJournalText.slice(0, start);
    const after = newJournalText.slice(end);
    const next = before + snippet + after;
    setNewJournalText(next);

    // Restore cursor position after React updates
    requestAnimationFrame(() => {
      const pos = start + snippet.length;
      el.selectionStart = pos;
      el.selectionEnd = pos;
      el.focus();
    });
  };

  const applyBold = () => {
    const el = journalTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end) return;
    const before = newJournalText.slice(0, start);
    const selected = newJournalText.slice(start, end);
    const after = newJournalText.slice(end);
    const next = `${before}**${selected}**${after}`;
    setNewJournalText(next);
    requestAnimationFrame(() => {
      const pos = start + selected.length + 4;
      el.selectionStart = pos;
      el.selectionEnd = pos;
      el.focus();
    });
  };

  const applyHeading = (level: 1 | 2) => {
    const el = journalTextareaRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? 0;
    const text = newJournalText;
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    const prefix = level === 1 ? '# ' : '## ';
    const beforeLine = text.slice(0, lineStart);
    const line = text.slice(lineStart);
    const next = beforeLine + prefix + line;
    setNewJournalText(next);
    requestAnimationFrame(() => {
      const newPos = pos + prefix.length;
      el.selectionStart = newPos;
      el.selectionEnd = newPos;
      el.focus();
    });
  };

  const applyBullet = () => {
    const el = journalTextareaRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? 0;
    const text = newJournalText;
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    const beforeLine = text.slice(0, lineStart);
    const line = text.slice(lineStart);
    const prefix = line.startsWith('- ') ? '' : '- ';
    const next = beforeLine + prefix + line;
    setNewJournalText(next);
    requestAnimationFrame(() => {
      const newPos = pos + prefix.length;
      el.selectionStart = newPos;
      el.selectionEnd = newPos;
      el.focus();
    });
  };

  return (
    <div className="h-full flex flex-col bg-green-50 p-4 md:p-6 relative overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-100/50 to-transparent pointer-events-none"></div>

      <div className="relative z-10 mb-4">
        <h2 className="text-2xl font-bold text-green-800 mb-1">{t.relax}</h2>
        <p className="text-slate-600 text-sm max-w-md">
          {t.instructions}
        </p>
      </div>

      {/* Quick access tiles */}
      <div className="relative z-10 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setShowCalmModal(true);
            setShowMindModal(false);
            setShowJournalModal(false);
          }}
          className="rounded-2xl bg-white border border-green-100 px-4 py-3 shadow-sm flex items-center justify-between hover:border-green-200 hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">
              Calm tools
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              Breathing, grounding, body scan & more.
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <Icons.Flower className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowMindModal(true);
            setShowCalmModal(false);
            setShowJournalModal(false);
          }}
          className="rounded-2xl bg-white border border-emerald-100 px-4 py-3 shadow-sm flex items-center justify-between hover:border-emerald-200 hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Mind patterns
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              Learn why your brain does what it does.
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Icons.Brain className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowJournalModal(true);
            setShowCalmModal(false);
            setShowMindModal(false);
          }}
          className="rounded-2xl bg-slate-900 px-4 py-3 shadow-sm flex items-center justify-between hover:bg-slate-800 transition-all"
        >
          <div>
            <p className="text-xs font-semibold text-white uppercase tracking-wider">
              Safe journaling
            </p>
            <p className="text-[11px] text-slate-200 mt-1">
              PIN-protected notes on this device only.
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            <Icons.Lock className="w-4 h-4" />
          </div>
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Placeholder instead of main exercise; actual exercises live in the Calm tools modal */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-green-200 bg-white/60 p-6 text-center shadow-sm">
          <p className="text-sm text-slate-700 max-w-sm">
            Open <span className="font-semibold">Calm tools</span> to start a breathing or grounding
            exercise, explore <span className="font-semibold">Mind patterns</span>, or write in your
            <span className="font-semibold"> Safe journal</span>.
          </p>
        </div>
      </div>

      {/* Calm Tools Modal */}
      {showCalmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-4xl md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="bg-green-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Icons.Flower className="w-5 h-5 text-green-200" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Calm tools</h3>
                  <p className="text-xs text-green-100">Breathing, grounding, body scan & more</p>
                </div>
              </div>
              <button
                onClick={() => setShowCalmModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Icons.X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-green-50/40">
              <div className="grid grid-cols-1 md:grid-cols-[2fr,1.5fr] gap-4 md:gap-6">
                {/* Reuse main exercise area */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-green-100/60 to-green-50 rounded-3xl p-4 md:p-6 shadow-sm border border-green-100/70">
          <div className="flex items-center justify-between w-full mb-4">
            <h3 className="text-lg font-semibold text-green-900">
              {selectedTool === '478_breathing' && '4-7-8 Breathing Calm'}
              {selectedTool === 'box_breathing' && 'Box Breathing Reset'}
              {selectedTool === 'grounding_54321' && '5–4–3–2–1 Grounding'}
              {selectedTool === 'body_scan' && 'Gentle Body Scan'}
              {selectedTool === 'pmr' && 'Progressive Muscle Relaxation'}
              {selectedTool === 'safe_place' && 'Safe Place Visualisation'}
              {selectedTool === 'self_compassion' && 'Self-Compassion Break'}
            </h3>
            <button
              onClick={() => speakGuide(selectedTool, getGuideText())}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/70 text-green-800 border border-green-200 hover:bg-white transition-colors shadow-sm"
            >
              {activeAudioId === selectedTool ? (
                <>
                  <Icons.X className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Icons.Speaker className="w-3.5 h-3.5" />
                  <span>Guided voice</span>
                </>
              )}
            </button>
          </div>

                  {/* We keep the same body as main area, but rely on current selectedTool blocks */}
                  {/* To avoid duplication, show a short hint instead of re-implementing all steps */}
              <p className="text-xs text-green-900/80 max-w-sm text-center">
                    Use the tool picker on the right to change the exercise. The main Relax screen
                    will update to match your choice.
              </p>
            </div>

                {/* Calm Tools picker */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-green-100">
            <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-2">
              Calm Tools
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTool('478_breathing')}
                className={`text-left text-xs rounded-2xl px-3 py-3 border transition-all ${
                  selectedTool === '478_breathing'
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-green-50 text-green-900 border-green-100 hover:bg-green-100'
                }`}
              >
                <p className="font-semibold">4-7-8 Breathing</p>
                <p className="text-[11px] opacity-80 mt-0.5">Nervous system reset</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTool('box_breathing')}
                className={`text-left text-xs rounded-2xl px-3 py-3 border transition-all ${
                  selectedTool === 'box_breathing'
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-green-50 text-green-900 border-green-100 hover:bg-green-100'
                }`}
              >
                <p className="font-semibold">Box Breathing</p>
                <p className="text-[11px] opacity-80 mt-0.5">Steady, even breaths</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTool('grounding_54321')}
                className={`text-left text-xs rounded-2xl px-3 py-3 border transition-all ${
                  selectedTool === 'grounding_54321'
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-green-50 text-green-900 border-green-100 hover:bg-green-100'
                }`}
              >
                <p className="font-semibold">5-4-3-2-1</p>
                <p className="text-[11px] opacity-80 mt-0.5">Grounding senses</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTool('body_scan')}
                className={`text-left text-xs rounded-2xl px-3 py-3 border transition-all ${
                  selectedTool === 'body_scan'
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-green-50 text-green-900 border-green-100 hover:bg-green-100'
                }`}
              >
                <p className="font-semibold">Body Scan</p>
                <p className="text-[11px] opacity-80 mt-0.5">Release tension</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTool('pmr')}
                className={`text-left text-xs rounded-2xl px-3 py-3 border transition-all ${
                  selectedTool === 'pmr'
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-green-50 text-green-900 border-green-100 hover:bg-green-100'
                }`}
              >
                <p className="font-semibold">Muscle Relax</p>
                <p className="text-[11px] opacity-80 mt-0.5">Progressive softening</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTool('safe_place')}
                className={`text-left text-xs rounded-2xl px-3 py-3 border transition-all ${
                  selectedTool === 'safe_place'
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-green-50 text-green-900 border-green-100 hover:bg-green-100'
                }`}
              >
                <p className="font-semibold">Safe Place</p>
                <p className="text-[11px] opacity-80 mt-0.5">Mental sanctuary</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTool('self_compassion')}
                className={`text-left text-xs rounded-2xl px-3 py-3 border transition-all ${
                  selectedTool === 'self_compassion'
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-green-50 text-green-900 border-green-100 hover:bg-green-100'
                }`}
              >
                <p className="font-semibold">Self-Compassion</p>
                <p className="text-[11px] opacity-80 mt-0.5">Kind self-talk</p>
              </button>
            </div>
          </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mind Patterns Modal */}
      {showMindModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="bg-emerald-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Icons.Brain className="w-5 h-5 text-emerald-300" />
            </div>
                <div>
                  <h3 className="font-bold text-lg">Mind Patterns Wiki</h3>
                  <p className="text-xs text-emerald-200">Short psycho-education cards</p>
                </div>
              </div>
              <button
                onClick={() => setShowMindModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Icons.X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-gray-50/60">
              <p className="text-[11px] text-slate-600">
              These are common patterns Bremi may highlight during chat. Tap any one to read why it
              happens biologically and what can help.
            </p>
              <div className="space-y-2">
              {PSYCHO_WIKI.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                    onClick={() => {
                      setActiveWikiEntry(entry);
                      setShowMindModal(false);
                    }}
                  className="w-full text-left text-xs bg-emerald-50/80 border border-emerald-100 rounded-2xl px-3 py-2.5 hover:bg-emerald-100 transition-colors flex items-start gap-2"
                >
                  <span className="mt-0.5">
                    <Icons.Sparkles className="w-3 h-3 text-emerald-500" />
                  </span>
                  <span>
                    <span className="font-semibold block">{entry.label}</span>
                    <span className="text-[11px] text-emerald-900/90 line-clamp-2">
                      {entry.shortDescription}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Safe Journaling Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Icons.Lock className="w-5 h-5 text-slate-200" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Safe journaling</h3>
                  <p className="text-xs text-slate-300">PIN-protected notes stored on this device</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowJournalModal(false);
                  setJournalError(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Icons.X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-gray-50/60 flex-1">
              {!journalUnlocked ? (
                <>
                  {journalPinHash ? (
                    <>
                      <p className="text-[11px] text-slate-600 mb-1">
                        Enter your 4+ digit PIN to unlock your private journal on this device.
                      </p>
                      <input
                        type="password"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                        placeholder="Enter PIN"
                      />
                      {journalError && (
                        <p className="text-[11px] text-red-600 mt-1">{journalError}</p>
                      )}
                      {pinAttempts >= MAX_PIN_ATTEMPTS && (
                        <button
                          type="button"
                          onClick={handleResetJournal}
                          className="mt-2 w-full border border-red-200 text-red-700 text-[10px] font-semibold rounded-xl py-2 hover:bg-red-50 transition-colors"
                        >
                          Reset journal and set new PIN (clears existing notes)
                        </button>
                      )}
                      <button
                        onClick={handleUnlockJournal}
                        className="mt-3 w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                      >
                        Unlock journal
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-slate-600 mb-1">
                        Create a simple PIN. This is only used on this device to gate your notes.
                      </p>
                      <div className="space-y-2">
                        <input
                          type="password"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                          placeholder="Choose a 4+ digit PIN"
                        />
                        <input
                          type="password"
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                          placeholder="Confirm PIN"
                        />
                      </div>
                      {journalError && (
                        <p className="text-[11px] text-red-600 mt-1">{journalError}</p>
                      )}
                      <button
                        onClick={handleSetPin}
                        className="mt-3 w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                      >
                        Set PIN & continue
                      </button>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Your notes and PIN are saved locally in this browser, not on Bremi&apos;s
                        servers.
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Formatting</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={applyBold}
                          className="px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-50"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHeading(1)}
                          className="px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-50"
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHeading(2)}
                          className="px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-50"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={applyBullet}
                          className="px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-50"
                        >
                          •
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={journalTextareaRef}
                      value={newJournalText}
                      onChange={(e) => setNewJournalText(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40 min-h-[80px]"
                      placeholder="Write a few kind lines to yourself, or describe what is on your mind..."
                    />
                    <button
                      onClick={handleSaveJournalEntry}
                      disabled={!newJournalText.trim()}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        newJournalText.trim()
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Save entry
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Past entries
                    </h4>
                    {journalEntries.length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        No entries yet. Even a few sentences count as real journaling.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {journalEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-[10px] text-slate-400">
                                {new Date(entry.createdAt).toLocaleString()}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = journalEntries.filter((e) => e.id !== entry.id);
                                  setJournalEntries(updated);
                                  setExpandedEntries((prev) => {
                                    const next = { ...prev };
                                    delete next[entry.id];
                                    return next;
                                  });
                                  if (editingEntryId === entry.id) {
                                    setEditingEntryId(null);
                                    setEditingText('');
                                  }
                                  try {
                                    localStorage.setItem(
                                      JOURNAL_DATA_KEY,
                                      JSON.stringify(updated)
                                    );
                                  } catch (err) {
                                    console.error('Failed to delete journal entry', err);
                                  }
                                }}
                                className="text-[10px] text-red-500 hover:text-red-600 underline underline-offset-2"
                              >
                                Delete
                              </button>
                            </div>
                            {editingEntryId === entry.id ? (
                              <div className="space-y-2 mt-1">
                                <textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/30 min-h-[60px]"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingEntryId(null);
                                      setEditingText('');
                                    }}
                                    className="px-2 py-1 rounded-lg border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const trimmed = editingText.trim();
                                      if (!trimmed) return;
                                      const updated = journalEntries.map((e) =>
                                        e.id === entry.id ? { ...e, text: trimmed } : e
                                      );
                                      setJournalEntries(updated);
                                      setEditingEntryId(null);
                                      setEditingText('');
                                      try {
                                        localStorage.setItem(
                                          JOURNAL_DATA_KEY,
                                          JSON.stringify(updated)
                                        );
                                      } catch (err) {
                                        console.error('Failed to update journal entry', err);
                                      }
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-800"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {(() => {
                                  const isExpanded = !!expandedEntries[entry.id];
                                  const maxLen = 220;
                                  const needsTruncate = entry.text.length > maxLen;
                                  const displayText =
                                    isExpanded || !needsTruncate
                                      ? entry.text
                                      : entry.text.slice(0, maxLen) + '…';
                                  return (
                                    <>
                                      <div className="prose prose-xs max-w-none text-slate-800">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                          components={{
                                            p: ({ node, ...props }) => (
                                              <p {...props} className="mb-1 last:mb-0" />
                                            ),
                                            ul: ({ node, ...props }) => (
                                              <ul
                                                {...props}
                                                className="list-disc list-inside mb-1"
                                              />
                                            ),
                                            ol: ({ node, ...props }) => (
                                              <ol
                                                {...props}
                                                className="list-decimal list-inside mb-1"
                                              />
                                            ),
                                            li: ({ node, ...props }) => (
                                              <li {...props} className="mb-0.5" />
                                            ),
                                            strong: ({ node, ...props }) => (
                                              <strong {...props} className="font-semibold" />
                                            ),
                                            em: ({ node, ...props }) => (
                                              <em {...props} className="italic" />
                                            ),
                                            h1: ({ node, ...props }) => (
                                              <h1
                                                {...props}
                                                className="text-sm font-bold mb-1 mt-1"
                                              />
                                            ),
                                            h2: ({ node, ...props }) => (
                                              <h2
                                                {...props}
                                                className="text-xs font-semibold mb-1 mt-1"
                                              />
                                            ),
                                            code: ({ node, ...props }) => (
                                              <code
                                                {...props}
                                                className="bg-slate-100 rounded px-1 py-0.5 text-[10px]"
                                              />
                                            ),
                                          }}
                                        >
                                          {displayText}
                                        </ReactMarkdown>
                                      </div>
                                      <div className="flex justify-between items-center mt-1">
                                        {needsTruncate && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpandedEntries((prev) => ({
                                                ...prev,
                                                [entry.id]: !isExpanded,
                                              }))
                                            }
                                            className="text-[10px] font-semibold text-slate-600 underline underline-offset-2"
                                          >
                                            {isExpanded ? 'Show less' : 'Read more'}
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingEntryId(entry.id);
                                            setEditingText(entry.text);
                                          }}
                                          className="text-[10px] text-slate-500 hover:text-slate-700 underline underline-offset-2"
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared Wiki Overlay */}
      {activeWikiEntry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="bg-emerald-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-white/10 p-2 rounded-lg mr-3">
                  <Icons.Brain className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{activeWikiEntry.label}</h3>
                  <p className="text-xs text-emerald-200">Psycho-education · Bremi Wiki</p>
                </div>
              </div>
              <button
                onClick={() => setActiveWikiEntry(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Icons.X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 bg-gray-50/60">
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  In simple language
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {activeWikiEntry.shortDescription}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                  Why this happens biologically
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {activeWikiEntry.biologicalWhy}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  What it can feel like
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {activeWikiEntry.whatItFeelsLike}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                  Gentle reframes
                </h4>
                <ul className="space-y-2">
                  {activeWikiEntry.gentleReframes.map((line, i) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-emerald-900 bg-white rounded-xl border border-emerald-100 px-3 py-2 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 mr-2 flex-shrink-0" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
              <button
                onClick={() =>
                  speakGuide(
                    `wiki-${activeWikiEntry.id}`,
                    `${activeWikiEntry.label}. ${activeWikiEntry.shortDescription} ${activeWikiEntry.biologicalWhy}`
                  )
                }
                className="flex-1 bg-emerald-50 text-emerald-800 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
              >
                {activeAudioId === `wiki-${activeWikiEntry.id}` ? (
                  <>
                    <Icons.X className="w-4 h-4" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Icons.Speaker className="w-4 h-4" />
                    <span>Let Bremi read this to me</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setActiveWikiEntry(null)}
                className="px-4 py-3 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};