const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const WEEK_SHORT = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const MAIN_PLANNING = [
  [
    { time: "09:30", duration: "120", activity: "Bethléem", client: "Seniors", type: "Structure", coach: "Arthur" },
    { time: "10:00", duration: "60", activity: "Villa", client: "Seniors", type: "Structure", coach: "Florian" },
    { time: "14:00", duration: "180", activity: "FAM", client: "Seniors", type: "Structure", coach: "Arthur et Florian" },
    { time: "19:00", duration: "60", activity: "Sport santé", client: "Seniors", type: "Sport santé", coach: "Arthur" }
  ],
  [
    { time: "09:00", duration: "180", activity: "Sport santé", client: "Seniors", type: "Sport santé", coach: "Florian" },
    { time: "14:00", duration: "90", activity: "Baby vélo", client: "Enfants", type: "École de vélo", coach: "Arthur" },
    { time: "14:00", duration: "180", activity: "Sport santé", client: "Seniors", type: "Sport santé", coach: "Arthur" },
    { time: "16:00", duration: "60", activity: "Baby vélo", client: "Enfants", type: "École de vélo", coach: "Florian" }
  ],
  [
    { time: "10:00", duration: "120", activity: "U7 / U9 VTT", client: "Enfants", type: "École de vélo", coach: "Arthur" },
    { time: "10:00", duration: "120", activity: "U9 / U11 route", client: "Enfants", type: "École de vélo", coach: "Florian" },
    { time: "14:00", duration: "180", activity: "École de vélo U13 / U15 / U17", client: "Ados", type: "École de vélo / compétition", coach: "Arthur et Florian" }
  ],
  [
    { time: "09:00", duration: "150", activity: "Vélo d'appartement", client: "Seniors", type: "Sport santé", coach: "Arthur" },
    { time: "14:00", duration: "120", activity: "Sport santé - gym douce", client: "Seniors", type: "Sport santé", coach: "Florian" },
    { time: "15:00", duration: "120", activity: "Verneuil", client: "Seniors", type: "Structure", coach: "Arthur" },
    { time: "17:30", duration: "60", activity: "Sport santé", client: "Seniors", type: "Sport santé", coach: "Arthur" }
  ],
  [
    { time: "10:00", duration: "120", activity: "Vélo d'appartement", client: "Seniors", type: "Sport santé", coach: "Florian" },
    { time: "14:00", duration: "120", activity: "Sport santé - gym douce", client: "Seniors", type: "Sport santé", coach: "Arthur" }
  ],
  [
    { time: "09:30", duration: "120", activity: "VTT U13 et +", client: "Ados", type: "École de vélo / compétition", coach: "Florian" },
    { time: "16:30", duration: "30", activity: "Décrassage", client: "Seniors", type: "Récupération", coach: "Arthur" }
  ],
  []
];
let sessions = [];
let selectedDate = new Date();
let weekStart = startOfWeek(selectedDate);

const els = {
  weekTitle: document.getElementById("weekTitle"),
  weekBoard: document.getElementById("weekBoard"),
  selectedTitle: document.getElementById("selectedTitle"),
  selectedCount: document.getElementById("selectedCount"),
  selectedSessions: document.getElementById("selectedSessions"),
  shareLink: document.getElementById("shareLink"),
  message: document.getElementById("message"),
  fields: {
    client: document.getElementById("client"),
    date: document.getElementById("date"),
    time: document.getElementById("time"),
    duration: document.getElementById("duration"),
    activity: document.getElementById("activity"),
    status: document.getElementById("status"),
    coach: document.getElementById("coach"),
    intensity: document.getElementById("intensity"),
    repeatWeeks: document.getElementById("repeatWeeks"),
    goal: document.getElementById("goal"),
    material: document.getElementById("material"),
    instructions: document.getElementById("instructions"),
    comment: document.getElementById("comment"),
    resultTime: document.getElementById("resultTime"),
    resultDistance: document.getElementById("resultDistance"),
    resultProgram: document.getElementById("resultProgram"),
    resultResistance: document.getElementById("resultResistance")
  }
};

function localISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISO(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return start;
}

function formatNumeric(date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatLong(date) {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .replace(/^./, letter => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) throw new Error("Erreur serveur");
  return response.json();
}

async function loadSessions() {
  sessions = await api("/api/sessions");
  render();
}

function sessionsForDate(iso) {
  return sessions
    .filter(session => session.date === iso)
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
}

function plannedSessionsForDate(date) {
  const dayIndex = (date.getDay() + 6) % 7;
  const iso = localISO(date);
  return (MAIN_PLANNING[dayIndex] || []).map((session, index) => ({
    ...session,
    date: iso,
    planIndex: `${iso}-${index}`
  }));
}

function weekDates() {
  return WEEK_DAYS.map((_, index) => addDays(weekStart, index));
}

function render() {
  const dates = weekDates();
  els.weekTitle.textContent = `Semaine du ${formatNumeric(dates[0])} au ${formatNumeric(dates[6])}`;
  els.shareLink.textContent = window.location.href;
  const todayIso = localISO(new Date());
  const selectedIso = localISO(selectedDate);

  els.weekBoard.innerHTML = dates.map((date, index) => {
    const iso = localISO(date);
    const plannedSessions = plannedSessionsForDate(date);
    const daySessions = sessionsForDate(iso);
    return `
      <article class="day ${iso === selectedIso ? "selected" : ""} ${iso === todayIso ? "today" : ""}" data-date="${iso}">
        <div class="day-head">
          <span>${WEEK_SHORT[index]}</span>
          <span class="day-date">${date.getDate()}/${date.getMonth() + 1}</span>
        </div>
        <div class="day-body">
          ${plannedSessions.map(session => `
            <button class="session-pill planned" type="button" data-date="${iso}" data-plan="${escapeHtml(session.planIndex)}">
              <strong>${escapeHtml(session.time)} · ${escapeHtml(session.activity)}</strong>
              <span>${escapeHtml(session.client)} · ${escapeHtml(session.coach)}</span>
            </button>
          `).join("")}
          ${daySessions.map(session => `
            <div class="session-pill detailed">
              <strong>${escapeHtml(session.time || "--:--")} · ${escapeHtml(session.activity || "Séance")}</strong>
              <span>Détail enregistré · ${escapeHtml(session.client || session.coach || "Groupe à préciser")}</span>
            </div>
          `).join("")}
          ${!plannedSessions.length && !daySessions.length ? `<div class="free">Libre</div>` : ""}
        </div>
      </article>
    `;
  }).join("");

  renderSelectedDay();
}

function renderSelectedDay() {
  const iso = localISO(selectedDate);
  const plannedSessions = plannedSessionsForDate(selectedDate);
  const daySessions = sessionsForDate(iso);
  els.selectedTitle.textContent = formatLong(selectedDate);
  const totalCount = plannedSessions.length + daySessions.length;
  els.selectedCount.textContent = `${totalCount} séance${totalCount > 1 ? "s" : ""} ce jour`;
  els.fields.date.value = iso;

  if (!plannedSessions.length && !daySessions.length) {
    els.selectedSessions.innerHTML = `<div class="free">Aucune séance ce jour</div>`;
    return;
  }

  els.selectedSessions.innerHTML = `
    ${plannedSessions.map(session => `
      <div class="session-card planned-card">
        <strong>${escapeHtml(session.time)} · ${escapeHtml(session.activity)}</strong>
        <p><b>Public :</b> ${escapeHtml(session.client)} · <b>Type :</b> ${escapeHtml(session.type)}</p>
        <p><b>Encadrant :</b> ${escapeHtml(session.coach)}</p>
        <button class="primary" type="button" data-plan="${escapeHtml(session.planIndex)}">Renseigner le détail</button>
      </div>
    `).join("")}
    ${daySessions.map(session => `
    <div class="session-card">
      <strong>${escapeHtml(session.time || "--:--")} · ${escapeHtml(session.activity || "Séance sans titre")}</strong>
      <p>${escapeHtml(session.client || "Groupe à préciser")}${session.duration ? ` · ${escapeHtml(session.duration)} min` : ""}${session.status ? ` · ${escapeHtml(session.status)}` : ""}</p>
      ${session.coach ? `<p><b>Encadrant :</b> ${escapeHtml(session.coach)}</p>` : ""}
      ${session.goal ? `<p><b>Objectif :</b> ${escapeHtml(session.goal)}</p>` : ""}
      ${session.material ? `<p><b>Matériel :</b> ${escapeHtml(session.material)}</p>` : ""}
      ${session.instructions ? `<p><b>Descriptif :</b> ${escapeHtml(session.instructions)}</p>` : ""}
      ${session.comment ? `<p><b>Commentaire :</b> ${escapeHtml(session.comment)}</p>` : ""}
      ${session.resultTime || session.resultDistance || session.resultProgram || session.resultResistance ? `<p><b>Résultats :</b> ${escapeHtml(session.resultTime || "-")} min · ${escapeHtml(session.resultDistance || "-")} km · prog. ${escapeHtml(session.resultProgram || "-")} · résistance ${escapeHtml(session.resultResistance || "-")}</p>` : ""}
      <button class="danger" type="button" data-delete="${escapeHtml(session.id)}">Supprimer</button>
    </div>
    `).join("")}
  `;
}

function formDataFor(date, index = 0) {
  const sessionDate = addDays(date, index * 7);
  return {
    date: localISO(sessionDate),
    client: els.fields.client.value.trim(),
    time: els.fields.time.value,
    duration: els.fields.duration.value,
    activity: els.fields.activity.value,
    status: els.fields.status.value,
    coach: els.fields.coach.value,
    intensity: els.fields.intensity.value,
    goal: els.fields.goal.value.trim(),
    material: els.fields.material.value.trim(),
    instructions: els.fields.instructions.value.trim(),
    comment: els.fields.comment.value.trim(),
    resultTime: els.fields.resultTime.value,
    resultDistance: els.fields.resultDistance.value,
    resultProgram: els.fields.resultProgram.value,
    resultResistance: els.fields.resultResistance.value
  };
}

function resetForm() {
  Object.entries(els.fields).forEach(([key, field]) => {
    if (key === "date") field.value = localISO(selectedDate);
    else if (key === "repeatWeeks") field.value = "1";
    else if (key === "status") field.value = "Planifiée";
    else field.value = "";
  });
  els.message.textContent = "";
}

function fillFormFromPlan(planIndex) {
  const plan = plannedSessionsForDate(selectedDate).find(session => session.planIndex === planIndex);
  if (!plan) return;
  els.fields.client.value = plan.client;
  els.fields.date.value = plan.date;
  els.fields.time.value = plan.time;
  els.fields.duration.value = plan.duration;
  els.fields.activity.value = plan.activity;
  els.fields.coach.value = plan.coach;
  els.fields.status.value = "Planifiée";
  els.fields.repeatWeeks.value = "1";
  els.fields.goal.value = "";
  els.fields.material.value = "";
  els.fields.instructions.value = "";
  els.fields.comment.value = "";
  els.message.textContent = `Détail prêt à compléter pour ${plan.activity}.`;
  document.querySelector(".workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveSession() {
  const baseDate = parseISO(els.fields.date.value);
  const repeat = Math.max(1, Number(els.fields.repeatWeeks.value || 1));
  const sample = formDataFor(baseDate, 0);
  if (!sample.client && !sample.activity && !sample.goal && !sample.instructions && !sample.comment) {
    els.message.textContent = "Ajoute au moins un groupe, une activité, un objectif, un descriptif ou un commentaire.";
    return;
  }

  for (let index = 0; index < repeat; index += 1) {
    await api("/api/sessions", {
      method: "POST",
      body: JSON.stringify(formDataFor(baseDate, index))
    });
  }
  els.message.textContent = repeat > 1 ? `${repeat} séances enregistrées.` : "Séance enregistrée.";
  resetForm();
  await loadSessions();
}

async function deleteSession(id) {
  await api(`/api/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
  await loadSessions();
  els.message.textContent = "Séance supprimée.";
}

function selectDate(date) {
  selectedDate = date;
  weekStart = startOfWeek(date);
  render();
}

document.getElementById("prevWeek").addEventListener("click", () => {
  weekStart = addDays(weekStart, -7);
  selectedDate = addDays(selectedDate, -7);
  render();
});

document.getElementById("todayWeek").addEventListener("click", () => selectDate(new Date()));

document.getElementById("nextWeek").addEventListener("click", () => {
  weekStart = addDays(weekStart, 7);
  selectedDate = addDays(selectedDate, 7);
  render();
});

els.weekBoard.addEventListener("click", event => {
  const planButton = event.target.closest("[data-plan]");
  if (planButton) {
    selectDate(parseISO(planButton.dataset.date));
    fillFormFromPlan(planButton.dataset.plan);
    return;
  }
  const day = event.target.closest("[data-date]");
  if (day) selectDate(parseISO(day.dataset.date));
});

els.fields.date.addEventListener("change", () => {
  if (els.fields.date.value) selectDate(parseISO(els.fields.date.value));
});

els.selectedSessions.addEventListener("click", event => {
  const planButton = event.target.closest("[data-plan]");
  if (planButton) {
    fillFormFromPlan(planButton.dataset.plan);
    return;
  }
  const button = event.target.closest("[data-delete]");
  if (button) deleteSession(button.dataset.delete);
});

document.getElementById("saveSession").addEventListener("click", saveSession);
document.getElementById("resetForm").addEventListener("click", resetForm);

resetForm();
loadSessions().catch(() => {
  els.message.textContent = "Impossible de charger les séances. Relance l'application sur le Mac de Fred.";
  render();
});
