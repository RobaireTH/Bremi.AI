import React, { useEffect, useState } from 'react';
import { Icons, NIGERIA_HELPLINES, TRANSLATIONS } from '../constants';
import { sendMessageToGemini } from '../services/geminiService';
import { GroundingData, Language } from '../types';

interface EmergencyProps {
  onClose: () => void;
  language: Language;
}

export const Emergency: React.FC<EmergencyProps> = ({ onClose, language }) => {
  const t = TRANSLATIONS[language];
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [nearbyPlaces, setNearbyPlaces] = useState<GroundingData[]>([]);

  useEffect(() => {
    // Auto-fetch nearby help on mount
    findHelpNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findHelpNearby = async () => {
    setLocationStatus('loading');
    
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use Gemini with Google Maps tool to find hospitals
          const response = await sendMessageToGemini(
            [], 
            "Find the nearest mental health clinics or hospitals to me right now. List them.",
            undefined,
            { latitude, longitude },
            language
          );

          if (response.groundingData && response.groundingData.length > 0) {
             setNearbyPlaces(response.groundingData);
             setLocationStatus('found');
          } else {
             setLocationStatus('error');
          }
        } catch (err) {
          console.error(err);
          setLocationStatus('error');
        }
      },
      () => {
        setLocationStatus('error');
      }
    );
  };

  return (
    <div className="h-full flex flex-col bg-red-50 p-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm">
        <Icons.X className="text-slate-500" />
      </button>

      <div className="flex flex-col items-center text-center mt-8 mb-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <Icons.Alert className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-3xl font-bold text-red-700">{t.emergency_title}</h2>
        <p className="text-red-900/70 mt-2">{t.emergency_desc}</p>
      </div>

      <div className="space-y-6 overflow-y-auto pb-20">
        {/* Immediate Actions */}
        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-red-500">
          <h3 className="font-bold text-slate-800 mb-4">{t.call_helpline}</h3>
          <div className="space-y-3">
            {NIGERIA_HELPLINES.map((line, idx) => (
              <a 
                key={idx}
                href={`tel:${line.number.replace(/\s/g, '')}`}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <span className="font-medium text-slate-700">{line.name}</span>
                <span className="font-bold text-red-600">{line.number}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Location Based Help */}
        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-500">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center">
             {t.nearby_hospitals}
             {locationStatus === 'loading' && <span className="ml-2 text-xs text-blue-500 animate-pulse">{t.locating}</span>}
          </h3>
          
          {locationStatus === 'error' && (
            <p className="text-sm text-slate-500">{t.error_loc}. Please call 112.</p>
          )}

          {locationStatus === 'found' && (
            <div className="space-y-2 mt-3">
              {nearbyPlaces.slice(0, 3).map((place, i) => (
                <a key={i} href={place.uri} target="_blank" rel="noreferrer" className="block p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-blue-600 truncate">{place.title}</div>
                  <div className="text-xs text-gray-500 truncate">{t.open_maps}</div>
                </a>
              ))}
            </div>
          )}
          
           {locationStatus === 'idle' && (
             <p className="text-sm text-gray-400">{t.finding}</p>
           )}
        </div>

        <div className="text-center text-xs text-gray-400 mt-4">
          Bremi.AI connects you to resources but is not a substitute for professional medical service.
        </div>
      </div>
    </div>
  );
};