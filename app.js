const STORAGE_KEYS = {
  activeChatId: "saafar.activeChatId",
  chats: "saafar.chats",
  settings: "saafar.settings"
};

const DEFAULT_SETTINGS = {
  creatorName: "Yahir",
  defaultCountry: "Honduras",
  defaultTimeZone: "America/Tegucigalpa",
  voiceEnabled: true,
  speechRate: 1
};

const COUNTRY_TIME_ZONES = {
  argentina: { label: "Argentina", zone: "America/Argentina/Buenos_Aires" },
  bolivia: { label: "Bolivia", zone: "America/La_Paz" },
  brasil: { label: "Brasil", zone: "America/Sao_Paulo" },
  chile: { label: "Chile", zone: "America/Santiago" },
  colombia: { label: "Colombia", zone: "America/Bogota" },
  "costa rica": { label: "Costa Rica", zone: "America/Costa_Rica" },
  cuba: { label: "Cuba", zone: "America/Havana" },
  ecuador: { label: "Ecuador", zone: "America/Guayaquil" },
  "el salvador": { label: "El Salvador", zone: "America/El_Salvador" },
  espana: { label: "Espana", zone: "Europe/Madrid" },
  "estados unidos": { label: "Estados Unidos", zone: "America/New_York" },
  guatemala: { label: "Guatemala", zone: "America/Guatemala" },
  honduras: { label: "Honduras", zone: "America/Tegucigalpa" },
  mexico: { label: "Mexico", zone: "America/Mexico_City" },
  nicaragua: { label: "Nicaragua", zone: "America/Managua" },
  panama: { label: "Panama", zone: "America/Panama" },
  paraguay: { label: "Paraguay", zone: "America/Asuncion" },
  peru: { label: "Peru", zone: "America/Lima" },
  "republica dominicana": {
    label: "Republica Dominicana",
    zone: "America/Santo_Domingo"
  },
  uruguay: { label: "Uruguay", zone: "America/Montevideo" },
  venezuela: { label: "Venezuela", zone: "America/Caracas" }
};

function createId() {
  return `chat-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[?!.;,]/g, "")
    .trim();
}

function formatDate(date, timeZone) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "full",
    timeZone: getSafeTimeZone(timeZone)
  }).format(date);
}

function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat("es-HN", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: getSafeTimeZone(timeZone)
  }).format(date);
}

function getSafeTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("es-HN", { timeZone });
    return timeZone;
  } catch (error) {
    return DEFAULT_SETTINGS.defaultTimeZone;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

class SaafarEngine {
  constructor(getSettings) {
    this.getSettings = getSettings;
  }

  getCapabilities() {
    return [
      "Responder saludos y preguntas basicas",
      "Decir que dia es hoy",
      "Mostrar la hora actual en tu pais o en otros paises conocidos",
      "Explicar quien me creo y cual es mi version",
      "Hablar en voz alta desde el navegador"
    ];
  }

  resolveCountry(normalizedMessage) {
    if (normalizedMessage.includes("este pais") || normalizedMessage.includes("mi pais")) {
      const settings = this.getSettings();
      return {
        label: settings.defaultCountry,
        zone: settings.defaultTimeZone
      };
    }

    for (const [countryKey, definition] of Object.entries(COUNTRY_TIME_ZONES)) {
      if (normalizedMessage.includes(countryKey)) {
        return definition;
      }
    }

    return null;
  }

  answer(message) {
    const settings = this.getSettings();
    const normalizedMessage = normalizeText(message);
    const now = new Date();

    if (!normalizedMessage) {
      return "Escribe algo y te respondo. Puedes probar con: hola, que dia es hoy, o que hora es en Honduras.";
    }

    if (/^(hola|buenas|hello|que tal|holi)/.test(normalizedMessage)) {
      return "Hola, bien y vos? Soy Saafar 1.0 H, tu asistente local.";
    }

    if (
      normalizedMessage.includes("como estas") ||
      normalizedMessage.includes("como te sientes")
    ) {
      return "Estoy funcionando bien y listo para ayudarte. Puedes preguntarme por la fecha, la hora o datos del sistema.";
    }

    if (
      normalizedMessage.includes("que dia es hoy") ||
      normalizedMessage.includes("fecha de hoy") ||
      normalizedMessage.includes("cual es la fecha")
    ) {
      return `Hoy es ${formatDate(now, settings.defaultTimeZone)}.`;
    }

    if (
      normalizedMessage.includes("que hora es") ||
      normalizedMessage.includes("hora actual") ||
      normalizedMessage.includes("hora en")
    ) {
      const country = this.resolveCountry(normalizedMessage) || {
        label: settings.defaultCountry,
        zone: settings.defaultTimeZone
      };

      return `La hora actual en ${country.label} es ${formatTime(now, country.zone)}.`;
    }

    if (
      normalizedMessage.includes("quien te creo") ||
      normalizedMessage.includes("quien te hizo") ||
      normalizedMessage.includes("quien eres")
    ) {
      return `Soy Saafar 1.0 H, una IA local basica creada para esta instancia por ${settings.creatorName}.`;
    }

    if (
      normalizedMessage.includes("tu version") ||
      normalizedMessage.includes("que version eres") ||
      normalizedMessage.includes("version")
    ) {
      return "Mi version activa es Saafar 1.0 H, un modelo local ligero basado en reglas y conocimiento fijo.";
    }

    if (
      normalizedMessage.includes("que puedes hacer") ||
      normalizedMessage.includes("ayuda") ||
      normalizedMessage.includes("comandos")
    ) {
      return `Puedo ayudarte con estas funciones: ${this.getCapabilities().join(", ")}.`;
    }

    if (
      normalizedMessage.includes("gracias") ||
      normalizedMessage.includes("muchas gracias")
    ) {
      return "Con gusto. Si quieres, prueba tambien con preguntas sobre la hora en otro pais o revisa la seccion de ajustes.";
    }

    if (
      normalizedMessage.includes("hablar") ||
      normalizedMessage.includes("voz") ||
      normalizedMessage.includes("microfono")
    ) {
      return "Puedes usar el boton Hablar para dictar tu mensaje. Si activas la opcion de voz, tambien leere mis respuestas.";
    }

    return [
      "Todavia soy un modelo local basico, pero puedo ayudarte con saludos, fecha, hora por pais, version, ajustes y voz.",
      "Prueba con frases como:",
      '"hola"',
      '"que dia es hoy"',
      '"que hora es en Mexico"',
      '"quien te creo"'
    ].join(" ");
  }
}

class SaafarApp {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS, ...loadJson(STORAGE_KEYS.settings, {}) };
    this.chats = loadJson(STORAGE_KEYS.chats, []);
    this.activeChatId = localStorage.getItem(STORAGE_KEYS.activeChatId);
    this.engine = new SaafarEngine(() => this.settings);
    this.recognition = null;

    this.elements = {
      chatList: document.getElementById("chat-list"),
      clockBadge: document.getElementById("clock-badge"),
      composerForm: document.getElementById("composer-form"),
      creatorNameInput: document.getElementById("creator-name-input"),
      countryInput: document.getElementById("country-input"),
      currentViewTitle: document.getElementById("current-view-title"),
      messageInput: document.getElementById("message-input"),
      messageList: document.getElementById("message-list"),
      micButton: document.getElementById("mic-button"),
      navButtons: document.querySelectorAll(".nav-button"),
      newChatButton: document.getElementById("new-chat-button"),
      settingsForm: document.getElementById("settings-form"),
      speechRateInput: document.getElementById("speech-rate-input"),
      timeZoneInput: document.getElementById("timezone-input"),
      voiceEnabledInput: document.getElementById("voice-enabled-input"),
      voiceSectionStatus: document.getElementById("voice-status"),
      voiceStartButton: document.getElementById("voice-start-button"),
      voiceStopButton: document.getElementById("voice-stop-button")
    };
  }

  init() {
    if (!this.chats.length) {
      this.createChat("Bienvenida");
      this.addAssistantMessage(
        this.getActiveChat().id,
        "Hola, soy Saafar 1.0 H. Puedo responder saludos, darte la fecha, decirte la hora en varios paises y hablar contigo."
      );
    } else if (!this.getActiveChat()) {
      this.activeChatId = this.chats[0].id;
    }

    this.bindEvents();
    this.populateSettings();
    this.renderChatList();
    this.renderMessages();
    this.switchSection("chat");
    this.updateClockBadge();
    setInterval(() => this.updateClockBadge(), 1000);
    this.setupSpeechRecognition();
  }

  bindEvents() {
    this.elements.composerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.sendMessage();
    });

    this.elements.newChatButton.addEventListener("click", () => {
      this.createChat();
      this.renderChatList();
      this.renderMessages();
      this.switchSection("chat");
    });

    this.elements.micButton.addEventListener("click", () => this.startListening());
    this.elements.voiceStartButton.addEventListener("click", () => this.startListening());
    this.elements.voiceStopButton.addEventListener("click", () => this.stopListening());

    this.elements.navButtons.forEach((button) => {
      button.addEventListener("click", () => this.switchSection(button.dataset.section));
    });

    this.elements.settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.saveSettings();
    });
  }

  populateSettings() {
    this.elements.creatorNameInput.value = this.settings.creatorName;
    this.elements.countryInput.value = this.settings.defaultCountry;
    this.elements.timeZoneInput.value = this.settings.defaultTimeZone;
    this.elements.voiceEnabledInput.checked = Boolean(this.settings.voiceEnabled);
    this.elements.speechRateInput.value = this.settings.speechRate;
  }

  createChat(title = "Nuevo chat") {
    const chat = {
      id: createId(),
      title,
      createdAt: new Date().toISOString(),
      messages: []
    };

    this.chats.unshift(chat);
    this.activeChatId = chat.id;
    this.persistChats();
    return chat;
  }

  getActiveChat() {
    return this.chats.find((chat) => chat.id === this.activeChatId) || null;
  }

  persistChats() {
    saveJson(STORAGE_KEYS.chats, this.chats);
    localStorage.setItem(STORAGE_KEYS.activeChatId, this.activeChatId || "");
  }

  addUserMessage(chatId, content) {
    const chat = this.chats.find((item) => item.id === chatId);
    if (!chat) return;

    chat.messages.push({
      id: createId(),
      role: "user",
      content,
      createdAt: new Date().toISOString()
    });

    if (chat.title === "Nuevo chat" || chat.title === "Bienvenida") {
      chat.title = content.slice(0, 28) || chat.title;
    }

    this.persistChats();
  }

  addAssistantMessage(chatId, content) {
    const chat = this.chats.find((item) => item.id === chatId);
    if (!chat) return;

    chat.messages.push({
      id: createId(),
      role: "assistant",
      content,
      createdAt: new Date().toISOString()
    });

    this.persistChats();
  }

  renderChatList() {
    this.elements.chatList.innerHTML = "";

    this.chats.forEach((chat) => {
      const button = document.createElement("button");
      button.className = `chat-item${chat.id === this.activeChatId ? " active" : ""}`;
      button.type = "button";
      const title = document.createElement("strong");
      title.textContent = chat.title;
      const meta = document.createElement("span");
      meta.textContent = `${chat.messages.length} mensajes`;
      button.append(title, meta);
      button.addEventListener("click", () => {
        this.activeChatId = chat.id;
        this.persistChats();
        this.renderChatList();
        this.renderMessages();
        this.switchSection("chat");
      });
      this.elements.chatList.appendChild(button);
    });
  }

  renderMessages() {
    const chat = this.getActiveChat();
    this.elements.messageList.innerHTML = "";

    if (!chat || !chat.messages.length) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "message assistant";
      const emptyMeta = document.createElement("span");
      emptyMeta.className = "message-meta";
      emptyMeta.textContent = "Saafar";
      emptyMessage.append(
        emptyMeta,
        document.createTextNode("Este chat esta vacio. Escribe tu primera pregunta.")
      );
      this.elements.messageList.appendChild(emptyMessage);
      return;
    }

    chat.messages.forEach((message) => {
      const article = document.createElement("article");
      article.className = `message ${message.role}`;
      const label = message.role === "user" ? "Tu" : "Saafar";
      const meta = document.createElement("span");
      meta.className = "message-meta";
      meta.textContent = label;
      article.append(meta, document.createTextNode(message.content));
      this.elements.messageList.appendChild(article);
    });

    this.elements.messageList.scrollTop = this.elements.messageList.scrollHeight;
  }

  switchSection(sectionName) {
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.toggle("active", section.id === `${sectionName}-section`);
    });

    this.elements.navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.section === sectionName);
    });

    const titles = {
      chat: "Conversacion",
      voice: "Hablar",
      settings: "Ajustes",
      version: "Version"
    };

    this.elements.currentViewTitle.textContent = titles[sectionName] || "Saafar";
  }

  sendMessage(prefilledMessage) {
    const message = (prefilledMessage || this.elements.messageInput.value).trim();
    const chat = this.getActiveChat();

    if (!message || !chat) {
      return;
    }

    this.addUserMessage(chat.id, message);
    const response = this.engine.answer(message);
    this.addAssistantMessage(chat.id, response);
    this.renderChatList();
    this.renderMessages();
    this.elements.messageInput.value = "";

    if (this.settings.voiceEnabled) {
      this.speak(response);
    }
  }

  saveSettings() {
    this.settings = {
      creatorName: this.elements.creatorNameInput.value.trim() || DEFAULT_SETTINGS.creatorName,
      defaultCountry: this.elements.countryInput.value.trim() || DEFAULT_SETTINGS.defaultCountry,
      defaultTimeZone: getSafeTimeZone(
        this.elements.timeZoneInput.value.trim() || DEFAULT_SETTINGS.defaultTimeZone
      ),
      voiceEnabled: this.elements.voiceEnabledInput.checked,
      speechRate: Number(this.elements.speechRateInput.value)
    };

    saveJson(STORAGE_KEYS.settings, this.settings);
    this.elements.timeZoneInput.value = this.settings.defaultTimeZone;
    this.updateClockBadge();

    const chat = this.getActiveChat();
    if (chat) {
      this.addAssistantMessage(
        chat.id,
        "Ajustes guardados. Ya actualice tu creador, pais base, zona horaria y preferencias de voz."
      );
      this.renderMessages();
      this.renderChatList();
    }
  }

  updateClockBadge() {
    const now = new Date();
    this.elements.clockBadge.textContent = `${this.settings.defaultCountry}: ${formatTime(
      now,
      this.settings.defaultTimeZone
    )}`;
  }

  speak(text) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-HN";
    utterance.rate = this.settings.speechRate;
    window.speechSynthesis.speak(utterance);
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.elements.voiceSectionStatus.textContent =
        "Estado: tu navegador no soporta reconocimiento de voz.";
      this.elements.micButton.disabled = true;
      this.elements.voiceStartButton.disabled = true;
      this.elements.voiceStopButton.disabled = true;
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = "es-HN";
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.addEventListener("start", () => {
      this.elements.voiceSectionStatus.textContent = "Estado: escuchando...";
    });

    this.recognition.addEventListener("result", (event) => {
      const transcript = event.results[0][0].transcript;
      this.elements.messageInput.value = transcript;
      this.elements.voiceSectionStatus.textContent = `Estado: escuchado "${transcript}".`;
      this.sendMessage(transcript);
      this.switchSection("chat");
    });

    this.recognition.addEventListener("end", () => {
      if (this.elements.voiceSectionStatus.textContent === "Estado: escuchando...") {
        this.elements.voiceSectionStatus.textContent = "Estado: en espera.";
      }
    });

    this.recognition.addEventListener("error", (event) => {
      this.elements.voiceSectionStatus.textContent = `Estado: error de voz (${event.error}).`;
    });
  }

  startListening() {
    if (!this.recognition) {
      return;
    }

    this.switchSection("voice");
    try {
      this.recognition.start();
    } catch (error) {
      this.elements.voiceSectionStatus.textContent = "Estado: el microfono ya estaba activo.";
    }
  }

  stopListening() {
    if (!this.recognition) {
      return;
    }

    this.recognition.stop();
    this.elements.voiceSectionStatus.textContent = "Estado: detenido.";
  }
}

const app = new SaafarApp();
app.init();
