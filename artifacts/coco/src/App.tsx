import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, BarChart3, BookOpen, Brain, Check, ChevronRight,
  CircleHelp, Compass, Flame, Headphones, Home, Library, LockKeyhole, Map,
  Menu, Moon,
  Play, Plus, Settings2, Sparkles, Star, Sun, Target,
  Trophy, Upload, Volume2, Webcam, X, type LucideIcon,
} from "lucide-react";
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";

type Language = "en" | "hi" | "ta";
type Mode = "child" | "adult";
type Format = "TXT" | "PDF" | "EPUB";
type Profile = { mode: Mode; name: string; language: Language };
type Book = { id: string; title: string; author: string; format: Format; progress: number; content: string; uploadedAt: string };
type ReadingSession = { bookId: string; startedAt: string; duration: number; wordsRead: number; struggleCount: number; averageRecoverySeconds: number };
type DifficultWord = { word: string; chunks: string[]; attempts: number; lastSeen: string };
type Settings = { language: Language; textSize: number; dyslexiaFont: boolean; lineSpacing: number; gazeMode: boolean };
type Rewards = { missionsCompleted: number; streak: number; badges: string[] };

const queryClient = new QueryClient();
const STORAGE = "coco-local-v1";

const demoBooks: Book[] = [
  {
    id: "moon-post",
    title: "The Moon Post",
    author: "Mira Sen",
    format: "TXT",
    progress: 38,
    uploadedAt: "2024-06-12",
    content: "At the edge of the village, a small blue mailbox waited for the moon.\n\nEvery evening, Nila wrote one brave thought on a tiny card. She wrote about the river, the mango tree, and the way stars looked like little doors.\n\nOne night, the moon wrote back. It said: You do not have to read every road at once. Take one step, then another.\n\nNila smiled and carried the letter home. Tomorrow would be a new page.",
  },
  {
    id: "garden-sounds",
    title: "Sounds in the Garden",
    author: "Asha Velu",
    format: "TXT",
    progress: 0,
    uploadedAt: "2024-06-12",
    content: "The garden woke before the house.\n\nA soft rustle moved through the leaves. A bright bird called from the fence. Under the soil, a seed stretched its roots and found a little more courage.\n\nLeela listened carefully. There were so many stories in one morning.",
  },
];

const copy: Record<Language, Record<string, string>> = {
  en: {
    welcome: "Reading, one brave step at a time.", intro: "COCO turns real books into achievable adventures — with a buddy beside you, not a judge above you.",
    choose: "Choose your reading path", explorer: "Explorer journey", explorerDesc: "Playful missions, tiny wins, and a reading buddy cheering you on.", adultPath: "Focused reading", adultDesc: "A quiet library, useful patterns, and tools that respect your pace.",
    begin: "Begin the journey", continue: "Continue to COCO", childName: "What should COCO call you?", adultName: "Your first name", nameHint: "You can change this anytime.", childGreeting: "Ready for today’s tiny adventure?", adultGreeting: "A calm place for your next page.", mission: "Today’s mission", openBook: "Open a book", upload: "Add a book", practice: "Practice words", rewards: "Your constellation", streak: "day streak", library: "Your library", recent: "Keep reading", analytics: "Reading patterns", difficult: "Words to revisit", privacy: "Privacy & gaze learning", settings: "Reading settings", progress: "progress", lastRead: "Last read", minutes: "minutes", words: "words", sessions: "sessions", noWords: "Your tricky words will appear here as you meet them.", seeAll: "See all", read: "Read now", brave: "BRAVE READER", amazing: "YOU DID AMAZING", completed: "MISSION COMPLETED", back: "Back", save: "Save", chooseLanguage: "Language", manual: "Audio + manual mode is always available.", needHelp: "Need a hand?", gaze: "Gaze learning", optional: "Optional, private, and never required.", askCamera: "Ask for camera permission", decline: "Continue without gaze", cameraOn: "Permission granted — camera is still off.", cameraNo: "No camera access needed. You can read with audio and manual support.", extraction: "COCO can open this file, but browser-only text extraction is limited for this format. Add a TXT copy for word-level support.", soundSteps: "Sound steps", listen: "Listen", tapWord: "Tap a word to mark it and see its sound steps.", finish: "Finish this mission", next: "Next word", signOut: "Reset local profile",
  },
  hi: {
    welcome: "पढ़ना, एक साहसी कदम एक बार।", intro: "COCO असली किताबों को छोटे-छोटे रोमांच में बदलता है — आपके साथ, आपके ऊपर नहीं।", choose: "अपना पढ़ने का रास्ता चुनें", explorer: "खोजी सफ़र", explorerDesc: "छोटे मिशन, छोटी जीत और आपका अपना पढ़ने वाला दोस्त।", adultPath: "ध्यान से पढ़ना", adultDesc: "एक शांत लाइब्रेरी और आपकी गति का सम्मान करने वाले औज़ार।", begin: "सफ़र शुरू करें", continue: "COCO पर जाएँ", childName: "COCO आपको किस नाम से बुलाए?", adultName: "आपका पहला नाम", nameHint: "आप इसे कभी भी बदल सकते हैं।", childGreeting: "आज के छोटे रोमांच के लिए तैयार?", adultGreeting: "आपके अगले पन्ने के लिए शांत जगह।", mission: "आज का मिशन", openBook: "किताब खोलें", upload: "किताब जोड़ें", practice: "शब्दों का अभ्यास", rewards: "आपका तारामंडल", streak: "दिन की लड़ी", library: "आपकी लाइब्रेरी", recent: "पढ़ना जारी रखें", analytics: "पढ़ने के पैटर्न", difficult: "फिर से देखने वाले शब्द", privacy: "गोपनीयता और नज़र सीखना", settings: "पढ़ने की सेटिंग", progress: "प्रगति", lastRead: "आखिरी बार", minutes: "मिनट", words: "शब्द", sessions: "सेशन", noWords: "मुश्किल शब्द यहाँ दिखेंगे।", seeAll: "सभी देखें", read: "अभी पढ़ें", brave: "बहादुर पाठक", amazing: "आपने बहुत अच्छा किया", completed: "मिशन पूरा", back: "वापस", save: "सहेजें", chooseLanguage: "भाषा", manual: "ऑडियो और मैनुअल मोड हमेशा उपलब्ध है।", needHelp: "मदद चाहिए?", gaze: "नज़र से सीखना", optional: "वैकल्पिक, निजी और ज़रूरी नहीं।", askCamera: "कैमरा अनुमति पूछें", decline: "नज़र के बिना जारी रखें", cameraOn: "अनुमति मिल गई — कैमरा अभी भी बंद है।", cameraNo: "कैमरा ज़रूरी नहीं। ऑडियो और मैनुअल मदद से पढ़ें।", extraction: "COCO यह फ़ाइल खोल सकता है, लेकिन इस फ़ॉर्मेट में ब्राउज़र में टेक्स्ट निकालना सीमित है। शब्द सहायता के लिए TXT कॉपी जोड़ें।", soundSteps: "ध्वनि चरण", listen: "सुनें", tapWord: "किसी शब्द पर टैप करके उसके ध्वनि चरण देखें।", finish: "मिशन पूरा करें", next: "अगला शब्द", signOut: "स्थानीय प्रोफ़ाइल रीसेट करें",
  },
  ta: {
    welcome: "வாசிப்பு — ஒரு தைரியமான அடியாக.", intro: "COCO உண்மையான புத்தகங்களை எளிதான சாகசங்களாக மாற்றுகிறது — தீர்ப்பிடாமல், உங்களுடன்.", choose: "உங்கள் வாசிப்பு பாதையைத் தேர்ந்தெடுக்கவும்", explorer: "ஆராய்ச்சியாளர் பயணம்", explorerDesc: "சிறு பணிகள், சிறு வெற்றிகள், உங்கள் வாசிப்பு நண்பர்.", adultPath: "கவனமான வாசிப்பு", adultDesc: "அமைதியான நூலகமும் உங்கள் வேகத்தை மதிக்கும் கருவிகளும்.", begin: "பயணத்தைத் தொடங்கு", continue: "COCO-வுக்குச் செல்லவும்", childName: "COCO உங்களை எப்படி அழைக்க வேண்டும்?", adultName: "உங்கள் பெயர்", nameHint: "இதை எப்போது வேண்டுமானாலும் மாற்றலாம்.", childGreeting: "இன்றைய சிறிய சாகசத்திற்கு தயாரா?", adultGreeting: "உங்கள் அடுத்த பக்கத்திற்கான அமைதியான இடம்.", mission: "இன்றைய பணி", openBook: "புத்தகத்தைத் திற", upload: "புத்தகம் சேர்", practice: "சொற்களைப் பயிற்சி செய்", rewards: "உங்கள் நட்சத்திரங்கள்", streak: "நாள் தொடர்ச்சி", library: "உங்கள் நூலகம்", recent: "வாசிப்பைத் தொடரவும்", analytics: "வாசிப்பு முறைகள்", difficult: "மீண்டும் பார்க்க வேண்டிய சொற்கள்", privacy: "தனியுரிமை மற்றும் பார்வை கற்றல்", settings: "வாசிப்பு அமைப்புகள்", progress: "முன்னேற்றம்", lastRead: "கடைசியாக வாசித்தது", minutes: "நிமிடங்கள்", words: "சொற்கள்", sessions: "அமர்வுகள்", noWords: "கடினமான சொற்கள் இங்கே தோன்றும்.", seeAll: "அனைத்தையும் காண்க", read: "இப்போது வாசி", brave: "தைரியமான வாசகர்", amazing: "நீங்கள் அற்புதமாக செய்தீர்கள்", completed: "பணி முடிந்தது", back: "பின்", save: "சேமி", chooseLanguage: "மொழி", manual: "ஆடியோ மற்றும் கைமுறை முறை எப்போதும் உள்ளது.", needHelp: "உதவி வேண்டுமா?", gaze: "பார்வை கற்றல்", optional: "விருப்பம், தனிப்பட்டது, தேவையில்லை.", askCamera: "கேமரா அனுமதி கேள்", decline: "பார்வையின்றி தொடரவும்", cameraOn: "அனுமதி கிடைத்தது — கேமரா இன்னும் அணைந்துள்ளது.", cameraNo: "கேமரா தேவையில்லை. ஆடியோ மற்றும் கைமுறை உதவியுடன் வாசிக்கலாம்.", extraction: "COCO இந்த கோப்பைத் திறக்கலாம், ஆனால் இந்த வடிவத்தில் உலாவி உரை பிரித்தெடுப்பது குறைவாக உள்ளது. சொல் உதவிக்கு TXT நகலைச் சேர்க்கவும்.", soundSteps: "ஒலி படிகள்", listen: "கேள்", tapWord: "ஒரு சொல்லைத் தட்டி அதன் ஒலி படிகளைப் பார்க்கவும்.", finish: "இந்த பணியை முடி", next: "அடுத்த சொல்", signOut: "உள்ளூர் சுயவிவரத்தை மீட்டமை",
  },
};

const getStored = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(`${STORAGE}:${key}`);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch { return fallback; }
};

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => getStored(key, initial));
  useEffect(() => { localStorage.setItem(`${STORAGE}:${key}`, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

function chunkWord(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length < 4) return [clean];
  const syllables = clean.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?=[^aeiouy]|$))?/g);
  if (syllables && syllables.join("") === clean && syllables.length > 1) return syllables;
  return clean.match(/.{1,2}/g) || [clean];
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3" data-testid="brand-coco">
    <div className="relative grid h-10 w-10 place-items-center rounded-[14px] bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] shadow-[4px_4px_0_hsl(var(--primary))]">
      <span className="font-display text-2xl leading-none">c</span>
      <span className="absolute right-[8px] top-[8px] h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
    </div>
    {!compact && <span className="font-display text-2xl font-bold tracking-tight">COCO</span>}
  </div>;
}

function LanguagePicker({ language, setLanguage }: { language: Language; setLanguage: (language: Language) => void }) {
  return <label className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted-foreground))]" data-testid="label-language">
    <span className="sr-only">Language</span>
    <select aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value as Language)} data-testid="select-language" className="cursor-pointer appearance-none rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm font-bold outline-none hover:border-[hsl(var(--primary))]">
      <option value="en">English</option><option value="hi">हिन्दी</option><option value="ta">தமிழ்</option>
    </select>
  </label>;
}

function IconButton({ icon: Icon, label, onClick, className = "" }: { icon: LucideIcon; label: string; onClick: () => void; className?: string }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} data-testid={`button-${label.toLowerCase().replaceAll(" ", "-")}`} className={`grid h-10 w-10 place-items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] transition hover:-translate-y-0.5 hover:border-[hsl(var(--primary))] ${className}`}><Icon size={18} strokeWidth={2.2} /></button>;
}

function ProgressBar({ value, accent = false }: { value: number; accent?: boolean }) {
  return <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]" aria-label={`${value}% complete`} data-testid="progress-reading">
    <div className={`h-full rounded-full transition-all duration-500 ${accent ? "bg-[hsl(var(--accent))]" : "bg-[hsl(var(--primary))]"}`} style={{ width: `${Math.min(100, value)}%` }} />
  </div>;
}

function AppShell({ children, profile, language, setLanguage, onReset }: { children: ReactNode; profile: Profile; language: Language; setLanguage: (l: Language) => void; onReset: () => void }) {
  const [location, setLocation] = useLocation();
  const t = (key: string) => copy[language][key] || copy.en[key] || key;
  const isChild = profile.mode === "child";
  const nav = isChild
    ? [{ href: "/child", label: "Home", icon: Home }, { href: "/read/moon-post", label: "Read", icon: BookOpen }, { href: "/privacy", label: "Privacy", icon: LockKeyhole }]
    : [{ href: "/adult", label: "Home", icon: Home }, { href: "/read/moon-post", label: "Library", icon: Library }, { href: "/privacy", label: "Privacy", icon: LockKeyhole }];
  return <div className="grain min-h-[100dvh] bg-[hsl(var(--background))]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[242px] flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card)/.82)] px-6 py-7 backdrop-blur md:flex">
      <Link href={isChild ? "/child" : "/adult"} className="mb-12" data-testid="link-logo"><Logo /></Link>
      <nav className="flex flex-col gap-2" aria-label="Main navigation">
        {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${location === href ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[3px_3px_0_hsl(var(--accent))]" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"}`} data-testid={`link-nav-${label.toLowerCase()}`}><Icon size={18} /><span>{label}</span></Link>)}
      </nav>
      <div className="mt-auto space-y-3">
        <Link href="/privacy" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]" data-testid="link-privacy"><CircleHelp size={18} />{t("needHelp")}</Link>
        <button type="button" onClick={onReset} data-testid="button-reset-profile" className="w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3 text-left text-xs font-bold text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]">{t("signOut")}</button>
      </div>
    </aside>
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.88)] px-5 py-4 backdrop-blur md:ml-[242px] md:px-10">
      <Link href={isChild ? "/child" : "/adult"} className="md:hidden" data-testid="link-mobile-logo"><Logo compact /></Link>
      <div className="hidden md:block"><span className="font-mono-coco text-[10px] font-medium uppercase tracking-[.25em] text-[hsl(var(--muted-foreground))]">Local first / kind by design</span></div>
      <div className="ml-auto flex items-center gap-3">
        <LanguagePicker language={language} setLanguage={setLanguage} />
        <div className="hidden items-center gap-2 rounded-full bg-[hsl(var(--secondary))] px-3 py-2 text-xs font-bold sm:flex" data-testid="text-profile-name"><span className="grid h-6 w-6 place-items-center rounded-full bg-[hsl(var(--accent))]">{profile.name.charAt(0).toUpperCase()}</span>{profile.name}</div>
        <IconButton icon={Menu} label="Open menu" onClick={() => setLocation("/privacy")} className="md:hidden" />
      </div>
    </header>
    <main className="md:ml-[242px]">{children}</main>
  </div>;
}

function Welcome({ onStart, language, setLanguage }: { onStart: (mode: Mode, name: string) => void; language: Language; setLanguage: (l: Language) => void }) {
  const t = (key: string) => copy[language][key] || copy.en[key] || key;
  const [path, setPath] = useState<Mode | null>(null);
  const [name, setName] = useState("");
  return <div className="grain min-h-[100dvh] overflow-hidden bg-[hsl(var(--background))]">
    <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-12"><Logo /><LanguagePicker language={language} setLanguage={setLanguage} /></header>
    <main className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-10 sm:px-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:pb-24 lg:pt-16">
      <section className="reveal">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]"><Sparkles size={14} /> A reading companion</div>
        <h1 className="max-w-3xl font-display text-[clamp(3.8rem,8vw,7.7rem)] font-semibold leading-[.88] tracking-[-.06em] text-[hsl(var(--foreground))]">Your next <span className="relative whitespace-nowrap text-[hsl(var(--primary))]">brave page<span className="absolute -bottom-2 left-0 h-2 w-full -rotate-2 rounded-full bg-[hsl(var(--accent))]" /></span> starts here.</h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">{t("intro")}</p>
        <div className="mt-9 flex items-center gap-4 text-sm font-bold text-[hsl(var(--muted-foreground))]"><div className="flex -space-x-2"><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[hsl(var(--background))] bg-[hsl(var(--accent))]">A</span><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[hsl(var(--background))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">M</span><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[hsl(var(--background))] bg-[hsl(var(--secondary))]">R</span></div><span>Made for the pace that is yours.</span></div>
      </section>
      <section className="reveal reveal-delay-1 relative">
        <div className="dot-field absolute -right-16 -top-12 h-48 w-48 rounded-full opacity-70" />
        <div className="paper-card relative rounded-[32px] p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-mono-coco text-[10px] uppercase tracking-[.22em] text-[hsl(var(--muted-foreground))]">COCO / 01</p><h2 className="mt-1 font-display text-3xl">Let’s make a plan.</h2></div><div className="bounce-soft grid h-14 w-14 place-items-center rounded-[20px] bg-[hsl(var(--accent))]"><Brain size={26} /></div></div>
           {!path ? <div className="space-y-4">
            <p className="mb-5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{t("choose")}</p>
             <button type="button" onClick={() => setPath("child")} data-testid="button-explorer-path" className="coco-button group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))] p-4 text-left text-[hsl(var(--primary-foreground))]"><span className="absolute -right-8 -top-12 h-28 w-28 rounded-full border-[16px] border-[hsl(var(--accent)/.35)]" /><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"><Compass size={23} /></span><span className="relative flex-1"><strong className="block text-lg">COCO Explorer</strong><span className="text-sm opacity-80">A cartoon-style reading adventure with missions and a guide.</span></span><ArrowRight size={20} className="relative transition group-hover:translate-x-1" /></button>
            <button type="button" onClick={() => setPath("adult")} data-testid="button-adult-path" className="coco-button group flex w-full items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 text-left"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[hsl(var(--secondary))]"><Library size={23} /></span><span className="flex-1"><strong className="block text-lg">{t("adultPath")}</strong><span className="text-sm text-[hsl(var(--muted-foreground))]">{t("adultDesc")}</span></span><ArrowRight size={20} className="text-[hsl(var(--muted-foreground))] transition group-hover:translate-x-1" /></button>
          </div> : <div className="reveal">
            <button type="button" onClick={() => setPath(null)} className="mb-6 flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted-foreground))]" data-testid="button-back-path"><ArrowLeft size={16} /> {t("back")}</button>
             {path === "child" ? <div className="mb-5 overflow-hidden rounded-[24px] border-2 border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]">
               <div className="relative flex min-h-[145px] items-end justify-between overflow-hidden bg-[hsl(var(--primary))] px-5 pb-5 text-[hsl(var(--primary-foreground))]">
                 <div className="relative z-10 max-w-[12rem]"><p className="font-mono-coco text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">COCO / EXPLORER MAP</p><p className="mt-2 font-display text-3xl leading-none">Let’s find your brave page.</p></div>
                 <div className="relative mr-2 h-24 w-24 shrink-0 rotate-[-7deg] rounded-[35%] border-4 border-[hsl(var(--foreground))] bg-[hsl(var(--accent))] shadow-[4px_4px_0_hsl(var(--foreground))]">
                   <div className="absolute left-5 top-5 h-3 w-3 rounded-full bg-[hsl(var(--foreground))]" /><div className="absolute right-5 top-5 h-3 w-3 rounded-full bg-[hsl(var(--foreground))]" /><div className="absolute bottom-5 left-1/2 h-3 w-8 -translate-x-1/2 rounded-full border-b-4 border-[hsl(var(--foreground))]" />
                 </div>
                 <Map className="absolute -right-2 -top-6 rotate-12 text-[hsl(var(--accent)/.25)]" size={130} />
               </div>
               <div className="flex items-center gap-3 p-4 text-sm font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--accent))]"><Star size={17} /></span><span>Mission 01: tell COCO your explorer name.</span></div>
             </div> : <div className="mb-5 rounded-2xl bg-[hsl(var(--secondary))] p-4"><p className="font-bold">{t("adultName")}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{t("nameHint")}</p></div>}
             {path === "child" && <p className="mb-2 text-sm font-bold">{t("childName")}</p>}
             {path === "adult" && null}
             <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onStart(path, name.trim()); }} placeholder={path === "child" ? "Nila" : "Sam"} aria-label={path === "child" ? t("childName") : t("adultName")} data-testid="input-name" className="mb-4 w-full rounded-2xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-4 text-lg outline-none transition placeholder:text-[hsl(var(--muted-foreground)/.6)] focus:border-[hsl(var(--primary))]" />
             <button type="button" disabled={!name.trim()} onClick={() => onStart(path, name.trim())} data-testid="button-start-path" className={`coco-button flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold disabled:cursor-not-allowed disabled:opacity-50 ${path === "child" ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"}`}>{path === "child" ? "Start my adventure" : t("continue")} <ArrowRight size={18} /></button>
          </div>}
          <div className="mt-6 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-5 text-xs text-[hsl(var(--muted-foreground))]"><LockKeyhole size={14} /> Your books and progress stay on this device.</div>
        </div>
      </section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-wrap gap-5 px-6 pb-8 text-xs font-bold text-[hsl(var(--muted-foreground))] sm:px-12"><span>COCO 2024</span><span>Small steps count.</span><span>Always local-first.</span></footer>
  </div>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-9 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="font-mono-coco text-[10px] font-medium uppercase tracking-[.25em] text-[hsl(var(--primary))]">{eyebrow}</p><h1 className="mt-2 font-display text-5xl font-semibold leading-none tracking-[-.04em] sm:text-6xl">{title}</h1><p className="mt-4 max-w-xl text-[hsl(var(--muted-foreground))]">{description}</p></div>{action}</div>;
}

function UploadButton({ onAdd }: { onAdd: (book: Book) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const extension = file.name.split(".").pop()?.toUpperCase() as Format;
    const format: Format = extension === "PDF" || extension === "EPUB" ? extension : "TXT";
    let content = "";
    if (format === "TXT") content = await file.text();
    else content = `This ${format} book is safely stored on your device.\n\nBrowser-only extraction for ${format} files can be limited. COCO will keep the file in your library, and you can add a TXT copy for word-level reading support.`;
    onAdd({ id: `book-${Date.now()}`, title: file.name.replace(/\.[^/.]+$/, ""), author: "Your book", format, progress: 0, content: content || "This book is waiting for its first words.", uploadedAt: new Date().toISOString() });
    if (format !== "TXT") setNotice(`${format} added. Browser-only extraction is limited; a TXT copy gives you full word support.`);
    event.target.value = "";
  };
  return <div className="relative">
    <input ref={inputRef} type="file" accept=".txt,.pdf,.epub,text/plain,application/pdf,application/epub+zip" onChange={handleFile} className="hidden" data-testid="input-book-file" />
    <button type="button" onClick={() => inputRef.current?.click()} data-testid="button-upload-book" className="coco-button flex items-center gap-2 rounded-2xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]"><Upload size={17} /> Add a book</button>
    {notice && <div role="status" className="absolute right-0 top-14 z-10 w-72 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-xs leading-relaxed shadow-[var(--shadow-md)]">{notice}<button type="button" onClick={() => setNotice("")} className="ml-2 font-bold underline" data-testid="button-dismiss-upload-notice">Dismiss</button></div>}
  </div>;
}

function BookCard({ book, onOpen, child = false }: { book: Book; onOpen: (id: string) => void; child?: boolean }) {
  return <button type="button" onClick={() => onOpen(book.id)} data-testid={`card-book-${book.id}`} className="group paper-card flex w-full flex-col overflow-hidden rounded-[24px] text-left transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
    <div className={`relative h-32 overflow-hidden p-5 ${child ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--secondary))]"}`}><div className="absolute -right-6 -top-9 h-28 w-28 rounded-full border-[18px] border-[hsl(var(--accent)/.6)]" /><BookOpen className={`relative ${child ? "text-[hsl(var(--primary-foreground))]" : "text-[hsl(var(--primary))]"}`} size={25} /><span className={`absolute bottom-4 right-5 font-mono-coco text-[10px] uppercase tracking-[.18em] ${child ? "text-[hsl(var(--primary-foreground)/.7)]" : "text-[hsl(var(--muted-foreground))]"}`}>{book.format}</span></div>
    <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-2xl leading-tight">{book.title}</h3><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{book.author}</p></div><ChevronRight size={19} className="mt-1 shrink-0 text-[hsl(var(--muted-foreground))] transition group-hover:translate-x-1" /></div><div className="mt-5 flex items-center justify-between text-xs font-bold text-[hsl(var(--muted-foreground))]"><span>{book.progress}% progress</span><span>{book.progress ? "Continue" : "New"} <ArrowRight className="ml-1 inline" size={13} /></span></div><div className="mt-2"><ProgressBar value={book.progress} accent={child} /></div></div>
  </button>;
}

function ChildHome({ books, rewards, difficultWords, onAdd, onOpen, language, setLanguage, profile, onReset }: { books: Book[]; rewards: Rewards; difficultWords: DifficultWord[]; onAdd: (book: Book) => void; onOpen: (id: string) => void; language: Language; setLanguage: (l: Language) => void; profile: Profile; onReset: () => void }) {
  const t = (key: string) => copy[language][key] || copy.en[key] || key;
  return <AppShell profile={profile} language={language} setLanguage={setLanguage} onReset={onReset}><div className="mx-auto max-w-6xl px-5 py-9 sm:px-10 lg:px-14 lg:py-14">
    <PageIntro eyebrow="Explorer home / 01" title={`${t("childGreeting")} ${profile.name}.`} description="There is no rush in a good adventure. Pick the next little step." action={<UploadButton onAdd={onAdd} />} />
    <div className="reveal mb-10 grid overflow-hidden rounded-[28px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[6px_6px_0_hsl(var(--accent))] md:grid-cols-[1fr_240px]"><div className="p-7 sm:p-9"><div className="mb-7 flex items-center gap-2 text-sm font-bold text-[hsl(var(--accent))]"><Target size={18} /> {t("mission")} / 01</div><h2 className="max-w-lg font-display text-4xl leading-[.96] sm:text-5xl">Read one page. Notice one new sound. Celebrate the try.</h2><div className="mt-7 flex items-center gap-4"><div className="h-3 max-w-[250px] flex-1 rounded-full bg-[hsl(var(--primary-foreground)/.2)]"><div className="h-3 w-[68%] rounded-full bg-[hsl(var(--accent))]" /></div><span className="font-mono-coco text-xs">2 / 3 steps</span></div><button type="button" onClick={() => onOpen(books[0]?.id || "moon-post")} data-testid="button-mission-open" className="coco-button mt-7 flex items-center gap-2 rounded-2xl bg-[hsl(var(--accent))] px-5 py-3 font-bold text-[hsl(var(--foreground))]">{t("openBook")} <ArrowRight size={17} /></button></div><div className="relative hidden min-h-[270px] overflow-hidden bg-[hsl(var(--accent))] md:block"><div className="absolute -bottom-20 -right-8 h-64 w-64 rounded-full border-[32px] border-[hsl(var(--primary)/.25)]" /><div className="absolute left-10 top-10 h-28 w-28 rotate-12 rounded-[32px] border-2 border-[hsl(var(--primary)/.35)]" /><Star className="absolute right-14 top-14 text-[hsl(var(--primary))]" size={30} /><BookOpen className="absolute bottom-10 left-12 text-[hsl(var(--primary))]" size={42} /></div></div>
    <div className="mb-10 grid gap-5 sm:grid-cols-3"><div className="paper-card rounded-[22px] p-5"><div className="mb-7 flex items-center justify-between"><span className="text-sm font-bold">{t("rewards")}</span><Trophy size={19} className="text-[hsl(var(--accent))]" /></div><p className="font-display text-4xl">{rewards.missionsCompleted}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">missions completed</p></div><div className="paper-card rounded-[22px] bg-[hsl(var(--secondary))] p-5"><div className="mb-7 flex items-center justify-between"><span className="text-sm font-bold">{t("streak")}</span><Flame size={19} className="text-[hsl(var(--accent))]" /></div><p className="font-display text-4xl">{rewards.streak}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">keep the rhythm</p></div><div className="paper-card rounded-[22px] p-5"><div className="mb-7 flex items-center justify-between"><span className="text-sm font-bold">Words met</span><Brain size={19} className="text-[hsl(var(--primary))]" /></div><p className="font-display text-4xl">{difficultWords.length}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">new friends to practice</p></div></div>
    <section><div className="mb-5 flex items-end justify-between"><div><p className="font-mono-coco text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Choose your trail</p><h2 className="mt-1 font-display text-3xl">{t("recent")}</h2></div><span className="text-sm font-bold text-[hsl(var(--muted-foreground))]">{books.length} books</span></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{books.map((book) => <BookCard key={book.id} book={book} onOpen={onOpen} child />)}<button type="button" onClick={() => document.querySelector<HTMLInputElement>('[data-testid="input-book-file"]')?.click()} data-testid="button-add-empty-book" className="flex min-h-[270px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[hsl(var(--border))] p-6 text-center text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary)/.5)]"><Plus size={24} /><strong className="mt-3 text-sm">{t("upload")}</strong><span className="mt-1 text-xs">TXT, PDF, or EPUB</span></button></div></section>
  </div></AppShell>;
}

function AdultHome({ books, sessions, difficultWords, onAdd, onOpen, language, setLanguage, profile, onReset }: { books: Book[]; sessions: ReadingSession[]; difficultWords: DifficultWord[]; onAdd: (book: Book) => void; onOpen: (id: string) => void; language: Language; setLanguage: (l: Language) => void; profile: Profile; onReset: () => void }) {
  const t = (key: string) => copy[language][key] || copy.en[key] || key;
  const active = books.find((book) => book.progress > 0 && book.progress < 100) || books[0];
  const totalWords = sessions.reduce((sum, session) => sum + session.wordsRead, 0);
  const totalMinutes = Math.max(0, Math.round(sessions.reduce((sum, session) => sum + session.duration, 0) / 60));
  return <AppShell profile={profile} language={language} setLanguage={setLanguage} onReset={onReset}><div className="mx-auto max-w-6xl px-5 py-9 sm:px-10 lg:px-14 lg:py-14">
    <PageIntro eyebrow="Focused reading / 01" title={`${t("adultGreeting")} ${profile.name}.`} description="Your library, your patterns, your pace. Everything here stays on this device." action={<UploadButton onAdd={onAdd} />} />
    <section className="reveal mb-10 grid overflow-hidden rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-sm)] lg:grid-cols-[1fr_300px]"><div className="p-7 sm:p-9"><div className="flex items-center justify-between"><div><p className="font-mono-coco text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">{t("recent")}</p><h2 className="mt-2 font-display text-4xl">{active?.title || "Your first book"}</h2><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{active?.author || "Add something worth reading."}</p></div><div className="hidden h-16 w-16 place-items-center rounded-2xl bg-[hsl(var(--secondary))] sm:grid"><BookOpen className="text-[hsl(var(--primary))]" size={26} /></div></div><div className="mt-8 flex items-center gap-4"><ProgressBar value={active?.progress || 0} /><span className="font-mono-coco text-xs">{active?.progress || 0}%</span></div><button type="button" onClick={() => active && onOpen(active.id)} data-testid="button-continue-reading" className="coco-button mt-7 flex items-center gap-2 rounded-2xl bg-[hsl(var(--primary))] px-5 py-3 font-bold text-[hsl(var(--primary-foreground))]">{t("read")} <ArrowRight size={17} /></button></div><div className="relative hidden min-h-[238px] overflow-hidden bg-[hsl(var(--secondary))] lg:block"><div className="absolute right-[-25px] top-[-25px] h-48 w-48 rounded-full border-[28px] border-[hsl(var(--accent)/.7)]" /><div className="absolute bottom-9 left-10 max-w-[170px] font-display text-2xl leading-tight text-[hsl(var(--primary))]">A little room for a lot of story.</div></div></section>
    <div className="mb-10 grid gap-5 sm:grid-cols-3"><div className="paper-card rounded-[22px] p-5"><div className="mb-8 flex items-center justify-between"><span className="text-sm font-bold">{t("minutes")}</span><BarChart3 size={19} className="text-[hsl(var(--primary))]" /></div><p className="font-display text-4xl">{totalMinutes || 0}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">this week</p></div><div className="paper-card rounded-[22px] p-5"><div className="mb-8 flex items-center justify-between"><span className="text-sm font-bold">{t("words")}</span><Target size={19} className="text-[hsl(var(--accent))]" /></div><p className="font-display text-4xl">{totalWords || 0}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">read with COCO</p></div><div className="paper-card rounded-[22px] p-5"><div className="mb-8 flex items-center justify-between"><span className="text-sm font-bold">{t("sessions")}</span><Sparkles size={19} className="text-[hsl(var(--primary))]" /></div><p className="font-display text-4xl">{sessions.length}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">quiet wins</p></div></div>
    <div className="grid gap-10 lg:grid-cols-[1.4fr_.8fr]"><section><div className="mb-5 flex items-end justify-between"><div><p className="font-mono-coco text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Shelf / local</p><h2 className="mt-1 font-display text-3xl">{t("library")}</h2></div><span className="text-sm font-bold text-[hsl(var(--muted-foreground))]">{books.length} books</span></div><div className="grid gap-5 md:grid-cols-2">{books.map((book) => <BookCard key={book.id} book={book} onOpen={onOpen} />)}</div></section><aside><div className="mb-5 flex items-end justify-between"><div><p className="font-mono-coco text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Word log</p><h2 className="mt-1 font-display text-3xl">{t("difficult")}</h2></div><Brain className="text-[hsl(var(--primary))]" size={22} /></div><div className="paper-card overflow-hidden rounded-[22px]">{difficultWords.length ? difficultWords.slice(0, 4).map((word) => <div key={word.word} className="flex items-center justify-between border-b border-[hsl(var(--border))] p-4 last:border-0" data-testid={`row-word-${word.word}`}><div><strong className="block font-display text-xl">{word.word}</strong><span className="font-mono-coco text-[10px] text-[hsl(var(--muted-foreground))]">{word.chunks.join(" · ")}</span></div><span className="rounded-full bg-[hsl(var(--secondary))] px-2 py-1 text-[10px] font-bold">{word.attempts} tries</span></div>) : <div className="p-6 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]" data-testid="empty-difficult-words">{t("noWords")}</div>}</div><Link href="/privacy" className="mt-4 flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]" data-testid="link-settings"><Settings2 size={16} /> {t("settings")} & {t("privacy")}</Link></aside></div>
  </div></AppShell>;
}

function ReaderPage({ books, difficultWords, settings, onUpdateBook, onAddWord, onFinish, language, setLanguage, profile, onReset }: { books: Book[]; difficultWords: DifficultWord[]; settings: Settings; onUpdateBook: (id: string, progress: number) => void; onAddWord: (word: DifficultWord) => void; onFinish: (session: ReadingSession) => void; language: Language; setLanguage: (l: Language) => void; profile: Profile; onReset: () => void }) {
  const { bookId } = useParams<{ bookId: string }>();
  const [, setLocation] = useLocation();
  const t = (key: string) => copy[language][key] || copy.en[key] || key;
  const book = books.find((item) => item.id === bookId) || demoBooks[0];
  const tokens = useMemo(() => book.content.split(/(\s+)/), [book.content]);
  const wordIndexes = useMemo(() => tokens.map((token, index) => /\S/.test(token) ? index : -1).filter((index) => index >= 0), [tokens]);
  const initialIndex = Math.min(Math.floor((book.progress / 100) * Math.max(1, wordIndexes.length)), Math.max(0, wordIndexes.length - 1));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedWord, setSelectedWord] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"idle" | "granted" | "denied">("idle");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [struggles, setStruggles] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [done, setDone] = useState(book.progress >= 100);
  const currentTokenIndex = wordIndexes[currentIndex] ?? wordIndexes[0] ?? 0;
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const preferredLanguage = language === "hi" ? "hi-IN" : language === "ta" ? "ta-IN" : "en-IN";
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === preferredLanguage.toLowerCase())
      || voices.find((voice) => voice.lang.toLowerCase().startsWith(preferredLanguage.slice(0, 2)))
      || voices.find((voice) => voice.lang.toLowerCase().includes("en-in"))
      || null;
    utterance.lang = preferredLanguage;
    utterance.rate = 0.62;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true); utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
  const speakLesson = () => speak(`${book.title}. ${book.content}`);
  const askCamera = async () => {
    setCameraBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("not supported");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission("granted");
    } catch {
      setCameraPermission("denied");
    }
    setCameraBusy(false);
  };
  const chooseWord = (token: string, tokenIndex: number) => {
    const clean = token.replace(/[^A-Za-zÀ-ÿ\u0900-\u0D7F'-]/g, "");
    if (!clean) return;
    setSelectedWord(clean);
    setStruggles((count) => count + 1);
    const position = wordIndexes.indexOf(tokenIndex);
    if (position >= 0) { setCurrentIndex(position); onUpdateBook(book.id, Math.round(((position + 1) / Math.max(1, wordIndexes.length)) * 100)); }
    const existing = difficultWords.find((item) => item.word.toLowerCase() === clean.toLowerCase());
    onAddWord({ word: clean, chunks: chunkWord(clean), attempts: (existing?.attempts || 0) + 1, lastSeen: new Date().toISOString() });
  };
  const finish = () => {
    const wordsRead = Math.min(wordIndexes.length, currentIndex + 1);
    onUpdateBook(book.id, 100); setDone(true);
    onFinish({ bookId: book.id, startedAt: new Date(startedAt).toISOString(), duration: Math.max(1, Math.round((Date.now() - startedAt) / 1000)), wordsRead, struggleCount: struggles, averageRecoverySeconds: struggles ? 8 : 0 });
  };
  return <AppShell profile={profile} language={language} setLanguage={setLanguage} onReset={onReset}><div className="mx-auto max-w-7xl px-5 py-6 sm:px-10 lg:px-14 lg:py-9">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><button type="button" onClick={() => setLocation(profile.mode === "child" ? "/child" : "/adult")} data-testid="button-back-reader" className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><ArrowLeft size={17} /> {t("back")}</button><div className="flex items-center gap-3"><span className="font-mono-coco text-xs text-[hsl(var(--muted-foreground))]">{book.progress}% {t("progress")}</span><IconButton icon={settings.dyslexiaFont ? Sun : Moon} label={settings.dyslexiaFont ? "Standard type" : "Dyslexia type"} onClick={() => document.body.classList.toggle("dark")} /></div></div>
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_310px]"><article className={`paper-card relative rounded-[28px] p-6 sm:p-10 lg:p-14 ${settings.dyslexiaFont ? "tracking-[.025em]" : ""}`} style={{ fontSize: `${settings.textSize}px`, lineHeight: settings.lineSpacing }}>
       <div className="mb-10 flex items-start justify-between border-b border-[hsl(var(--border))] pb-7"><div><p className="font-mono-coco text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">{book.format} / {book.author}</p><h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{book.title}</h1><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Listen to the whole lesson in a calm, steady voice.</p></div><button type="button" onClick={speakLesson} aria-label="Listen to whole lesson" data-testid="button-speak-lesson" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]"><Volume2 size={21} /></button></div>
      {book.format !== "TXT" && <div role="status" className="mb-8 flex gap-3 rounded-2xl border border-[hsl(var(--accent))] bg-[hsl(var(--secondary))] p-4 text-sm leading-relaxed text-[hsl(var(--foreground))]"><CircleHelp className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" size={18} />{t("extraction")}</div>}
      <p className="reader-copy max-w-3xl text-[1em]">{tokens.map((token, index) => /\S/.test(token) ? <button type="button" key={`${token}-${index}`} onClick={() => chooseWord(token, index)} data-testid={`word-${index}`} className={`rounded px-0.5 text-left transition hover:bg-[hsl(var(--accent)/.35)] focus:bg-[hsl(var(--accent)/.5)] ${index === currentTokenIndex ? "bg-[hsl(var(--accent)/.4)] underline decoration-[hsl(var(--accent))] decoration-2 underline-offset-4" : ""}`}>{token}</button> : <span key={`${token}-${index}`}>{token}</span>)}</p>
      <div className="mt-12 border-t border-[hsl(var(--border))] pt-6"><div className="mb-3 flex justify-between text-xs font-bold text-[hsl(var(--muted-foreground))]"><span>Reading trail</span><span>{Math.round(((currentIndex + 1) / Math.max(1, wordIndexes.length)) * 100)}%</span></div><ProgressBar value={((currentIndex + 1) / Math.max(1, wordIndexes.length)) * 100} accent /><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => { const next = Math.min(wordIndexes.length - 1, currentIndex + 1); setCurrentIndex(next); onUpdateBook(book.id, Math.round(((next + 1) / Math.max(1, wordIndexes.length)) * 100)); }} data-testid="button-next-word" className="coco-button flex items-center gap-2 rounded-2xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]">{t("next")} <ChevronRight size={16} /></button><button type="button" onClick={() => speak(selectedWord || tokens[currentTokenIndex] || "")} data-testid="button-listen-word" className="flex items-center gap-2 rounded-2xl border border-[hsl(var(--border))] px-4 py-3 text-sm font-bold"><Headphones size={16} /> {isSpeaking ? "Playing…" : t("listen")}</button>{!done && <button type="button" onClick={finish} data-testid="button-finish-mission" className="ml-auto flex items-center gap-2 rounded-2xl bg-[hsl(var(--accent))] px-4 py-3 text-sm font-bold"><Check size={16} /> {t("finish")}</button>}</div></div>
    </article>
    <aside className="space-y-5"><div className="paper-card rounded-[24px] p-5"><div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--accent))]"><Brain size={19} /></div><div><h2 className="font-bold">{t("soundSteps")}</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">{t("tapWord")}</p></div></div>{selectedWord ? <div className="rounded-2xl bg-[hsl(var(--secondary))] p-4" data-testid="panel-word-support"><p className="font-display text-3xl">{selectedWord}</p><div className="mt-3 flex flex-wrap gap-2">{chunkWord(selectedWord).map((chunk, index) => <span key={`${chunk}-${index}`} className="rounded-lg bg-[hsl(var(--card))] px-2 py-1 font-mono-coco text-sm font-medium shadow-sm">{chunk}</span>)}</div><button type="button" onClick={() => speak(selectedWord)} data-testid="button-pronounce-selected" className="mt-4 flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]"><Volume2 size={16} /> {t("listen")}</button></div> : <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{t("tapWord")}</div>}</div>
      <div className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--card))]"><Headphones size={18} className="text-[hsl(var(--primary))]" /></div><div><h2 className="font-bold">Calm reading voice</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Tap Listen for a gentle, steady reading pace.</p></div></div><button type="button" onClick={speakLesson} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--card))] px-3 py-2 text-sm font-bold text-[hsl(var(--primary))]" data-testid="button-listen-lesson"> <Volume2 size={16} /> Listen to whole lesson</button></div>
      <div className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--secondary))]"><Webcam size={18} className="text-[hsl(var(--primary))]" /></div><div><h2 className="font-bold">Read with camera</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Only if you choose. Audio help always stays on.</p></div></div>{cameraPermission === "granted" && <p role="status" className="mt-3 text-xs font-bold text-[hsl(var(--primary))]">Camera ready for this reading.</p>}{cameraPermission === "denied" && <p role="status" className="mt-3 text-xs font-bold text-[hsl(var(--muted-foreground))]">That’s okay — keep reading with audio help.</p>}{cameraPermission !== "granted" && <button type="button" disabled={cameraBusy} onClick={askCamera} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-3 py-2 text-sm font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-60" data-testid="button-reader-camera">{cameraBusy ? "Waiting for your choice…" : "Turn on camera"} <Webcam size={16} /></button>}</div>
      {done && <div className="reveal rounded-[24px] bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] shadow-[4px_4px_0_hsl(var(--accent))]" data-testid="status-completion"><Trophy className="mb-5 text-[hsl(var(--accent))]" size={30} /><p className="font-mono-coco text-[10px] tracking-[.2em]">{t("completed")}</p><h2 className="mt-2 font-display text-4xl">{t("brave")}</h2><p className="mt-3 text-sm text-[hsl(var(--primary-foreground)/.8)]">{t("amazing")}. This page is yours now.</p><button type="button" onClick={() => setLocation(profile.mode === "child" ? "/child" : "/adult")} data-testid="button-return-home" className="mt-5 rounded-xl bg-[hsl(var(--accent))] px-4 py-2 text-sm font-bold text-[hsl(var(--foreground))]">Return home</button></div>}</aside></div>
  </div></AppShell>;
}

function PrivacyPage({ settings, onUpdate, language, setLanguage, profile, onReset }: { settings: Settings; onUpdate: (next: Partial<Settings>) => void; language: Language; setLanguage: (l: Language) => void; profile: Profile; onReset: () => void }) {
  const t = (key: string) => copy[language][key] || copy.en[key] || key;
  return <AppShell profile={profile} language={language} setLanguage={setLanguage} onReset={onReset}><div className="mx-auto max-w-4xl px-5 py-10 sm:px-10 lg:px-14 lg:py-16"><PageIntro eyebrow="A choice you own" title={t("privacy")} description="Camera help is offered only while you are reading, so you can decide in the moment." /><div className="grid gap-5 md:grid-cols-2"><section className="paper-card rounded-[28px] p-7 sm:p-9"><div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--secondary))]"><LockKeyhole size={27} className="text-[hsl(var(--primary))]" /></div><h2 className="font-display text-3xl">Your reading stays yours</h2><p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">COCO keeps your books and reading steps on this device. Nothing is shared, and camera help never begins on its own.</p><div className="mt-6 flex items-start gap-3 rounded-2xl bg-[hsl(var(--secondary))] p-4 text-sm"><Check size={18} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" /><span>When you open a book, you can choose camera help or continue with audio and word support.</span></div></section><section className="rounded-[28px] bg-[hsl(var(--primary))] p-7 text-[hsl(var(--primary-foreground))] sm:p-9"><div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"><Headphones size={27} /></div><h2 className="font-display text-3xl">A calm voice is always here</h2><p className="mt-4 leading-relaxed text-[hsl(var(--primary-foreground)/.78)]">You never lose support by saying no. Listen to a word, hear the whole lesson, and move through every page at your own pace.</p><div className="mt-8 space-y-3 text-sm font-bold"><div className="flex items-center gap-3"><Check size={17} className="text-[hsl(var(--accent))]" /> Gentle voice support</div><div className="flex items-center gap-3"><Check size={17} className="text-[hsl(var(--accent))]" /> Your own books</div><div className="flex items-center gap-3"><Check size={17} className="text-[hsl(var(--accent))]" /> Your choice, every time</div></div><Link href={profile.mode === "child" ? "/child" : "/adult"} className="mt-9 flex items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--accent))] px-4 py-3 font-bold text-[hsl(var(--foreground))]" data-testid="link-return-reading">{t("back")} <ArrowRight size={17} /></Link></section></div></div></AppShell>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function AppRouter() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = usePersisted<Profile | null>("profile", null);
  const [books, setBooks] = usePersisted<Book[]>("books", demoBooks);
  const [sessions, setSessions] = usePersisted<ReadingSession[]>("sessions", []);
  const [difficultWords, setDifficultWords] = usePersisted<DifficultWord[]>("difficultWords", []);
  const [settings, setSettings] = usePersisted<Settings>("settings", { language: "en", textSize: 20, dyslexiaFont: true, lineSpacing: 1.75, gazeMode: false });
  const [rewards, setRewards] = usePersisted<Rewards>("rewards", { missionsCompleted: 2, streak: 4, badges: ["first-page", "sound-hunter"] });
  const language = profile?.language || settings.language;
  const setLanguage = (next: Language) => { setSettings((current) => ({ ...current, language: next })); if (profile) setProfile({ ...profile, language: next }); };
  const addBook = (book: Book) => setBooks((current) => [...current, book]);
  const openBook = (id: string) => setLocation(`/read/${id}`);
  const updateBook = (id: string, progress: number) => setBooks((current) => current.map((book) => book.id === id ? { ...book, progress: Math.max(book.progress, progress) } : book));
  const addWord = (word: DifficultWord) => setDifficultWords((current) => [word, ...current.filter((item) => item.word.toLowerCase() !== word.word.toLowerCase())]);
  const finish = (session: ReadingSession) => { setSessions((current) => [...current, session]); setRewards((current) => ({ ...current, missionsCompleted: current.missionsCompleted + 1, streak: Math.max(current.streak, 1) })); };
  const updateSettings = (next: Partial<Settings>) => setSettings((current) => ({ ...current, ...next }));
  const reset = () => { setProfile(null); setLocation("/"); };
  if (!profile) return <Switch><Route path="/privacy"><PrivacyPage settings={settings} onUpdate={updateSettings} language={language} setLanguage={setLanguage} profile={{ mode: "adult", name: "Reader", language }} onReset={reset} /></Route><Route component={() => <Welcome onStart={(mode, name) => { setProfile({ mode, name, language }); setLocation(`/${mode}`); }} language={language} setLanguage={setLanguage} />} /></Switch>;
  return <RoutedErrorBoundary><Switch>
    <Route path="/child"><ChildHome books={books} rewards={rewards} difficultWords={difficultWords} onAdd={addBook} onOpen={openBook} language={language} setLanguage={setLanguage} profile={profile} onReset={reset} /></Route>
    <Route path="/adult"><AdultHome books={books} sessions={sessions} difficultWords={difficultWords} onAdd={addBook} onOpen={openBook} language={language} setLanguage={setLanguage} profile={profile} onReset={reset} /></Route>
    <Route path="/read/:bookId"><ReaderPage books={books} difficultWords={difficultWords} settings={settings} onUpdateBook={updateBook} onAddWord={addWord} onFinish={finish} language={language} setLanguage={setLanguage} profile={profile} onReset={reset} /></Route>
    <Route path="/privacy"><PrivacyPage settings={settings} onUpdate={updateSettings} language={language} setLanguage={setLanguage} profile={profile} onReset={reset} /></Route>
    <Route path="/"><Route component={() => { setLocation(profile.mode === "child" ? "/child" : "/adult"); return null; }} /></Route>
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><AppRouter /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;