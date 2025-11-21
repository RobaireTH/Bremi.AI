
import React from 'react';
import { Language } from './types';

// Icons as components since we can't use external icon libraries easily
export const Icons = {
  Chat: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Flower: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/><path d="M12 7.5A4.5 4.5 0 1 0 7.5 12 4.5 4.5 0 1 0 12 16.5a4.5 4.5 0 1 0 4.5-4.5 4.5 4.5 0 1 0-4.5-4.5"/><path d="M12 3v9"/><path d="M12 12v9"/><path d="M16.5 7.5l-9 9"/><path d="M7.5 7.5l9 9"/></svg>
  ),
  Alert: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
  ),
  Send: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  ),
  Google: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className={className}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  WhatsApp: ({ className }: { className?: string }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 1h4a.5.5 0 0 0 1-1v-1a.5.5 0 0 0-1-1h-4a.5.5 0 0 0-1 1v1z"/></svg>
  ),
  X: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
  Brain: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
  ),
  Sparkles: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  Image: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
  ),
  Speaker: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
  ),
  ThumbsUp: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
  ),
  ThumbsDown: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
  ),
  User: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  Trash: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg>
  ),
  Plus: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  ToggleLeft: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="8" cy="12" r="3"></circle></svg>
  ),
  ToggleRight: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="16" cy="12" r="3"></circle></svg>
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
  )
};

export const EMERGENCY_NUMBER = "112";
export const NIGERIA_HELPLINES = [
  { name: "National Emergency", number: "112" },
  { name: "Lagos Suicide Prevention", number: "0806 210 6493" },
  { name: "Mentally Aware Nigeria", number: "0809 111 6264" }
];

export const SUPPORTED_LANGUAGES: {code: Language, name: string}[] = [
  { code: 'en', name: 'English' },
  { code: 'yo', name: 'Yorùbá' },
  { code: 'ha', name: 'Hausa' },
  { code: 'ig', name: 'Igbo' },
];

export const TRANSLATIONS = {
  en: {
    subtitle: "No judgement. No wahala. Just a safe space to talk your mind.",
    signin: "Sign in with Google",
    chat: "Chat",
    relax: "Relax",
    whatsapp: "WhatsApp",
    help: "Help",
    profile: "Profile",
    placeholder: "Type something...",
    online: "Online",
    sos: "SOS",
    reflect: "Reflect",
    history_on: "History On",
    history_off: "History Off",
    breathe_in: "Breathe In",
    hold: "Hold",
    exhale: "Exhale",
    emergency_title: "Emergency Help",
    emergency_desc: "You are not alone. Help is available.",
    call_helpline: "Call a Helpline",
    nearby_hospitals: "Nearby Hospitals",
    locating: "Locating...",
    finding: "Finding nearest centers...",
    error_loc: "Could not access location",
    open_maps: "Open in Maps",
    welcome: "Hello. How body? I dey here for you. Anything weighing you down today?",
    why_breathe: "Why this helps?",
    why_breathe_desc: "This 4-7-8 technique calms your nervous system instantly.",
    instructions: "Follow the circle. Inhale peace, exhale wahala.",
    your_profile: "",
    name_label: "Display Name",
    lang_label: "Preferred Language",
    save_changes: "Save Changes",
    saved: "Settings Saved!",
    logout: "Log Out",
    history: "History",
    no_history: "No saved chats yet.",
    delete: "Delete",
    new_chat: "New Chat",
    yesterday: "Yesterday",
    today: "Today",
    last_7_days: "Previous 7 Days",
    older: "Older",
    start_chat: "Start a conversation",
    continue: "Continue",
    continue_whatsapp: "Continue in WhatsApp",
    coming_soon_title: "Coming Soon!",
    coming_soon_desc: "We are working hard to bring Bremi.AI to WhatsApp. Stay tuned!",
    go_back: "Go Back",
    privacy_notice: "Your privacy comes first. Chats are not saved unless you toggle 'History On'. All data stays locally on your device."
  },
  yo: {
    subtitle: "Ko si idajọ. Ko si wahala. Aye ailewu lati sọ ọkan rẹ jade.",
    signin: "Wọle pẹlu Google",
    chat: "Ọrọ",
    relax: "Sinmi",
    whatsapp: "WhatsApp",
    help: "Iranlọwọ",
    profile: "Profaili",
    placeholder: "Kọ nkan...",
    online: "Lori ayelujara",
    sos: "SOS",
    reflect: "Ronu",
    history_on: "Itan Tan",
    history_off: "Itan Pa",
    breathe_in: "Simi Inu",
    hold: "Duro",
    exhale: "Simi Jade",
    emergency_title: "Iranlọwọ Pajawiri",
    emergency_desc: "Iwọ ko dawa. Iranlọwọ wa.",
    call_helpline: "Pe laini iranlọwọ",
    nearby_hospitals: "Awọn ile-iwosan nitosi",
    locating: "Wiwa...",
    finding: "Wiwa awọn ile-iṣẹ...",
    error_loc: "Ko le ri ipo",
    open_maps: "Ṣii ni Maps",
    welcome: "Bawo. Ara nko? Mo wa nibi fun e. Se nkankan n da e lamu loni?",
    why_breathe: "Kilode ti eyi fi ṣe iranlọwọ?",
    why_breathe_desc: "Ilana 4-7-8 yii n mu eto aifọkanbalẹ rẹ balẹ lẹsẹkẹsẹ.",
    instructions: "Tẹle iyipo naa. Simi alaafia, tu wahala jade.",
    your_profile: "",
    name_label: "Oruko",
    lang_label: "Ede Ti O Fẹran",
    save_changes: "Fipamọ Awọn Ayipada",
    saved: "Awọn eto ti wa ni ipamọ!",
    logout: "Jade",
    history: "Itan",
    no_history: "Ko si iwiregbe ti a fipamọ.",
    delete: "Pa rẹ",
    new_chat: "Iwiregbe Tuntun",
    yesterday: "Lana",
    today: "Loni",
    last_7_days: "Ọjọ 7 to kọja",
    older: "Agbalagba",
    start_chat: "Bẹrẹ ibaraẹnisọrọ",
    continue: "Tẹsiwaju",
    continue_whatsapp: "Tẹsiwaju ni WhatsApp",
    coming_soon_title: "Nbọ Laipe!",
    coming_soon_desc: "A n ṣiṣẹ takuntakun lati mu Bremi.AI wa si WhatsApp. Duro yi!",
    go_back: "Pada sẹhin",
    privacy_notice: "Aṣiri rẹ ṣe pataki. A ko fi ọrọ pamọ ayafi ti o ba tan 'Itan'. Awọn data wa lori ẹrọ rẹ."
  },
  ha: {
    subtitle: "Ba hukunci. Ba wahala. Wuri mai aminci don faɗar ran ku.",
    signin: "Shiga da Google",
    chat: "Tattaunawa",
    relax: "Huta",
    whatsapp: "WhatsApp",
    help: "Taimako",
    profile: "Bayani",
    placeholder: "Rubuta wani abu...",
    online: "A kan layi",
    sos: "SOS",
    reflect: "Tunani",
    history_on: "Tarihi Kunna",
    history_off: "Tarihi Kashe",
    breathe_in: "Ja Numfashi",
    hold: "Rike",
    exhale: "Fitar da Numfashi",
    emergency_title: "Taimakon Gaggawa",
    emergency_desc: "Ba ku kaɗai ba ne. Akwai taimako.",
    call_helpline: "Kira layin taimako",
    nearby_hospitals: "Asibitoci kusa",
    locating: "Neman wuri...",
    finding: "Neman cibiyoyi...",
    error_loc: "Ba a iya samun wuri ba",
    open_maps: "Buɗe a Maps",
    welcome: "Sannu. Yaya jiki? Ina nan domin ku. Ko akwai abin da ke damun ku?",
    why_breathe: "Me yasa wannan ke taimakawa?",
    why_breathe_desc: "Wannan dabarar 4-7-8 tana kwantar da hankalin ku nan take.",
    instructions: "Bi da'irar. Jawo natsuwa, fitar da wahala.",
    your_profile: "",
    name_label: "Suna",
    lang_label: "Harshen da aka fi so",
    save_changes: "Ajiye Canje-canje",
    saved: "An Ajiye Saituna!",
    logout: "Fita",
    history: "Tarihi",
    no_history: "Babu tattaunawar da aka ajiye.",
    delete: "Goge",
    new_chat: "Sabon Tattaunawa",
    yesterday: "Jiya",
    today: "Yau",
    last_7_days: "Kwanaki 7 da suka wuce",
    older: "Tsoho",
    start_chat: "Fara tattaunawa",
    continue: "Ci gaba",
    continue_whatsapp: "Ci gaba a WhatsApp",
    coming_soon_title: "Yana Zuwa Nan Ba Da Jimawa Ba!",
    coming_soon_desc: "Muna aiki tuƙuru don kawo Bremi.AI zuwa WhatsApp. Kasance tare da mu!",
    go_back: "Koma baya",
    privacy_notice: "Sirrinka yana da mahimmanci. Ba a adana hira sai ka kunna 'Tarihi'. Bayanai suna kan na'urarka."
  },
  ig: {
    subtitle: "Enweghị ikpe. Enweghị wahala. Ebe nchekwa iji kwuo uche gị.",
    signin: "Banye na Google",
    chat: "Kọm",
    relax: "Zụrụ ike",
    whatsapp: "WhatsApp",
    help: "Enyemaka",
    profile: "Profaili",
    placeholder: "Dee ihe...",
    online: "N'ịntanetị",
    sos: "SOS",
    reflect: "Chee echiche",
    history_on: "Akụkọ Na-echekwa",
    history_off: "Akụkọ Gbanyụọ",
    breathe_in: "Kuo ume",
    hold: "Jide",
    exhale: "Kuo ume pụta",
    emergency_title: "Enyemaka Mberede",
    emergency_desc: "Ị nọghị naanị gị. Enyemaka dị.",
    call_helpline: "Kpọọ akara enyemaka",
    nearby_hospitals: "Ụlọ ọgwụ dị nso",
    locating: "Na-achọ...",
    finding: "Na-achọ ụlọ ọrụ...",
    error_loc: "Enweghị ike ịnweta ọnọdụ",
    open_maps: "Mepee na Maps",
    welcome: "Kedu. Kedu ka ị mere? Anọ m ebe a maka gị. Enwere ihe na-enye gị nsogbu taa?",
    why_breathe: "Gịnị mere nke a ji enyere aka?",
    why_breathe_desc: "Usoro 4-7-8 a na-eme ka akwara gị dajụọ ozugbo.",
    instructions: "Soro okirikiri ahụ. Kuo udo, kuo wahala pụta.",
    your_profile: "",
    name_label: "Aha Gị",
    lang_label: "Asụsụ Ị Chọrọ",
    save_changes: "Chekwaa Mgbanwe",
    saved: "Echekwara ntọala!",
    logout: "Pụọ",
    history: "Akụkọ",
    no_history: "Enweghị nkata echekwara.",
    delete: "Hichapụ",
    new_chat: "Nkata Ọhụrụ",
    yesterday: "Nke gara aga",
    today: "Taa",
    last_7_days: "Ụbọchị 7 gara aga",
    older: "Nke ochie",
    start_chat: "Malite mkparịta ụka",
    continue: "Gaa n'ihu",
    continue_whatsapp: "Gaa n'ihu na WhatsApp",
    coming_soon_title: "Na-abịa n'oge na-adịghị anya!",
    coming_soon_desc: "A na-arụsi ọrụ ike iji weta Bremi.AI na WhatsApp. Nọrọ na-eche!",
    go_back: "Gaa azụ",
    privacy_notice: "Nzuzo gị dị mkpa. A naghị echekwa nkata ọ gwụla ma ị gbanyere 'Akụkọ'. Data niile na-anọ na ngwaọrụ gị."
  }
};
