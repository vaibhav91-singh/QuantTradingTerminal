import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceAssistant({
  onBuy,
  onSell,
  onStepNext,
  onStepPrev,
  onTogglePlay,
  onOpenMonteCarlo,
  onOpenReport,
  onToggleAi,
  onToggleFullscreen,
  addToast
}) {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const lastExecutedRef = useRef(0);

  // Text-To-Speech AI Voice Feedback Function
  const speakFeedback = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select natural sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('David')) && v.lang.startsWith('en')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const now = Date.now();
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      const cleanText = transcript.trim().toLowerCase();
      if (!cleanText) return;

      setLastCommand(cleanText);

      // Debounce command execution (800ms threshold)
      if (now - lastExecutedRef.current < 800) return;

      // 1. BUY COMMANDS (English & Hinglish)
      if (
        cleanText.includes('buy') || 
        cleanText.includes('long') || 
        cleanText.includes('khareed') || 
        cleanText.includes('khared') ||
        cleanText.includes('kharido')
      ) {
        lastExecutedRef.current = now;
        speakFeedback('Executing Buy Order, Commander.');
        if (addToast) addToast('🎙️ JARVIS: Executing BUY Order', 'success');
        if (onBuy) onBuy();
      } 
      // 2. SELL COMMANDS (English & Hinglish)
      else if (
        cleanText.includes('sell') || 
        cleanText.includes('short') || 
        cleanText.includes('becho') || 
        cleanText.includes('bech')
      ) {
        lastExecutedRef.current = now;
        speakFeedback('Executing Sell Order, Commander.');
        if (addToast) addToast('🎙️ JARVIS: Executing SELL Order', 'warning');
        if (onSell) onSell();
      } 
      // 3. STEP NEXT COMMANDS
      else if (
        cleanText.includes('next') || 
        cleanText.includes('step') || 
        cleanText.includes('forward') || 
        cleanText.includes('aage') ||
        cleanText.includes('agla')
      ) {
        lastExecutedRef.current = now;
        speakFeedback('Stepping next candle.');
        if (onStepNext) onStepNext();
      } 
      // 4. STEP PREVIOUS COMMANDS
      else if (
        cleanText.includes('back') || 
        cleanText.includes('prev') || 
        cleanText.includes('previous') || 
        cleanText.includes('piche') ||
        cleanText.includes('peeche')
      ) {
        lastExecutedRef.current = now;
        speakFeedback('Stepping back.');
        if (onStepPrev) onStepPrev();
      } 
      // 5. PLAY / PAUSE COMMANDS
      else if (
        cleanText.includes('play') || 
        cleanText.includes('pause') || 
        cleanText.includes('start') || 
        cleanText.includes('stop') ||
        cleanText.includes('chalao') ||
        cleanText.includes('ruko')
      ) {
        lastExecutedRef.current = now;
        speakFeedback('Toggling replay playback.');
        if (onTogglePlay) onTogglePlay();
      } 
      // 6. FULLSCREEN COMMANDS
      else if (
        cleanText.includes('full screen') || 
        cleanText.includes('fullscreen') || 
        cleanText.includes('bada karo')
      ) {
        lastExecutedRef.current = now;
        speakFeedback('Toggling fullscreen mode.');
        if (onToggleFullscreen) onToggleFullscreen();
      }
      // 7. MONTE CARLO RISK SIMULATION COMMANDS
      else if (
        cleanText.includes('monte') || 
        cleanText.includes('simulation') || 
        cleanText.includes('risk')
      ) {
        lastExecutedRef.current = now;
        speakFeedback('Opening Monte Carlo Risk Simulator.');
        if (onOpenMonteCarlo) onOpenMonteCarlo();
      } 
      // 8. BACKTEST REPORT AUDIT COMMANDS
      else if (
        cleanText.includes('report') || 
        cleanText.includes('audit') || 
        cleanText.includes('tear sheet')
      ) {
        lastExecutedRef.current = now;
        speakFeedback('Generating Backtest Performance Report.');
        if (onOpenReport) onOpenReport();
      } 
      // 9. AI ML TOGGLE COMMANDS
      else if (
        cleanText.includes('ai') || 
        cleanText.includes('ml') || 
        cleanText.includes('prediction')
      ) {
        lastExecutedRef.current = now;
        speakFeedback('Toggling Machine Learning Predictions.');
        if (onToggleAi) onToggleAi();
      }
    };

    recognition.onerror = (err) => {
      console.warn('JARVIS Speech Recognition Error:', err.error);
      if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
        shouldListenRef.current = false;
        setIsListening(false);
        if (addToast) addToast('⚠️ Microphone permission denied.', 'warning');
      }
    };

    recognition.onend = () => {
      // Auto-restart recognition continuously if active!
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
  }, [onBuy, onSell, onStepNext, onStepPrev, onTogglePlay, onOpenMonteCarlo, onOpenReport, onToggleAi, onToggleFullscreen, addToast, speakFeedback]);

  const toggleListening = () => {
    if (!isSupported) {
      if (addToast) addToast('⚠️ Web Speech API not supported in this browser. Please use Chrome or Edge.', 'warning');
      return;
    }

    if (isListening) {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
      speakFeedback('JARVIS going offline.');
      if (addToast) addToast('🎙️ JARVIS Voice Mode Paused', 'info');
    } else {
      try {
        shouldListenRef.current = true;
        recognitionRef.current?.start();
        setIsListening(true);
        speakFeedback('JARVIS online. Standing by for voice commands.');
        if (addToast) addToast('🎙️ JARVIS Online: Speak "Buy", "Sell", "Play", "Next", "Full Screen"', 'success');
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  return {
    isListening,
    lastCommand,
    isSupported,
    toggleListening
  };
}

