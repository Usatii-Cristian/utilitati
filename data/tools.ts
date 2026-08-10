/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SINGURUL fisier pe care trebuie sa-l editezi ca sa adaugi tool-uri noi.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Adaugi un obiect nou in array-ul `tools` de mai jos:
 *
 *      {
 *        name: 'Nume Tool',
 *        url: 'https://exemplu.com',
 *        category: 'Dev Tools',              // orice string; categorie noua = pastila noua
 *        shortDescription: 'O propozitie.',  // apare pe card
 *        details: 'Ce face, pentru ce il folosesc, cand are sens sa-l deschid.',
 *        emoji: '🧰',                        // optional, fallback daca favicon-ul nu se incarca
 *      }
 *
 *  Categoriile se genereaza automat din date (in ordinea din `categoryOrder`).
 *  Accentele de culoare vin din `categoryAccents`; o categorie necunoscuta
 *  primeste accentul implicit, deci nimic nu se strica daca uiti sa-l setezi.
 */

export interface Tool {
  name: string;
  url: string;
  category: string;
  shortDescription: string;
  details: string;
  emoji?: string;
}

export const tools: Tool[] = [
  // ── Design & UI ────────────────────────────────────────────────────────────
  {
    name: 'Penpot',
    url: 'https://github.com/penpot/penpot',
    category: 'Design & UI',
    shortDescription: 'Alternativă open-source la Figma, self-hostabilă.',
    details:
      'Design colaborativ și prototipuri fără abonament — deployezi pe serverul tău, echipa lucrează pe aceleași fișiere, suportă design tokens și componente. Bun când vrei Figma dar fără cost lunar sau fără să-ți urce fișierele pe cloud străin.',
    emoji: '🎨',
  },
  {
    name: 'Aceternity UI',
    url: 'https://ui.aceternity.com',
    category: 'Design & UI',
    shortDescription: '200+ componente animate React/Next.js/Tailwind/Framer Motion.',
    details:
      'Componente gata făcute (hero sections, carduri 3D, butoane magnetice, ASCII art). Bun când vrei o interfață modernă rapid, fără să scrii animații complexe de la zero.',
    emoji: '✨',
  },
  {
    name: 'ReactBits',
    url: 'https://reactbits.dev',
    category: 'Design & UI',
    shortDescription: 'Componente React animate open-source, complet gratuite.',
    details:
      'Text effects, fundaluri, carduri, animații la scroll — similar cu Aceternity dar 100% gratuit, fără paywall. Bun pentru micro-interacțiuni și efecte vizuale rapide pe orice site React.',
    emoji: '⚛️',
  },
  {
    name: 'Haikei',
    url: 'https://haikei.app',
    category: 'Design & UI',
    shortDescription: 'Generator de fundaluri/forme SVG (valuri, bloburi, gradienți).',
    details:
      'Faci un fundal unic pentru hero section în câteva secunde, fără Photoshop/Illustrator. Exporți PNG sau SVG direct. Bun când ai nevoie de un vizual rapid pentru o secțiune de site.',
    emoji: '🌊',
  },
  {
    name: 'LottieFiles',
    url: 'https://lottiefiles.com',
    category: 'Design & UI',
    shortDescription: 'Bibliotecă de animații Lottie ușoare.',
    details:
      'Loading spinners, iconițe animate, mascote — fișiere mici care nu îngreunează pagina. Are și editor pentru ajustat animația la proiect. Bun pentru micro-interacțiuni (buton de succes, loading state).',
    emoji: '🎞️',
  },
  {
    name: 'Mobbin',
    url: 'https://mobbin.com',
    category: 'Design & UI',
    shortDescription: 'Screenshot-uri reale de UI din mii de aplicații.',
    details:
      'Cauți cum au rezolvat alții un flow (onboarding, checkout, empty state) și ai exemple reale, organizate pe pattern. Bun când nu știi cum să structurezi un ecran și vrei referință rapidă.',
    emoji: '📱',
  },

  // ── AI Tools ───────────────────────────────────────────────────────────────
  {
    name: 'Whisper',
    url: 'https://github.com/openai/whisper',
    category: 'AI Tools',
    shortDescription: 'Transcriere audio-în-text, 99 de limbi, open-source.',
    details:
      'Transcrii interviuri, podcasturi, notițe vocale — gratuit, rulează local, fără abonament. Bun ca bază pentru subtitrări sau orice ai nevoie de speech-to-text.',
    emoji: '🎙️',
  },
  {
    name: 'CosyVoice',
    url: 'https://github.com/FunAudioLLM/CosyVoice',
    category: 'AI Tools',
    shortDescription: 'TTS cu clonare de voce, 9 limbi, rulează local.',
    details:
      'Generezi voce sintetică (inclusiv clonată) controlând emoție, viteză și dialect prin text, prin Docker/vLLM. Bun când ai nevoie de voice-over personalizat fără actor vocal.',
    emoji: '🗣️',
  },
  {
    name: 'Fooocus',
    url: 'https://github.com/lllyasviel/Fooocus',
    category: 'AI Tools',
    shortDescription: 'Generare de imagini AI local, gratuit.',
    details:
      'Alternativă la Midjourney (care costă 30$/lună) — rulează pe PC-ul tău, fără cenzură, fără net. Scrii promptul, primești imaginea. Bun pentru artă/concept fără abonament.',
    emoji: '🖼️',
  },
  {
    name: 'AutoSubs',
    url: 'https://github.com/tmoroney/auto-subs',
    category: 'AI Tools',
    shortDescription: 'Generator local de subtitrări cu integrare DaVinci/Premiere/AE.',
    details:
      'Transcriere, diarizare (cine vorbește) și traducere pe 100+ limbi, tot local, fără cloud. Bun de folosit direct în timeline-ul de editare video.',
    emoji: '💬',
  },
  {
    name: 'Remove-AI-Watermarks',
    url: 'https://github.com/wiltodelta/remove-ai-watermarks',
    category: 'AI Tools',
    shortDescription: 'Elimină watermark-uri din imagini generate AI.',
    details:
      'Șterge SynthID, C2PA, tag-uri EXIF "made with AI" și logo-uri vizibile din imagini Gemini/ChatGPT/Midjourney etc. Bun când ai nevoie de imaginea curată, fără label-uri.',
    emoji: '🧽',
  },
  {
    name: '500 AI Agents Projects',
    url: 'https://github.com/ashishpatel26/500-AI-Agents-Projects',
    category: 'AI Tools',
    shortDescription: '500+ proiecte de agenți AI cu cod funcțional.',
    details:
      'Exemple gata de rulat pe LangGraph, CrewAI, AutoGen, Agno — acoperă domenii diferite (finance, retail, cybersecurity etc). Bun ca punct de plecare când vrei să construiești un agent AI și nu știi de unde să începi.',
    emoji: '🤖',
  },
  {
    name: 'llmfit',
    url: 'https://github.com/AlexsJones/llmfit',
    category: 'AI Tools',
    shortDescription: 'Îți spune ce modele LLM rulează efectiv pe hardware-ul tău.',
    details:
      'O singură comandă scanează CPU/GPU/RAM și îți arată, din sute de modele și provideri, ce intră la tine — acoperă GGUF, MLX și Unsloth. Bun înainte să descarci 40GB degeaba: afli din start dacă modelul încape în VRAM sau o să se târască pe CPU.',
    emoji: '📏',
  },
  {
    name: 'OpenLLM',
    url: 'https://github.com/bentoml/OpenLLM',
    category: 'AI Tools',
    shortDescription: 'Rulează orice LLM open-source ca API compatibil OpenAI.',
    details:
      'Pornești Llama, DeepSeek sau Mistral cu o comandă și primești un endpoint identic cu cel OpenAI — codul existent merge neschimbat, doar schimbi base URL-ul. Bun când vrei să scapi de costul per token sau să ții datele pe infrastructura ta.',
    emoji: '🦙',
  },
  {
    name: 'Hermes Agent',
    url: 'https://github.com/NousResearch/hermes-agent',
    category: 'AI Tools',
    shortDescription: 'Agent AI de la Nous Research care își păstrează contextul între sesiuni.',
    details:
      'Agent care ține minte ce ai lucrat și se adaptează la felul tău de a lucra, cu suport pentru mai mulți provideri (OpenAI, Anthropic etc). Bun ca alternativă self-hosted la agenții closed-source, când vrei control pe prompturi și pe memoria agentului.',
    emoji: '🧠',
  },

  // ── Dev Tools ──────────────────────────────────────────────────────────────
  {
    name: 'Sentry',
    url: 'https://sentry.io',
    category: 'Dev Tools',
    shortDescription: 'Monitorizare erori și performanță în producție.',
    details:
      'Vezi exact unde și de ce pică aplicația — trace-uri, logs, session replay. Are AI care găsește cauza și propune fix. Bun de integrat în orice proiect Next.js live, ca să prinzi bug-uri înainte să-ți spună clientul.',
    emoji: '🚨',
  },
  {
    name: 'Snyk',
    url: 'https://snyk.io',
    category: 'Dev Tools',
    shortDescription: 'Scanare de securitate pentru cod și dependințe.',
    details:
      'Găsește vulnerabilități în cod, pachete npm, containere și infrastructură — inclusiv cod scris de AI. Bun de rulat înainte de deploy, mai ales la proiecte cu date sensibile (ex. magazin online).',
    emoji: '🛡️',
  },
  {
    name: 'ImageMagick WebUI',
    url: 'https://github.com/PrzemekSkw/imagemagick-webui',
    category: 'Dev Tools',
    shortDescription: 'Interfață web pentru ImageMagick.',
    details:
      'Resize batch, eliminare fundal, conversii de format, preview live — fără linie de comandă, self-hostabil prin Docker. Bun pentru procesat multe imagini rapid (ex. poze produse pentru un site).',
    emoji: '🪄',
  },
  {
    name: 'Android Architecture Samples',
    url: 'https://github.com/android/architecture-samples',
    category: 'Dev Tools',
    shortDescription: 'Exemple oficiale Google de arhitectură Android.',
    details:
      'Bune practici cu ViewModel, LiveData, Room pentru diverse abordări de structurare a codului. Util doar dacă faci și Android nativ, ca referință.',
    emoji: '🤖',
  },
  {
    name: 'Tesseract.js',
    url: 'https://github.com/naptha/tesseract.js',
    category: 'Dev Tools',
    shortDescription: 'OCR pur în JavaScript, 100+ limbi, rulează direct în browser.',
    details:
      'Extragi text din imagini și scan-uri direct în browser sau în Node, prin WebAssembly — fără server, fără API plătit, fără să trimiți pozele nicăieri. Bun când vrei să citești automat facturi, bonuri sau screenshot-uri într-o aplicație web.',
    emoji: '🔤',
  },
  {
    name: 'Awesome Cloudflare',
    url: 'https://github.com/zhuima/awesome-cloudflare',
    category: 'Dev Tools',
    shortDescription: 'Listă curată de tool-uri și proiecte open-source pe Cloudflare.',
    details:
      'Adună Workers, Pages, R2, tunnels, plus proiecte gata făcute, ghiduri și bloguri, organizate pe categorii. Bun când vrei să hostezi ceva gratuit pe edge și cauți ce a construit deja lumea, în loc să pornești de la zero.',
    emoji: '⛅',
  },

  // ── Apps & Utilitare ───────────────────────────────────────────────────────
  {
    name: 'Brave Browser',
    url: 'https://github.com/brave/brave-browser',
    category: 'Apps & Utilitare',
    shortDescription: 'Browser Chromium cu ad-block nativ.',
    details:
      'Blochează reclame și tracker-e din start, mai rapid ca Chrome, suportă toate extensiile Chrome. Bun ca browser zilnic, privat.',
    emoji: '🦁',
  },
  {
    name: 'Seelen UI',
    url: 'https://github.com/eythaann/Seelen-UI',
    category: 'Apps & Utilitare',
    shortDescription: 'Înlocuiește complet desktopul Windows.',
    details:
      'Taskbar, dock, window manager și launcher custom, teme prin CSS, 70+ limbi. Bun dacă vrei un desktop Windows care arată/simte ca macOS sau un Linux tiling.',
    emoji: '🖥️',
  },
  {
    name: 'Kodi (XBMC)',
    url: 'https://github.com/xbmc/xbmc',
    category: 'Apps & Utilitare',
    shortDescription: 'Media player open-source pentru video/muzică/poze.',
    details:
      'Suportă plugin-uri, teme, storage de rețea. Bun ca hub media central, de exemplu pe un mini PC conectat la TV.',
    emoji: '📺',
  },
  {
    name: 'FileExplorer',
    url: 'https://github.com/conaticus/FileExplorer',
    category: 'Apps & Utilitare',
    shortDescription: 'Manager de fișiere rapid (Rust + Tauri).',
    details:
      'Caută fișiere în ~15ms (vs minute la Explorer standard), suportă SFTP, preview, hashing, permisiuni. Bun ca înlocuitor rapid pentru Windows Explorer.',
    emoji: '📂',
  },
  {
    name: 'Awesome Free Apps',
    url: 'https://github.com/Axorax/awesome-free-apps',
    category: 'Apps & Utilitare',
    shortDescription: 'Listă curată de aplicații gratuite.',
    details:
      'Organizată pe Windows/macOS/Linux/mobil și pe categorii (open-source, recomandate). Bun când cauți o alternativă gratuită la ceva plătit.',
    emoji: '🎁',
  },
  {
    name: 'FreeCut',
    url: 'https://github.com/walterlow/freecut',
    category: 'Apps & Utilitare',
    shortDescription: 'Editor video în browser, fără instalare.',
    details:
      'Multi-track, keyframes, timp real, salvează proiectele local, procesarea se face în browser. Bun pentru editări video rapide fără soft greu instalat.',
    emoji: '✂️',
  },
  {
    name: 'Helium',
    url: 'https://github.com/imputnet/helium',
    category: 'Apps & Utilitare',
    shortDescription: 'Browser Chromium curățat de telemetrie și de reclame.',
    details:
      'Build de Chromium fără tracking și fără servicii Google pornite din start, cu blocare de reclame inclusă; există și pentru Windows, și pentru macOS. Bun ca browser zilnic dacă vrei intimitate reală, fără cripto și programe de recompense.',
    emoji: '🎈',
  },
  {
    name: 'Palmier Pro',
    url: 'https://github.com/palmier-io/palmier-pro',
    category: 'Apps & Utilitare',
    shortDescription: 'Editor video nativ de macOS construit în jurul agenților AI.',
    details:
      'Editor scris în Swift, cu suport MCP: îi dai instrucțiuni unui agent (Claude & co.) și el operează pe timeline în locul tău, nu doar generează clipuri. Open-source, GPL-3.0. ATENȚIE: e doar pentru macOS — pe Windows nu îl poți rula; alternativa cross-platform e forkul OpenTake (Rust + Tauri).',
    emoji: '🌴',
  },
  {
    name: 'OpenCut',
    url: 'https://github.com/OpenCut-app/OpenCut',
    category: 'Apps & Utilitare',
    shortDescription: 'Alternativă open-source la CapCut, direct în browser.',
    details:
      'Editor video cu timeline multi-track, fără watermark, fără abonament și fără să-ți urce clipurile pe serverele nimănui. Bun pentru montaje rapide de social media, când CapCut te oprește la paywall.',
    emoji: '🎬',
  },

  // ── OSINT & Research ───────────────────────────────────────────────────────
  {
    name: 'Social Analyzer',
    url: 'https://github.com/qeeqbox/social-analyzer',
    category: 'OSINT & Research',
    shortDescription: 'Caută profiluri de social media pe +1000 platforme.',
    details:
      'API, CLI și aplicație web pentru analiza și găsirea profilurilor unei persoane după username/nume. Bun pentru research rapid sau verificare de identitate online.',
    emoji: '🔎',
  },
];

/**
 * Ordinea pastilelor de categorie. Categoriile care apar in `tools` dar lipsesc
 * de aici sunt adaugate automat la final, in ordinea primei aparitii.
 */
export const categoryOrder: string[] = [
  'Design & UI',
  'AI Tools',
  'Dev Tools',
  'Apps & Utilitare',
  'OSINT & Research',
];

/** Accent de culoare per categorie (folosit pe border, glow, badge). */
export const categoryAccents: Record<string, string> = {
  'Design & UI': '#ff6b9d',
  'AI Tools': '#c9f24e',
  'Dev Tools': '#4ecdf2',
  'Apps & Utilitare': '#ffb057',
  'OSINT & Research': '#b18cff',
};

export const DEFAULT_ACCENT = '#c9f24e';

export function accentFor(category: string): string {
  return categoryAccents[category] ?? DEFAULT_ACCENT;
}
