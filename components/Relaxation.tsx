import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface RelaxationProps {
  language: Language;
}

export const Relaxation: React.FC<RelaxationProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const [step, setStep] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [instruction, setInstruction] = useState(t.breathe_in);
  const [seconds, setSeconds] = useState(4);

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

    runCycle();

    return () => clearTimeout(timer);
  }, [t]);

  // Countdown effect
  useEffect(() => {
    if (seconds > 0) {
      const timer = setInterval(() => setSeconds(s => s - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [seconds, step]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-green-50 p-6 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-100/50 to-transparent pointer-events-none"></div>
      
      <h2 className="text-2xl font-bold text-green-800 mb-2 z-10">{t.relax}</h2>
      <p className="text-slate-500 mb-12 max-w-xs z-10">
        {t.instructions}
      </p>

      <div className="relative flex items-center justify-center mb-16">
        {/* Breathing Circle */}
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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 max-w-sm w-full z-10">
        <h3 className="font-semibold text-green-700 mb-2">{t.why_breathe}</h3>
        <p className="text-sm text-slate-600">
          {t.why_breathe_desc}
        </p>
      </div>
    </div>
  );
};