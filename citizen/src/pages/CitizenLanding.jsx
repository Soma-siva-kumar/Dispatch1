import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import API from '../api/axios';
import { getDeviceCoordinates } from '../utils/geolocation';
import {
  Shield,
  Phone,
  AlertTriangle,
  ArrowRight,
  Info,
  Clock,
  MapPin,
  Camera,
  Lock,
  ChevronLeft,
  ChevronRight,
  Languages,
  FileText,
  Users,
  Sun,
  Moon,
  Mic,
  X,
  Loader,
  BookOpen,
  Brain
} from 'lucide-react';



// Complete translation mapping for EN, TE, HI








export default function CitizenLanding() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, changeLanguage: setLang, t } = useLanguage();

  const INSPIRATIONAL_QUOTES = [
    t('quotes.quote1'),
    t('quotes.quote2'),
    t('quotes.quote3'),
    t('quotes.quote4'),
    t('quotes.quote5'),
    t('quotes.quote6'),
    t('quotes.quote7'),
  ];

  const EMERGENCY_SERVICES = [
    { service: t('services.nationalHelpline'), number: '112', desc: t('services.nationalHelplineDesc'), color: 'var(--accent-red)' },
    { service: t('services.policeControl'), number: '100', desc: t('services.policeControlDesc'), color: 'var(--flag-white)' },
    { service: t('services.fireRescue'), number: '101', desc: t('services.fireRescueDesc'), color: 'var(--accent-orange)' },
    { service: t('services.medicalAssistance'), number: '102', desc: t('services.medicalAssistanceDesc'), color: 'var(--accent-green)' },
    { service: t('services.womenHelpline'), number: '1091', desc: t('services.womenHelplineDesc'), color: 'var(--flag-saffron)' },
  ];

  const SAFETY_TIPS = [
    { title: t('safety.tip1Title'), text: t('safety.tip1Text') },
    { title: t('safety.tip2Title'), text: t('safety.tip2Text') },
    { title: t('safety.tip3Title'), text: t('safety.tip3Text') },
    { title: t('safety.tip4Title'), text: t('safety.tip4Text') },
    { title: t('safety.tip5Title'), text: t('safety.tip5Text') },
  ];

  const CATEGORIES = [
    { title: t('categories.crimeTitle'), desc: t('categories.crimeDesc'), action: t('categories.crimeAction') },
    { title: t('categories.medicalTitle'), desc: t('categories.medicalDesc'), action: t('categories.medicalAction') },
    { title: t('categories.fireTitle'), desc: t('categories.fireDesc'), action: t('categories.fireAction') },
    { title: t('categories.womenTitle'), desc: t('categories.womenDesc'), action: t('categories.womenAction') },
    { title: t('categories.childTitle'), desc: t('categories.childDesc'), action: t('categories.childAction') },
    { title: t('categories.seniorTitle'), desc: t('categories.seniorDesc'), action: t('categories.seniorAction') },
    { title: t('categories.accidentTitle'), desc: t('categories.accidentDesc'), action: t('categories.accidentAction') },
    { title: t('categories.disasterTitle'), desc: t('categories.disasterDesc'), action: t('categories.disasterAction') },
    { title: t('categories.domesticTitle'), desc: t('categories.domesticDesc'), action: t('categories.domesticAction') },
    { title: t('categories.missingTitle'), desc: t('categories.missingDesc'), action: t('categories.missingAction') },
    { title: t('categories.cyberTitle'), desc: t('categories.cyberDesc'), action: t('categories.cyberAction') },
    { title: t('categories.animalTitle'), desc: t('categories.animalDesc'), action: t('categories.animalAction') }
  ];

  // States for Theme, Tips, Modals, Accordions
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  const [activeTip, setActiveTip] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const sections = ['home', 'services', 'rights'];
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // AI Voice Agent states
  const [voiceAgentOpen, setVoiceAgentOpen] = useState(false);
  const voiceAgentOpenRef = useRef(false);
  const [vaMobile, setVaMobile] = useState('');
  const [vaLocating, setVaLocating] = useState(false);
  const [vaCoords, setVaCoords] = useState(null);   // [lng, lat]
  const [vaAddress, setVaAddress] = useState('');
  const [vaSubmitting, setVaSubmitting] = useState(false);
  const [vaSuccess, setVaSuccess] = useState(false);
  const [vaError, setVaError] = useState('');

  // AI Voice Agent Interactive Conversation states
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const locationPromiseRef = useRef(null);
  const [vaStep, setVaStep] = useState(0); // 0: Idle, 1..5: Questions, 6: Submitting, 7: Finished
  const [vaState, setVaState] = useState('IDLE'); // IDLE, AI_SPEAKING, WAITING_TO_LISTEN, LISTENING, PROCESSING_TRANSCRIPT, NEXT_QUESTION
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [chatMessages, setChatMessages] = useState([]); // { sender: 'agent'|'citizen', text: string }
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [answers, setAnswers] = useState({
    what_happened: '',
    brief_details: '',
    location: '',
    injuries: '',
    active_status: ''
  });
  const answersRef = useRef({
    what_happened: '',
    brief_details: '',
    location: '',
    injuries: '',
    active_status: ''
  });

  const QUESTIONS = [
    { id: 'what_happened', question: "Hello. You have reached the Emergency AI Assistant. What happened?", shortQuestion: "What happened?" },
    { id: 'brief_details', question: "Tell me briefly about the incident.", shortQuestion: "Tell me briefly about the incident." },
    { id: 'location', question: "What is your current location?", shortQuestion: "What is your current location?" },
    { id: 'injuries', question: "Are there any injuries?", shortQuestion: "Are there any injuries?" },
    { id: 'active_status', question: "Is the emergency still active?", shortQuestion: "Is the emergency still active?" }
  ];

  const vaGetLocationPromise = () => {
    return new Promise(async (resolve) => {
      try {
        const coords = await getDeviceCoordinates();
        if (coords) {
          const [longitude, latitude] = coords;
          let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const a = data.address || {};
            const parts = [
              a.road || a.pedestrian || a.footway,
              a.suburb || a.neighbourhood || a.village,
              a.city || a.town || a.county,
              a.state,
            ].filter(Boolean);
            if (parts.length > 0) address = parts.join(', ');
            else if (data.display_name) address = data.display_name;
          } catch (e) {
            console.warn("nominatim error:", e);
          }
          resolve({ coords, address });
        } else {
          resolve({ coords: null, address: 'Location permission denied or timed out' });
        }
      } catch (err) {
        console.warn("geolocation error:", err);
        resolve({ coords: null, address: 'Location permission denied or timed out' });
      }
    });
  };

  const vaGetLocation = () => {
    setVaLocating(true);
    setVaAddress('');
    locationPromiseRef.current = vaGetLocationPromise();
    locationPromiseRef.current.then(({ coords, address }) => {
      setVaCoords(coords);
      setVaAddress(address);
      setVaLocating(false);
    });
  };

  const speakText = (text, callback) => {
    // 1. When AI is speaking: Disable Speech Recognition.
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    setIsListening(false);

    if (!window.speechSynthesis) {
      console.log("SpeechSynthesis not supported on this browser");
      if (callback) callback();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    setIsSpeaking(true);
    setVaState('AI_SPEAKING');
    console.log("AI started speaking:", text);

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log("AI finished speaking");
      if (voiceAgentOpenRef.current && callback) callback();
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      setIsSpeaking(false);
      console.log("AI finished speaking (error)");
      if (voiceAgentOpenRef.current && callback) callback();
    };

    window.speechSynthesis.speak(utterance);
  };

  const startListeningForStep = (stepIndex) => {
    setVaState('WAITING_TO_LISTEN');
    // Wait approximately 300–500 ms before starting Speech Recognition.
    setTimeout(() => {
      if (!voiceAgentOpenRef.current) return;
      setVaState('LISTENING');
      setIsListening(true);
      setLiveTranscript('');
      transcriptRef.current = '';

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Speech recognition not supported in this browser.');
        return;
      }

      console.log("SpeechRecognition started");
      console.log("Listening...");

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

      let hasResultReceived = false;

      rec.onstart = () => {
        // Recognition active
      };

      rec.onresult = (event) => {
        if (!voiceAgentOpenRef.current) return;
        const text = event.results[0][0].transcript;
        console.log("Interim transcript:", text);
        setLiveTranscript(text);
        transcriptRef.current = text;
        hasResultReceived = true;
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please allow microphone access.');
          setMicPermissionDenied(true);
          setVaState('IDLE');
        }
      };

      rec.onend = () => {
        console.log("SpeechRecognition ended");
        setIsListening(false);
        if (!voiceAgentOpenRef.current) return;
        
        const finalVal = transcriptRef.current.trim();
        if (hasResultReceived && finalVal) {
          console.log("Final transcript:", finalVal);
          setVaState('PROCESSING_TRANSCRIPT');
          handleAnswerForStep(stepIndex, finalVal);
        } else {
          console.log("No speech captured, prompting again");
          setVaState('AI_SPEAKING');
          // Ask politely again
          speakText("I couldn't hear you. Could you please repeat that?", () => {
            startListeningForStep(stepIndex);
          });
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        console.warn('Error starting SpeechRecognition:', err);
      }
    }, 400);
  };

  const handleAnswerForStep = (stepIndex, text) => {
    const currentQKey = QUESTIONS[stepIndex - 1].id;
    
    // Save response
    setAnswers(prev => ({ ...prev, [currentQKey]: text }));
    answersRef.current[currentQKey] = text;
    
    // Add to chat messages
    setChatMessages(prev => [...prev, { sender: 'citizen', text }]);
    
    // Clear live transcript
    transcriptRef.current = '';
    setLiveTranscript('');
    
    // Auto-scroll the chat
    setTimeout(() => {
      const container = document.getElementById('va-chat-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);

    setVaState('NEXT_QUESTION');
    console.log("Moving to next question");
    const nextStep = stepIndex + 1;
    runConversationStep(nextStep);
  };

  const runConversationStep = (stepIndex) => {
    if (stepIndex > 5) {
      setVaState('PROCESSING_TRANSCRIPT');
      handleFinalSubmission();
      return;
    }

    setVaStep(stepIndex);
    const qObj = QUESTIONS[stepIndex - 1];

    setChatMessages(prev => [...prev, { sender: 'agent', text: qObj.question }]);
    
    // Auto-scroll the chat
    setTimeout(() => {
      const container = document.getElementById('va-chat-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);

    // Speak the question
    speakText(qObj.question, () => {
      startListeningForStep(stepIndex);
    });
  };

  const handleFinalSubmission = async () => {
    setVaStep(6); // Submitting
    const finalGreeting = "Thank you. Your emergency report has been submitted successfully. Our dispatcher will contact you shortly. Please stay safe.";
    
    setChatMessages(prev => [...prev, { sender: 'agent', text: finalGreeting }]);
    
    // Auto-scroll the chat
    setTimeout(() => {
      const container = document.getElementById('va-chat-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);

    speakText(finalGreeting);

    // Build QA transcript array
    const voiceQATranscript = QUESTIONS.map(q => ({
      question: q.question,
      answer: answersRef.current[q.id] || 'Not specified'
    }));

    // Complete transcript string
    const voiceTranscript = QUESTIONS.map(q => `Question: ${q.question}\nAnswer: ${answersRef.current[q.id] || 'Not specified'}`).join('\n\n');

    setVaSubmitting(true);
    try {
      // 1. Wait for location promise to get exact citizen location
      let finalCoords = vaCoords;
      let finalAddress = vaAddress;
      if (locationPromiseRef.current) {
        const loc = await locationPromiseRef.current;
        if (loc && loc.coords) {
          finalCoords = loc.coords;
          finalAddress = loc.address;
        }
      }

      // Build FormData payload
      const fd = new FormData();
      fd.append('voiceTranscript', voiceTranscript);
      fd.append('voiceQATranscript', JSON.stringify(voiceQATranscript));
      fd.append('coordinates', JSON.stringify(finalCoords || [78.4867, 17.3850])); // default to Hyderabad if GPS failed
      fd.append('address', finalAddress || 'Location obtained from voice transcript');
      fd.append('mobile', vaMobile); // verified citizen mobile
      
      const { data } = await API.post('/incidents/voice', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setVaSuccess(true);
      setVaStep(7); // Done
      toast.success('Emergency Voice Report Submitted!');
    } catch (err) {
      setVaError(err.response?.data?.message || 'Submission failed. Please try again.');
      setVaStep(5); // Let them retry or see error
    } finally {
      setVaSubmitting(false);
    }
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      return false;
    }
  };

  const startVoiceAgentConversation = async () => {
    const granted = await requestMicPermission();
    if (!granted) {
      setMicPermissionDenied(true);
      setVaError('Microphone permission is required to report an emergency.');
      return;
    }

    setMicPermissionDenied(false);
    setVaStep(1);
    setChatMessages([]);
    setLiveTranscript('');
    setAnswers({
      what_happened: '',
      brief_details: '',
      location: '',
      injuries: '',
      active_status: ''
    });
    answersRef.current = {
      what_happened: '',
      brief_details: '',
      location: '',
      injuries: '',
      active_status: ''
    };

    // Start conversation after a short delay
    setTimeout(() => {
      runConversationStep(1);
    }, 600);
  };

  const vaHandleOpen = async () => {
    voiceAgentOpenRef.current = true;
    setVoiceAgentOpen(true);
    setVaMobile(user?.phone || '9999999999');
    setVaCoords(null);
    setVaAddress('');
    setVaSuccess(false);
    setVaError('');
    setVaStep(0); // show phone number verification and location lock first
    setMicPermissionDenied(false);

    // Start exact location lookup in background
    vaGetLocation();
  };

  const vaHandleClose = () => {
    voiceAgentOpenRef.current = false;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    setVoiceAgentOpen(false);
    setVaSuccess(false);
    setVaError('');
    setVaStep(0);
    setVaState('IDLE');
    setMicPermissionDenied(false);
  };

  const vaHandleSubmit = () => {
    handleFinalSubmission();
  };

  // Rotating emergency response quote states
  const [heroQuoteIndex, setHeroQuoteIndex] = useState(0);
  const [heroQuoteHovered, setHeroQuoteHovered] = useState(false);

  useEffect(() => {
    if (heroQuoteHovered) return;
    const interval = setInterval(() => {
      setHeroQuoteIndex((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroQuoteHovered]);

  const HERO_BANNER_QUOTES = [
    "EVERY SECOND SAVES A LIFE.",
    "TOGETHER FOR A SAFER TOMORROW.",
    "YOUR SAFETY IS OUR PRIORITY.",
    "FASTER RESPONSE. STRONGER PROTECTION."
  ];



  const handleReportRedirect = () => {
    if (user) {
      navigate('/report');
    } else {
      navigate('/login');
    }
  };

  const handleHistoryRedirect = () => {
    if (user) {
      navigate('/my-incidents');
    } else {
      navigate('/login');
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const nextTip = () => {
    setActiveTip(prev => (prev + 1) % SAFETY_TIPS.length);
  };

  const prevTip = () => {
    setActiveTip(prev => (prev - 1 + SAFETY_TIPS.length) % SAFETY_TIPS.length);
  };

  // Theme variable definitions
  const isDark = theme === 'dark';
  
  // Custom design tokens based on glassmorphism theme
  const bgMain = 'none';
  const bgMainColor = 'transparent';
  
  const textColor = '#FFFFFF';
  const textSecondary = 'rgba(255, 255, 255, 0.82)';
  const textMuted = 'rgba(255, 255, 255, 0.62)';
  const cardBg = isDark ? 'rgba(8, 14, 28, 0.65)' : 'rgba(255, 255, 255, 0.12)';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)';
  const shadowStyle = '0 18px 50px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04)';
  const navBg = isDark ? 'rgba(4, 8, 20, 0.55)' : 'rgba(255, 255, 255, 0.12)';

  const secondaryBtnBg = 'rgba(255,255,255,0.08)';
  const secondaryBtnText = '#ffffff';

  const heroGlow = isDark 
    ? 'radial-gradient(circle, rgba(255, 153, 51, 0.18) 0%, rgba(19, 136, 8, 0.12) 70%)'
    : 'radial-gradient(circle, rgba(255, 153, 51, 0.22) 0%, rgba(19, 136, 8, 0.18) 70%)';
  
  const heroTitleGradient = 'linear-gradient(135deg, #ff9933 0%, #ffffff 48%, #138808 100%)';
  const navActionStyle = {
    background: 'linear-gradient(135deg, #ff9933, #ea580c)',
    color: '#ffffff',
    border: '1px solid #ff9933',
    padding: '0.5rem 1.25rem',
    fontWeight: 700,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
    textDecoration: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    lineHeight: 1
  };

  return (
    <div 
      className={isDark ? 'dark-theme-only' : 'light-theme-only'}
      style={{
        backgroundColor: bgMainColor,
        backgroundImage: bgMain,
        minHeight: '100vh',
        color: textColor,
        overflowX: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        paddingTop: '88px',
        transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '--bg-card': cardBg,
        '--text-primary': textColor,
        '--text-secondary': textSecondary,
        '--text-muted': textMuted,
        '--border': borderCol,
        '--bg-glass': 'rgba(255, 255, 255, 0.04)',
        '--bg-glass-hover': 'rgba(255, 255, 255, 0.07)'
      }}
    >
      {/* Keyframe Animations style injection */}
      <style>{`
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(220, 38, 38, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
          }
        }
        .btn-emergency-red {
          animation: pulseGlow 2s infinite;
          background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
          border-color: #dc2626 !important;
          color: #ffffff !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-emergency-red:hover {
          box-shadow: 0 0 25px rgba(220, 38, 38, 0.65) !important;
          transform: translateY(-2px) scale(1.03) !important;
        }
        @keyframes orbFloatBreath {
          0%, 100% {
            transform: translateY(0px) scale(1);
            box-shadow: 
              0 0 20px rgba(255,255,255,.25),
              0 0 40px rgba(255,255,255,.18),
              0 0 60px rgba(255,80,80,.35),
              0 0 90px rgba(220,38,38,.30),
              0 0 120px rgba(255,255,255,.15);
          }
          50% {
            transform: translateY(-6px) scale(1.04);
            box-shadow: 
              0 0 32px rgba(255,255,255,.40),
              0 0 55px rgba(255,255,255,.25),
              0 0 85px rgba(255,80,80,.50),
              0 0 120px rgba(220,38,38,.45),
              0 0 150px rgba(255,255,255,.25);
          }
        }
        @keyframes borderRotate {
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes ringPulse1 {
          0% {
            transform: scale(1);
            opacity: 0.35;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        @keyframes ringPulse2 {
          0% {
            transform: scale(1);
            opacity: 0.25;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes phoneRing {
          0%, 72%, 100% {
            transform: rotate(0deg);
          }
          76% {
            transform: rotate(15deg);
          }
          80% {
            transform: rotate(-15deg);
          }
          84% {
            transform: rotate(12deg);
          }
          88% {
            transform: rotate(-12deg);
          }
          92% {
            transform: rotate(8deg);
          }
          96% {
            transform: rotate(-8deg);
          }
        }
        @keyframes continuousRing {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          50% { transform: rotate(-15deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes orbHeartbeat {
          0%, 100% {
            transform: scale(1);
            box-shadow: 
              0 0 30px rgba(255,255,255,.40),
              0 0 55px rgba(255,255,255,.28),
              0 0 85px rgba(255,80,80,.55),
              0 0 120px rgba(220,38,38,.50),
              0 0 150px rgba(255,255,255,.25);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 
              0 0 50px rgba(255,255,255,.60),
              0 0 85px rgba(255,255,255,.45),
              0 0 130px rgba(255,80,80,.90),
              0 0 190px rgba(220,38,38,.85),
              0 0 240px rgba(255,255,255,.45);
          }
        }
        @keyframes clickPress {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(0.92);
          }
          70% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }
        .va-float-btn {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 90, 95, 0.7) 0%, rgba(239, 68, 68, 0.75) 45%, rgba(220, 38, 38, 0.8) 100%), rgba(20, 25, 40, 0.25);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 2px solid rgba(255,255,255,0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          padding: 0;
          overflow: visible;
          position: relative;
          animation: orbFloatBreath 4s ease-in-out infinite;
          transition: transform 300ms ease, box-shadow 300ms ease;
        }
        .va-float-btn::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          padding: 2px;
          background: conic-gradient(from 0deg, #ff9933, #ffffff, #138808, #ffffff, #ff9933);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          animation: borderRotate 8s linear infinite;
          pointer-events: none;
        }
        .va-float-btn svg {
          animation: phoneRing 2.5s infinite;
          filter: drop-shadow(0 0 5px rgba(255,255,255,0.75));
        }
        .va-float-btn .pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          z-index: -1;
          border: 2px solid rgba(255, 80, 80, 0.4);
          background: rgba(255, 80, 80, 0.08);
          box-shadow: 0 0 15px rgba(255, 80, 80, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.2);
        }
        .va-float-btn .ring-1 {
          animation: ringPulse1 2s infinite ease-out;
        }
        .va-float-btn .ring-2 {
          animation: ringPulse2 2s infinite ease-out;
          animation-delay: 1s;
        }
        .va-float-btn:hover {
          transform: translateY(-6px) scale(1.12) !important;
          animation-play-state: paused;
          box-shadow: 
            0 0 35px rgba(255,255,255,.50),
            0 0 65px rgba(255,255,255,.30),
            0 0 100px rgba(255,80,80,.70),
            0 0 150px rgba(220,38,38,.60),
            0 0 180px rgba(255,255,255,.25) !important;
        }
        .va-float-btn:hover::before {
          animation-duration: 4s;
        }
        .va-float-btn:active {
          animation: clickPress 250ms ease-in-out !important;
        }
        .va-float-btn.listening {
          animation: orbHeartbeat 1.2s infinite ease-in-out !important;
        }
        .va-float-btn.listening::before {
          animation-duration: 3s;
          filter: brightness(1.4);
        }
        .va-float-btn.listening svg {
          animation: continuousRing 0.5s infinite linear;
        }
        .va-float-btn.listening .ring-1 {
          animation-duration: 1s;
        }
        .va-float-btn.listening .ring-2 {
          animation-duration: 1s;
          animation-delay: 0.5s;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .va-modal { animation: modalFadeIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* Accent borders inside Light theme only */
        .light-theme-only .card-accent-blue {
          border-left: 5px solid #fb923c !important;
          border-radius: 12px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .light-theme-only .card-accent-blue:hover {
          box-shadow: 0 10px 30px rgba(251, 146, 60, 0.12) !important;
          border-color: #fb923c !important;
          transform: translateY(-3px) !important;
        }

        .light-theme-only .card-accent-green {
          border-left: 5px solid #f97316 !important;
          border-radius: 12px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .light-theme-only .card-accent-green:hover {
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.12) !important;
          border-color: #f97316 !important;
          transform: translateY(-3px) !important;
        }

        .light-theme-only .card-accent-saffron {
          border-left: 5px solid #ff9933 !important;
          border-radius: 12px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .light-theme-only .card-accent-saffron:hover {
          box-shadow: 0 10px 30px rgba(255, 153, 51, 0.12) !important;
          border-color: #ff9933 !important;
          transform: translateY(-3px) !important;
        }

        .light-theme-only .card-accent-purple {
          border-left: 5px solid #f97316 !important;
          border-radius: 12px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .light-theme-only .card-accent-purple:hover {
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.12) !important;
          border-color: #f97316 !important;
          transform: translateY(-3px) !important;
        }
        
        /* Regular glassmorphism cards in light theme only */
        .light-theme-only .card:not([class*="card-accent"]) {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(16px) !important;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08) !important;
          border-color: rgba(0, 0, 0, 0.08) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .light-theme-only .card:not([class*="card-accent"]):hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12) !important;
        }
        
        /* Hero title specific color and anti-aliasing */
        .hero-title-text {
          font-family: 'Outfit', 'Inter', sans-serif !important;
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.45) !important;
        }

        .hero-title-gradient-span {
          font-family: 'Outfit', 'Inter', sans-serif !important;
          font-weight: 900 !important;
          background: linear-gradient(90deg, #FF9933 0%, #FFD700 25%, #FFFFFF 50%, #8ae676 75%, #138808 100%) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          display: inline-block !important;
          text-shadow: none !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }

        /* Flag gradient texts in Light and Dark themes */
        .flag-gradient-text {
          font-size: 1.45rem;
          font-weight: 750;
          margin: 0 auto 2.5rem;
          max-width: 850px;
          line-height: 1.45;
          min-height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to right, #ff9933 15%, #ffffff 50%, #00e676 85%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          text-shadow: 0 1px 12px rgba(255,255,255,0.05);
        }

        .light-theme-only .flag-gradient-text {
          background: linear-gradient(to right, #e65c00 15%, #475569 50%, #138808 85%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          text-shadow: 0 1px 4px rgba(15, 23, 42, 0.05) !important;
        }
      `}</style>


      {/* Navigation Header */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'fixed',
        top: '1rem',
        left: '1.5rem',
        right: '1.5rem',
        zIndex: 1000,
        height: '76px',
        borderRadius: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="nav-logo-container" style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img src="/prakasam_police_badge.jpg" alt="Prakasam Police Badge" style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ffffff' }}>
              {t('common.prakasamPolice')}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              {t('common.citizenPortal')}
            </div>
          </div>
        </div>

        {/* Anchors & Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }} className="nav-links">
          <a href="#home" className={activeSection === 'home' ? 'active' : ''}>{t('navbar.home')}</a>
          <a href="#services" className={activeSection === 'services' ? 'active' : ''}>{t('navbar.emergencyServices')}</a>
          <a href="#rights" className={activeSection === 'rights' ? 'active' : ''}>{t('navbar.knowYourRights')}</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Theme Toggle Removed as per user request */}

          {/* Language Selector */}
          <div className="nav-lang-selector">
            <Languages size={15} style={{ color: '#ff9933' }} />
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                outline: 'none', 
                cursor: 'pointer' 
              }}
            >
              <option value="en" style={{ background: '#0d1421', color: '#ffffff' }}>English</option>
              <option value="te" style={{ background: '#0d1421', color: '#ffffff' }}>తెలుగు</option>
              <option value="hi" style={{ background: '#0d1421', color: '#ffffff' }}>हिन्दी</option>
            </select>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="nav-user-capsule">
                {t('navbar.citizen')}: <strong>{user.name}</strong>
              </span>
              <Link
                to="/report"
                className="nav-btn"
              >
                My Portal
              </Link>
              <button onClick={() => { logout(); navigate('/login'); }} className="nav-btn">
                {t('navbar.logout')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => {
                  // For un-authenticated users, open the existing login/register page
                  navigate('/login');
                }}
                className="nav-btn"
              >
                Report
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header id="home" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 2rem 4rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        minHeight: 'calc(100vh - 88px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Glow under headline */}
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '550px',
          height: '220px',
          background: heroGlow,
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Premium Glass Panel */}
        <div className="hero-glass-panel" style={{ position: 'relative', zIndex: 1 }}>

        <h1 
          className="hero-title-text"
          style={{
            fontSize: '5rem',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            textAlign: 'center',
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}
        >
          SMART DISPATCH.<br />
          <span className="hero-title-gradient-span">
            STRONGER COMMUNITIES.
          </span>
        </h1>

        {/* Animated Rotating Quote Banner */}
        <div 
          onMouseEnter={() => setHeroQuoteHovered(true)} 
          onMouseLeave={() => setHeroQuoteHovered(false)}
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.92)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '2rem',
            textAlign: 'center',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            height: '1.75rem',
            overflow: 'hidden',
            width: '100%',
            cursor: 'pointer'
          }}
        >
          {HERO_BANNER_QUOTES.map((quote, idx) => {
            let diff = idx - heroQuoteIndex;
            if (diff === 3) diff = -1;
            if (diff === -3) diff = 1;
            return (
              <div 
                key={quote}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: idx === heroQuoteIndex ? 0.92 : 0,
                  transform: `translateY(${diff * 100}%)`,
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease'
                }}
              >
                {quote}
              </div>
            );
          })}
        </div>
        {/* Hero Quote (Premium Indian Tricolor Gradient) */}
        <div className="hero-quote-container">
          <div className="hero-quote">
            We Listen. We Respond. We Protect.
          </div>
        </div>
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2.25rem', marginBottom: '4.5rem' }}>
          <button 
            onClick={handleReportRedirect} 
            className="btn btn-lg btn-emergency-red" 
            style={{ 
              gap: '0.75rem', 
              fontWeight: 700,
              padding: '0.8rem 2.25rem',
              borderRadius: '8px'
            }}
          >
            <AlertTriangle size={19} />
            <span>{t('hero.reportBtn')}</span>
          </button>
          <a 
            href="#works" 
            className="btn btn-lg animate-all" 
            style={{ 
              background: secondaryBtnBg,
              color: secondaryBtnText,
              border: `1px solid ${borderCol}`,
              fontWeight: 600,
              padding: '0.8rem 2rem',
              borderRadius: '8px'
            }}
          >
            {t('hero.learnBtn')}
          </a>
        </div>

        </div>{/* End Glass Panel */}
      </header>

      {/* Feature Cards Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '100px auto',
        padding: '80px 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Hero Statistics - Redesigned Citizen Info Cards */}
        <div className="feature-cards-grid" style={{ textAlign: 'left' }}>
          {/* Card 1 */}
          <div className="card hero-stat-card animate-all" style={{ 
            background: 'rgba(10, 15, 30, 0.55)', 
            borderColor: 'rgba(255, 255, 255, 0.08)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.5rem', 
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              <AlertTriangle size={22} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>24×7 Emergency Assistance</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.25rem', lineHeight: 1.4 }}>Immediate connection to emergency services.</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card hero-stat-card animate-all" style={{ 
            background: 'rgba(10, 15, 30, 0.55)', 
            borderColor: 'rgba(255, 255, 255, 0.08)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.5rem', 
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <Shield size={22} style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>Secure Reporting</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.25rem', lineHeight: 1.4 }}>Your information is protected and handled responsibly.</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="card hero-stat-card animate-all" style={{ 
            background: 'rgba(10, 15, 30, 0.55)', 
            borderColor: 'rgba(255, 255, 255, 0.08)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.5rem', 
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <Shield size={22} style={{ color: '#10B981' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>Quick Police Response</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.25rem', lineHeight: 1.4 }}>Nearest available unit is notified for faster assistance.</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="card hero-stat-card animate-all" style={{ 
            background: 'rgba(10, 15, 30, 0.55)', 
            borderColor: 'rgba(255, 255, 255, 0.08)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.5rem', 
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <MapPin size={22} style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>Track Your Report</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.25rem', lineHeight: 1.4 }}>Monitor your incident status after submission.</div>
            </div>
          </div>

          {/* Card 5 - AI Incident Analysis */}
          <div className="card hero-stat-card animate-all" style={{ 
            background: 'rgba(10, 15, 30, 0.55)', 
            borderColor: 'rgba(255, 255, 255, 0.08)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.5rem', 
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ background: 'rgba(124, 77, 255, 0.15)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(124, 77, 255, 0.25)' }}>
              <Brain size={22} style={{ color: '#7C4DFF' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>AI Incident Analysis</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.25rem', lineHeight: 1.4 }}>AI automatically analyzes emergency reports and prioritizes critical incidents for faster response.</div>
            </div>
          </div>

          {/* Card 6 - Live Emergency Updates */}
          <div className="card hero-stat-card animate-all" style={{ 
            background: 'rgba(10, 15, 30, 0.55)', 
            borderColor: 'rgba(255, 255, 255, 0.08)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.5rem', 
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ background: 'rgba(0, 188, 212, 0.15)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0, 188, 212, 0.25)' }}>
              <Clock size={22} style={{ color: '#00BCD4' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>Live Emergency Updates</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.25rem', lineHeight: 1.4 }}>Receive real-time notifications and status updates for your reported incidents.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1.5px', background: isDark ? 'linear-gradient(to right, transparent, rgba(255,153,51,0.12), transparent)' : 'linear-gradient(to right, transparent, rgba(249, 115, 22, 0.12), transparent)', margin: '2rem auto 4rem', maxWidth: '1000px' }} />

      {/* Citizen Rights & Responsibilities Section (Directly below Hero) */}
      <section id="rights" style={{
        maxWidth: '1200px',
        margin: '0 auto 6rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#ff9933' }}>
            <BookOpen size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('navbar.knowYourRights')}</span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', color: textColor }}>{t('rightsSection.heading')}</h2>
          <p style={{ color: textSecondary, maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', fontWeight: 500 }}>
            {t('rightsSection.sub')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {[
            { title: t('rightsSection.item1Title'), desc: t('rightsSection.item1Desc') },
            { title: t('rightsSection.item2Title'), desc: t('rightsSection.item2Desc') },
            { title: t('rightsSection.item3Title'), desc: t('rightsSection.item3Desc') },
            { title: t('rightsSection.item4Title'), desc: t('rightsSection.item4Desc') },
            { title: t('rightsSection.item5Title'), desc: t('rightsSection.item5Desc') },
            { title: t('rightsSection.item6Title'), desc: t('rightsSection.item6Desc') }
          ].map((right, idx) => (
            <div key={idx} style={{
              background: cardBg,
              border: `1px solid ${borderCol}`,
              borderRadius: '12px',
              padding: '1.75rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: shadowStyle
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                fontSize: '4.5rem',
                fontWeight: 900,
                color: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
                userSelect: 'none'
              }}>
                0{idx + 1}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: textColor, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#ff9933' }}>●</span> {right.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: textSecondary, lineHeight: 1.5 }}>
                {right.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Legal Disclaimer */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: textSecondary,
          marginTop: '2rem',
          fontStyle: 'italic',
          background: cardBg,
          padding: '0.75rem',
          borderRadius: '8px',
          border: `1px solid ${borderCol}`,
          boxShadow: shadowStyle
        }}>
          ⚖️ {t('rightsSection.disclaimer')}
        </p>
      </section>

      {/* Divider */}
      <div style={{ height: '1.5px', background: isDark ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' : 'linear-gradient(to right, transparent, rgba(16, 185, 129, 0.12), transparent)', margin: '2rem auto 4rem', maxWidth: '1000px' }} />

      {/* Trust Section - Report Without Fear */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 6rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', color: textColor }}>
            {t('fearSection.heading')}
          </h2>
          <p style={{ color: textSecondary, maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', fontWeight: 500 }}>
            {t('fearSection.sub')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem'
        }}>
          {/* Card 1: Your Identity */}
          <div className="card animate-all" style={{ background: cardBg, padding: '2rem', textAlign: 'left', borderTop: '3px solid #ff9933', boxShadow: shadowStyle, borderColor: borderCol }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255,153,51,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Users size={22} style={{ color: '#ff9933' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: textColor }}>{t('fearSection.card1Title')}</h3>
            <p style={{ fontSize: '0.9rem', color: textSecondary, lineHeight: 1.5 }}>
              {t('fearSection.card1Desc')}
            </p>
          </div>

          {/* Card 2: Every Report Counts */}
          <div className="card animate-all" style={{ background: cardBg, padding: '2rem', textAlign: 'left', borderTop: '3px solid #f97316', boxShadow: shadowStyle, borderColor: borderCol }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <FileText size={22} style={{ color: '#f97316' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: textColor }}>{t('fearSection.card2Title')}</h3>
            <p style={{ fontSize: '0.9rem', color: textSecondary, lineHeight: 1.5 }}>
              {t('fearSection.card2Desc')}
            </p>
          </div>

          {/* Card 3: Privacy */}
          <div className="card animate-all" style={{ background: cardBg, padding: '2rem', textAlign: 'left', borderTop: '3px solid #10b981', boxShadow: shadowStyle, borderColor: borderCol }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Lock size={22} style={{ color: '#10b981' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: textColor }}>{t('fearSection.card3Title')}</h3>
            <p style={{ fontSize: '0.9rem', color: textSecondary, lineHeight: 1.5 }}>
              {t('fearSection.card3Desc')}
            </p>
          </div>

          {/* Card 4: Community Safety */}
          <div className="card animate-all" style={{ background: cardBg, padding: '2rem', textAlign: 'left', borderTop: '3px solid #fb923c', boxShadow: shadowStyle, borderColor: borderCol }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(251,146,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Shield size={22} style={{ color: '#fb923c' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: textColor }}>{t('fearSection.card4Title')}</h3>
            <p style={{ fontSize: '0.9rem', color: textSecondary, lineHeight: 1.5 }}>
              {t('fearSection.card4Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1.5px', background: isDark ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' : 'linear-gradient(to right, transparent, rgba(255, 153, 51, 0.12), transparent)', margin: '2rem auto 4rem', maxWidth: '1000px' }} />

      {/* Emergency Categories Section */}
      <section id="services" style={{
        maxWidth: '1200px',
        margin: '0 auto 6rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', color: textColor }}>{t('navbar.emergencyServices')}</h2>
          <p style={{ color: textSecondary, fontSize: '1.05rem', fontWeight: 500 }}>
            Select an incident category to learn immediate safety procedures.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>
          {CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              className="card animate-all"
              onClick={() => setActiveCategory(cat)}
              style={{
                background: cardBg,
                cursor: 'pointer',
                textAlign: 'left',
                padding: '1.5rem',
                border: activeCategory?.title === cat.title ? '1px solid #ff9933' : `1px solid ${borderCol}`,
                boxShadow: shadowStyle
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: textColor }}>{cat.title}</h3>
              <p style={{ fontSize: '0.85rem', color: textSecondary, lineHeight: 1.4, marginBottom: '0.5rem' }}>
                {cat.desc}
              </p>
              <span style={{ fontSize: '0.75rem', color: '#ff9933', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                View Action Guide <ArrowRight size={12} />
              </span>
            </div>
          ))}
        </div>

        {/* Interactive Category Action Guide Modal overlay */}
        {activeCategory && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', background: cardBg, border: '1px solid rgba(255,153,51,0.3)', position: 'relative', boxShadow: shadowStyle }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem', color: textColor }}>{activeCategory.title} Guidelines</h3>
              <p style={{ color: textSecondary, fontSize: '0.95rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                {activeCategory.desc}
              </p>
              <div style={{ background: 'rgba(255, 153, 51, 0.05)', border: '1px solid rgba(255, 153, 51, 0.15)', padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#ff9933', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Info size={12} /> Immediate safety action
                </div>
                <p style={{ fontSize: '0.85rem', color: textColor, lineHeight: 1.5 }}>
                  {activeCategory.action}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleReportRedirect} className="btn btn-primary btn-full" style={{ background: 'linear-gradient(135deg, #ff9933, #ea580c)', borderColor: '#ff9933' }}>
                  File Report Now
                </button>
                <button onClick={() => setActiveCategory(null)} className="btn btn-ghost" style={{ color: textColor }}>
                  Close Guide
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section id="works" style={{
        maxWidth: '1200px',
        margin: '0 auto 6rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', color: textColor }}>How It Works</h2>
          <p style={{ color: textSecondary, fontSize: '1.05rem', fontWeight: 500 }}>
            A streamlined digital response cycle mapping citizens directly to dispatchers and responders.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem',
          position: 'relative'
        }}>
          {[
            { step: '1', title: 'Citizen Reports Incident', desc: 'Citizen inputs category, description, and GPS pin.' },
            { step: '2', title: 'Severity Check', desc: 'System automatically prioritizes severity and scans language.' },
            { step: '3', title: 'Dispatcher Verifies', desc: 'HQ operators review details and authorize dispatch.' },
            { step: '4', title: 'Unit Assigned', desc: 'Closest police or rescue vehicle coordinates are assigned.' },
            { step: '5', title: 'Live Response Tracking', desc: 'Citizen tracks unit progress on their status dashboard.' },
            { step: '6', title: 'Incident Closed', desc: 'Case details logged securely for future records.' }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: cardBg,
              border: `1px solid ${borderCol}`,
              borderRadius: '12px',
              padding: '1.5rem',
              position: 'relative',
              textAlign: 'center',
              boxShadow: shadowStyle
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: idx % 2 === 0 ? '#ff9933' : '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '0.9rem'
              }}>
                {item.step}
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: textColor, marginBottom: '0.5rem' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '0.75rem', color: textSecondary, lineHeight: 1.4 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Tips Slider Carousel */}
      <section style={{
        maxWidth: '700px',
        margin: '0 auto 6rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: cardBg,
          border: '1px solid rgba(255, 153, 51, 0.25)',
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: shadowStyle,
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#ff9933', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            <Info size={14} />
            <span>Emergency Safety Tip</span>
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', color: textColor }}>
            {SAFETY_TIPS[activeTip].title}
          </h3>
          <p style={{ fontSize: '0.95rem', color: textSecondary, lineHeight: 1.6, minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            "{SAFETY_TIPS[activeTip].text}"
          </p>

          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
            <button onClick={prevTip} style={{ background: 'transparent', border: 'none', color: textSecondary, cursor: 'pointer' }}>
              <ChevronLeft size={24} />
            </button>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {SAFETY_TIPS.map((_, idx) => (
                <div key={idx} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: activeTip === idx ? '#ff9933' : textMuted,
                  transition: 'var(--transition)'
                }} />
              ))}
            </div>
            <button onClick={nextTip} style={{ background: 'transparent', border: 'none', color: textSecondary, cursor: 'pointer' }}>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Call-to-Action Emotional Banner */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 6rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: isDark ? 'linear-gradient(135deg, #431407 0%, #0f172a 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: `1px solid ${borderCol}`,
          borderRadius: '16px',
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
          boxShadow: shadowStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <AlertTriangle size={48} style={{ color: '#dc2626' }} />
          <h3 style={{ fontSize: '2rem', fontWeight: 850, color: textColor, maxWidth: '800px', lineHeight: 1.25 }}>
            {t('cta.heading')}
          </h3>
          <p style={{ color: textSecondary, maxWidth: '650px', fontSize: '1rem', lineHeight: 1.5, fontWeight: 500 }}>
            {t('cta.subheading')}
          </p>

          <button 
            onClick={handleReportRedirect} 
            className="btn btn-emergency-red animate-all" 
            style={{ 
              padding: '0.8rem 2.25rem',
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: '8px'
            }}
          >
            {t('cta.btn')}
          </button>
        </div>
      </section>

      {/* Emergency Awareness Banner */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 6rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: isDark ? 'linear-gradient(135deg, #581c20 0%, #080c14 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: isDark ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid rgba(220, 38, 38, 0.15)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: shadowStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: textColor }}>Unified Call Response Directory</h3>
          <p style={{ color: textSecondary, maxWidth: '600px', fontSize: '0.95rem', lineHeight: 1.5, fontWeight: 500 }}>
            Direct emergency dial lines are available across India. In case of life-threatening events or immediate hazards, contact ERSS directly:
          </p>

          <div style={{
            display: 'flex',
            gap: '1.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            margin: '1rem 0'
          }}>
            {EMERGENCY_SERVICES.map((serv, idx) => (
              <div key={idx} style={{
                background: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: `1px solid ${borderCol}`,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: textColor }}>{serv.service}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', fontFamily: 'monospace' }}>{serv.number}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.8rem', color: textSecondary, fontStyle: 'italic' }}>
            ⚠️ If someone's life is in immediate danger, dial 112 or contact local rescue teams without delay.
          </p>
        </div>
      </section>

      {/* Government Alignment Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 6rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: cardBg,
          border: `1px solid ${borderCol}`,
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: shadowStyle
        }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: textColor }}>
            {t('govAlignment')}
          </h3>
          <p style={{ color: textSecondary, maxWidth: '750px', margin: '0 auto 2rem', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500 }}>
            The Prakasam Police emergency coordination platform features data validation flow, evidence vault protection, and audit logs designed in alignment with modern national frameworks and digital acts.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            fontSize: '0.75rem',
            color: textSecondary
          }}>
            <span style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '4px', border: `1px solid ${borderCol}`, color: textColor, fontWeight: 600 }}>
              Emergency Response Support System (ERSS-112)
            </span>
            <span style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '4px', border: `1px solid ${borderCol}`, color: textColor, fontWeight: 600 }}>
              Bharatiya Nyaya Sanhita (BNS), 2023
            </span>
            <span style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '4px', border: `1px solid ${borderCol}`, color: textColor, fontWeight: 600 }}>
              Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
            </span>
            <span style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '4px', border: `1px solid ${borderCol}`, color: textColor, fontWeight: 600 }}>
              Bharatiya Sakshya Adhiniyam (BSA), 2023
            </span>
            <span style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '4px', border: `1px solid ${borderCol}`, color: textColor, fontWeight: 600 }}>
              Digital Personal Data Protection (DPDP) Act, 2023
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'rgba(8, 14, 28, 0.82)',
        borderTop: `1px solid ${borderCol}`,
        padding: '4.5rem 2rem 3rem',
        color: 'rgba(255, 255, 255, 0.72)',
        fontSize: '0.85rem',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(20px) saturate(1.3)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          <div>
            <div style={{ fontWeight: 800, color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <img src="/prakasam_police_badge.jpg" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
              <span>{t('common.prakasamPolice')}</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: textMuted }}>
              A high-precision real-time response network built to coordinate Police, Fire, Ambulance, and Disaster Relief services under state frameworks.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', marginBottom: '1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Citizen Services</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li><button onClick={handleReportRedirect} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer', fontSize: 'inherit' }}>File Incident Report</button></li>
              <li><button onClick={handleHistoryRedirect} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer', fontSize: 'inherit' }}>Track My Reports</button></li>
              <li><a href="#services" style={{ color: '#94a3b8' }}>Emergency Directory</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', marginBottom: '1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Know Your Rights</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li><a href="#rights" style={{ color: '#94a3b8' }}>Legal Timeline Awareness</a></li>
              <li><a href="#rights" style={{ color: '#94a3b8' }}>Evidence Preservation (BSA)</a></li>
              <li><a href="#rights" style={{ color: '#94a3b8' }}>Women SOS Safety Laws</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', marginBottom: '1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Privacy & Terms</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li><span style={{ color: '#94a3b8' }}>DPDP Act Compliance</span></li>
              <li><span style={{ color: '#94a3b8' }}>Security Audit Trail</span></li>
              <li><span style={{ color: '#94a3b8' }}>Anonymity Guidelines</span></li>
            </ul>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '2.5rem',
          borderTop: `1px solid ${borderCol}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <div>
            &copy; {new Date().getFullYear()} Prakasam Police Emergency Response Network. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span>DPDP Encrypted Vault</span>
            <span>24x7 Connected</span>
          </div>
        </div>
      </footer>
      <button
        className={`va-float-btn ${voiceAgentOpen ? 'listening' : ''}`}
        onClick={vaHandleOpen}
        title="Talk to AI Emergency Agent"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
        }}
      >
        <span className="pulse-ring ring-1" />
        <span className="pulse-ring ring-2" />
        <Phone size={40} />
      </button>

      {/* ── AI VOICE AGENT MODAL OVERLAY ── */}
      {voiceAgentOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) vaHandleClose(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="va-modal"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: isDark ? 'rgba(10, 15, 28, 0.98)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(220,38,38,0.35)' : 'rgba(220,38,38,0.2)'}`,
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 24px 80px rgba(220,38,38,0.2)',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={vaHandleClose}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
              }}
            >
              <X size={18} />
            </button>

            {/* Success Screen */}
            {vaSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ color: '#10b981', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Report Submitted Successfully</h2>
                <p style={{ color: textSecondary, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Your emergency voice report has been processed by our AI and forwarded to the Prakasam control room.
                </p>
                <div style={{
                  background: isDark ? 'rgba(16,185,129,0.08)' : '#f0fdf4',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  color: textSecondary,
                }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <Phone size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                    <span>Registered Phone: <strong style={{ color: textColor }}>+91 {vaMobile}</strong></span>
                  </div>
                  {vaAddress && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <MapPin size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                      <span>Report Location: <strong style={{ color: textColor }}>{vaAddress}</strong></span>
                    </div>
                  )}
                </div>
                <button
                  onClick={vaHandleClose}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.7rem 2rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Return to Dashboard
                </button>
              </div>
            ) : micPermissionDenied ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎙️❌</div>
                <h2 style={{ color: '#dc2626', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                  Microphone Permission Required
                </h2>
                <p style={{ color: textSecondary, fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Microphone permission is required to report an emergency via the AI Voice Agent.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={vaHandleOpen}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.7rem', fontWeight: 700, borderRadius: '10px' }}
                  >
                    Retry Permission
                  </button>
                  <button
                    onClick={vaHandleClose}
                    className="btn btn-ghost"
                    style={{ flex: 1, padding: '0.7rem', border: `1px solid ${borderCol}`, color: textColor, borderRadius: '10px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <style>{`
                  @keyframes va-pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
                  }
                  @keyframes va-pulse-cyan {
                    0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(6, 182, 212, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
                  }
                  @keyframes va-wave {
                    0%, 100% { transform: scaleY(0.3); }
                    50% { transform: scaleY(1.2); }
                  }
                  .va-wave-bar {
                    width: 3px;
                    height: 24px;
                    background: #dc2626;
                    border-radius: 3px;
                    display: inline-block;
                    margin: 0 2px;
                  }
                  .va-wave-bar.speaking {
                    background: #dc2626;
                    animation: va-wave 1s ease-in-out infinite;
                  }
                  .va-wave-bar.listening {
                    background: #06b6d4;
                    animation: va-wave 0.8s ease-in-out infinite;
                  }
                `}</style>

                {vaStep === 0 ? (
                  <>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: '0 8px 30px rgba(220,38,38,0.4)',
                      }}>
                        <Mic size={28} color="#fff" />
                      </div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: textColor, marginBottom: '0.35rem' }}>
                        AI Emergency Assistant
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: textSecondary, lineHeight: 1.55 }}>
                        Verify your mobile number and wait for the exact GPS location lock before calling.
                      </p>
                    </div>

                    {/* Mobile number input */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
                        Your Contact Phone Number
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: `1.5px solid ${vaError ? '#dc2626' : borderCol}`, borderRadius: '10px', padding: '0.65rem 1rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ff9933', flexShrink: 0 }}>+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={vaMobile}
                          onChange={(e) => { setVaMobile(e.target.value.replace(/\D/g, '')); setVaError(''); }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: textColor,
                            width: '100%',
                            letterSpacing: '0.08em',
                          }}
                        />
                        {vaMobile.length === 10 && (
                          <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>
                        )}
                      </div>
                      {vaError && (
                        <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: 600 }}>{vaError}</p>
                      )}
                    </div>

                    {/* Location status */}
                    <div style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                      border: `1px solid ${borderCol}`,
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                    }}>
                      <MapPin size={16} style={{ color: vaCoords ? '#10b981' : '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                          Exact GPS Location Lock
                        </div>
                        {vaLocating ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.82rem' }}>
                            <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            Retrieving exact location coordinates...
                          </div>
                        ) : vaAddress ? (
                          <div style={{ fontSize: '0.82rem', color: textColor, lineHeight: 1.4 }}>
                            {vaAddress} (Lock Acquired)
                          </div>
                        ) : (
                          <button
                            onClick={vaGetLocation}
                            style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                          >
                            Click to acquire GPS location
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Start emergency report */}
                    <button
                      onClick={startVoiceAgentConversation}
                      disabled={vaMobile.length < 10}
                      style={{
                        width: '100%',
                        background: vaMobile.length === 10
                          ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                          : isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                        color: vaMobile.length === 10 ? '#fff' : textMuted,
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: vaMobile.length === 10 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.6rem',
                        transition: 'all 0.2s',
                        boxShadow: vaMobile.length === 10 ? '0 6px 20px rgba(220,38,38,0.35)' : 'none',
                      }}
                    >
                      <Mic size={16} /> Start Hands-Free Call
                    </button>
                  </>
                ) : (
                  <>
                    {/* Progress & Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: `1px solid ${borderCol}`, paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isListening ? '#06b6d4' : isSpeaking ? '#dc2626' : '#64748b',
                          animation: isListening ? 'va-pulse-cyan 1.5s infinite' : isSpeaking ? 'va-pulse-red 1.5s infinite' : 'none'
                        }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: textColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {vaStep === 6 ? 'Submitting Report...' : `Step ${vaStep} of 5`}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: textSecondary, fontWeight: 600 }}>
                        AI Emergency Voice Agent
                      </span>
                    </div>

                    {/* AI Avatar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem 0 1.5rem' }}>
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: isListening ? 'linear-gradient(135deg, #0891b2, #06b6d4)' : 'linear-gradient(135deg, #dc2626, #ea580c)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isListening ? '0 8px 24px rgba(6,182,212,0.3)' : '0 8px 24px rgba(220,38,38,0.3)',
                        transition: 'all 0.3s',
                        position: 'relative'
                      }}>
                        <Mic size={32} color="#fff" />
                      </div>
                      
                      {/* Waveform indicator */}
                      <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.75rem' }}>
                        {(isSpeaking || isListening) ? (
                          <div style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                            {[...Array(6)].map((_, i) => (
                              <span
                                key={i}
                                className={`va-wave-bar ${isSpeaking ? 'speaking' : 'listening'}`}
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: textSecondary, fontWeight: 600 }}>
                            System Idle
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ChatGPT style Conversation Box */}
                    <div
                      id="va-chat-container"
                      style={{
                        height: '240px',
                        overflowY: 'auto',
                        border: `1px solid ${borderCol}`,
                        borderRadius: '12px',
                        padding: '1rem',
                        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(248,250,252,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        marginBottom: '1rem',
                        scrollBehavior: 'smooth'
                      }}
                    >
                      {chatMessages.length === 0 && (
                        <div style={{ color: textSecondary, fontSize: '0.82rem', textAlign: 'center', marginTop: '5rem' }}>
                          Initializing conversation...
                        </div>
                      )}
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: msg.sender === 'citizen' ? 'flex-end' : 'flex-start',
                            width: '100%'
                          }}
                        >
                          <div style={{
                            maxWidth: '82%',
                            background: msg.sender === 'citizen'
                              ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')
                              : (isDark ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.05)'),
                            border: `1px solid ${msg.sender === 'citizen'
                              ? (isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)')
                              : (isDark ? 'rgba(220,38,38,0.3)' : 'rgba(220,38,38,0.12)')
                            }`,
                            borderRadius: '12px',
                            padding: '0.65rem 0.85rem',
                            fontSize: '0.85rem',
                            lineHeight: 1.45,
                            color: textColor,
                            boxShadow: 'var(--shadow-sm)',
                            textAlign: 'left'
                          }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: msg.sender === 'citizen' ? '#60a5fa' : '#f87171', marginBottom: '0.2rem' }}>
                              {msg.sender === 'citizen' ? 'You' : 'AI Assistant'}
                            </div>
                            {msg.text}
                          </div>
                        </div>
                      ))}

                      {/* Live speech input indicator */}
                      {isListening && liveTranscript && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                          <div style={{
                            maxWidth: '82%',
                            background: 'rgba(6,182,212,0.08)',
                            border: '1px solid rgba(6,182,212,0.25)',
                            borderRadius: '12px',
                            padding: '0.65rem 0.85rem',
                            fontSize: '0.85rem',
                            color: textColor,
                            opacity: 0.85,
                            textAlign: 'left',
                            fontStyle: 'italic'
                          }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#06b6d4', marginBottom: '0.2rem', fontStyle: 'normal' }}>
                              Listening...
                            </div>
                            {liveTranscript}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: textSecondary }}>
                      <span>
                        {isSpeaking ? '🔊 Agent speaking...' : isListening ? '🎙️ Listening (speak now)...' : 'Wait...'}
                      </span>
                      {vaAddress && (
                        <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={vaAddress}>
                          📍 {vaAddress}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
