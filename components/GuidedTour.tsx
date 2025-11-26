import React, { useState } from 'react';
import { Icons } from '../constants';

interface GuidedTourProps {
  onFinish: () => void;
}

const STEPS = [
  {
    title: 'Welcome to Bremi.Ai',
    body: "I'm your mental health companion, not a doctor. My job is to help you untangle thoughts, understand your feelings, and practise small skills that make life a bit lighter.",
  },
  {
    title: 'Chat Space',
    body: 'This main screen is where we talk. I will ask gentle questions, help you challenge unhelpful thoughts, and sometimes highlight mind patterns like “Burnout” or “Rumination” so you can understand them better.',
  },
  {
    title: 'Relax & Calm Tools',
    body: 'The Relax tab gives you quick tools when your body or mind feels tense: breathing, grounding, body scans, muscle relax, safe place, and self-compassion. You can also let me guide you with voice.',
  },
  {
    title: 'Psycho-education & Privacy',
    body: "When I notice patterns, I may suggest reading a short Bremi-Wiki card to learn what’s happening and why. By default your chats are saved locally on this device only, and you can turn history off any time.",
  },
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ onFinish }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const isLast = stepIndex === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onFinish();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const back = () => {
    setStepIndex((i) => (i > 0 ? i - 1 : i));
  };

  const skip = () => {
    onFinish();
  };

  const step = STEPS[stepIndex];

  return (
    <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
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


