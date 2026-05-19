const STORAGE_KEY = "basic-clock-en-v1";

const el = {
  html: document.documentElement,
  tabs: [...document.querySelectorAll("[data-tab-target]")],
  pages: [...document.querySelectorAll(".page")],
  dateLabel: document.getElementById("dateLabel"),
  timezoneLabel: document.getElementById("timezoneLabel"),
  digitalClock: document.getElementById("digitalClock"),
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
  timerMinutes: document.getElementById("timerMinutes"),
  timerSeconds: document.getElementById("timerSeconds"),
  startTimer: document.getElementById("startTimer"),
  pauseTimer: document.getElementById("pauseTimer"),
  resetTimer: document.getElementById("resetTimer"),
  startThreeSecondTimer: document.getElementById("startThreeSecondTimer"),
  themeSelect: document.getElementById("themeSelect"),
  defaultAlarmSound: document.getElementById("defaultAlarmSound"),
  defaultTimerSound: document.getElementById("defaultTimerSound"),
  volumeRange: document.getElementById("volumeRange"),
  mutedToggle: document.getElementById("mutedToggle"),
  hourToggle: document.getElementById("hourToggle"),
  secondsToggle: document.getElementById("secondsToggle"),
  ringDialog: document.getElementById("ringDialog"),
  ringKind: document.getElementById("ringKind"),
  ringTitle: document.getElementById("ringTitle"),
  ringDetail: document.getElementById("ringDetail"),
  stopRing: document.getElementById("stopRing"),
  snoozeRing: document.getElementById("snoozeRing"),
  toast: document.getElementById("toast")
};

const defaults = {
  settings: {
    theme: "matrix",
    hour12: false,
    showSeconds: true,
    muted: false,
    volume: 0.72,
    defaultAlarmSound: "bell",
    defaultTimerSound: "triple"
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
const audio = {
  context: null,
  master: null,
  nodes: new Set(),
  repeatHandle: null,
  unlocked: false
};

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return structuredClone(defaults);
    return {
      settings: { ...defaults.settings, ...parsed.settings },
      alarms: Array.isArray(parsed.alarms) ? parsed.alarms : [],
      timer: { ...defaults.timer, ...parsed.timer, running: false, endsAt: null }
    };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => el.toast.classList.remove("show"), 2400);
}

function applySettings() {
  el.html.dataset.theme = state.settings.theme;
  el.themeSelect.value = state.settings.theme;
  el.defaultAlarmSound.value = state.settings.defaultAlarmSound;
  el.defaultTimerSound.value = state.settings.defaultTimerSound;
  el.volumeRange.value = state.settings.volume;
  el.mutedToggle.checked = state.settings.muted;
  el.hourToggle.checked = state.settings.hour12;
  el.secondsToggle.checked = state.settings.showSeconds;
  el.alarmSound.value = state.settings.defaultAlarmSound;
  updateAudioStatus();
  updateMasterGain();
}

async function ensureAudio() {
  if (!audio.context) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      audio.unlocked = false;
      updateAudioStatus();
      return false;
    }
    audio.context = new AudioCtor();
    audio.master = audio.context.createGain();
    audio.master.connect(audio.context.destination);
    updateMasterGain();
  }

  if (audio.context.state === "suspended") {
    try {
      await audio.context.resume();
    } catch {
      audio.unlocked = false;
    }
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
    bell: [
      { f: 880, t: 0, d: 0.22 },
      { f: 660, t: 0.24, d: 0.22 },
      { f: 990, t: 0.49, d: 0.32 }
    ],
    pulse: [
      { f: 392, t: 0, d: 0.18 },
      { f: 392, t: 0.28, d: 0.18 },
      { f: 523, t: 0.56, d: 0.24 }
    ],
    triple: [
      { f: 523, t: 0, d: 0.16 },
      { f: 659, t: 0.18, d: 0.16 },
      { f: 784, t: 0.36, d: 0.22 }
    ]
  };
  return patterns[soundName] || patterns.bell;
}

async function playSound(kind, soundName) {
  const unlocked = await ensureAudio();
  const resolvedSound = soundName || (kind === "timer" ? state.settings.defaultTimerSound : state.settings.defaultAlarmSound);

  soundEvents.push({
    type: kind,
    sound: resolvedSound,
    at: new Date().toISOString(),
    audioContextState: audio.context?.state || "missing",
    muted: state.settings.muted
  });

  if (!unlocked || state.settings.muted || !audio.context || !audio.master) {
    fallbackSignal(kind);
    return false;
  }

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

function fallbackSignal(kind) {
  if (navigator.vibrate) navigator.vibrate(kind === "alarm" ? [160, 80, 160] : [90, 60, 90]);
}

function stopRepeatingSound() {
  window.clearInterval(audio.repeatHandle);
  audio.repeatHandle = null;
  for (const node of audio.nodes) {
    try {
      node.stop();
    } catch {
      // Node may already be stopped.
    }
  }
  audio.nodes.clear();
}

function startRepeatingSound(kind, soundName) {
  stopRepeatingSound();
  void playSound(kind, soundName);
  audio.repeatHandle = window.setInterval(() => void playSound(kind, soundName), kind === "alarm" ? 1250 : 1500);
}

function switchPage(target) {
  el.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tabTarget === target));
  el.pages.forEach((page) => page.classList.toggle("active", page.id === target));
}

function formatClock(now) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: state.settings.showSeconds ? "2-digit" : undefined,
    hour12: state.settings.hour12
  }).format(now);
}

function updateClock(now = new Date()) {
  el.digitalClock.textContent = formatClock(now);
  el.dateLabel.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(now);
  el.timezoneLabel.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
  el.nextAlarmLabel.textContent = nextAlarmText(now);
}

function timeInputFor(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function setDefaultAlarmTime() {
  const nextMinute = new Date(Date.now() + 60_000);
  el.alarmTime.value = timeInputFor(nextMinute);
}

function addDailyAlarm(time, label, sound) {
  state.alarms.push({
    id: uid(),
    type: "daily",
    time,
    label: label || "Alarm",
    sound: sound || state.settings.defaultAlarmSound,
    enabled: true,
    lastFiredKey: null,
    createdAt: new Date().toISOString()
  });
  saveState();
  renderAlarms();
  updateClock();
}

function addOneTimeAlarm(secondsFromNow, label = "One-time alarm", sound = state.settings.defaultAlarmSound) {
  const dueAt = new Date(Date.now() + secondsFromNow * 1000);
  const alarm = {
    id: uid(),
    type: "once",
    at: dueAt.toISOString(),
    label,
    sound,
    enabled: true,
    createdAt: new Date().toISOString()
  };
  state.alarms.push(alarm);
  saveState();
  renderAlarms();
  updateClock();
  showToast(`${label} scheduled for ${dueAt.toLocaleTimeString("en-US")}.`);
  return alarm;
}

function removeAlarm(id) {
  state.alarms = state.alarms.filter((alarm) => alarm.id !== id);
  saveState();
  renderAlarms();
  updateClock();
}

function toggleAlarm(id) {
  const alarm = state.alarms.find((item) => item.id === id);
  if (!alarm) return;
  alarm.enabled = !alarm.enabled;
  alarm.lastFiredKey = null;
  saveState();
  renderAlarms();
  updateClock();
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
    const title = document.createElement("p");
    title.className = "list-title";
    title.textContent = alarm.label;
    const subtitle = document.createElement("p");
    subtitle.className = "list-subtitle";
    subtitle.textContent = alarm.type === "daily"
      ? `Daily at ${alarm.time} - ${alarm.sound}`
      : `${new Date(alarm.at).toLocaleString("en-US")} - ${alarm.sound}`;
    text.append(title, subtitle);

    const status = document.createElement("span");
    status.className = "pill";
    status.textContent = alarm.enabled ? "On" : "Off";

    const actions = document.createElement("div");
    actions.className = "quick-row";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = alarm.enabled ? "Disable" : "Enable";
    toggle.addEventListener("click", () => toggleAlarm(alarm.id));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
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
  const active = state.alarms.filter((alarm) => alarm.enabled);
  if (active.length === 0) return "No alarms";
  const next = active.map((alarm) => ({ alarm, date: nextDateForAlarm(alarm, now) })).sort((a, b) => a.date - b.date)[0];
  const seconds = Math.max(0, Math.round((next.date - now) / 1000));
  return `${next.alarm.label} - in ${formatDuration(seconds)}`;
}

function alarmDueKey(now, alarm) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${alarm.time}`;
}

function checkAlarms(now = new Date()) {
  for (const alarm of state.alarms) {
    if (!alarm.enabled) continue;
    if (alarm.type === "once" && new Date(alarm.at) <= now) {
      alarm.enabled = false;
      fireAlarm(alarm);
      continue;
    }
    if (alarm.type === "daily") {
      const [hours, minutes] = alarm.time.split(":").map(Number);
      const key = alarmDueKey(now, alarm);
      if (now.getHours() === hours && now.getMinutes() === minutes && alarm.lastFiredKey !== key) {
        alarm.lastFiredKey = key;
        fireAlarm(alarm);
      }
    }
  }
}

function fireAlarm(alarm) {
  saveState();
  renderAlarms();
  showRing({
    kind: "alarm",
    title: alarm.label,
    detail: "Your alarm is ringing. The sound repeats until stopped.",
    sound: alarm.sound
  });
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
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
  saveState();
  renderTimer();
}

function startTimer() {
  void ensureAudio();
  if (state.timer.remaining <= 0) state.timer.remaining = timerSecondsFromInputs();
  state.timer.duration = state.timer.remaining;
  state.timer.endsAt = Date.now() + state.timer.remaining * 1000;
  state.timer.running = true;
  saveState();
  renderTimer();
}

function pauseTimer() {
  updateTimerRemaining();
  state.timer.running = false;
  state.timer.endsAt = null;
  saveState();
  renderTimer();
}

function resetTimer() {
  state.timer.running = false;
  state.timer.endsAt = null;
  state.timer.remaining = timerSecondsFromInputs();
  saveState();
  renderTimer();
}

function updateTimerRemaining() {
  if (!state.timer.running || !state.timer.endsAt) return;
  state.timer.remaining = Math.max(0, Math.ceil((state.timer.endsAt - Date.now()) / 1000));
  if (state.timer.remaining <= 0) {
    state.timer.running = false;
    state.timer.endsAt = null;
    saveState();
    showRing({
      kind: "timer",
      title: "Timer complete",
      detail: "The countdown is complete. Timer audio is playing.",
      sound: state.settings.defaultTimerSound
    });
  }
}

function renderTimer() {
  updateTimerRemaining();
  el.timerDisplay.textContent = formatDuration(state.timer.remaining);
  el.startTimer.disabled = state.timer.running;
  el.pauseTimer.disabled = !state.timer.running;
}

function showRing({ kind, title, detail, sound }) {
  currentRing = { kind, title, detail, sound };
  el.ringKind.textContent = kind === "alarm" ? "Alarm" : "Timer";
  el.ringTitle.textContent = title;
  el.ringDetail.textContent = detail;
  el.snoozeRing.hidden = kind !== "alarm";
  startRepeatingSound(kind, sound);
  if (!el.ringDialog.open) {
    try {
      el.ringDialog.showModal();
    } catch {
      el.ringDialog.setAttribute("open", "open");
    }
  }
}

function stopRing() {
  stopRepeatingSound();
  currentRing = null;
  if (el.ringDialog.open) el.ringDialog.close();
}

function snoozeCurrentRing() {
  if (!currentRing || currentRing.kind !== "alarm") return;
  addOneTimeAlarm(300, `Snooze: ${currentRing.title}`, currentRing.sound);
  stopRing();
}

function tick() {
  const now = new Date();
  updateClock(now);
  checkAlarms(now);
  renderTimer();
}

function bindEvents() {
  el.tabs.forEach((tab) => tab.addEventListener("click", () => switchPage(tab.dataset.tabTarget)));

  window.addEventListener("pointerdown", () => void ensureAudio(), { once: true });
  window.addEventListener("keydown", () => void ensureAudio(), { once: true });

  el.unlockAudio.addEventListener("click", async () => {
    const ok = await ensureAudio();
    showToast(ok ? "Audio is ready." : "The browser could not start audio.");
  });

  el.alarmForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void ensureAudio();
    addDailyAlarm(el.alarmTime.value, el.alarmLabel.value.trim(), el.alarmSound.value);
    showToast("Alarm added.");
  });

  el.quickOne.addEventListener("click", () => {
    void ensureAudio();
    addOneTimeAlarm(60, "+1 min alarm");
  });
  el.quickTen.addEventListener("click", () => {
    void ensureAudio();
    addOneTimeAlarm(600, "+10 min alarm");
  });
  el.quickTestAlarm.addEventListener("click", () => {
    void ensureAudio();
    addOneTimeAlarm(5, "Test alarm");
  });
  el.testAlarmSound.addEventListener("click", () => {
    void ensureAudio();
    showRing({
      kind: "alarm",
      title: "Alarm sound test",
      detail: "Alarm audio is playing for a manual test.",
      sound: el.alarmSound.value
    });
  });

  el.testTimerSound.addEventListener("click", () => {
    void ensureAudio();
    showRing({
      kind: "timer",
      title: "Timer sound test",
      detail: "Timer audio is playing for a manual test.",
      sound: state.settings.defaultTimerSound
    });
  });

  el.startTimer.addEventListener("click", () => {
    if (!state.timer.running) {
      state.timer.remaining = timerSecondsFromInputs();
      startTimer();
    }
  });
  el.pauseTimer.addEventListener("click", pauseTimer);
  el.resetTimer.addEventListener("click", resetTimer);
  el.startThreeSecondTimer.addEventListener("click", () => {
    void ensureAudio();
    setTimerDuration(3);
    startTimer();
  });

  el.themeSelect.addEventListener("change", () => {
    state.settings.theme = el.themeSelect.value;
    saveState();
    applySettings();
  });
  el.defaultAlarmSound.addEventListener("change", () => {
    state.settings.defaultAlarmSound = el.defaultAlarmSound.value;
    saveState();
    applySettings();
  });
  el.defaultTimerSound.addEventListener("change", () => {
    state.settings.defaultTimerSound = el.defaultTimerSound.value;
    saveState();
    applySettings();
  });
  el.volumeRange.addEventListener("input", () => {
    state.settings.volume = Number(el.volumeRange.value);
    saveState();
    updateMasterGain();
  });
  el.mutedToggle.addEventListener("change", () => {
    state.settings.muted = el.mutedToggle.checked;
    saveState();
    applySettings();
  });
  el.hourToggle.addEventListener("change", () => {
    state.settings.hour12 = el.hourToggle.checked;
    saveState();
    updateClock();
  });
  el.secondsToggle.addEventListener("change", () => {
    state.settings.showSeconds = el.secondsToggle.checked;
    saveState();
    updateClock();
  });

  el.stopRing.addEventListener("click", stopRing);
  el.snoozeRing.addEventListener("click", snoozeCurrentRing);
  el.ringDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    stopRing();
  });
}

window.__clockAppTest = {
  get soundEvents() {
    return soundEvents;
  },
  get alarms() {
    return state.alarms;
  },
  get timer() {
    return state.timer;
  },
  async unlockAudio() {
    return ensureAudio();
  },
  clear() {
    state.alarms = [];
    state.timer = { ...defaults.timer };
    soundEvents.length = 0;
    stopRing();
    saveState();
    renderAlarms();
    renderTimer();
    updateClock();
  },
  createTestAlarm(seconds = 5) {
    return addOneTimeAlarm(seconds, "Automated test alarm");
  },
  startTestTimer(seconds = 3) {
    setTimerDuration(seconds);
    startTimer();
  }
};

applySettings();
setDefaultAlarmTime();
renderAlarms();
renderTimer();
updateClock();
bindEvents();
window.setInterval(tick, 250);
