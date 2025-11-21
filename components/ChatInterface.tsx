
import React, { useState, useRef, useEffect } from 'react';
import { Message, AnalysisResult } from '../types';
import { Icons, TRANSLATIONS } from '../constants';
import { sendMessageToGemini, analyzeSession, generateSpeech } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';
import { useSession } from '../contexts/SessionContext';

interface ChatInterfaceProps {
  onEmergency: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onEmergency,
}) => {
  const { user, updateUser } = useUser();
  const { activeSession, updateSession } = useSession();

  if (!user) return null;
  const t = TRANSLATIONS[user.language];

  const getInitialMessages = () => {
    if (activeSession) return activeSession.messages;

    return [
      {
        id: 'privacy-notice',
        role: 'system' as const,
        text: t.privacy_notice,
        timestamp: Date.now()
      },
      {
        id: 'welcome',
        role: 'model' as const,
        text: t.welcome.replace('${user.name}', user.name),
        timestamp: Date.now() + 1
      }
    ];
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages());

  // Reset messages when session changes
  useEffect(() => {
    setMessages(getInitialMessages());
  }, [activeSession?.id]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedImage]);

  // Notify parent of updates for history saving
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the welcome message unless user interacted
      updateSession(messages, user.preferences.saveHistory);
    }
  }, [messages, user.preferences.saveHistory]);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) { }
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) { }
      }
    };
  }, []);

  const handleToggleHistory = () => {
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        saveHistory: !user.preferences.saveHistory
      }
    };
    updateUser(updatedUser);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    const lowerText = inputText.toLowerCase();
    if (lowerText.includes("suicide") || lowerText.includes("kill myself") || lowerText.includes("end it all")) {
      onEmergency();
    }

    try {
      let location = undefined;
      if (lowerText.includes("hospital") || lowerText.includes("help") || lowerText.includes("emergency") || lowerText.includes("clinic") || lowerText.includes("therapist") || lowerText.includes("doctor")) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
        } catch (e) {
          console.log("Location access denied or unavailable");
        }
      }

      const response = await sendMessageToGemini(
        messages,
        newMessage.text,
        imageToSend || undefined,
        location,
        user.language
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        groundingData: response.groundingData
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error(error);
      // Add a visible error message to the chat if something catastrophic happens
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, something went wrong. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, feedback: type } : msg
    ));
  };

  const handleAnalyze = async () => {
    if (messages.length < 3) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeSession(messages, user.language);
      setAnalysisResult(result);
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSpeak = async (text: string, id: string) => {
    if (loadingAudioId) return;

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) { }
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      try { await audioContextRef.current.close(); } catch (e) { }
      audioContextRef.current = null;
    }

    setLoadingAudioId(id);

    try {
      const base64Audio = await generateSpeech(text);

      if (!base64Audio) throw new Error("No audio data received");

      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
        setLoadingAudioId(null);
      };

    } catch (e) {
      console.error("Failed to play audio", e);
      setLoadingAudioId(null);
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">

      {/* Sophisticated Background Decoration - Muted, Organic Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-green-200/30 to-emerald-100/30 blur-[100px] animate-pulse-slow"></div>
        <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-200/20 to-indigo-100/20 blur-[80px] animate-blob"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-gradient-to-t from-teal-100/30 to-green-100/20 blur-[60px] animate-pulse-slower"></div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-4 py-2 shadow-sm z-20 flex justify-between items-center sticky top-0 border-b border-slate-100">
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-green-600 mr-2 shadow-inner border border-green-100 overflow-hidden">
            <img src="/bremi-logo.svg" alt="Bremi Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-lg tracking-tight leading-none">Bremi.AI</h2>
              {/* History Toggle moved here */}
              <button
                onClick={handleToggleHistory}
                className="flex items-center transition-opacity hover:opacity-80"
                title={user.preferences.saveHistory ? "History On" : "History Off"}
              >
                {user.preferences.saveHistory ? (
                  <Icons.ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <Icons.ToggleLeft className="w-8 h-8 text-slate-300" />
                )}
              </button>
            </div>
            <div className="flex items-center text-[10px] font-medium text-green-600 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              {t.online}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || messages.length < 3}
            className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Analyze Session"
          >
            {isAnalyzing ? (
              <span className="animate-spin mr-1">⟳</span>
            ) : (
              <Icons.Brain className="w-4 h-4 mr-1.5" />
            )}
            {t.reflect}
          </button>
          <button
            onClick={onEmergency}
            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center border border-red-100 hover:bg-red-100 transition-colors shadow-sm"
          >
            <Icons.Alert className="w-4 h-4 mr-1" />
            {t.sos}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32 z-10 scroll-smooth">
        {!user.preferences.saveHistory && messages.length > 1 && (
          <div className="flex justify-center opacity-60 hover:opacity-100 transition-opacity">
            <div className="text-[10px] text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full backdrop-blur-sm flex items-center">
              <Icons.Clock className="w-3 h-3 mr-1" />
              {t.history_off}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center my-4' : 'justify-start'} animate-slide-up`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center w-full' : 'items-start'} max-w-[85%] md:max-w-[70%] ${msg.role === 'system' ? '!max-w-[95%]' : ''}`}>

              {msg.image && (
                <div className="mb-2 rounded-2xl overflow-hidden border-2 border-white shadow-sm max-w-[200px]">
                  <img src={msg.image} alt="User upload" className="w-full h-auto object-cover" />
                </div>
              )}

              <div
                className={`relative px-5 py-3.5 shadow-sm text-[15px] leading-relaxed transition-all hover:shadow-md ${msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-2xl rounded-tr-sm'
                    : msg.role === 'system'
                      ? 'bg-transparent text-slate-500 text-center text-xs w-full max-w-md mx-auto'
                      : 'bg-white text-slate-700 rounded-2xl rounded-tl-sm border border-gray-100'
                  }`}
              >
                {msg.role === 'system' && (
                  <div className="flex items-center justify-center mb-1 space-x-2">
                    <div className="bg-white/50 p-1 rounded-full">
                      <Icons.Sparkles className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bremi Info</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.groundingData && msg.groundingData.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Resources</p>
                    {msg.groundingData.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs underline truncate opacity-90 hover:opacity-100 mb-1.5"
                      >
                        {link.title || link.uri}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {msg.role !== 'system' && (
                <div className="flex justify-between items-center mt-1 px-1 w-full">
                  <div className={`text-[10px] font-medium ${msg.role === 'user' ? 'text-green-800/40' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {msg.role === 'model' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleSpeak(msg.text, msg.id)}
                        className="text-slate-400 hover:text-green-600 transition-colors p-1.5 rounded-full hover:bg-green-50"
                        title="Listen"
                      >
                        {loadingAudioId === msg.id ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-green-500 border-t-transparent animate-spin"></div>
                        ) : (
                          <Icons.Speaker className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="flex items-center space-x-0.5 ml-1">
                        <button
                          onClick={() => handleFeedback(msg.id, 'up')}
                          className={`p-1.5 rounded-full hover:bg-green-50 transition-colors ${msg.feedback === 'up' ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-green-500'}`}
                        >
                          <Icons.ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, 'down')}
                          className={`p-1.5 rounded-full hover:bg-red-50 transition-colors ${msg.feedback === 'down' ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-400'}`}
                        >
                          <Icons.ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Analysis Overlay Modal */}
      {analysisResult && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-white/10 p-2 rounded-lg mr-3">
                  <Icons.Brain className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Session Insights</h3>
                  <p className="text-xs text-slate-400">AI Psychoanalysis</p>
                </div>
              </div>
              <button onClick={() => setAnalysisResult(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Icons.X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 bg-gray-50/50">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Detected Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.themes.map((theme, i) => (
                    <span key={i} className="bg-white text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 shadow-sm">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100/50 shadow-sm">
                <div className="flex items-start">
                  <Icons.Sparkles className="w-5 h-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-slate-700 text-sm italic leading-relaxed">
                    "{analysisResult.feedback}"
                  </p>
                </div>
              </div>

              {analysisResult.distortions.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Cognitive Patterns</h4>
                  <ul className="space-y-2">
                    {analysisResult.distortions.map((dis, i) => (
                      <li key={i} className="flex items-start text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {dis}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Reframing Suggestions</h4>
                <div className="space-y-3">
                  {analysisResult.suggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-start bg-white p-3.5 rounded-xl border border-green-100 shadow-sm">
                      <Icons.CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-900 leading-relaxed">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => setAnalysisResult(null)}
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all transform active:scale-[0.98]"
              >
                Close Reflection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white/90 backdrop-blur-md p-4 border-t border-gray-100 fixed bottom-[80px] left-0 right-0 z-30 safe-bottom">

        {selectedImage && (
          <div className="absolute bottom-full left-4 mb-4 animate-slide-up">
            <div className="relative group">
              <img src={selectedImage} alt="Preview" className="w-24 h-24 object-cover rounded-xl border-4 border-white shadow-lg" />
              <div className="absolute inset-0 bg-black/20 rounded-xl group-hover:bg-black/30 transition-colors"></div>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transform transition-transform hover:scale-110"
              >
                <Icons.X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <div className="flex items-end space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 mb-0.5 rounded-full bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all shadow-sm active:scale-95"
              title="Upload Image"
            >
              <Icons.Image className="w-6 h-6" />
            </button>

            <div className="flex-1 bg-gray-100 rounded-[24px] px-4 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 border border-transparent transition-all">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={selectedImage ? "Add a caption..." : t.placeholder}
                rows={1}
                className="w-full bg-transparent text-sm focus:outline-none max-h-24 resize-none py-2"
                style={{ minHeight: '40px' }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && !selectedImage) || isLoading}
              className={`p-3 mb-0.5 rounded-full transition-all shadow-md ${(inputText.trim() || selectedImage)
                  ? 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400'
                }`}
            >
              <Icons.Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
