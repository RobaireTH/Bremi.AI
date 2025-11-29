import React, { useEffect, useState } from 'react';
import { Icons } from '../constants';

interface GuidedTourProps {
  onFinish: () => void;
  onStepChange?: (index: number) => void;
}

const STEPS = [
  {
    title: 'Welcome to Bremi.Ai',
    body: "I'm your mental health companion, not a doctor. My job is to help you untangle thoughts, understand your feelings, and practise small skills that make life a bit lighter.",
  },
  {
    title: 'Chat Space',
    body: 'This main screen is where we talk. I will ask gentle questions, help you challenge unhelpful thoughts, and you can tap the Reflect button to see a short summary, thought patterns, and a suggested care plan for your session.',
  },
  {
    title: 'Relax & Calm Tools',
    body: 'The Relax tab gives you quick tools when your body or mind feels tense: breathing, grounding, body scans, muscle relax, safe place, and self-compassion. You can also let me guide you with voice.',
  },
  {
    title: 'Psycho-education & Privacy',
    body: "When I notice patterns, I may suggest reading a short Bremi-Wiki card to learn what’s happening and why. You’ll also see a small notice about whether chats are being saved on this device, and you can turn history off any time if you prefer.",
  },
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ onFinish, onStepChange }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const isLast = stepIndex === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onFinish();
    } else {
      setStepIndex((i) => {
        const nextIndex = i + 1;
        if (onStepChange) onStepChange(nextIndex);
        return nextIndex;
      });
    }
  };

  const back = () => {
    setStepIndex((i) => {
      if (i === 0) return i;
      const prevIndex = i - 1;
      if (onStepChange) onStepChange(prevIndex);
      return prevIndex;
    });
  };

  const skip = () => {
    onFinish();
  };

  const step = STEPS[stepIndex];

  const POINTER_CONFIG: Array<
    | {
        className: string;
        label: string;
      }
    | null
  > = [
    {
      // Step 0 - general chat area
      className: 'bottom-[120px] left-1/2 -translate-x-1/2',
      label: 'This is your main chat space with Bremi.',
    },
    {
      // Step 1 - Reflect button (top-right Brain icon)
      className: 'top-[56px] right-[88px]',
      label: 'Use Reflect to see insights and a suggested care plan after a chat.',
    },
    {
      // Step 2 - Relax tab / calm tools (bottom nav area)
      className: 'bottom-[90px] left-1/4 -translate-x-1/2',
      label: 'Here you can open the Relax tab and use calming tools.',
    },
    {
      // Step 3 - wiki chips & history notice near top of chat
      className: 'top-[120px] right-6',
      label: 'You will see mind-pattern highlights and privacy info here.',
    },
  ];

  useEffect(() => {
    if (onStepChange) {
      onStepChange(stepIndex);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
      {/* Pointer bubble */}
      {POINTER_CONFIG[stepIndex] && (
        <div
          className={`absolute ${POINTER_CONFIG[stepIndex]!.className} flex flex-col items-center gap-1 pointer-events-none`}
        >
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-medium shadow-md">
            {POINTER_CONFIG[stepIndex]!.label}
          </div>
        </div>
      )}

      <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto">
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white/10 p-2 rounded-lg mr-3">
              <Icons.Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Quick Tour</h3>
              <p className="text-xs text-slate-300">~2 minutes to get familiar</p>
            </div>
          </div>
          <button
            onClick={skip}
            className="text-xs font-semibold text-slate-200 hover:text-white px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
          >
            Skip
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Step {stepIndex + 1} of {STEPS.length}
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{step.body}</p>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
          <button
            onClick={back}
            disabled={stepIndex === 0}
            className={`text-xs font-semibold px-3 py-2 rounded-full border transition-colors ${
              stepIndex === 0
                ? 'border-gray-200 text-gray-300 cursor-default'
                : 'border-gray-200 text-slate-600 hover:bg-gray-50'
            }`}
          >
            Back
          </button>
          <button
            onClick={next}
            className="text-xs font-semibold px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-colors"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};


