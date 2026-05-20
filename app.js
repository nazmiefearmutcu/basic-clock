/* ==========================================================
   Basic Clock — app.js
   Adds personalization (name, greeting, motto, accent, layout,
   date format, blink, fx toggle, scanlines) on top of the
   existing clock / alarms / timer / audio model.
   ========================================================== */

const STORAGE_KEY = "basic-clock-en-v1";

const ACCENT_OPTIONS = {
  matrix:       ["#39ff88", "#7af0ff", "#f5ff7a", "#ff8aff"],
  bladerunner:  ["#ff7a1a", "#ffb86b", "#2bd4e4", "#ff3b6b"],
  alien:        ["#ffb000", "#ff3b3b", "#5ad36b", "#ffd07a"],
  pinkie:       ["#ff4ea8", "#ffd83a", "#5fd9ff", "#a455ff"],
  rainbow:      ["#2db7ff", "#ff4d6d", "#ffd83a", "#a455ff"],
  interstellar: ["#e8b76f", "#8ec5ff", "#f4d9a0", "#ffffff"]
};
const ACCENT_2_PAIRS = {
  "#39ff88": "#b6ffd0", "#7af0ff": "#e1faff", "#f5ff7a": "#fff7c0", "#ff8aff": "#ffd6ff",
  "#ff7a1a": "#2bd4e4", "#ffb86b": "#2bd4e4", "#2bd4e4": "#ff7a1a", "#ff3b6b": "#2bd4e4",
  "#ffb000": "#ff3b3b", "#ff3b3b": "#ffb000", "#5ad36b": "#ffb000", "#ffd07a": "#ff3b3b",
  "#ff4ea8": "#ffd83a", "#ffd83a": "#ff4ea8", "#5fd9ff": "#ff4ea8", "#a455ff": "#ffd83a",
  "#2db7ff": "#ff4d6d", "#ff4d6d": "#ffd83a",
  "#e8b76f": "#8ec5ff", "#8ec5ff": "#e8b76f", "#f4d9a0": "#8ec5ff", "#ffffff": "#e8b76f"
};

const THEME_DEFAULT_ACCENTS = {
  matrix: "#39ff88",
  bladerunner: "#ff7a1a",
  alien: "#ffb000",
  pinkie: "#ff4ea8",
  rainbow: "#2db7ff",
  interstellar: "#e8b76f"
};

/* Iconic quotes per theme — rotate every ~18s, click to advance. */
const THEME_QUOTES = {
  matrix: [
    "Wake up, Neo.",
    "There is no spoon.",
    "Follow the white rabbit.",
    "Free your mind."
  ],
  bladerunner: [
    "All those moments, lost in time.",
    "More human than human.",
    "Cells. Interlinked. Within cells interlinked.",
    "I want more life."
  ],
  alien: [
    "In space, no one can hear you scream.",
    "Final report of the Nostromo.",
    "Stay frosty.",
    "Signing off."
  ],
  pinkie: [
    "Smile, smile, smile!",
    "Oatmeal? Are you crazy?",
    "Forever! And ever!",
    "Today is gonna be the best day!"
  ],
  rainbow: [
    "20% cooler.",
    "Sonic Rainboom!",
    "Loyalty above all.",
    "I don't do slow."
  ],
  interstellar: [
    "Do not go gentle into that good night.",
    "We used to look up and wonder.",
    "Love is the one thing that transcends time and space.",
    "Maybe we've already found it.",
    "Rage, rage against the dying of the light."
  ]
};

const el = {
  html: document.documentElement,
  brandHome: document.getElementById("brandHome"),
  tabs: [...document.querySelectorAll("[data-tab-target]")],
  pages: [...document.querySelectorAll(".page")],

  greetingEyebrow: document.getElementById("greetingEyebrow"),
  greetingName: document.getElementById("greetingName"),

  dateLabel: document.getElementById("dateLabel"),
  timezoneLabel: document.getElementById("timezoneLabel"),
  digitalClock: document.getElementById("digitalClock"),
  ckHH: null, ckMM: null, ckSS: null,
  nextAlarmLabel: document.getElementById("nextAlarmLabel"),
  audioStatus: document.getElementById("audioStatus"),

  unlockAudio: document.getElementById("unlockAudio"),
  alarmForm: document.getElementById("alarmForm"),
  alarmTime: document.getElementById("alarmTime"),
  alarmLabel: document.getElementById("alarmLabel"),
  alarmSound: document.getElementById("alarmSound"),
  alarmList: document.getElementById("alarmList"),
  quickOne: document.getElementById("quickOne"),
  quickTen: document.getElementById("quickTen"),
  quickTestAlarm: document.getElementById("quickTestAlarm"),
  testAlarmSound: document.getElementById("testAlarmSound"),
  testTimerSound: document.getElementById("testTimerSound"),

  timerDisplay: document.getElementById("timerDisplay"),
  timerProgressBar: document.getElementById("timerProgressBar"),
  timerMinutes: document.getElementById("timerMinutes"),
  timerSeconds: document.getElementById("timerSeconds"),
  startTimer: document.getElementById("startTimer"),
  pauseTimer: document.getElementById("pauseTimer"),
  resetTimer: document.getElementById("resetTimer"),
  startThreeSecondTimer: document.getElementById("startThreeSecondTimer"),
  timerPresets: [...document.querySelectorAll("[data-timer-preset]")],

  themeSelect: null, // legacy reference removed; use theme-pick cards
  themeCards: [...document.querySelectorAll("[data-theme-pick]")],
  layoutSeg: document.querySelector('[data-seg="layout"]'),
  accentSwatches: document.getElementById("accentSwatches"),

  displayName: document.getElementById("displayName"),
  greetingStyle: document.getElementById("greetingStyle"),
  customMotto: document.getElementById("customMotto"),

  defaultAlarmSound: document.getElementById("defaultAlarmSound"),
  defaultTimerSound: document.getElementById("defaultTimerSound"),
  volumeRange: document.getElementById("volumeRange"),
  mutedToggle: document.getElementById("mutedToggle"),
  hourToggle: document.getElementById("hourToggle"),
  secondsToggle: document.getElementById("secondsToggle"),
  blinkToggle: document.getElementById("blinkToggle"),
  dateFormat: document.getElementById("dateFormat"),
  fxToggle: document.getElementById("fxToggle"),
  scanlinesToggle: document.getElementById("scanlinesToggle"),
  resetSettings: document.getElementById("resetSettings"),

  ringDialog: document.getElementById("ringDialog"),
  ringKind: document.getElementById("ringKind"),
  ringTitle: document.getElementById("ringTitle"),
  ringDetail: document.getElementById("ringDetail"),
  stopRing: document.getElementById("stopRing"),
  snoozeRing: document.getElementById("snoozeRing"),
  toast: document.getElementById("toast"),

  bgFx: document.getElementById("bgFx"),
};
el.ckHH = el.digitalClock.querySelector(".ck-hh");
el.ckMM = el.digitalClock.querySelector(".ck-mm");
el.ckSS = el.digitalClock.querySelector(".ck-ss");

const defaults = {
  settings: {
    theme: "matrix",
    layout: "split",
    accent: null, // null → use theme default
    hour12: false,
    showSeconds: true,
    blink: true,
    muted: false,
    volume: 0.72,
    defaultAlarmSound: "bell",
    defaultTimerSound: "triple",
    displayName: "",
    greetingStyle: "time",
    customMotto: "",
    dateFormat: "long",
    fx: true,
    scanlines: true
  },
  alarms: [],
  timer: {
    duration: 60,
    remaining: 60,
    running: false,
    endsAt: null
  }
};

let state = loadState();
let currentRing = null;
const soundEvents = [];
const audio = { context: null, master: null, nodes: new Set(), repeatHandle: null, unlocked: false };

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return structuredClone(defaults);
    return {
      settings: { ...defaults.settings, ...parsed.settings },
      alarms: Array.isArray(parsed.alarms) ? parsed.alarms : [],
      timer: { ...defaults.timer, ...parsed.timer, running: false, endsAt: null }
    };
  } catch { return structuredClone(defaults); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid() { return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()); }

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => el.toast.classList.remove("show"), 2400);
}

/* ---------------- Settings application ---------------- */

function applySettings() {
  const s = state.settings;

  el.html.dataset.theme = s.theme;
  el.html.dataset.layout = s.layout;
  el.html.dataset.fx = s.fx ? "on" : "off";
  el.html.dataset.scanlines = s.scanlines ? "on" : "off";
  el.html.dataset.showSeconds = s.showSeconds ? "on" : "off";
  el.html.dataset.blink = s.blink ? "on" : "off";

  // Accent override
  const accent = s.accent || THEME_DEFAULT_ACCENTS[s.theme];
  const accent2 = ACCENT_2_PAIRS[accent] || accent;
  el.html.style.setProperty("--accent", accent);
  el.html.style.setProperty("--accent-2", accent2);
  el.html.style.setProperty("--accent-soft", hexA(accent, 0.16));

  // Reflect form controls
  el.themeCards.forEach(c => c.setAttribute("aria-pressed", c.dataset.themePick === s.theme ? "true" : "false"));
  if (el.layoutSeg) {
    [...el.layoutSeg.querySelectorAll("[data-seg-val]")].forEach(b => b.setAttribute("aria-pressed", b.dataset.segVal === s.layout ? "true" : "false"));
  }
  el.defaultAlarmSound.value = s.defaultAlarmSound;
  el.defaultTimerSound.value = s.defaultTimerSound;
  el.volumeRange.value = s.volume;
  el.mutedToggle.checked = s.muted;
  el.hourToggle.checked = s.hour12;
  el.secondsToggle.checked = s.showSeconds;
  el.blinkToggle.checked = s.blink;
  el.fxToggle.checked = s.fx;
  el.scanlinesToggle.checked = s.scanlines;
  el.dateFormat.value = s.dateFormat;
  el.displayName.value = s.displayName;
  el.greetingStyle.value = s.greetingStyle;
  el.customMotto.value = s.customMotto;
  el.alarmSound.value = s.defaultAlarmSound;

  renderAccentSwatches();
  renderGreeting();
  startFx(); // restart bg effects for the current theme
  updateAudioStatus();
  updateMasterGain();
}

function hexA(hex, alpha) {
  const m = hex.replace("#", "");
  const v = m.length === 3 ? m.split("").map(c => c + c).join("") : m;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function renderAccentSwatches() {
  const opts = ACCENT_OPTIONS[state.settings.theme] || [];
  const current = state.settings.accent || THEME_DEFAULT_ACCENTS[state.settings.theme];
  el.accentSwatches.replaceChildren();
  for (const c of opts) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.style.setProperty("--c", c);
    b.setAttribute("aria-label", `Accent ${c}`);
    b.setAttribute("aria-pressed", c === current ? "true" : "false");
    b.addEventListener("click", () => {
      state.settings.accent = c;
      saveState();
      applySettings();
    });
    el.accentSwatches.append(b);
  }
}

/* ---------------- Greeting + iconic quote rotation ---------------- */

let quoteState = { theme: null, list: [], idx: 0, timer: 0 };

function timeGreeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}

function pickQuoteForTheme(theme) {
  const list = THEME_QUOTES[theme] || THEME_QUOTES.matrix;
  // Stable random shuffle anchored on theme + minute, so consecutive renders are stable
  return list;
}

function startQuoteRotation() {
  window.clearInterval(quoteState.timer);
  if (state.settings.greetingStyle !== "time") return;
  quoteState.timer = window.setInterval(() => {
    quoteState.idx = (quoteState.idx + 1) % quoteState.list.length;
    swapQuoteText(quoteState.list[quoteState.idx]);
  }, 18000);
}

function swapQuoteText(text) {
  el.greetingName.classList.add("fading");
  window.setTimeout(() => {
    el.greetingName.textContent = text;
    el.greetingName.classList.remove("fading");
  }, 260);
}

function renderGreeting() {
  const s = state.settings;
  const name = (s.displayName || "").trim();
  const eyebrowParent = el.greetingEyebrow.parentElement;

  // Reset quote rotation when (re)rendering
  window.clearInterval(quoteState.timer);

  if (s.greetingStyle === "off") { eyebrowParent.style.display = "none"; return; }
  eyebrowParent.style.display = "";

  let eyebrow = "";
  let line = "";
  let isQuote = false;

  switch (s.greetingStyle) {
    case "static":
      eyebrow = name ? timeGreeting() : "Hi there";
      line = name ? `${name}.` : "Welcome back.";
      break;
    case "motto":
      eyebrow = timeGreeting();
      line = (s.customMotto || "").trim() || (name ? `${name}, make today count.` : "Make today count.");
      break;
    case "time":
    default:
      eyebrow = name ? `${timeGreeting()}, ${name}` : timeGreeting();
      // Choose theme quote list; start a rotation
      quoteState.theme = s.theme;
      quoteState.list = pickQuoteForTheme(s.theme).slice();
      // Randomize starting index for variety
      quoteState.idx = Math.floor(Math.random() * quoteState.list.length);
      line = quoteState.list[quoteState.idx];
      isQuote = true;
      break;
  }

  el.greetingEyebrow.textContent = eyebrow;
  el.greetingName.textContent = line;
  el.greetingName.dataset.noQuotes = isQuote ? "false" : "true";
  el.greetingName.setAttribute("title", isQuote ? "Click for the next line" : "");

  if (isQuote) startQuoteRotation();
}

function cycleQuote() {
  if (state.settings.greetingStyle !== "time" || !quoteState.list.length) return;
  quoteState.idx = (quoteState.idx + 1) % quoteState.list.length;
  swapQuoteText(quoteState.list[quoteState.idx]);
  startQuoteRotation(); // reset interval
}

/* ---------------- Audio ---------------- */

async function ensureAudio() {
  if (!audio.context) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) { audio.unlocked = false; updateAudioStatus(); return false; }
    audio.context = new AudioCtor();
    audio.master = audio.context.createGain();
    audio.master.connect(audio.context.destination);
    updateMasterGain();
  }
  if (audio.context.state === "suspended") {
    try { await audio.context.resume(); } catch { audio.unlocked = false; }
  }
  audio.unlocked = audio.context.state === "running";
  updateAudioStatus();
  return audio.unlocked;
}
function updateMasterGain() {
  if (!audio.master) return;
  audio.master.gain.value = state.settings.muted ? 0 : state.settings.volume;
}
function updateAudioStatus() {
  const base = audio.unlocked ? "Ready" : "Locked";
  el.audioStatus.textContent = state.settings.muted ? `${base}, muted` : base;
}
function soundPattern(soundName) {
  const patterns = {
    bell:  [{f:880,t:0,d:0.22},{f:660,t:0.24,d:0.22},{f:990,t:0.49,d:0.32}],
    pulse: [{f:392,t:0,d:0.18},{f:392,t:0.28,d:0.18},{f:523,t:0.56,d:0.24}],
    triple:[{f:523,t:0,d:0.16},{f:659,t:0.18,d:0.16},{f:784,t:0.36,d:0.22}]
  };
  return patterns[soundName] || patterns.bell;
}
async function playSound(kind, soundName) {
  const unlocked = await ensureAudio();
  const resolvedSound = soundName || (kind === "timer" ? state.settings.defaultTimerSound : state.settings.defaultAlarmSound);
  soundEvents.push({ type: kind, sound: resolvedSound, at: new Date().toISOString(), audioContextState: audio.context?.state || "missing", muted: state.settings.muted });
  if (!unlocked || state.settings.muted || !audio.context || !audio.master) { fallbackSignal(kind); return false; }
  const now = audio.context.currentTime + 0.03;
  for (const note of soundPattern(resolvedSound)) {
    const osc = audio.context.createOscillator();
    const gain = audio.context.createGain();
    osc.type = kind === "alarm" ? "square" : "sine";
    osc.frequency.setValueAtTime(note.f, now + note.t);
    gain.gain.setValueAtTime(0.0001, now + note.t);
    gain.gain.exponentialRampToValueAtTime(0.42, now + note.t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(now + note.t);
    osc.stop(now + note.t + note.d + 0.05);
    audio.nodes.add(osc);
    osc.addEventListener("ended", () => audio.nodes.delete(osc), { once: true });
  }
  return true;
}
function fallbackSignal(kind) { if (navigator.vibrate) navigator.vibrate(kind === "alarm" ? [160, 80, 160] : [90, 60, 90]); }
function stopRepeatingSound() {
  window.clearInterval(audio.repeatHandle);
  audio.repeatHandle = null;
  for (const node of audio.nodes) { try { node.stop(); } catch {} }
  audio.nodes.clear();
}
function startRepeatingSound(kind, soundName) {
  stopRepeatingSound();
  void playSound(kind, soundName);
  audio.repeatHandle = window.setInterval(() => void playSound(kind, soundName), kind === "alarm" ? 1250 : 1500);
}

/* ---------------- Pages ---------------- */
function switchPage(target) {
  el.tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.tabTarget === target));
  el.pages.forEach(page => page.classList.toggle("active", page.id === target));
}

/* ---------------- Clock rendering ---------------- */
function pad(n) { return String(n).padStart(2, "0"); }

function updateClock(now = new Date()) {
  let h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  let suffix = "";
  if (state.settings.hour12) {
    suffix = h >= 12 ? " PM" : " AM";
    h = h % 12 || 12;
  }
  el.ckHH.textContent = pad(h);
  el.ckMM.textContent = pad(m);
  el.ckSS.textContent = pad(s);
  // Suffix appended to mm only when 12h
  if (state.settings.hour12 && !el.digitalClock.dataset.suffix) {
    el.digitalClock.dataset.suffix = "yes";
  }
  if (!state.settings.hour12 && el.digitalClock.dataset.suffix) {
    delete el.digitalClock.dataset.suffix;
  }
  // Title for tab
  document.title = state.settings.hour12
    ? `${pad(h)}:${pad(m)}${suffix} · Basic Clock`
    : `${pad(h)}:${pad(m)} · Basic Clock`;

  // Date
  el.dateLabel.textContent = formatDate(now);
  el.timezoneLabel.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
  el.nextAlarmLabel.textContent = nextAlarmText(now);
}

function formatDate(now) {
  switch (state.settings.dateFormat) {
    case "off": return "—";
    case "iso": return now.toISOString().slice(0, 10);
    case "short": return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "2-digit", month: "short" }).format(now);
    case "long":
    default: return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(now);
  }
}

/* ---------------- Alarms ---------------- */
function timeInputFor(date) { return `${pad(date.getHours())}:${pad(date.getMinutes())}`; }
function setDefaultAlarmTime() { el.alarmTime.value = timeInputFor(new Date(Date.now() + 60_000)); }

function addDailyAlarm(time, label, sound) {
  state.alarms.push({ id: uid(), type: "daily", time, label: label || "Alarm", sound: sound || state.settings.defaultAlarmSound, enabled: true, lastFiredKey: null, createdAt: new Date().toISOString() });
  saveState(); renderAlarms(); updateClock();
}
function addOneTimeAlarm(secondsFromNow, label = "One-time alarm", sound = state.settings.defaultAlarmSound) {
  const dueAt = new Date(Date.now() + secondsFromNow * 1000);
  const alarm = { id: uid(), type: "once", at: dueAt.toISOString(), label, sound, enabled: true, createdAt: new Date().toISOString() };
  state.alarms.push(alarm);
  saveState(); renderAlarms(); updateClock();
  showToast(`${label} scheduled for ${dueAt.toLocaleTimeString("en-US")}.`);
  return alarm;
}
function removeAlarm(id) { state.alarms = state.alarms.filter(a => a.id !== id); saveState(); renderAlarms(); updateClock(); }
function toggleAlarm(id) {
  const a = state.alarms.find(x => x.id === id); if (!a) return;
  a.enabled = !a.enabled; a.lastFiredKey = null;
  saveState(); renderAlarms(); updateClock();
}
function renderAlarms() {
  el.alarmList.replaceChildren();
  if (state.alarms.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list-item";
    empty.textContent = "No alarms yet.";
    el.alarmList.append(empty);
    return;
  }
  const sorted = [...state.alarms].sort((a, b) => nextDateForAlarm(a) - nextDateForAlarm(b));
  for (const alarm of sorted) {
    const item = document.createElement("article");
    item.className = "list-item";
    item.dataset.testid = "alarm-item";
    const text = document.createElement("div");
    const title = document.createElement("p"); title.className = "list-title"; title.textContent = alarm.label;
    const subtitle = document.createElement("p"); subtitle.className = "list-subtitle";
    subtitle.textContent = alarm.type === "daily"
      ? `Daily at ${alarm.time} · ${alarm.sound}`
      : `${new Date(alarm.at).toLocaleString("en-US")} · ${alarm.sound}`;
    text.append(title, subtitle);
    const status = document.createElement("span"); status.className = "pill"; status.textContent = alarm.enabled ? "On" : "Off";
    const actions = document.createElement("div"); actions.className = "quick-row"; actions.style.margin = "0";
    const toggle = document.createElement("button"); toggle.type = "button"; toggle.textContent = alarm.enabled ? "Disable" : "Enable";
    toggle.addEventListener("click", () => toggleAlarm(alarm.id));
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Delete";
    remove.addEventListener("click", () => removeAlarm(alarm.id));
    actions.append(toggle, remove);
    item.append(text, status, actions);
    el.alarmList.append(item);
  }
}
function nextDateForAlarm(alarm, now = new Date()) {
  if (!alarm.enabled) return new Date(8.64e15);
  if (alarm.type === "once") return new Date(alarm.at);
  const [hours, minutes] = alarm.time.split(":").map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}
function nextAlarmText(now = new Date()) {
  const active = state.alarms.filter(a => a.enabled);
  if (active.length === 0) return "No alarms";
  const next = active.map(a => ({ alarm: a, date: nextDateForAlarm(a, now) })).sort((a, b) => a.date - b.date)[0];
  const seconds = Math.max(0, Math.round((next.date - now) / 1000));
  return `${next.alarm.label} · in ${formatDuration(seconds)}`;
}
function alarmDueKey(now, alarm) { return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${alarm.time}`; }
function checkAlarms(now = new Date()) {
  for (const alarm of state.alarms) {
    if (!alarm.enabled) continue;
    if (alarm.type === "once" && new Date(alarm.at) <= now) { alarm.enabled = false; fireAlarm(alarm); continue; }
    if (alarm.type === "daily") {
      const [h, m] = alarm.time.split(":").map(Number);
      const key = alarmDueKey(now, alarm);
      if (now.getHours() === h && now.getMinutes() === m && alarm.lastFiredKey !== key) {
        alarm.lastFiredKey = key;
        fireAlarm(alarm);
      }
    }
  }
}
function fireAlarm(alarm) {
  saveState(); renderAlarms();
  showRing({ kind: "alarm", title: alarm.label, detail: "Your alarm is ringing. The sound repeats until stopped.", sound: alarm.sound });
}

/* ---------------- Timer ---------------- */
function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(rest)}`;
  return `${pad(minutes)}:${pad(rest)}`;
}
function timerSecondsFromInputs() {
  const minutes = Number.parseInt(el.timerMinutes.value || "0", 10);
  const seconds = Number.parseInt(el.timerSeconds.value || "0", 10);
  return Math.max(1, Math.min(24 * 3600, minutes * 60 + seconds));
}
function setTimerDuration(seconds) {
  state.timer.duration = seconds;
  state.timer.remaining = seconds;
  state.timer.running = false;
  state.timer.endsAt = null;
  el.timerMinutes.value = Math.floor(seconds / 60);
  el.timerSeconds.value = seconds % 60;
  saveState(); renderTimer();
}
function startTimer() {
  void ensureAudio();
  if (state.timer.remaining <= 0) state.timer.remaining = timerSecondsFromInputs();
  state.timer.duration = state.timer.remaining;
  state.timer.endsAt = Date.now() + state.timer.remaining * 1000;
  state.timer.running = true;
  saveState(); renderTimer();
}
function pauseTimer() { updateTimerRemaining(); state.timer.running = false; state.timer.endsAt = null; saveState(); renderTimer(); }
function resetTimer() { state.timer.running = false; state.timer.endsAt = null; state.timer.remaining = timerSecondsFromInputs(); saveState(); renderTimer(); }
function updateTimerRemaining() {
  if (!state.timer.running || !state.timer.endsAt) return;
  state.timer.remaining = Math.max(0, Math.ceil((state.timer.endsAt - Date.now()) / 1000));
  if (state.timer.remaining <= 0) {
    state.timer.running = false;
    state.timer.endsAt = null;
    saveState();
    showRing({ kind: "timer", title: "Timer complete", detail: "The countdown is complete. Timer audio is playing.", sound: state.settings.defaultTimerSound });
  }
}
function renderTimer() {
  updateTimerRemaining();
  el.timerDisplay.textContent = formatDuration(state.timer.remaining);
  el.startTimer.disabled = state.timer.running;
  el.pauseTimer.disabled = !state.timer.running;
  const total = state.timer.duration || 1;
  const pct = Math.max(0, Math.min(100, ((total - state.timer.remaining) / total) * 100));
  if (el.timerProgressBar) el.timerProgressBar.style.width = `${pct}%`;
}

/* ---------------- Ring dialog ---------------- */
function showRing({ kind, title, detail, sound }) {
  currentRing = { kind, title, detail, sound };
  el.ringKind.textContent = kind === "alarm" ? "Alarm" : "Timer";
  el.ringTitle.textContent = title;
  el.ringDetail.textContent = detail;
  el.snoozeRing.hidden = kind !== "alarm";
  startRepeatingSound(kind, sound);
  if (!el.ringDialog.open) {
    try { el.ringDialog.showModal(); } catch { el.ringDialog.setAttribute("open", "open"); }
  }
}
function stopRing() { stopRepeatingSound(); currentRing = null; if (el.ringDialog.open) el.ringDialog.close(); }
function snoozeCurrentRing() {
  if (!currentRing || currentRing.kind !== "alarm") return;
  addOneTimeAlarm(300, `Snooze: ${currentRing.title}`, currentRing.sound);
  stopRing();
}

/* ---------------- Tick ---------------- */
function tick() {
  const now = new Date();
  updateClock(now);
  checkAlarms(now);
  renderTimer();
  // Refresh greeting eyebrow once a minute (cheap; redo every tick fine)
  if (state.settings.greetingStyle === "time" || state.settings.greetingStyle === "motto") {
    const name = (state.settings.displayName || "").trim();
    el.greetingEyebrow.textContent = (state.settings.greetingStyle === "time" && name)
      ? `${timeGreeting(now)}, ${name}`
      : timeGreeting(now);
  }
}

/* ---------------- Events ---------------- */
function bindEvents() {
  el.brandHome.addEventListener("click", e => { e.preventDefault(); switchPage("clock"); });
  el.tabs.forEach(tab => tab.addEventListener("click", () => switchPage(tab.dataset.tabTarget)));

  // Click the quote to cycle to the next one
  el.greetingName.addEventListener("click", cycleQuote);

  window.addEventListener("pointerdown", () => void ensureAudio(), { once: true });
  window.addEventListener("keydown", () => void ensureAudio(), { once: true });

  el.unlockAudio.addEventListener("click", async () => {
    const ok = await ensureAudio();
    showToast(ok ? "Audio is ready." : "The browser could not start audio.");
  });

  el.alarmForm.addEventListener("submit", e => {
    e.preventDefault();
    void ensureAudio();
    addDailyAlarm(el.alarmTime.value, el.alarmLabel.value.trim(), el.alarmSound.value);
    showToast("Alarm added.");
  });
  el.quickOne.addEventListener("click", () => { void ensureAudio(); addOneTimeAlarm(60, "+1 min alarm"); });
  el.quickTen.addEventListener("click", () => { void ensureAudio(); addOneTimeAlarm(600, "+10 min alarm"); });
  el.quickTestAlarm.addEventListener("click", () => { void ensureAudio(); addOneTimeAlarm(5, "Test alarm"); });
  el.testAlarmSound.addEventListener("click", () => {
    void ensureAudio();
    showRing({ kind: "alarm", title: "Alarm sound test", detail: "Alarm audio is playing for a manual test.", sound: el.alarmSound.value });
  });
  el.testTimerSound.addEventListener("click", () => {
    void ensureAudio();
    showRing({ kind: "timer", title: "Timer sound test", detail: "Timer audio is playing for a manual test.", sound: state.settings.defaultTimerSound });
  });

  el.startTimer.addEventListener("click", () => {
    if (!state.timer.running) { state.timer.remaining = timerSecondsFromInputs(); startTimer(); }
  });
  el.pauseTimer.addEventListener("click", pauseTimer);
  el.resetTimer.addEventListener("click", resetTimer);
  el.startThreeSecondTimer.addEventListener("click", () => { void ensureAudio(); setTimerDuration(3); startTimer(); });
  el.timerPresets.forEach(btn => btn.addEventListener("click", () => {
    setTimerDuration(Number(btn.dataset.timerPreset));
  }));

  // Theme cards
  el.themeCards.forEach(card => {
    card.addEventListener("click", () => {
      if (state.settings.theme !== card.dataset.themePick) {
        state.settings.theme = card.dataset.themePick;
        state.settings.accent = null; // reset accent to theme default
        saveState();
        applySettings();
      }
    });
  });

  // Layout segmented
  if (el.layoutSeg) {
    el.layoutSeg.addEventListener("click", e => {
      const btn = e.target.closest("[data-seg-val]");
      if (!btn) return;
      state.settings.layout = btn.dataset.segVal;
      saveState(); applySettings();
    });
  }

  // Personalization
  el.displayName.addEventListener("input", () => { state.settings.displayName = el.displayName.value; saveState(); renderGreeting(); });
  el.greetingStyle.addEventListener("change", () => { state.settings.greetingStyle = el.greetingStyle.value; saveState(); renderGreeting(); });
  el.customMotto.addEventListener("input", () => { state.settings.customMotto = el.customMotto.value; saveState(); renderGreeting(); });

  // Display options
  el.defaultAlarmSound.addEventListener("change", () => { state.settings.defaultAlarmSound = el.defaultAlarmSound.value; saveState(); applySettings(); });
  el.defaultTimerSound.addEventListener("change", () => { state.settings.defaultTimerSound = el.defaultTimerSound.value; saveState(); applySettings(); });
  el.volumeRange.addEventListener("input", () => { state.settings.volume = Number(el.volumeRange.value); saveState(); updateMasterGain(); });
  el.mutedToggle.addEventListener("change", () => { state.settings.muted = el.mutedToggle.checked; saveState(); applySettings(); });
  el.hourToggle.addEventListener("change", () => { state.settings.hour12 = el.hourToggle.checked; saveState(); updateClock(); });
  el.secondsToggle.addEventListener("change", () => { state.settings.showSeconds = el.secondsToggle.checked; saveState(); applySettings(); });
  el.blinkToggle.addEventListener("change", () => { state.settings.blink = el.blinkToggle.checked; saveState(); applySettings(); });
  el.dateFormat.addEventListener("change", () => { state.settings.dateFormat = el.dateFormat.value; saveState(); updateClock(); });
  el.fxToggle.addEventListener("change", () => { state.settings.fx = el.fxToggle.checked; saveState(); applySettings(); });
  el.scanlinesToggle.addEventListener("change", () => { state.settings.scanlines = el.scanlinesToggle.checked; saveState(); applySettings(); });

  el.resetSettings.addEventListener("click", () => {
    if (!confirm("Reset all settings (alarms and timer kept)?")) return;
    state.settings = structuredClone(defaults.settings);
    saveState(); applySettings(); updateClock();
    showToast("Settings reset.");
  });

  el.stopRing.addEventListener("click", stopRing);
  el.snoozeRing.addEventListener("click", snoozeCurrentRing);
  el.ringDialog.addEventListener("cancel", e => { e.preventDefault(); stopRing(); });
}

/* ==========================================================
   Background effects (canvas)
   ========================================================== */
const fx = { raf: 0, cleanup: null };

function stopFx() {
  if (fx.cleanup) { try { fx.cleanup(); } catch {} fx.cleanup = null; }
  cancelAnimationFrame(fx.raf);
  const ctx = el.bgFx.getContext("2d");
  ctx.clearRect(0, 0, el.bgFx.width, el.bgFx.height);
}

function startFx() {
  stopFx();
  if (!state.settings.fx) return;
  const theme = state.settings.theme;
  if (theme === "matrix") return startMatrixRain();
  if (theme === "bladerunner") return startDustStorm();
  if (theme === "alien") return startAlienScan();
  if (theme === "pinkie") return startConfetti();
  if (theme === "rainbow") return startSpeedStreaks();
  if (theme === "interstellar") return startInterstellar();
}

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  el.bgFx.width = Math.floor(w * dpr);
  el.bgFx.height = Math.floor(h * dpr);
  el.bgFx.style.width = w + "px";
  el.bgFx.style.height = h + "px";
  return { w, h, dpr };
}

function startMatrixRain() {
  const dims = fitCanvas();
  const ctx = el.bgFx.getContext("2d");
  ctx.scale(dims.dpr, dims.dpr);

  const fontSize = 16;
  let cols = Math.ceil(dims.w / fontSize);
  // Each drop: { y: row in px (snapped), v: fractional accumulator, ch: current glyph }
  let drops = new Array(cols).fill(0).map(() => ({
    y: Math.floor(Math.random() * -dims.h / fontSize) * fontSize,
    v: 0,
    ch: ""
  }));
  const glyphs = "ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｲﾝ0123456789".split("");

  function onResize() {
    const d = fitCanvas();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(d.dpr, d.dpr);
    cols = Math.ceil(d.w / fontSize);
    drops = new Array(cols).fill(0).map(() => ({
      y: Math.floor(Math.random() * -d.h / fontSize) * fontSize,
      v: 0,
      ch: ""
    }));
  }
  window.addEventListener("resize", onResize);

  function frame() {
    const w = window.innerWidth, h = window.innerHeight;
    // gentle trail fade
    ctx.fillStyle = "rgba(5, 10, 7, 0.055)";
    ctx.fillRect(0, 0, w, h);

    ctx.font = `${fontSize}px "VT323", monospace`;
    for (let i = 0; i < cols; i++) {
      const d = drops[i];
      // accumulate slow downward motion; advance one row when it crosses fontSize
      d.v += 0.10 + Math.random() * 0.08; // ~0.10–0.18 px/frame → very calm
      if (d.v >= fontSize) {
        d.v -= fontSize;
        d.y += fontSize;
        d.ch = glyphs[(Math.random() * glyphs.length) | 0];
        const x = i * fontSize;
        // bright head
        ctx.fillStyle = "rgba(220, 255, 230, 0.95)";
        ctx.fillText(d.ch, x, d.y);
        // dim trail glyph one row up
        ctx.fillStyle = "rgba(57, 255, 136, 0.45)";
        ctx.fillText(d.ch, x, d.y - fontSize);
        if (d.y > h + 80 && Math.random() > 0.985) d.y = -20;
        if (d.y > h + 600) d.y = -20;
      }
    }
    fx.raf = requestAnimationFrame(frame);
  }
  frame();
  fx.cleanup = () => window.removeEventListener("resize", onResize);
}

/* ---------- 2049 — slow sepia dust drift + vertical search beam ---------- */
function startDustStorm() {
  let dims = fitCanvas();
  const ctx = el.bgFx.getContext("2d");
  ctx.scale(dims.dpr, dims.dpr);

  let parts = [];
  function seed() {
    const count = Math.floor((dims.w * dims.h) / 9000);
    parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * dims.w,
        y: Math.random() * dims.h,
        vx: 0.15 + Math.random() * 0.4,
        vy: (Math.random() - 0.5) * 0.10,
        r: 0.4 + Math.random() * 1.6,
        a: 0.05 + Math.random() * 0.18,
        hue: 25 + Math.random() * 20
      });
    }
  }
  seed();

  function onResize() {
    dims = fitCanvas();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dims.dpr, dims.dpr);
    seed();
  }
  window.addEventListener("resize", onResize);

  let t0 = performance.now();
  let beamX = -200, beamPhase = 0;

  function frame(t) {
    const dt = (t - t0) / 1000; t0 = t;
    // gentle fade so dust trails very slightly
    ctx.fillStyle = "rgba(22, 10, 5, 0.10)";
    ctx.fillRect(0, 0, dims.w, dims.h);

    // dust
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy + Math.sin((p.x + p.y) * 0.01) * 0.05;
      if (p.x > dims.w + 20) { p.x = -20; p.y = Math.random() * dims.h; }
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grd.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.a})`);
      grd.addColorStop(1, `hsla(${p.hue}, 80%, 50%, 0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // slow vertical search beam — sweeps across every ~22s
    beamPhase += dt;
    if (beamPhase > 22) { beamPhase = 0; beamX = -240; }
    if (beamX < dims.w + 240) {
      beamX += dt * 110;
      const grd2 = ctx.createLinearGradient(beamX - 120, 0, beamX + 120, 0);
      grd2.addColorStop(0, "rgba(255, 170, 80, 0)");
      grd2.addColorStop(0.5, "rgba(255, 200, 110, 0.10)");
      grd2.addColorStop(1, "rgba(255, 170, 80, 0)");
      ctx.fillStyle = grd2;
      ctx.fillRect(beamX - 120, 0, 240, dims.h);
    }
    fx.raf = requestAnimationFrame(frame);
  }
  fx.raf = requestAnimationFrame(frame);
  fx.cleanup = () => window.removeEventListener("resize", onResize);
}

/* ---------- Alien — amber static + a slow horizontal scan sweep ---------- */
function startAlienScan() {
  let dims = fitCanvas();
  const ctx = el.bgFx.getContext("2d");
  ctx.scale(dims.dpr, dims.dpr);

  function onResize() {
    dims = fitCanvas();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dims.dpr, dims.dpr);
  }
  window.addEventListener("resize", onResize);

  let scanY = 0;
  let flicker = 0;
  let t0 = performance.now();

  function frame(t) {
    const dt = (t - t0) / 1000; t0 = t;
    // hard clear (no trail)
    ctx.clearRect(0, 0, dims.w, dims.h);

    // amber static (sparse pixels)
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * dims.w;
      const y = Math.random() * dims.h;
      ctx.fillStyle = `hsla(${38 + Math.random() * 8}, 100%, 50%, ${0.08 + Math.random() * 0.12})`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // slow horizontal scan line, sweeping top-to-bottom every ~16s
    scanY += dt * (dims.h / 16);
    if (scanY > dims.h + 80) scanY = -80;
    const grd = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
    grd.addColorStop(0, "rgba(255, 176, 0, 0)");
    grd.addColorStop(0.5, "rgba(255, 176, 0, 0.18)");
    grd.addColorStop(1, "rgba(255, 176, 0, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, scanY - 40, dims.w, 80);

    // bright scan line
    ctx.fillStyle = "rgba(255, 200, 80, 0.55)";
    ctx.fillRect(0, scanY, dims.w, 1);

    // occasional flicker dimmer
    flicker += dt;
    if (flicker > 3 + Math.random() * 4) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fillRect(0, 0, dims.w, dims.h);
      flicker = 0;
    }

    fx.raf = requestAnimationFrame(frame);
  }
  fx.raf = requestAnimationFrame(frame);
  fx.cleanup = () => window.removeEventListener("resize", onResize);
}

/* ---------- Pinkie — colorful rotating confetti pieces ---------- */
function startConfetti() {
  let dims = fitCanvas();
  const ctx = el.bgFx.getContext("2d");
  ctx.scale(dims.dpr, dims.dpr);

  const colors = ["#ff4ea8", "#ffd83a", "#5fd9ff", "#a455ff", "#ff8fd5", "#ffffff"];
  let parts = [];
  function seed() {
    const count = Math.floor((dims.w * dims.h) / 18000) + 30;
    parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * dims.w,
        y: Math.random() * -dims.h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0.6 + Math.random() * 1.2,
        r: 0.6 + Math.random() * 1.2,
        w: 6 + Math.random() * 8,
        h: 3 + Math.random() * 6,
        ang: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.08,
        c: colors[(Math.random() * colors.length) | 0]
      });
    }
  }
  seed();

  function onResize() {
    dims = fitCanvas();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dims.dpr, dims.dpr);
    seed();
  }
  window.addEventListener("resize", onResize);

  function frame() {
    ctx.clearRect(0, 0, dims.w, dims.h);
    for (const p of parts) {
      p.x += p.vx + Math.sin(p.ang) * 0.2;
      p.y += p.vy;
      p.ang += p.va;
      if (p.y > dims.h + 20) { p.y = -20; p.x = Math.random() * dims.w; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ang);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    fx.raf = requestAnimationFrame(frame);
  }
  fx.raf = requestAnimationFrame(frame);
  fx.cleanup = () => window.removeEventListener("resize", onResize);
}

/* ---------- Rainbow — diagonal speed streaks with rainbow trails ---------- */
function startSpeedStreaks() {
  let dims = fitCanvas();
  const ctx = el.bgFx.getContext("2d");
  ctx.scale(dims.dpr, dims.dpr);

  const palette = ["#ff3b3b", "#ff8a1a", "#ffd83a", "#2db55a", "#2db7ff", "#a455ff"];
  let streaks = [];
  function seed() {
    streaks = [];
    const count = Math.floor(dims.w / 90) + 6;
    for (let i = 0; i < count; i++) {
      streaks.push(makeStreak());
    }
  }
  function makeStreak() {
    return {
      x: Math.random() * dims.w * 1.5 - dims.w * 0.3,
      y: Math.random() * dims.h,
      sp: 4 + Math.random() * 4,
      len: 80 + Math.random() * 220,
      thick: 3 + Math.random() * 5,
      c: palette[(Math.random() * palette.length) | 0],
      a: 0.18 + Math.random() * 0.22
    };
  }
  seed();

  function onResize() {
    dims = fitCanvas();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dims.dpr, dims.dpr);
    seed();
  }
  window.addEventListener("resize", onResize);

  // 25deg sweep
  const ANG = (-25 * Math.PI) / 180;
  const dx = Math.cos(ANG);
  const dy = Math.sin(ANG);

  function frame() {
    // subtle fade so streaks have a tail
    ctx.fillStyle = "rgba(180, 228, 255, 0.18)";
    ctx.fillRect(0, 0, dims.w, dims.h);
    for (const s of streaks) {
      s.x += dx * s.sp;
      s.y += dy * s.sp;
      // wrap
      if (s.x > dims.w + 40 || s.y < -40) Object.assign(s, makeStreak(), { x: -s.len, y: Math.random() * dims.h });

      const gx0 = s.x - dx * s.len, gy0 = s.y - dy * s.len;
      const grd = ctx.createLinearGradient(gx0, gy0, s.x, s.y);
      grd.addColorStop(0, `${s.c}00`);
      grd.addColorStop(1, s.c);
      ctx.strokeStyle = grd;
      ctx.globalAlpha = s.a;
      ctx.lineWidth = s.thick;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(gx0, gy0);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    fx.raf = requestAnimationFrame(frame);
  }
  fx.raf = requestAnimationFrame(frame);
  fx.cleanup = () => window.removeEventListener("resize", onResize);
}

/* ---------- Interstellar — deep starfield with parallax depth ---------- */
function startInterstellar() {
  let dims = fitCanvas();
  const ctx = el.bgFx.getContext("2d");
  ctx.scale(dims.dpr, dims.dpr);

  let stars = [];
  function seed() {
    const count = Math.floor((dims.w * dims.h) / 3500);
    stars = [];
    for (let i = 0; i < count; i++) {
      const depth = Math.random(); // 0..1
      stars.push({
        x: Math.random() * dims.w,
        y: Math.random() * dims.h,
        r: 0.2 + depth * 1.6,
        a: Math.random() * Math.PI * 2,
        sp: 0.08 + depth * 0.5,        // twinkle speed
        vy: 0.02 + depth * 0.12,       // slow downward drift (parallax)
        warm: Math.random() < 0.18      // a few warm Gargantua-tinted stars
      });
    }
  }
  seed();

  function onResize() {
    dims = fitCanvas();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dims.dpr, dims.dpr);
    seed();
  }
  window.addEventListener("resize", onResize);

  // Subtle slowly-drifting dust nebula in the background
  let t0 = performance.now();
  let nebulaPhase = 0;

  function frame(t) {
    const dt = (t - t0) / 1000; t0 = t;
    // hard clear — pure black
    ctx.clearRect(0, 0, dims.w, dims.h);

    // Faint nebula glow that drifts
    nebulaPhase += dt * 0.04;
    const nx = dims.w * (0.65 + Math.sin(nebulaPhase) * 0.04);
    const ny = dims.h * (0.35 + Math.cos(nebulaPhase * 0.7) * 0.03);
    const neb = ctx.createRadialGradient(nx, ny, 0, nx, ny, Math.max(dims.w, dims.h) * 0.45);
    neb.addColorStop(0, "rgba(232, 183, 111, 0.08)");
    neb.addColorStop(0.5, "rgba(180, 130, 70, 0.03)");
    neb.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, dims.w, dims.h);

    for (const s of stars) {
      s.a += dt * s.sp;
      s.y += s.vy;
      if (s.y > dims.h + 4) { s.y = -4; s.x = Math.random() * dims.w; }
      const tw = 0.5 + 0.5 * Math.sin(s.a);
      const alpha = (0.55 + 0.45 * tw) * (0.3 + s.r * 0.5);
      if (s.warm) {
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
        grd.addColorStop(0, `rgba(255, 220, 170, ${alpha})`);
        grd.addColorStop(1, `rgba(232, 183, 111, 0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(245, 248, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    fx.raf = requestAnimationFrame(frame);
  }
  fx.raf = requestAnimationFrame(frame);
  fx.cleanup = () => window.removeEventListener("resize", onResize);
}

/* ---------------- Test hooks ---------------- */
window.__clockAppTest = {
  get soundEvents() { return soundEvents; },
  get alarms() { return state.alarms; },
  get timer() { return state.timer; },
  async unlockAudio() { return ensureAudio(); },
  clear() {
    state.alarms = [];
    state.timer = { ...defaults.timer };
    soundEvents.length = 0;
    stopRing();
    saveState(); renderAlarms(); renderTimer(); updateClock();
  },
  createTestAlarm(seconds = 5) { return addOneTimeAlarm(seconds, "Automated test alarm"); },
  startTestTimer(seconds = 3) { setTimerDuration(seconds); startTimer(); }
};

/* ---------------- Boot ---------------- */
applySettings();
setDefaultAlarmTime();
renderAlarms();
renderTimer();
updateClock();
bindEvents();
window.setInterval(tick, 250);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
