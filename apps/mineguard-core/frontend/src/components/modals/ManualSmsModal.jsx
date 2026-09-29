import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Send, AlertTriangle, CheckCircle2, Smartphone, Users, Globe2, 
  Clock, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, 
  Info, Check, ChevronRight, MessageSquare, Copy, Sparkles, PhoneCall
} from 'lucide-react';
import { apiFetch, API_BASE, getApiKey, wsUrl } from '../../services/api';

const OPERATIONAL_TEMPLATES = [
  {
    id: 'shift_handover',
    title: 'Shift Handover Briefing',
    category: 'Operations',
    icon: '📋',
    english: 'Shift {{shift}} handover briefing scheduled at {{timestamp}} in {{zone}}. All supervisors and operators report to the briefing station.',
    hindi: 'शिफ्ट {{shift}} हैंडओवर ब्रीफिंग {{timestamp}} पर {{zone}} में निर्धारित है। सभी सुपरवाइजर ब्रीफिंग स्टेशन पर रिपोर्ट करें।',
    tamil: 'ஷிப்ட் {{shift}} பணி ஒப்படைப்பு {{timestamp}} மணிக்கு {{zone}} பகுதியில் நடைபெறும். அனைத்து மேற்பார்வையாளர்களும் வரவும்.',
    bengali: 'শিফট {{shift}} হ্যান্ডওভার ব্রিফিং {{timestamp}} মুহূর্তে {{zone}}-এ নির্ধারিত। সকল সুপারভাইজার ও অপারেটর ব্রিফিং স্টেশনে উপস্থিত হোন।',
    santali: 'ᱥᱤᱯᱷᱴ {{shift}} ᱦᱟᱱᱰᱚᱣᱟᱨ ᱵᱨᱤᱯᱷᱤᱝ {{timestamp}} ᱨᱮ {{zone}} ᱨᱮ ᱢᱮᱱᱟᱜᱼᱟ᱾ ᱥᱟᱱᱟᱢ ᱥᱩᱯᱚᱨᱵᱷᱟᱭᱡᱚᱨ ᱵᱨᱤᱯᱷᱤᱝ ᱥᱴᱮᱥᱚᱱ ᱨᱮ ᱦᱮᱡ ᱠᱚ ᱢᱟ᱾'
  },
  {
    id: 'safety_inspection',
    title: 'Safety Inspection Notice',
    category: 'Safety',
    icon: '🛡️',
    english: 'Routine safety audit underway in {{zone}} at {{timestamp}}. Ensure all escapeways, PPE, and communication sets are secured.',
    hindi: '{{zone}} में {{timestamp}} पर नियमित सुरक्षा निरीक्षण जारी है। सभी निकास मार्ग और सुरक्षा उपकरण व्यवस्थित रखें।',
    tamil: '{{zone}} பகுதியில் {{timestamp}} மணிக்கு வழக்கமான பாதுகாப்பு ஆய்வு நடைபெறுகிறது. வெளியேறும் வழிகளை தெளிவாக வைக்கவும்.',
    bengali: '{{zone}}-এ {{timestamp}} মুহূর্তে নিয়মিত সুরক্ষা পরিদর্শন চলছে। সমস্ত নিরাপত্তা পথ ও সরঞ্জাম প্রস্তুত রাখুন।',
    santali: '{{zone}} ᱨᱮ {{timestamp}} ᱨᱮ ᱵᱟᱹᱲᱛᱤ ᱥᱤᱠᱷᱤᱛ ᱧᱮᱞᱡᱚᱠᱷ ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ᱾ ᱥᱟᱱᱟᱢ ᱚᱰᱚᱱ ᱰᱟᱦᱟᱨ ᱟᱨ ᱥᱤᱠᱷᱤᱛ ᱥᱟᱢᱟᱱ ᱛᱷᱤᱠ ᱫᱚᱦᱚ ᱢᱟ᱾'
  },
  {
    id: 'drill_notice',
    title: 'Evacuation Drill Notice',
    category: 'Safety',
    icon: '🚨',
    english: 'Notice: Routine evacuation drill scheduled today at {{timestamp}}. Normal underground operations resume immediately following the drill.',
    hindi: 'सूचना: आज {{timestamp}} पर नियमित निकासी ड्रिल आयोजित की जाएगी। ड्रिल के तुरंत बाद सामान्य कार्य फिर से शुरू होगा।',
    tamil: 'அறிவிப்பு: இன்று {{timestamp}} மணிக்கு வழக்கமான வெளியேற்ற ஒத்திகை நடைபெறும். ஒத்திகைக்குப் பின் வழக்கமான பணி தொடரும்.',
    bengali: 'সূচনা: আজ {{timestamp}} মুহূর্তে নিয়মিত সরিয়ে-নেওয়ার মহড়া অনুষ্ঠিত হবে। মহড়ার পরেই স্বাভাবিক কাজ পুনরায় শুরু হবে।',
    santali: 'ᱡᱟᱹᱨᱤ ᱠᱷᱚᱵᱚᱨ: ᱛᱤᱱᱟᱹᱜ ᱫᱤᱱ {{timestamp}} ᱨᱮ ᱚᱫᱚᱲ ᱚᱰᱚᱱ ᱨᱮᱱᱟᱜ ᱢᱚᱦᱲᱟ ᱦᱩᱭᱩᱜᱼᱟ᱾ ᱢᱚᱦᱲᱟ ᱯᱩᱨᱟᱹ ᱠᱷᱟᱱ ᱠᱟᱹᱢᱤ ᱫᱩᱦᱲᱟᱹ ᱮᱛᱚᱦᱚᱵ ᱦᱩᱭᱩᱜᱼᱟ᱾'
  },
  {
    id: 'ventilation_maint',
    title: 'Ventilation Maintenance',
    category: 'Maintenance',
    icon: '💨',
    english: 'Planned ventilation fan maintenance in {{zone}} from {{timestamp}}. Auxiliary ventilation active. Monitor airflow sensors.',
    hindi: '{{zone}} में {{timestamp}} से नियोजित वेंटिलेशन रखरखाव होगा। सहायक पंखे सक्रिय हैं। वायु प्रवाह की निगरानी रखें।',
    tamil: '{{zone}} பகுதியில் {{timestamp}} முதல் காற்றோட்ட விசிறி பராமரிப்பு நடைபெறும். கூடுதல் காற்றோட்டம் இயக்கத்தில் உள்ளது.',
    bengali: '{{zone}}-এ {{timestamp}} থেকে পরিকল্পিত ভেন্টিলেশন রক্ষণাবেক্ষণ। সহায়ক ফ্যান সক্রিয়। বায়ুপ্রবাহ সেন্সর পর্যবেক্ষণ করুন।',
    santali: '{{zone}} ᱨᱮ {{timestamp}} ᱠᱷᱚᱱ ᱦᱚᱣᱟ ᱯᱟᱥᱱᱟᱣ ᱫᱚᱦᱲᱟᱹ ᱥᱟᱯᱲᱟᱣ ᱦᱩᱭᱩᱜᱼᱟ᱾ ᱜᱚᱲᱚ ᱯᱷᱮᱱ ᱪᱟᱞᱟᱣ ᱨᱮ ᱢᱮᱱᱟᱜᱼᱟ᱾ ᱦᱚᱣᱟ ᱥᱮᱱᱥᱚᱨ ᱧᱮᱞ ᱢᱟ᱾'
  },
  {
    id: 'gas_reading_normal',
    title: 'Routine Gas Advisory',
    category: 'Monitoring',
    icon: '🟡',
    english: 'Routine telemetry check in {{zone}} at {{timestamp}}: CH4, CO, and O2 levels are stable and within safety thresholds. Continue operations.',
    hindi: '{{zone}} में {{timestamp}} पर गैस जांच पूर्ण: CH4, CO और O2 का स्तर सामान्य और सुरक्षित सीमा में है। कार्य जारी रखें।',
    tamil: '{{zone}} பகுதியில் {{timestamp}} மணிக்கு வாயு ஆய்வு நிறைவு: CH4, CO மற்றும் O2 அளவுகள் பாதுகாப்பான அளவில் உள்ளன.',
    bengali: '{{zone}}-এ {{timestamp}} মুহূর্তে নিয়মিত গ্যাস পরীক্ষা: CH4, CO এবং O2 মাত্রা স্থিতিশীল ও সুরক্ষা সীমার মধ্যে। কাজ চালিয়ে যান।',
    santali: '{{zone}} ᱨᱮ {{timestamp}} ᱨᱮ ᱜᱮᱥ ᱧᱮᱞᱡᱚᱠᱷ: CH4, CO ᱟᱨ O2 ᱢᱟᱯ ᱥᱤᱠᱷᱤᱛ ᱥᱤᱢᱟ ᱵᱷᱤᱛᱨᱤ ᱨᱮ ᱢᱮᱱᱟᱜᱼᱟ᱾ ᱠᱟᱹᱢᱤ ᱪᱟᱞᱟᱣ ᱛᱟᱦᱮᱱ ᱢᱟ᱾'
  },
  {
    id: 'equipment_transit',
    title: 'Heavy Machinery Transit',
    category: 'Operations',
    icon: '🚜',
    english: 'Continuous miner transport moving through {{zone}} at {{timestamp}}. Keep main haulage road clear of personnel and light vehicles.',
    hindi: '{{timestamp}} पर {{zone}} से भारी खनन मशीनरी का परिवहन होगा। मुख्य मार्ग को कर्मियों और हल्के वाहनों से मुक्त रखें।',
    tamil: '{{timestamp}} மணிக்கு {{zone}} வழியாக கனரக இயந்திரங்கள் கொண்டு செல்லப்படும். முக்கிய பாதையை காலியாக வைக்கவும்.',
    bengali: '{{timestamp}} মুহূর্তে {{zone}} দিয়ে ভারী খনি যন্ত্র পরিবহন হবে। মূল পথ কর্মী ও হালকা যান থেকে মুক্ত রাখুন।',
    santali: '{{timestamp}} ᱨᱮ {{zone}} ᱛᱮ ᱞᱟᱹᱴᱩ ᱠᱷᱟᱹᱫᱽ ᱢᱚᱥᱤᱱ ᱪᱟᱞᱟᱜᱼᱟ᱾ ᱢᱩᱞ ᱰᱟᱦᱟᱨ ᱠᱷᱚᱱ ᱠᱟᱹᱢᱤᱭᱟᱹ ᱠᱚ ᱥᱟᱦᱟ ᱠᱚ ᱛᱟᱦᱮᱱ ᱢᱟ᱾'
  },
  {
    id: 'custom_message',
    title: 'Custom Message',
    category: 'Custom',
    icon: '✍️',
    english: '',
    hindi: '',
    tamil: '',
    bengali: '',
    santali: ''
  }
];

const VARIABLE_CHIPS = [
  { tag: '{{recipient_name}}', label: 'Recipient Name', example: 'Ramesh Kumar' },
  { tag: '{{zone}}', label: 'Mine Zone', example: 'Shaft 3 / South Wall' },
  { tag: '{{shift}}', label: 'Current Shift', example: 'Shift B (Day)' },
  { tag: '{{timestamp}}', label: 'Timestamp', example: '14:30 IST' }
];

export default function ManualSmsModal({ isOpen, onClose, targetBroadcastId, onSentSuccess }) {
  // Wizard Stages: 'compose' | 'confirm' | 'sending' | 'result'
  const [stage, setStage] = useState('compose');
  
  // Broadcast Data
  const [broadcastInfo, setBroadcastInfo] = useState(null);
  const [rosterData, setRosterData] = useState({ total_recipients: 0, valid_sms_recipients: 0, missing_sms_recipients: 0, recipients: [] });
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);

  // Composer State
  const [selectedTemplateId, setSelectedTemplateId] = useState('shift_handover');
  const [language, setLanguage] = useState('english'); // 'english' | 'hindi' | 'tamil'
  const [messageText, setMessageText] = useState('');
  const [senderName, setSenderName] = useState('Mine Safety Dispatch');
  
  // Preview State
  const [previewRecipientIndex, setPreviewRecipientIndex] = useState(0);
  
  // Sending & Result State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sendingStatusText, setSendingStatusText] = useState('Initializing Gateway...');
  const [sendResult, setSendResult] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);
  
  // Search in Result
  const [resultFilterQuery, setResultFilterQuery] = useState('');
  const textareaRef = useRef(null);

  // Fetch broadcast details and roster whenever modal opens with targetBroadcastId
  useEffect(() => {
    if (isOpen && targetBroadcastId) {
      setStage('compose');
      setDuplicateError(null);
      setSendingProgress(0);
      setSendResult(null);
      fetchBroadcastDetails(targetBroadcastId);
      fetchRecipientRoster(targetBroadcastId);
    }
  }, [isOpen, targetBroadcastId]);

  // Set default message when template or language changes (if not custom or if user clicks template)
  useEffect(() => {
    if (selectedTemplateId) {
      const tpl = OPERATIONAL_TEMPLATES.find(t => t.id === selectedTemplateId);
      if (tpl && tpl[language] !== undefined) {
        setMessageText(tpl[language]);
      }
    }
  }, [selectedTemplateId, language]);

  const fetchBroadcastDetails = async (id) => {
    try {
      const res = await apiFetch(`/api/broadcasts/${id}`, {
        headers: { 'X-API-Key': getApiKey() }
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastInfo(data);
      }
    } catch (err) {
      console.error('Failed to load broadcast info:', err);
    }
  };

  const fetchRecipientRoster = async (id) => {
    setIsLoadingRoster(true);
    try {
      const res = await apiFetch(`/api/broadcasts/${id}/recipients`, {
        headers: { 'X-API-Key': getApiKey() }
      });
      if (res.ok) {
        const data = await res.json();
        setRosterData(data);
      }
    } catch (err) {
      console.error('Failed to load recipient roster:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  // Insert variable chip into message at cursor position
  const handleInsertVariable = (tag) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageText(prev => prev + ' ' + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = messageText.substring(0, start) + tag + messageText.substring(end);
    setMessageText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  // SMS Metric calculations (GSM-7 vs Unicode)
  const smsMetrics = useMemo(() => {
    const text = messageText || '';
    const isUnicode = Array.from(text).some(char => char.charCodeAt(0) > 127);
    const charCount = text.length;
    
    let segmentSize;
    let maxSingleSegment;
    if (isUnicode) {
      maxSingleSegment = 70;
      segmentSize = charCount <= 70 ? 70 : 67;
    } else {
      maxSingleSegment = 160;
      segmentSize = charCount <= 160 ? 160 : 153;
    }
    
    const segments = charCount === 0 ? 1 : Math.ceil(charCount / segmentSize);
    const charsRemainingInSegment = segments * segmentSize - charCount;
    const validRecipients = rosterData.valid_sms_recipients || 1;
    const totalSmsUnits = segments * validRecipients;

    return {
      charCount,
      isUnicode,
      maxSingleSegment,
      segmentSize,
      segments,
      charsRemainingInSegment,
      totalSmsUnits,
      isMultiSegment: segments > 1
    };
  }, [messageText, rosterData.valid_sms_recipients]);

  // Current preview recipient
  const previewRecipient = useMemo(() => {
    if (!rosterData.recipients || rosterData.recipients.length === 0) {
      return {
        name: 'Ramesh Kumar',
        zone: 'Shaft 3 / South Wall',
        role: 'Underground Miner',
        phone_masked: '+91 ••••••8214',
        shift: 'Shift B (Day)'
      };
    }
    return rosterData.recipients[previewRecipientIndex % rosterData.recipients.length];
  }, [rosterData.recipients, previewRecipientIndex]);

  // Resolved preview message text with variable replacements
  const resolvedPreviewMessage = useMemo(() => {
    if (!messageText) return 'Enter your operational message above to preview simulated handset delivery.';
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
    
    return messageText
      .replace(/\{\{recipient_name\}\}/g, previewRecipient.name || 'Team Member')
      .replace(/\{\{zone\}\}/g, previewRecipient.zone || 'Shaft 3')
      .replace(/\{\{shift\}\}/g, previewRecipient.shift || 'Shift B (Day)')
      .replace(/\{\{timestamp\}\}/g, timeStr);
  }, [messageText, previewRecipient]);

  // Execute Dispatch
  const handleStartDispatch = async () => {
    setStage('sending');
    setIsSubmitting(true);
    setDuplicateError(null);
    setSendingProgress(10);
    setSendingStatusText('Connecting to Industrial SMS Gateway...');

    // Progress animation steps
    const timer1 = setTimeout(() => {
      setSendingProgress(35);
      setSendingStatusText(`Resolving ${rosterData.valid_sms_recipients} cellular route endpoints...`);
    }, 400);

    const timer2 = setTimeout(() => {
      setSendingProgress(70);
      setSendingStatusText('Transmitting SMS burst packets over carrier tunnel...');
    }, 850);

    try {
      const res = await apiFetch(`/api/sms/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify({
          broadcast_id: targetBroadcastId,
          message: messageText,
          languages: [language],
          template_id: selectedTemplateId,
          sender: senderName
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Dispatch failed');
      }

      const data = await res.json();
      setSendingProgress(100);
      setSendingStatusText('Broadcast completed. Handset receipts captured.');
      
      setTimeout(() => {
        setSendResult(data);
        setStage('result');
        setIsSubmitting(false);
        if (onSentSuccess) onSentSuccess(data);
      }, 400);

    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsSubmitting(false);
      setStage('compose');
      setDuplicateError(err.message || 'Failed to dispatch manual SMS.');
    }
  };

  // Filtered deliveries list for result screen
  const filteredDeliveries = useMemo(() => {
    if (!sendResult || !sendResult.deliveries) return [];
    if (!resultFilterQuery) return sendResult.deliveries;
    const q = resultFilterQuery.toLowerCase();
    return sendResult.deliveries.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.zone.toLowerCase().includes(q) || 
      d.phone_masked.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q)
    );
  }, [sendResult, resultFilterQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      
      {/* Main Drawer Panel */}
      <div className="w-full max-w-4xl h-full bg-[#080D14] border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 relative text-slate-100 font-sans">

        {/* ── DRAWER HEADER ── */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-[#0C121E] flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono">
                  Manual SMS Broadcast
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  Non-Emergency Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted cellular transmission for operational, shift, and routine notices
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── LOCKED TARGET BROADCAST RECIPIENT SUMMARY BAR ── */}
        <div className="px-6 py-3 bg-[#0E1626] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Target Broadcast:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold font-mono">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{broadcastInfo ? broadcastInfo.name : 'Selected Broadcast'}</span>
              <span className="text-[10px] opacity-75 font-normal ml-1">🔒 Locked</span>
            </div>
          </div>

          {/* Recipient Eligibility Stats */}
          <div className="flex items-center gap-4 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Total Members:</span>
              <span className="font-bold text-white">{rosterData.total_recipients}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-slate-400">Valid Mobile:</span>
              <span className="font-bold text-emerald-400">{rosterData.valid_sms_recipients}</span>
            </div>
            {rosterData.missing_sms_recipients > 0 && (
              <div className="flex items-center gap-1.5" title="Members without a registered mobile number will be skipped">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-slate-400">Missing Phone:</span>
                <span className="font-bold text-amber-400">{rosterData.missing_sms_recipients}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── ERROR BANNER (e.g. Duplicate Send) ── */}
        {duplicateError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-red-200">Dispatch Intercepted</div>
              <div className="text-red-300/90 mt-0.5">{duplicateError}</div>
            </div>
            <button onClick={() => setDuplicateError(null)} className="ml-auto text-red-400 hover:text-white text-xs font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* ── DRAWER BODY (Scrollable Area) ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STAGE 1: COMPOSE STATE                                     */}
          {/* ══════════════════════════════════════════════════════════ */}
          {stage === 'compose' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT COLUMN: COMPOSER CONTROLS (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">

                {/* 1. Quick Operational Templates */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Predefined Operational Templates
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Select to populate</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {OPERATIONAL_TEMPLATES.map(tpl => {
                      const isSelected = selectedTemplateId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected 
                              ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                              : 'bg-[#0E1522] border-slate-800 hover:border-slate-700 hover:bg-[#121B2B]'
                          }`}
                        >
                          <span className="text-base shrink-0">{tpl.icon}</span>
                          <div className="min-w-0">
                            <div className={`text-xs font-bold truncate ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
                              {tpl.title}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {tpl.category}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Multilingual Language Selector */}
                <div className="bg-[#0E1522] p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Globe2 className="w-4 h-4 text-cyan-400" /> Target Language
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400/90">
                      {language === 'english' ? 'GSM-7 (Standard)' : 'Unicode Engine (UTF-8)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'english', label: 'English', flag: '🇬🇧' },
                      { id: 'hindi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
                      { id: 'bengali', label: 'বাংলা (Bengali)', flag: '🇮🇳' },
                      { id: 'tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
                      { id: 'santali', label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)', flag: '🇮🇳' }
                    ].map(lang => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setLanguage(lang.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          language === lang.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'bg-[#0A0F18] text-slate-400 hover:text-slate-200 border border-slate-800/80'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Variable Chips Injection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Insert Placeholders
                    </span>
                    <span className="text-[10px] text-slate-500">Click to insert at cursor</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLE_CHIPS.map(chip => (
                      <button
                        key={chip.tag}
                        type="button"
                        onClick={() => handleInsertVariable(chip.tag)}
                        className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 hover:border-cyan-500/50 text-[11px] font-mono font-medium transition-all flex items-center gap-1 cursor-pointer"
                        title={`Example: ${chip.example}`}
                      >
                        <span className="text-cyan-400 font-bold">+</span>
                        <span>{chip.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Live Textarea Composer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      SMS Message Body
                    </label>
                    
                    {/* Live Segment Calculator Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        smsMetrics.isMultiSegment 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {smsMetrics.charCount} / {smsMetrics.maxSingleSegment} chars • {smsMetrics.segments} SMS segment{smsMetrics.segments > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={5}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your operational SMS message here or choose a template above..."
                    className="w-full px-4 py-3 bg-[#0B101A] border border-slate-700/80 focus:border-amber-500 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all font-sans resize-none leading-relaxed"
                  />

                  {/* Multi-segment Cost Alert */}
                  {smsMetrics.isMultiSegment && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Message exceeds single segment. Each recipient will receive {smsMetrics.segments} connected SMS parts ({smsMetrics.totalSmsUnits} total SMS credits).
                      </span>
                    </div>
                  )}
                </div>

                {/* 5. Sender Dispatch ID */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E1522] border border-slate-800 text-xs">
                  <span className="text-slate-400">Sender Header ID:</span>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="bg-[#0A0F18] border border-slate-700 px-2.5 py-1 rounded text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

              </div>

              {/* RIGHT COLUMN: INTERACTIVE PHONE MOCKUP PREVIEW (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Recipient Handset Preview
                  </span>

                  {/* Recipient Switcher */}
                  {rosterData.recipients && rosterData.recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPreviewRecipientIndex(prev => prev + 1)}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      Cycle Member ({((previewRecipientIndex % rosterData.recipients.length) + 1)}/{rosterData.recipients.length})
                    </button>
                  )}
                </div>

                {/* Smartphone Device Frame */}
                <div className="w-full max-w-sm mx-auto bg-[#101725] rounded-[32px] p-4 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
                  
                  {/* Speaker Notch */}
                  <div className="w-20 h-4 bg-slate-900 mx-auto rounded-full mb-3 flex items-center justify-center">
                    <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                  </div>

                  {/* Phone Screen */}
                  <div className="bg-[#060A10] rounded-[22px] p-3 border border-slate-800/80 min-h-[360px] flex flex-col justify-between">
                    
                    {/* Handset Header */}
                    <div className="border-b border-slate-800/60 pb-2.5 text-center">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        SMS / TEXT MESSAGE
                      </div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">
                        {senderName}
                      </div>
                      <div className="text-[9px] font-mono text-cyan-400/80">
                        {previewRecipient.phone_masked} • {previewRecipient.name}
                      </div>
                    </div>

                    {/* Chat Bubble Area */}
                    <div className="py-4 flex-1 flex flex-col justify-end space-y-2">
                      <div className="text-[10px] text-center text-slate-500 font-mono">
                        Today • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      {/* Message Bubble */}
                      <div className="max-w-[92%] bg-[#1E293B] border border-slate-700 rounded-2xl rounded-tl-sm p-3.5 shadow-md self-start text-xs text-slate-100 leading-relaxed break-words whitespace-pre-wrap">
                        {resolvedPreviewMessage}
                        
                        <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[9px] font-mono text-slate-400">
                          <span>{smsMetrics.segments} SMS ({smsMetrics.charCount} chars)</span>
                          <span className="text-cyan-400 font-bold">TM-CARRIER ✓✓</span>
                        </div>
                      </div>
                    </div>

                    {/* Handset Bottom Input Mock */}
                    <div className="bg-[#0D131F] rounded-full px-3 py-1.5 border border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Reply not permitted (Broadcast)</span>
                      <span className="text-[9px] text-slate-600 font-mono">MINE-CELL</span>
                    </div>

                  </div>

                </div>

                {/* Preview Metadata Callout */}
                <div className="p-3 rounded-xl bg-[#0E1522] border border-slate-800/80 text-[11px] space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Previewing Recipient:</span>
                    <span className="text-slate-300 font-bold">{previewRecipient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Sector:</span>
                    <span className="text-cyan-400">{previewRecipient.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile Gateway:</span>
                    <span className="text-emerald-400">{previewRecipient.phone_masked}</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STAGE 2: CONFIRMATION INTERLOCK (2-Step Safety)            */}
          {/* ══════════════════════════════════════════════════════════ */}
          {stage === 'confirm' && (
            <div className="max-w-xl mx-auto space-y-6 py-4 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase font-mono tracking-wide">
                  Confirm Manual SMS Dispatch
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Review the transmission parameters before firing cellular broadcast packets.
                </p>
              </div>

              {/* Transmission Matrix Summary */}
              <div className="bg-[#0E1522] rounded-2xl border border-slate-800 p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Target Group</span>
                    <span className="text-sm font-bold text-white font-mono">{broadcastInfo?.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Eligible Mobile Numbers</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{rosterData.valid_sms_recipients} Recipient{rosterData.valid_sms_recipients > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">SMS Segments</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">{smsMetrics.segments} Segment{smsMetrics.segments > 1 ? 's' : ''} per Handset</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total SMS Credits</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">{smsMetrics.totalSmsUnits} SMS Units</span>
                  </div>
                </div>

                {/* Message Excerpt */}
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Message Preview</span>
                  <div className="p-3 rounded-xl bg-[#080D14] border border-slate-800 text-xs text-slate-300 font-sans italic leading-relaxed">
                    "{resolvedPreviewMessage}"
                  </div>
                </div>
              </div>

              {/* Safety Interlock Notice */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Non-Emergency Notice:</strong> This action sends a standard cellular SMS to underground/surface handsets. Sirens, strobe alarms, and emergency evacuation routing will NOT be triggered.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStage('compose')}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer"
                >
                  ← Back to Editor
                </button>

                <button
                  type="button"
                  onClick={handleStartDispatch}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirm & Dispatch SMS</span>
                </button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STAGE 3: SENDING / TRANSMISSION IN PROGRESS                */}
          {/* ══════════════════════════════════════════════════════════ */}
          {stage === 'sending' && (
            <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-in fade-in duration-300">
              
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping"></div>
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/60">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white uppercase font-mono tracking-wider">
                  Dispatching SMS Packets...
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {sendingStatusText}
                </p>
              </div>

              {/* Industrial Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: `${sendingProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>CARRIER GATEWAY</span>
                  <span className="font-bold text-amber-400">{sendingProgress}%</span>
                  <span>BURST PROTOCOL</span>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STAGE 4: DELIVERY RESULT SCREEN                            */}
          {/* ══════════════════════════════════════════════════════════ */}
          {stage === 'result' && sendResult && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Success Hero Badge */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-950/50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      Broadcast Successful • {sendResult.alert_id}
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase font-mono mt-0.5">
                      {sendResult.delivered_count} SMS Messages Delivered
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Transmitted to <span className="text-slate-200 font-bold">{sendResult.broadcast_name}</span> via Industrial Gateway
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right font-mono">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Total Credits</div>
                    <div className="text-base font-bold text-amber-400">{sendResult.total_sms_units} Units</div>
                  </div>
                </div>
              </div>

              {/* Delivery KPI Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0E1522] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Target Recipients</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">{sendResult.recipient_count}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0E1522] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Delivered</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    {sendResult.delivered_count} <span className="text-xs text-slate-400 font-normal">({((sendResult.delivered_count / (sendResult.recipient_count || 1)) * 100).toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0E1522] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Pending Handset ACK</span>
                  <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">{sendResult.pending_count || 0}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0E1522] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Failed / Skipped</span>
                  <span className="text-xl font-bold font-mono text-slate-400 mt-1 block">{sendResult.failed_count || 0}</span>
                </div>
              </div>

              {/* Masked Recipients Delivery Breakdown Table */}
              <div className="bg-[#0E1522] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0F18]">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    Recipient Delivery Receipts (Masked)
                  </div>

                  <input
                    type="text"
                    placeholder="Search name, zone, or phone..."
                    value={resultFilterQuery}
                    onChange={(e) => setResultFilterQuery(e.target.value)}
                    className="px-3 py-1.5 bg-[#121B2B] border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-60"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                  {filteredDeliveries.map((item, idx) => (
                    <div key={idx} className="p-3 px-4 flex items-center justify-between text-xs hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[11px] font-mono">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.zone}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 font-mono">
                        <span className="text-slate-300 text-[11px]">{item.phone_masked}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'Delivered'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 hidden sm:inline">{item.delivered_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ── STICKY FOOTER ACTIONS ── */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#0C121E] flex items-center justify-between sticky bottom-0 z-30">
          {stage === 'compose' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!messageText.trim() || rosterData.valid_sms_recipients === 0}
                onClick={() => setStage('confirm')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer"
              >
                <span>Review & Dispatch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {stage === 'confirm' && (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStage('compose')}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
              >
                ← Back
              </button>
              <div className="text-[11px] text-slate-500 font-mono">
                Stage 2 of 2: Interlock Confirmation
              </div>
            </div>
          )}

          {stage === 'sending' && (
            <div className="w-full text-center text-xs text-slate-400 font-mono py-1">
              Gateway packet dispatch active. Please do not close window.
            </div>
          )}

          {stage === 'result' && (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStage('compose');
                  setMessageText('');
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Compose Another SMS
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer"
              >
                Done & Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
