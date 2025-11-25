import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS, Icons } from '../constants';
import { generateSpeech } from '../services/geminiService';
import { PSYCHO_WIKI, PsychoWikiEntry } from '../psychoWiki';

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

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

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

    setActiveAudioId(id);
    try {
      const base64Audio = await generateSpeech(text);
      if (!base64Audio) throw new Error('No audio data received');

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
        setActiveAudioId(null);
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

  return (
    <div className="h-full flex flex-col bg-green-50 p-4 md:p-6 relative overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-100/50 to-transparent pointer-events-none"></div>

      <div className="relative z-10 mb-4">
        <h2 className="text-2xl font-bold text-green-800 mb-1">{t.relax}</h2>
        <p className="text-slate-600 text-sm max-w-md">
          {t.instructions}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[2fr,1.5fr] gap-4 md:gap-6 flex-1">
        {/* Main Exercise Area */}
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

          {selectedTool === '478_breathing' && (
            <div className="flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center mb-10">
                <div
                  className={`
                    w-64 h-64 rounded-full bg-green-400/20 backdrop-blur-sm absolute
                    transition-all duration-[4000ms] ease-in-out
                    ${step === 'inhale' ? 'scale-100 opacity-100' : ''}
                    ${step === 'hold' ? 'scale-100 opacity-80' : ''}
                    ${step === 'exhale' ? 'scale-50 opacity-50' : ''}
                  `}
                ></div>

                <div
                  className={`
                    w-48 h-48 rounded-full bg-green-500 shadow-2xl shadow-green-200 flex items-center justify-center text-white font-bold text-xl z-10
                    transition-all duration-[4000ms] ease-in-out
                    ${step === 'inhale' ? 'scale-110' : ''}
                    ${step === 'hold' ? 'scale-110' : ''}
                    ${step === 'exhale' ? 'scale-90' : ''}
                  `}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-2xl mb-1">{instruction}</span>
                    <span className="text-4xl font-light">{seconds > 0 ? seconds : ''}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-900/80 max-w-sm text-center">
                Breathe in for 4, hold for 7, exhale for 8. Let your shoulders drop and your jaw
                unclench as you follow the circle.
              </p>
            </div>
          )}

          {selectedTool === 'box_breathing' && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {['Inhale 4s', 'Hold 4s', 'Exhale 4s', 'Rest 4s'].map((label, i) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/80 border border-green-100 px-4 py-5 text-center shadow-sm"
                  >
                    <p className="text-xs uppercase tracking-wide text-green-600 mb-1">
                      Step {i + 1}
                    </p>
                    <p className="font-semibold text-green-900">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-900/80 max-w-sm text-center">
                Imagine tracing a square with your breath. Same length for breathing in, holding,
                breathing out, and pausing.
              </p>
            </div>
          )}

          {selectedTool === 'grounding_54321' && (
            <div className="flex flex-col items-start justify-center space-y-3 max-w-md">
              {[
                '5 things you can see around you.',
                '4 things you can feel with your body.',
                '3 things you can hear.',
                '2 things you can smell.',
                '1 thing you can taste or imagine tasting.',
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white/80 border border-green-100 rounded-2xl px-4 py-3 shadow-sm w-full"
                >
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                    {5 - i}
                  </div>
                  <p className="text-sm text-slate-800">{text}</p>
                </div>
              ))}
              <p className="text-xs text-green-900/80">
                This pulls your mind out of spiralling thoughts and back into the safety of the
                present moment.
              </p>
            </div>
          )}

          {selectedTool === 'body_scan' && (
            <div className="flex flex-col items-start justify-center space-y-3 max-w-md">
              {[
                'Notice your forehead, eyes and jaw. Soften them slightly.',
                'Drop your shoulders away from your ears. Let your chest and back loosen.',
                'Bring awareness to your belly, hips and lower back. Breathe into that space.',
                'Scan down your legs, knees, ankles and feet. Notice any points of contact with the floor.',
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white/80 border border-green-100 rounded-2xl px-4 py-3 shadow-sm w-full"
                >
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-800">{text}</p>
                </div>
              ))}
              <p className="text-xs text-green-900/80">
                You do not need to force your body to relax. Just notice, breathe, and give it
                gentle permission to soften.
              </p>
            </div>
          )}

          {selectedTool === 'pmr' && (
            <div className="flex flex-col items-start justify-center space-y-3 max-w-md">
              {[
                'Clench your fists gently as you breathe in, then release them fully as you breathe out.',
                'Tense your forearms and upper arms for a moment, then let them drop heavy by your side.',
                'Raise your shoulders slightly towards your ears, hold, then let them fall and soften.',
                'Squeeze the muscles in your face — eyes, jaw, cheeks — then relax them and allow your tongue to rest.',
                'Gently tighten your belly and lower back, then breathe out and let that area loosen.',
                'Press your legs and feet into the floor or bed, then release and notice the heaviness.',
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white/80 border border-green-100 rounded-2xl px-4 py-3 shadow-sm w-full"
                >
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-800">{text}</p>
                </div>
              ))}
              <p className="text-xs text-green-900/80">
                If any area feels painful when tensed, skip it. The aim is to teach your body the
                feeling of letting go, not to force anything.
              </p>
            </div>
          )}

          {selectedTool === 'safe_place' && (
            <div className="flex flex-col items-start justify-center space-y-3 max-w-md">
              {[
                'Imagine a place where you feel safe or at peace — it could be a beach, your village, your room, or somewhere totally imagined.',
                'Notice what you can see there: colours, shapes, light, shadows.',
                'Listen for the sounds: breeze, distant traffic, gospel music, laughter, birds, or quiet.',
                'Notice the temperature on your skin, and what you are sitting or lying on.',
                'Picture someone or something that makes you feel supported here, even if it is just the presence of God, nature, or an older, calmer version of you.',
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white/80 border border-green-100 rounded-2xl px-4 py-3 shadow-sm w-full"
                >
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-800">{text}</p>
                </div>
              ))}
              <p className="text-xs text-green-900/80">
                You can return to this safe place in your mind whenever reality feels rough. With
                practice, your body will learn to relax faster each time.
              </p>
            </div>
          )}

          {selectedTool === 'self_compassion' && (
            <div className="flex flex-col items-start justify-center space-y-3 max-w-md">
              {[
                'Pause and gently name what you are feeling: for example, “I feel anxious and overwhelmed right now.”',
                'Remind yourself: “I am not the only one who feels like this. Many people struggle with this too.”',
                'Place a hand on your chest, belly, or cheek and notice the warmth or pressure.',
                'Say something kind to yourself, the way you would talk to a beloved friend in the same situation.',
                'If words feel hard, you can simply breathe and repeat a short phrase like “Easy, small small” or “I am trying my best.”',
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white/80 border border-green-100 rounded-2xl px-4 py-3 shadow-sm w-full"
                >
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-800">{text}</p>
                </div>
              ))}
              <p className="text-xs text-green-900/80">
                Self-compassion is a skill that grows with practice. Awkwardness at first does not
                mean you are doing it wrong.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Tool Picker + Wiki */}
        <div className="flex flex-col gap-4">
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

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-emerald-100 flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Mind Patterns Wiki
              </h4>
              <Icons.Brain className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[11px] text-slate-600 mb-3">
              These are common patterns Bremi may highlight during chat. Tap any one to read why it
              happens biologically and what can help.
            </p>
            <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
              {PSYCHO_WIKI.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActiveWikiEntry(entry)}
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

      {/* Shared Wiki Overlay */}
      {activeWikiEntry && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
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