import React, { useState, useMemo } from 'react';
import { 
  Settings, Sliders, Bell, Server, Radio, Check, 
  ShieldCheck, ShieldAlert, Users, Cpu, Database, Volume2, 
  Key, Globe, Search, Layers, RefreshCw, Save, RotateCcw, 
  Download, Upload, AlertTriangle, Activity, Zap, HardDrive, 
  MapPin, Gauge, Lock, UserPlus, Trash2, ChevronRight, 
  CheckCircle2, Info, SlidersHorizontal, Wifi, Shield, 
  ArrowUpRight, VolumeX, Eye, Terminal, Sparkles, FileSpreadsheet,
  Copy, CheckCheck, Phone, Send, MessageSquare, ExternalLink, X
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';
import { apiFetch, API_BASE, getApiKey, wsUrl } from '../../services/api';
import { INITIAL_CONFIG } from '../../services/initialConfig';

export { INITIAL_CONFIG };

// -------------------------------------------------------------
// 8-CATEGORY HIERARCHY
// -------------------------------------------------------------
const HIERARCHY = [
  {
    id: 'GENERAL',
    label: 'General',
    icon: Settings,
    desc: 'System identity & data preferences',
    subs: [
      { id: 'general-identity', label: 'System Identity' },
      { id: 'general-data', label: 'Data Configuration' },
      { id: 'general-monitoring', label: 'Monitoring Preferences' }
    ]
  },
  {
    id: 'SITE',
    label: 'Site & Mine',
    icon: MapPin,
    desc: 'Colliery details, zones & gateways',
    subs: [
      { id: 'site-mine-info', label: 'Mine Information' },
      { id: 'site-zones', label: 'Monitoring Zones' },
      { id: 'site-gateways', label: 'Gateway Configuration' }
    ]
  },
  {
    id: 'SENSORS',
    label: 'Sensors',
    icon: Cpu,
    desc: 'Sensor devices, health & calibration',
    subs: [
      { id: 'sensors-config', label: 'Sensor Configuration' },
      { id: 'sensors-health', label: 'Sensor Health' },
      { id: 'sensors-calibration', label: 'Calibration' }
    ]
  },
  {
    id: 'SAFETY',
    label: 'Safety',
    icon: ShieldAlert,
    desc: 'Hazard thresholds & evacuation rules',
    subs: [
      { id: 'safety-thresholds', label: 'Safety Thresholds' },
      { id: 'safety-risk-levels', label: 'Risk Levels' },
      { id: 'safety-evacuation', label: 'Evacuation Rules' }
    ]
  },
  {
    id: 'ALERTS',
    label: 'Alerts',
    icon: Bell,
    desc: 'Worker SMS alerts & audible siren controls',
    subs: [
      { id: 'alerts-notifications', label: 'Worker SMS Alert' },
      { id: 'alerts-audio', label: 'Audio Alarms' },
      { id: 'alerts-routing', label: 'Alert Routing' }
    ]
  },
  {
    id: 'AI_MODEL',
    label: 'AI Model',
    icon: Sparkles,
    desc: 'Predictive neural model & risk weights',
    subs: [
      { id: 'ai-prediction', label: 'Prediction Settings' },
      { id: 'ai-risk-scoring', label: 'Risk Scoring' },
      { id: 'ai-model-info', label: 'Model Information' }
    ]
  },
  {
    id: 'OPERATORS',
    label: 'Operators',
    icon: Users,
    desc: 'Users, roles & access permissions',
    subs: [
      { id: 'operators-users', label: 'Users' },
      { id: 'operators-roles', label: 'Roles' },
      { id: 'operators-permissions', label: 'Permissions' }
    ]
  },
  {
    id: 'SYSTEM',
    label: 'System',
    icon: Server,
    desc: 'Connection status, database & audit logs',
    subs: [
      { id: 'system-connectivity', label: 'Connectivity' },
      { id: 'system-api', label: 'API' },
      { id: 'system-database', label: 'Database' },
      { id: 'system-audit-logs', label: 'Audit Logs' }
    ]
  }
];

export default function SettingsView() {
  const { config, setConfig, soundEnabled, setSoundEnabled, sensors } = useMineData();
  const [activeCatId, setActiveCatId] = useState('ALERTS');
  const [activeSubId, setActiveSubId] = useState('alerts-notifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isModified, setIsModified] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Modal dialog states
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Control Room Operator');
  const [newUserPhone, setNewUserPhone] = useState('');

  const [showAddZone, setShowAddZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneRisk, setNewZoneRisk] = useState('LOW');
  const [newZoneCapacity, setNewZoneCapacity] = useState('30');
  const [newZoneRoute, setNewZoneRoute] = useState('');

  // Helper to update nested state cleanly
  const updateSetting = (path, val) => {
    setConfig(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let current = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = val;
      return copy;
    });
    setIsModified(true);
  };

  // Save Settings
  const handleSave = async () => {
    try {
      localStorage.setItem('coal_mine_simple_settings_v4', JSON.stringify(config));
      
      // Notify backend of archive setting changes and safety thresholds
      try {
        await apiFetch(`/api/settings/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Backend requires authentication for safety-threshold mutations
            'X-API-Key': config.system.api.apiKey
          },
          body: JSON.stringify({
            auto_archive: config.general.data.autoArchive,
            retention_days: config.general.data.retentionDays,
            safety_thresholds: config.safety.thresholds
          })
        });
      } catch (err) {
        console.error("Backend sync failed", err);
      }

      setIsModified(false);
      showToast('Settings & SMS recipients saved successfully!');
    } catch (e) {
      showToast('Error saving settings');
    }
  };

  // Reset to Defaults
  const handleReset = () => {
    if (window.confirm("Reset all settings back to default values?")) {
      setConfig(INITIAL_CONFIG);
      localStorage.setItem('coal_mine_simple_settings_v4', JSON.stringify(INITIAL_CONFIG));
      setIsModified(false);
      showToast('Reset to default settings');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Simple Worker SMS Alert State
  const [workerTarget, setWorkerTarget] = useState('ALL'); // 'ALL' | 'ZONE_B' | 'ZONE_A' | 'CUSTOM'
  const [workerPhones, setWorkerPhones] = useState([]); // operator enters recipients — no hardcoded personal numbers
  const [workerPhoneInput, setWorkerPhoneInput] = useState('');
  const [smsGateway, setSmsGateway] = useState('smsgate'); // 'fast2sms' | 'smsgate'
  // Gateway credentials are OPERATOR-SUPPLIED at runtime — the previously
  // hardcoded LAN gateway URL + password were removed (audit finding); the
  // backend reads SMS_GATEWAY_* / FAST2SMS_API_KEY from its environment.
  const [smsGatewayUrl, setSmsGatewayUrl] = useState('');
  const [smsGateUsername, setSmsGateUsername] = useState('');
  const [smsGatePassword, setSmsGatePassword] = useState('');
  const [workerMessage, setWorkerMessage] = useState(
    '[MINEGUARD AI] URGENT EVACUATION ALERT: Immediate mine evacuation ordered for underground personnel. Please move immediately to Muster Point Alpha via designated escape routes.'
  );
  const [workerAlertStatus, setWorkerAlertStatus] = useState(null);
  const [isSendingWorkerAlert, setIsSendingWorkerAlert] = useState(false);

  const ALERT_META = {
    zone: 'Sector B / Zone-B Highwall',
    muster_point: 'Muster Point Alpha',
    gas_type: 'CH4 (Methane)',
    gas_level: '2.8% vol',
    threshold: '1.25% vol',
    hazard_type: 'Accelerated strata convergence & high vibration',
    detected_value: '4.5 mm/h (Displacement)',
    trend: 'Increasing rapidly',
    risk_level: 'HIGH',
    previous_risk: 'CRITICAL',
    authorized_person: 'Shift In-Charge (G. Sharma)'
  };

  const buildTemplate = (tpl) => {
    const now = new Date();
    // Honest reference ID: timestamp-derived (no fabricated random suffix
    // presented as a real alert reference)
    const alertId = `TM-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    const timestamp = now.toLocaleString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST';
    return tpl
      .replace(/{{zone}}/g, ALERT_META.zone)
      .replace(/{{muster_point}}/g, ALERT_META.muster_point)
      .replace(/{{gas_type}}/g, ALERT_META.gas_type)
      .replace(/{{gas_level}}/g, ALERT_META.gas_level)
      .replace(/{{threshold}}/g, ALERT_META.threshold)
      .replace(/{{hazard_type}}/g, ALERT_META.hazard_type)
      .replace(/{{detected_value}}/g, ALERT_META.detected_value)
      .replace(/{{trend}}/g, ALERT_META.trend)
      .replace(/{{risk_level}}/g, ALERT_META.risk_level)
      .replace(/{{previous_risk}}/g, ALERT_META.previous_risk)
      .replace(/{{authorized_person}}/g, ALERT_META.authorized_person)
      .replace(/{{alert_id}}/g, alertId)
      .replace(/{{timestamp}}/g, timestamp);
  };

  const WORKER_PRESETS = [
    {
      id: 'EVACUATION',
      label: '🚨 Evacuate Now',
      priority: 'P0 CRITICAL',
      color: 'border-red-500/60 bg-red-950/40 text-red-300 hover:bg-red-900/60',
      rawTemplate:
`[TERRAMESH AI] 🚨 URGENT EVACUATION ALERT

ENGLISH:
CRITICAL SAFETY EVENT detected in {{zone}}.
Condition: {{hazard_type}}
Risk Level: CRITICAL
Detected Value: {{detected_value}}
Safe Limit: {{threshold}}
Immediate evacuation of all underground personnel is ORDERED.
Proceed immediately to {{muster_point}} using designated escape routes.
Do NOT stop in the affected zone. Do NOT re-enter until an official ALL CLEAR is issued.
Follow mine emergency procedures and instructions from authorized personnel.

TAMIL:
{{zone}} பகுதியில் மிக ஆபத்தான பாதுகாப்பு நிலை கண்டறியப்பட்டுள்ளது.
நிலைமை: {{hazard_type}}
அபாய நிலை: CRITICAL
கண்டறியப்பட்ட மதிப்பு: {{detected_value}}
பாதுகாப்பு வரம்பு: {{threshold}}
அனைத்து நிலத்தடி பணியாளர்களும் உடனடியாக வெளியேற வேண்டும்.
குறிக்கப்பட்ட பாதுகாப்பு வழியாக {{muster_point}} செல்லவும்.
பாதிக்கப்பட்ட பகுதியில் நிற்கவோ மீண்டும் நுழையவோ வேண்டாம்.
அதிகாரப்பூர்வ ALL CLEAR அறிவிப்பு வரும் வரை மீண்டும் நுழைய வேண்டாம்.
சுரங்க அவசரகால நடைமுறைகளையும் அதிகாரிகளின் அறிவுறுத்தல்களையும் பின்பற்றவும்.

HINDI:
{{zone}} में गंभीर सुरक्षा खतरा पाया गया है।
स्थिति: {{hazard_type}}
जोखिम स्तर: CRITICAL
पता चला मान: {{detected_value}}
सुरक्षित सीमा: {{threshold}}
सभी भूमिगत कर्मियों को तुरंत बाहर निकलने का आदेश दिया गया है।
निर्धारित सुरक्षित मार्ग से {{muster_point}} जाएँ।
प्रभावित क्षेत्र में न रुकें और दोबारा प्रवेश न करें।
आधिकारिक ALL CLEAR जारी होने तक वापस प्रवेश न करें।
खदान की आपातकालीन प्रक्रियाओं और अधिकृत अधिकारियों के निर्देशों का पालन करें।

Alert ID: {{alert_id}}
Zone: {{zone}}
Time: {{timestamp}}`
    },
    {
      id: 'STRATA',
      label: '⚠️ Strata Warning',
      priority: 'P1 WARNING',
      color: 'border-amber-500/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60',
      rawTemplate:
`[TERRAMESH AI] ⚠️ STRATEGIC WARNING

ENGLISH:
TerraMesh AI has detected abnormal conditions in {{zone}}.
Hazard: {{hazard_type}}
Risk Level: HIGH
Detected Value: {{detected_value}}
Safe Limit: {{threshold}}
Trend: {{trend}}
Personnel in or near the affected zone must remain alert.
Avoid unnecessary movement and activities in the affected area.
Follow supervisor instructions and remain prepared for possible evacuation.
Further instructions will be issued if the risk level increases.

TAMIL:
TerraMesh AI, {{zone}} பகுதியில் அசாதாரண நிலைமையை கண்டறிந்துள்ளது.
ஆபத்து: {{hazard_type}}
அபாய நிலை: HIGH
கண்டறியப்பட்ட மதிப்பு: {{detected_value}}
பாதுகாப்பு வரம்பு: {{threshold}}
நிலை மாற்றம்: {{trend}}
பாதிக்கப்பட்ட பகுதியில் அல்லது அதன் அருகில் உள்ள பணியாளர்கள் எச்சரிக்கையாக இருக்கவும்.
தேவையற்ற இயக்கம் மற்றும் செயல்பாடுகளைத் தவிர்க்கவும்.
மேற்பார்வையாளரின் அறிவுறுத்தல்களைப் பின்பற்றவும்.
தேவைப்பட்டால் உடனடி வெளியேற்றத்திற்கு தயாராக இருக்கவும்.
அபாய நிலை அதிகரித்தால் மேலும் அறிவிப்பு வழங்கப்படும்.

HINDI:
TerraMesh AI ने {{zone}} में असामान्य स्थिति का पता लगाया है।
खतरा: {{hazard_type}}
जोखिम स्तर: HIGH
पता चला मान: {{detected_value}}
सुरक्षित सीमा: {{threshold}}
रुझान: {{trend}}
प्रभावित क्षेत्र में या उसके पास मौजूद कर्मी सतर्क रहें।
अनावश्यक गतिविधियों और आवाजाही से बचें।
पर्यवेक्षक के निर्देशों का पालन करें।
आवश्यकता पड़ने पर तुरंत निकासी के लिए तैयार रहें।
जोखिम बढ़ने पर आगे की सूचना जारी की जाएगी।

Alert ID: {{alert_id}}
Time: {{timestamp}}`
    },
    {
      id: 'GAS',
      label: '🟡 Gas Caution',
      priority: 'P2 HAZARD',
      color: 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60',
      rawTemplate:
`[TERRAMESH AI] 🟡 GAS CAUTION ALERT

ENGLISH:
Abnormal gas concentration detected in {{zone}}.
Gas: {{gas_type}}
Detected Level: {{gas_level}}
Safe Limit: {{threshold}}
Risk Status: {{risk_level}}
Trend: {{trend}}
Avoid unnecessary entry into the affected zone.
Do not create flames, sparks or ignition sources.
Ensure ventilation and follow established mine gas-safety procedures.
Personnel must follow instructions from authorized mine supervisors.
If gas levels continue to rise, an evacuation alert may be issued.

TAMIL:
{{zone}} பகுதியில் அசாதாரண வாயு செறிவு கண்டறியப்பட்டுள்ளது.
வாயு: {{gas_type}}
கண்டறியப்பட்ட அளவு: {{gas_level}}
பாதுகாப்பு வரம்பு: {{threshold}}
அபாய நிலை: {{risk_level}}
நிலை மாற்றம்: {{trend}}
பாதிக்கப்பட்ட பகுதியில் தேவையற்ற நுழைவைத் தவிர்க்கவும்.
தீ, தீப்பொறி அல்லது பற்றவைப்பு ஏற்படுத்தும் செயல்களை செய்ய வேண்டாம்.
காற்றோட்டத்தை உறுதி செய்து சுரங்க வாயு பாதுகாப்பு நடைமுறைகளைப் பின்பற்றவும்.
அங்கீகரிக்கப்பட்ட சுரங்க மேற்பார்வையாளர்களின் அறிவுறுத்தல்களைப் பின்பற்றவும்.
வாயு அளவு தொடர்ந்து அதிகரித்தால் வெளியேற்ற எச்சரிக்கை வழங்கப்படலாம்.

HINDI:
{{zone}} में असामान्य गैस सांद्रता का पता चला है।
गैस: {{gas_type}}
पता चला स्तर: {{gas_level}}
सुरक्षित सीमा: {{threshold}}
जोखिम स्तर: {{risk_level}}
रुझान: {{trend}}
प्रभावित क्षेत्र में अनावश्यक प्रवेश से बचें।
आग, चिंगारी या किसी भी प्रज्वलन स्रोत का उपयोग न करें।
वेंटिलेशन सुनिश्चित करें और खदान की गैस-सुरक्षा प्रक्रियाओं का पालन करें।
अधिकृत खदान पर्यवेक्षकों के निर्देशों का पालन करें।
यदि गैस का स्तर बढ़ता रहता है, तो निकासी चेतावनी जारी की जा सकती है।

Alert ID: {{alert_id}}
Time: {{timestamp}}`
    },
    {
      id: 'ALL_CLEAR',
      label: '🟢 All Clear',
      priority: 'SAFE',
      color: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60',
      rawTemplate:
`[TERRAMESH AI] ✅ ALL CLEAR

ENGLISH:
The previous safety alert for {{zone}} has been assessed and the immediate hazard has been cleared.
Previous Hazard: {{hazard_type}}
Previous Risk Level: {{previous_risk}}
Current Status: SAFE / CLEARED
Cleared By: {{authorized_person}}
Clearance Time: {{timestamp}}
Normal operations may resume ONLY after authorization from responsible mine personnel.
Continue following standard mine safety procedures.
Remain alert for further TerraMesh AI notifications.

TAMIL:
{{zone}} பகுதியில் முன்னர் அறிவிக்கப்பட்ட பாதுகாப்பு எச்சரிக்கை மதிப்பீடு செய்யப்பட்டு, உடனடி ஆபத்து நீக்கப்பட்டுள்ளது.
முந்தைய ஆபத்து: {{hazard_type}}
முந்தைய அபாய நிலை: {{previous_risk}}
தற்போதைய நிலை: SAFE / CLEARED
அனுமதி வழங்கியவர்: {{authorized_person}}
அனுமதி நேரம்: {{timestamp}}
பொறுப்பான சுரங்க அதிகாரிகளின் அனுமதி கிடைத்த பின்னரே வழக்கமான பணிகளைத் தொடங்கவும்.
வழக்கமான சுரங்க பாதுகாப்பு நடைமுறைகளை தொடர்ந்து பின்பற்றவும்.
TerraMesh AI வழங்கும் அடுத்தடுத்த அறிவிப்புகளைக் கவனிக்கவும்.

HINDI:
{{zone}} में पहले जारी की गई सुरक्षा चेतावनी का आकलन किया गया है और तत्काल खतरा समाप्त हो गया है।
पिछला खतरा: {{hazard_type}}
पिछला जोखिम स्तर: {{previous_risk}}
वर्तमान स्थिति: SAFE / CLEARED
अनुमति देने वाले अधिकारी: {{authorized_person}}
क्लीयरेंस समय: {{timestamp}}
जिम्मेदार खदान अधिकारियों की अनुमति के बाद ही सामान्य कार्य शुरू करें।
सामान्य खदान सुरक्षा प्रक्रियाओं का पालन जारी रखें।
TerraMesh AI की आगे की सूचनाओं पर ध्यान दें।

Alert ID: {{alert_id}}
Time: {{timestamp}}`
    }
  ].map(p => ({ ...p, text: buildTemplate(p.rawTemplate) }));


  const handleSendWorkerAlert = async () => {
    setIsSendingWorkerAlert(true);
    const targetLabel = workerTarget === 'ALL' 
      ? 'All Underground Workers (126 Personnel)' 
      : workerTarget === 'ZONE_B' 
      ? 'Zone B At-Risk Crew (12 Personnel)' 
      : workerTarget === 'ZONE_A'
      ? 'Zone A Highwall Crew (18 Personnel)'
      : `${workerPhones.length} Recipients`;

    if (workerPhones.length === 0) {
      showToast('❌ No recipients added', 'error');
      return;
    }

    try {
      setIsSendingWorkerAlert(true);
      for (const phone of workerPhones) {
        const digits = phone.replace(/[^0-9]/g, '');
        const localNumber = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits;
        const formattedPhone = `+91${localNumber}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch('/api/alerts/send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': getApiKey()
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message: workerMessage,
            gateway: smsGateway,
            smsgate_url: smsGatewayUrl,
            api_key: smsGateway === 'smsgate' && smsGateUsername ? btoa(`${smsGateUsername}:${smsGatePassword}`) : ''
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        if (data.status === 'failed' || data.status === 'gateway_failed') {
          throw new Error(data.api_error || 'Gateway failed');
        }
      }

      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setWorkerAlertStatus({
        success: true,
        target: targetLabel,
        phone: workerPhones.join(', '),
        time: timeStr,
        // Honest dispatch reference: the backend's reported status/time —
        // no fabricated random transaction IDs
        txId: data.status || 'dispatched'
      });
      showToast(`✅ SMS Alert sent to ${workerPhones.length} recipients`);
    } catch (err) {
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setWorkerAlertStatus({
        success: false,
        target: targetLabel,
        phone: workerPhones.join(', '),
        time: timeStr,
        txId: `ERR-NETWORK`,
        errorMsg: err.message
      });
      showToast(`❌ SMS Alert Failed: ${err.message}`, 'error');
    } finally {
      setIsSendingWorkerAlert(false);
    }

    // Play quick audible notification chime
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  };

  // Audio test
  const handleTestAudio = () => {
    setIsPlayingAudio(true);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime((config.alerts.audio.volume / 100) * 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      }
    } catch (e) {}
    setTimeout(() => setIsPlayingAudio(false), 1300);
  };

  // Auto calibrate test
  const handleAutoCalibrate = async () => {
    setIsCalibrating(true);
    try {
      const res = await apiFetch(`/api/settings/calibrate`, {
        method: 'POST',
        headers: { 'X-API-Key': config.system.api.apiKey }
      });
      if (res.ok) {
        updateSetting('sensors.calibration.lastDate', new Date().toISOString().slice(0, 10));
        showToast('Sensors successfully zero-calibrated!');
      } else {
        showToast('Calibration failed');
      }
    } catch (e) {
      showToast('Network error during calibration');
    } finally {
      setIsCalibrating(false);
    }
  };

  // Retrain AI test
  const handleRetrainAI = async () => {
    setIsRetraining(true);
    try {
      const res = await apiFetch(`/api/ml/retrain`, {
        method: 'POST',
        headers: { 'X-API-Key': config.system.api.apiKey }
      });
      if (res.ok) {
        updateSetting('aiModel.modelInfo.lastTrained', new Date().toISOString().slice(0, 10));
        showToast('AI Model retrained with latest strata data!');
      } else {
        showToast('AI Model retraining failed');
      }
    } catch (e) {
      showToast('Network error during retraining');
    } finally {
      setIsRetraining(false);
    }
  };

  // Add User
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const userObj = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      name: newUserName,
      role: newUserRole,
      shift: 'Shift A',
      phone: newUserPhone || '+91 7010886232',
      active: true
    };
    setConfig(prev => ({
      ...prev,
      operators: {
        ...prev.operators,
        users: [...prev.operators.users, userObj]
      }
    }));
    setIsModified(true);
    setShowAddUser(false);
    setNewUserName('');
    setNewUserPhone('');
    showToast('Operator added to roster');
  };

  // Delete User
  const handleDeleteUser = (id) => {
    setConfig(prev => ({
      ...prev,
      operators: {
        ...prev.operators,
        users: prev.operators.users.filter(u => u.id !== id)
      }
    }));
    setIsModified(true);
    showToast('Operator removed');
  };

  // Add Zone
  const handleAddZoneSubmit = (e) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    const zoneObj = {
      id: `ZN-0${config.site.zones.length + 1}`,
      name: newZoneName,
      riskLevel: newZoneRisk,
      capacity: Number(newZoneCapacity) || 30,
      workers: 0,
      route: newZoneRoute || 'Main Portal'
    };
    setConfig(prev => ({
      ...prev,
      site: {
        ...prev.site,
        zones: [...prev.site.zones, zoneObj]
      }
    }));
    setIsModified(true);
    setShowAddZone(false);
    setNewZoneName('');
    setNewZoneRoute('');
    showToast('Monitoring Zone added');
  };

  // Delete Zone
  const handleDeleteZone = (id) => {
    setConfig(prev => ({
      ...prev,
      site: {
        ...prev.site,
        zones: prev.site.zones.filter(z => z.id !== id)
      }
    }));
    setIsModified(true);
    showToast('Zone removed');
  };

  // Active Category Object
  const currentCategory = HIERARCHY.find(c => c.id === activeCatId) || HIERARCHY[0];

  // Filtered Hierarchy for Search
  const displayHierarchy = useMemo(() => {
    if (!searchQuery.trim()) return HIERARCHY;
    const q = searchQuery.toLowerCase();
    return HIERARCHY.filter(cat => 
      cat.label.toLowerCase().includes(q) || 
      cat.desc.toLowerCase().includes(q) ||
      cat.subs.some(s => s.label.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // AI Weight Total
  const aiWeightSum = (
    Number(config.aiModel.riskScoring.tiltWeight || 0) +
    Number(config.aiModel.riskScoring.extensometerWeight || 0) +
    Number(config.aiModel.riskScoring.porePressureWeight || 0) +
    Number(config.aiModel.riskScoring.seismicWeight || 0) +
    Number(config.aiModel.riskScoring.gasWeight || 0)
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 font-sans text-[#F8FAFC]">
      
      {/* -------------------------------------------------------------
          TOP BAR: CLEAN TITLE, QUICK SEARCH, SAVE ACTIONS
      ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111827] border border-slate-800 p-4 rounded-2xl shadow-lg">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                Mine System Settings
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                SMS: +91 7010886232 Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configure safety limits, sensors, SMS alert recipients, operators and system parameters
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quick search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-60 bg-[#162235] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-[#162235] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
            title="Restore default settings"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
              isModified
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isModified ? 'Save Changes *' : 'Save Settings'}</span>
          </button>
        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* -------------------------------------------------------------
          MAIN 2-COLUMN LAYOUT: CATEGORY LIST & SETTINGS CARDS
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: 8 SIMPLE CATEGORY TABS */}
        <div className="md:col-span-4 lg:col-span-3 space-y-1.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
            Categories
          </div>

          <div className="space-y-1">
            {displayHierarchy.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCatId === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCatId(cat.id);
                    setActiveSubId(cat.subs[0].id);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-md'
                      : 'bg-[#111827] border-slate-800/80 text-slate-300 hover:bg-[#162235] hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-cyan-500 text-slate-950' : 'bg-[#162235] text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                      <span>{cat.label}</span>
                      {cat.id === 'ALERTS' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="SMS configured" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{cat.desc}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SUB-TABS & CONTENT */}
        <div className="md:col-span-8 lg:col-span-9 space-y-3">
          
          {/* Sub-Navigation Pills */}
          <div className="flex flex-wrap gap-1.5 bg-[#111827] p-1.5 rounded-xl border border-slate-800">
            {currentCategory.subs.map((sub) => {
              const isSubActive = activeSubId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubId(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSubActive
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-[#162235]'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>

          {/* Settings Content Container */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            
            {/* =========================================================
                1. GENERAL
            ========================================================= */}
            {activeSubId === 'general-identity' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">System Identity</h2>
                  <p className="text-xs text-slate-400">Basic identification details for this mine site and command station.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Mine / Colliery Name</label>
                    <input
                      type="text"
                      value={config.general.identity.mineName}
                      onChange={(e) => updateSetting('general.identity.mineName', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white text-xs outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Facility Code</label>
                    <input
                      type="text"
                      value={config.general.identity.facilityCode}
                      onChange={(e) => updateSetting('general.identity.facilityCode', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium flex justify-between items-center">
                      Current Operating Shift
                      <span className="text-[10px] bg-cyan-900/40 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/50">Auto-Synced</span>
                    </label>
                    <div className="w-full px-3 py-2 rounded-xl bg-[#162235]/50 border border-slate-700/50 text-slate-300 text-xs cursor-not-allowed">
                      {config.general.identity.operatingShift}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Primary Emergency Hotline</label>
                    <input
                      type="text"
                      value={config.general.identity.hotline}
                      onChange={(e) => updateSetting('general.identity.hotline', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-emerald-400 font-semibold text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSubId === 'general-data' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Data Configuration</h2>
                  <p className="text-xs text-slate-400">Manage telemetry data update rates and historical retention.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">Data Update Rate</span>
                      <span className="text-cyan-400 font-bold">{config.general.data.pollingInterval} second(s)</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={config.general.data.pollingInterval}
                      onChange={(e) => updateSetting('general.data.pollingInterval', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1s (Real-time)</span>
                      <span>5s (Slow)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">Data Storage History</span>
                      <span className="text-cyan-400 font-bold">{config.general.data.retentionDays} Days</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="365"
                      step="30"
                      value={config.general.data.retentionDays}
                      onChange={(e) => updateSetting('general.data.retentionDays', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>30 Days</span>
                      <span>365 Days</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Auto-Archive Daily Telemetry</div>
                    <div className="text-[11px] text-slate-400">Automatically backup daily readings to storage at midnight</div>
                  </div>
                  <button
                    onClick={() => updateSetting('general.data.autoArchive', !config.general.data.autoArchive)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      config.general.data.autoArchive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.general.data.autoArchive ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {activeSubId === 'general-monitoring' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Monitoring Preferences</h2>
                  <p className="text-xs text-slate-400">Customize how live maps and screens behave.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Auto-Focus Map on Triggered Alerts</div>
                      <div className="text-[11px] text-slate-400">Automatically zooms to the sensor or zone when a hazard occurs</div>
                    </div>
                    <button
                      onClick={() => updateSetting('general.monitoring.autoCenterOnAlert', !config.general.monitoring.autoCenterOnAlert)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        config.general.monitoring.autoCenterOnAlert ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {config.general.monitoring.autoCenterOnAlert ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Low-Bandwidth Mode</div>
                      <div className="text-[11px] text-slate-400">Optimizes screen updates for weak underground wireless connections</div>
                    </div>
                    <button
                      onClick={() => updateSetting('general.monitoring.lowBandwidthMode', !config.general.monitoring.lowBandwidthMode)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        config.general.monitoring.lowBandwidthMode ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {config.general.monitoring.lowBandwidthMode ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                2. SITE & MINE
            ========================================================= */}
            {activeSubId === 'site-mine-info' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Mine Information</h2>
                  <p className="text-xs text-slate-400">Geological depth, coordinates, and certified statutory officers.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Facility Full Name</label>
                    <input
                      type="text"
                      value={config.site.mineInfo.facilityName}
                      onChange={(e) => updateSetting('site.mineInfo.facilityName', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white text-xs outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Max Seam Depth (Meters)</label>
                    <input
                      type="number"
                      value={config.site.mineInfo.seamDepth}
                      onChange={(e) => updateSetting('site.mineInfo.seamDepth', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-cyan-400 font-bold text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Mine Manager</label>
                    <input
                      type="text"
                      value={config.site.mineInfo.mineManager}
                      onChange={(e) => updateSetting('site.mineInfo.mineManager', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white text-xs outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Chief Safety Officer</label>
                    <input
                      type="text"
                      value={config.site.mineInfo.safetyOfficer}
                      onChange={(e) => updateSetting('site.mineInfo.safetyOfficer', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSubId === 'site-zones' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white">Monitoring Zones</h2>
                    <p className="text-xs text-slate-400">Underground mining sectors, maximum capacity, and evacuation paths.</p>
                  </div>
                  <button
                    onClick={() => setShowAddZone(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    + Add Zone
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.site.zones.map((zone) => (
                    <div key={zone.id} className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-white">{zone.name}</div>
                          <div className="text-[10px] text-slate-400">{zone.id} • Max {zone.capacity} Miners</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          zone.riskLevel === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                          zone.riskLevel === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                          zone.riskLevel === 'ELEVATED' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {zone.riskLevel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 flex justify-between items-center pt-1 border-t border-slate-800">
                        <span>Exit: {zone.route}</span>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="text-slate-400 hover:text-red-400 cursor-pointer p-1"
                          title="Remove Zone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubId === 'site-gateways' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Gateway Configuration</h2>
                  <p className="text-xs text-slate-400">Wireless LoRa gateways communicating with underground sensors.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {config.site.gateways.map((gw) => {
                    // Dynamically calculate stats based on live sensors
                    let connectedSensors = [];
                    if (gw.id === 'GW-01') {
                      connectedSensors = sensors.filter(s => s.zone === 'Zone A');
                    } else if (gw.id === 'GW-02') {
                      connectedSensors = sensors.filter(s => s.zone === 'Zone B' || s.zone === 'Zone C');
                    } else if (gw.id === 'GW-03') {
                      connectedSensors = sensors.filter(s => s.zone === 'Zone D');
                    }
                    
                    const nodesCount = connectedSensors.length;
                    let signalStr = "Offline";
                    let dotColor = "bg-red-500";
                    let pulseClass = "";
                    
                    if (nodesCount > 0) {
                      const avgSignalPct = connectedSensors.reduce((sum, s) => sum + (s.lora_signal || 0), 0) / nodesCount;
                      const dbm = Math.round(-120 + (avgSignalPct / 100) * 70); // Rough pct to dBm conversion
                      
                      let qualitative = "Fair";
                      if (avgSignalPct > 80) qualitative = "Strong";
                      else if (avgSignalPct > 50) qualitative = "Good";
                      else if (avgSignalPct < 30) qualitative = "Weak";
                      
                      signalStr = `${qualitative} (${dbm} dBm)`;
                      dotColor = "bg-emerald-400";
                      pulseClass = "animate-pulse";
                    }
                    
                    return (
                      <div key={gw.id} className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">{gw.name}</span>
                          <span className={`w-2 h-2 rounded-full ${dotColor} ${pulseClass}`} />
                        </div>
                        <div className="text-xs text-cyan-400 font-mono">{gw.frequency}</div>
                        <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                          <div>Signal: <span className="text-slate-200 font-semibold">{signalStr}</span></div>
                          <div>Connected: <span className="text-slate-200 font-semibold">{nodesCount} Sensors</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                3. SENSORS
            ========================================================= */}
            {activeSubId === 'sensors-config' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Sensor Configuration</h2>
                  <p className="text-xs text-slate-400">Registered sensor nodes, assigned zones, and sampling rates.</p>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[400px] pr-2">
                  <table className="w-full text-left text-xs relative">
                    <thead className="sticky top-0 bg-[#0B0F17] z-10">
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">SENSOR NAME</th>
                        <th className="pb-2">TYPE</th>
                        <th className="pb-2">ZONE</th>
                        <th className="pb-2">RATE</th>
                        <th className="pb-2">BATTERY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {sensors.map((s) => (
                        <tr key={s.id} className="hover:bg-[#162235]/40">
                          <td className="py-2.5 font-sans font-semibold text-white">{s.name}</td>
                          <td className="py-2.5 text-cyan-400">{s.type}</td>
                          <td className="py-2.5 text-slate-300 font-sans">{s.zone}</td>
                          <td className="py-2.5 text-slate-300">{s.sampling_interval}</td>
                          <td className="py-2.5">
                            <span className={`font-bold ${s.battery > 80 ? 'text-emerald-400' : s.battery > 20 ? 'text-amber-400' : 'text-red-500'}`}>
                              {s.battery}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSubId === 'sensors-health' && (() => {
              const healthyCount = sensors.filter(s => s.status === 'SAFE').length;
              const warningCount = sensors.filter(s => ['WARNING', 'CAUTION', 'CRITICAL'].includes(s.status)).length;
              const offlineCount = sensors.filter(s => s.status === 'OFFLINE').length;

              return (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-white">Sensor Health</h2>
                    <p className="text-xs text-slate-400">Monitor sensor network uptime and automatic failure protection.</p>
                  </div>
  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800">
                      <div className="text-lg font-bold text-emerald-400">{healthyCount}</div>
                      <div className="text-[11px] text-slate-300">Healthy Nodes</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800">
                      <div className="text-lg font-bold text-amber-400">{warningCount}</div>
                      <div className="text-[11px] text-slate-300">Warning State</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700">
                      <div className="text-lg font-bold text-slate-400">{offlineCount}</div>
                      <div className="text-[11px] text-slate-300">Offline</div>
                    </div>
                  </div>

                <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Auto-Isolate Faulty Sensors</div>
                    <div className="text-[11px] text-slate-400">Ignore corrupted data so it doesn't trigger false alarms</div>
                  </div>
                  <button
                    onClick={() => updateSetting('sensors.health.autoIsolate', !config.sensors.health.autoIsolate)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      config.sensors.health.autoIsolate ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.sensors.health.autoIsolate ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            );
          })()}

            {activeSubId === 'sensors-calibration' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Sensor Calibration</h2>
                  <p className="text-xs text-slate-400">Zero-point tare adjustment and automated calibration testing.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Tiltmeter Zero-Offset (°)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.sensors.calibration.tiltZeroOffset}
                      onChange={(e) => updateSetting('sensors.calibration.tiltZeroOffset', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-cyan-400 font-mono text-xs outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Last Calibration Date</label>
                    <input
                      type="text"
                      disabled
                      value={config.sensors.calibration.lastDate}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-slate-400 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Execute Zero-Calibration Routine</div>
                    <div className="text-[11px] text-slate-400">Calibrates in-pit inclinometers to exact zero baseline</div>
                  </div>
                  <button
                    onClick={handleAutoCalibrate}
                    disabled={isCalibrating}
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
                    <span>{isCalibrating ? 'Calibrating...' : 'Calibrate Now'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                4. SAFETY
            ========================================================= */}
            {activeSubId === 'safety-thresholds' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Safety Thresholds</h2>
                  <p className="text-xs text-slate-400">Critical trigger limits for slope tilt, ground movement, and gas hazard.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tilt Slider */}
                  <div className="p-4 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">Critical Tilt Limit</span>
                      <span className="text-cyan-400 font-bold font-mono text-sm">{config.safety.thresholds.tiltCritical}°</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={config.safety.thresholds.tiltCritical}
                      onChange={(e) => updateSetting('safety.thresholds.tiltCritical', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1.0° (Strict)</span>
                      <span>5.0° (Critical)</span>
                    </div>
                  </div>

                  {/* Displacement Slider */}
                  <div className="p-4 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">Max Ground Movement</span>
                      <span className="text-red-400 font-bold font-mono text-sm">{config.safety.thresholds.dispCritical} mm/day</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="8.0"
                      step="0.2"
                      value={config.safety.thresholds.dispCritical}
                      onChange={(e) => updateSetting('safety.thresholds.dispCritical', Number(e.target.value))}
                      className="w-full accent-red-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1.0 mm/day</span>
                      <span>8.0 mm/day</span>
                    </div>
                  </div>

                  {/* Pore Pressure */}
                  <div className="p-4 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">Water Pressure Limit</span>
                      <span className="text-cyan-400 font-bold font-mono text-sm">{config.safety.thresholds.porePressureLimit} kPa</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="400"
                      step="10"
                      value={config.safety.thresholds.porePressureLimit}
                      onChange={(e) => updateSetting('safety.thresholds.porePressureLimit', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>100 kPa</span>
                      <span>400 kPa</span>
                    </div>
                  </div>

                  {/* Methane CH4 */}
                  <div className="p-4 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">Methane (CH4) Trip Limit</span>
                      <span className="text-amber-400 font-bold font-mono text-sm">{config.safety.thresholds.ch4TripLimit}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={config.safety.thresholds.ch4TripLimit}
                      onChange={(e) => updateSetting('safety.thresholds.ch4TripLimit', Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0.5% (Warning)</span>
                      <span>1.25% (Engineering Cutoff)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubId === 'safety-risk-levels' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Risk Levels</h2>
                  <p className="text-xs text-slate-400">Index brackets used to categorize real-time slope hazard.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono text-xs">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800">
                    <div className="text-emerald-400 font-bold">NORMAL</div>
                    <div className="text-white font-bold mt-1">0 — {config.safety.riskLevels.normalMax}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800">
                    <div className="text-amber-400 font-bold">ELEVATED</div>
                    <div className="text-white font-bold mt-1">{config.safety.riskLevels.normalMax + 1} — {config.safety.riskLevels.elevatedMax}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-800">
                    <div className="text-orange-400 font-bold">WARNING</div>
                    <div className="text-white font-bold mt-1">{config.safety.riskLevels.elevatedMax + 1} — {config.safety.riskLevels.warningMax}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800">
                    <div className="text-red-400 font-bold">CRITICAL</div>
                    <div className="text-white font-bold mt-1">{config.safety.riskLevels.warningMax + 1} — 100</div>
                  </div>
                </div>
              </div>
            )}

            {activeSubId === 'safety-evacuation' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Evacuation Rules</h2>
                  <p className="text-xs text-slate-400">Automatic evacuation triggers and designated muster points.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Auto-Trigger Siren on Critical Breach</div>
                      <div className="text-[11px] text-slate-400">Sounds alarm when slope tilt exceeds critical safety limit</div>
                    </div>
                    <button
                      onClick={() => updateSetting('safety.evacuation.autoEvacuate', !config.safety.evacuation.autoEvacuate)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        config.safety.evacuation.autoEvacuate ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {config.safety.evacuation.autoEvacuate ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Activate LED Escape Path Strobes</div>
                      <div className="text-[11px] text-slate-400">Illuminates underground evacuation route with flashing lights</div>
                    </div>
                    <button
                      onClick={() => updateSetting('safety.evacuation.strobeLights', !config.safety.evacuation.strobeLights)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        config.safety.evacuation.strobeLights ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {config.safety.evacuation.strobeLights ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Primary Surface Muster Point</label>
                    <input
                      type="text"
                      value={config.safety.evacuation.primaryMuster}
                      onChange={(e) => updateSetting('safety.evacuation.primaryMuster', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-emerald-400 font-semibold text-xs outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Secondary Alternate Muster Point</label>
                    <input
                      type="text"
                      value={config.safety.evacuation.secondaryMuster}
                      onChange={(e) => updateSetting('safety.evacuation.secondaryMuster', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                5. ALERTS (WORKER SMS EMERGENCY ALERT DISPATCH)
            ========================================================= */}
            {activeSubId === 'alerts-notifications' && (
              <div className="space-y-4 font-sans">
                {/* 6. Channel Notification Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-white block">SMS Cellular</span>
                      <span className="text-[10px] text-slate-400">GSM Network</span>
                    </div>
                    <button
                      onClick={() => updateSetting('alerts.notifications.smsEnabled', !config.alerts.notifications.smsEnabled)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${config.alerts.notifications.smsEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {config.alerts.notifications.smsEnabled ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-white block">LoRa Pagers</span>
                      <span className="text-[10px] text-slate-400">868MHz Mesh</span>
                    </div>
                    <button
                      onClick={() => updateSetting('alerts.notifications.pagerEnabled', !config.alerts.notifications.pagerEnabled)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${config.alerts.notifications.pagerEnabled ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {config.alerts.notifications.pagerEnabled ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-white block">Siren Sync</span>
                      <span className="text-[10px] text-slate-400">880Hz Audio</span>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${soundEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {soundEnabled ? 'ACTIVE' : 'MUTED'}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-white block">VHF Radio</span>
                      <span className="text-[10px] text-slate-400">Channel 04 Auto</span>
                    </div>
                    <button
                      onClick={() => updateSetting('alerts.notifications.radioEnabled', !config.alerts.notifications.radioEnabled)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${config.alerts.notifications.radioEnabled ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {config.alerts.notifications.radioEnabled ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {activeSubId === 'alerts-audio' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Audio Alarms</h2>
                  <p className="text-xs text-slate-400">Synthesized 880Hz industrial siren volume and browser testing.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">Siren Master Volume</span>
                      <span className="text-cyan-400 font-bold">{config.alerts.audio.volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={config.alerts.audio.volume}
                      onChange={(e) => updateSetting('alerts.audio.volume', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">Siren Auto-Silence Timeout</span>
                      <span className="text-red-400 font-bold">{config.alerts.audio.sirenDuration}s</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={config.alerts.audio.sirenDuration}
                      onChange={(e) => updateSetting('alerts.audio.sirenDuration', Number(e.target.value))}
                      className="w-full accent-red-500"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Test 880Hz Siren Tone</div>
                    <div className="text-[11px] text-slate-400">Play a quick audible tone to verify command room speakers</div>
                  </div>
                  <button
                    onClick={handleTestAudio}
                    disabled={isPlayingAudio}
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                    <span>{isPlayingAudio ? 'Playing...' : 'Play Test Sound'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeSubId === 'alerts-routing' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Alert Routing</h2>
                  <p className="text-xs text-slate-400">Summary of who receives notifications based on alert severity.</p>
                </div>

                <div className="space-y-2">
                  {config.alerts.routing.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                          r.severity === 'WARNING' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {r.severity}
                        </span>
                        <div>
                          <div className="font-semibold text-white">{r.notify}</div>
                          <div className="text-[10px] text-slate-400">Via: {r.via}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =========================================================
                6. AI MODEL
            ========================================================= */}
            {activeSubId === 'ai-prediction' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">AI Prediction Settings</h2>
                  <p className="text-xs text-slate-400">Forecast lookahead horizon and model sensitivity.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Forecast Lead Time</label>
                    <select
                      value={config.aiModel.prediction.leadTimeHours}
                      onChange={(e) => updateSetting('aiModel.prediction.leadTimeHours', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white text-xs outline-none focus:border-cyan-500"
                    >
                      <option value={1}>1 Hour (Immediate)</option>
                      <option value={3}>3 Hours (Short Term)</option>
                      <option value={6}>6 Hours (Standard)</option>
                      <option value={12}>12 Hours (Long Horizon)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Minimum Confidence Cutoff</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="50"
                        max="99"
                        value={config.aiModel.prediction.confidenceMin}
                        onChange={(e) => updateSetting('aiModel.prediction.confidenceMin', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-cyan-400 font-bold font-mono text-xs outline-none focus:border-cyan-500"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubId === 'ai-risk-scoring' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-white">Risk Scoring Weights</h2>
                    <p className="text-xs text-slate-400">Balance the influence of each sensor type on the total risk score.</p>
                  </div>
                  <div className="text-xs font-mono">
                    Total: <span className={`font-bold ${aiWeightSum === 100 ? 'text-emerald-400' : 'text-red-400'}`}>{aiWeightSum}%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>1. Inclinometer Tilt Rate</span>
                      <span className="text-cyan-400 font-bold">{config.aiModel.riskScoring.tiltWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={config.aiModel.riskScoring.tiltWeight}
                      onChange={(e) => updateSetting('aiModel.riskScoring.tiltWeight', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>2. Extensometer Ground Strain</span>
                      <span className="text-cyan-400 font-bold">{config.aiModel.riskScoring.extensometerWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={config.aiModel.riskScoring.extensometerWeight}
                      onChange={(e) => updateSetting('aiModel.riskScoring.extensometerWeight', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>3. Pore Water Pressure</span>
                      <span className="text-cyan-400 font-bold">{config.aiModel.riskScoring.porePressureWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      value={config.aiModel.riskScoring.porePressureWeight}
                      onChange={(e) => updateSetting('aiModel.riskScoring.porePressureWeight', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSubId === 'ai-model-info' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">AI Model Information</h2>
                  <p className="text-xs text-slate-400">Current neural model version and accuracy benchmarks.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-[#162235] border border-slate-700">
                    <div className="text-slate-400 text-[10px]">ACCURACY</div>
                    <div className="text-emerald-400 font-bold text-lg mt-0.5">{config.aiModel.modelInfo.accuracy}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#162235] border border-slate-700">
                    <div className="text-slate-400 text-[10px]">WEIGHTS VERSION</div>
                    <div className="text-white font-bold text-sm mt-0.5">{config.aiModel.modelInfo.version}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Retrain AI Neural Weights</div>
                    <div className="text-[11px] text-slate-400">Last updated: {config.aiModel.modelInfo.lastTrained}</div>
                  </div>
                  <button
                    onClick={handleRetrainAI}
                    disabled={isRetraining}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
                    <span>{isRetraining ? 'Retraining...' : 'Retrain AI'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                7. OPERATORS
            ========================================================= */}
            {activeSubId === 'operators-users' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-white">Operator Roster</h2>
                    <p className="text-xs text-slate-400">Personnel authorized to access the mine monitoring platform.</p>
                  </div>
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    + Add User
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.operators.users.map((u) => (
                    <div key={u.id} className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.phone.includes('7010886232') && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-cyan-400">{u.role}</div>
                        <div className="text-[10px] text-slate-300 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{u.phone}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-slate-400 hover:text-red-400 cursor-pointer p-1"
                        title="Remove user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubId === 'operators-roles' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Roles & Hierarchy</h2>
                  <p className="text-xs text-slate-400">Predefined role specifications for mine safety management.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.operators.roles.map((r, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 space-y-1">
                      <div className="text-xs font-bold text-white">{r.name}</div>
                      <div className="text-[11px] text-slate-400">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubId === 'operators-permissions' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Action Permissions</h2>
                  <p className="text-xs text-slate-400">Privileges granted to each role.</p>
                </div>

                <div className="space-y-2">
                  {config.operators.permissions.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#162235] border border-slate-700 flex justify-between items-center text-xs">
                      <span className="font-semibold text-white">{p.action}</span>
                      <span className="text-[11px] text-cyan-400 font-mono">{p.roles}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =========================================================
                8. SYSTEM
            ========================================================= */}
            {activeSubId === 'system-connectivity' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Connectivity Status</h2>
                  <p className="text-xs text-slate-400">Live health of backend API servers and streaming services.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 space-y-1">
                    <div className="text-[10px] text-slate-400">BACKEND REST API</div>
                    <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      CONNECTED
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 space-y-1">
                    <div className="text-[10px] text-slate-400">ROUND-TRIP LATENCY</div>
                    <div className="text-cyan-400 font-mono font-bold text-xs">{config.system.connectivity.latency} ms</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#162235] border border-slate-700 text-xs font-mono text-slate-300">
                  URL: {config.system.connectivity.backendUrl}
                </div>
              </div>
            )}

            {activeSubId === 'system-api' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">API & Integrations</h2>
                  <p className="text-xs text-slate-400">Access credentials and webhook settings for external SCADA systems.</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">API Secret Key</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={config.system.api.apiKey}
                        className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-cyan-400 font-mono text-xs"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(config.system.api.apiKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="px-3 py-2 rounded-xl bg-[#162235] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                      >
                        {copiedKey ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">External Webhook URL</label>
                    <input
                      type="text"
                      value={config.system.api.webhookUrl}
                      onChange={(e) => updateSetting('system.api.webhookUrl', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white font-mono text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSubId === 'system-database' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Database Status</h2>
                  <p className="text-xs text-slate-400">Telemetry storage capacity and maintenance options.</p>
                </div>

                <div className="p-4 rounded-xl bg-[#162235] border border-slate-700 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">Disk Storage Space</span>
                    <span className="text-cyan-400 font-mono font-bold">{config.system.database.usedMb} MB / {config.system.database.totalMb} MB</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${(config.system.database.usedMb / config.system.database.totalMb) * 100}%` }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#162235] border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Database Optimization</div>
                    <div className="text-[11px] text-slate-400">Last cleaned: {config.system.database.lastCleaned}</div>
                  </div>
                  <button
                    onClick={() => showToast('Database index optimized successfully')}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs cursor-pointer"
                  >
                    Optimize Now
                  </button>
                </div>
              </div>
            )}

            {activeSubId === 'system-audit-logs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-white">Audit Trail Logs</h2>
                    <p className="text-xs text-slate-400">Recent user modifications and parameter updates.</p>
                  </div>
                  <button
                    onClick={() => {
                      const csv = "ID,Time,User,Detail,Type\n" + config.system.auditLogs.map(l => `"${l.id}","${l.time}","${l.user}","${l.detail}","${l.type}"`).join("\n");
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `mine_audit_${new Date().toISOString().slice(0, 10)}.csv`;
                      a.click();
                      showToast('Audit log CSV exported');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#162235] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download CSV</span>
                  </button>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {config.system.auditLogs.map((l) => (
                    <div key={l.id} className="p-3 rounded-xl bg-[#162235] border border-slate-700 flex justify-between items-center">
                      <div>
                        <span className="text-cyan-400 font-bold mr-2">{l.time}</span>
                        <span className="text-white font-sans font-semibold mr-2">{l.user}:</span>
                        <span className="text-slate-300 font-sans">{l.detail}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                        {l.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* -------------------------------------------------------------
          MODAL: ADD OPERATOR
      ------------------------------------------------------------- */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111827] border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">Add New Operator</h3>
              <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Assigned Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white outline-none focus:border-cyan-500"
                >
                  <option>Control Room Operator</option>
                  <option>Chief Safety Officer</option>
                  <option>Geotechnical Engineer</option>
                  <option>Mine General Manager</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 7010886232"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
                >
                  Add Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: ADD ZONE
      ------------------------------------------------------------- */}
      {showAddZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111827] border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">Add Monitoring Zone</h3>
              <button onClick={() => setShowAddZone(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddZoneSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zone E - East Drift"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Risk Level</label>
                <select
                  value={newZoneRisk}
                  onChange={(e) => setNewZoneRisk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white outline-none focus:border-cyan-500"
                >
                  <option>LOW</option>
                  <option>ELEVATED</option>
                  <option>HIGH</option>
                  <option>CRITICAL</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Max Worker Capacity</label>
                <input
                  type="number"
                  placeholder="30"
                  value={newZoneCapacity}
                  onChange={(e) => setNewZoneCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Evacuation Route</label>
                <input
                  type="text"
                  placeholder="e.g. Route E1 (Surface Portal)"
                  value={newZoneRoute}
                  onChange={(e) => setNewZoneRoute(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#162235] border border-slate-700 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddZone(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
                >
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

