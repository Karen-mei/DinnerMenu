// 「食べたいものメモ」機能
// localStorage = スマホのブラウザの中にある保存場所。ページを閉じても消えない。
const STORAGE_KEY = "menuApp.wishList";

const form = document.getElementById("wish-form");
const input = document.getElementById("wish-input");
const list = document.getElementById("wish-list");
const emptyMessage = document.getElementById("empty-message");

function loadWishes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveWishes(wishes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
}

function render(wishes) {
  list.innerHTML = "";
  emptyMessage.style.display = wishes.length === 0 ? "block" : "none";

  for (const wish of wishes) {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.className = "wish-text";
    span.textContent = wish.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "削除");
    deleteBtn.addEventListener("click", () => {
      const wishes = loadWishes().filter((w) => w.id !== wish.id);
      saveWishes(wishes);
      render(wishes);
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const wishes = loadWishes();
  wishes.unshift({ id: Date.now(), text });
  saveWishes(wishes);
  render(wishes);

  input.value = "";
  input.focus();
});

render(loadWishes());

// 「今週の予定」機能
// 日付(YYYY-MM-DD)ごとに "with"（旦那いる）/ "without"（旦那いない）/ "none"（作らない）を保存する
const WEEK_STORAGE_KEY = "menuApp.weekStatus";
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];
const STATUS_OPTIONS = [
  { value: "with", label: "旦那いる" },
  { value: "without", label: "旦那いない" },
  { value: "none", label: "作らない" },
];

const weekList = document.getElementById("week-list");

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getThisWeekDates() {
  const today = new Date();
  // getDay(): 日=0, 月=1, ... 土=6 なので、月曜始まりに揃える
  const diffFromMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffFromMonday);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function loadWeekStatus() {
  const raw = localStorage.getItem(WEEK_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveWeekStatus(statusMap) {
  localStorage.setItem(WEEK_STORAGE_KEY, JSON.stringify(statusMap));
}

function renderWeek() {
  const statusMap = loadWeekStatus();
  const todayKey = toDateKey(new Date());
  weekList.innerHTML = "";

  for (const date of getThisWeekDates()) {
    const dateKey = toDateKey(date);
    const li = document.createElement("li");
    if (dateKey === todayKey) li.classList.add("is-today");

    const label = document.createElement("span");
    label.className = "day-label";
    label.textContent = `${date.getMonth() + 1}/${date.getDate()}（${DAY_LABELS[(date.getDay() + 6) % 7]}）`;

    const group = document.createElement("div");
    group.className = "status-group";

    for (const option of STATUS_OPTIONS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "status-btn";
      btn.dataset.status = option.value;
      btn.textContent = option.label;
      if (statusMap[dateKey] === option.value) {
        btn.classList.add("is-selected");
      }
      btn.addEventListener("click", () => {
        const current = loadWeekStatus();
        // もう一度同じボタンを押したら選択解除できるようにする
        current[dateKey] = current[dateKey] === option.value ? undefined : option.value;
        saveWeekStatus(current);
        renderWeek();
      });
      group.appendChild(btn);
    }

    li.appendChild(label);
    li.appendChild(group);
    weekList.appendChild(li);
  }
}

renderWeek();

// 「AIに献立を考えてもらう」機能
// 裏方サーバーは使わず、質問文をコピーしてClaudeアプリに貼り付けてもらい、
// 返ってきた答えを貼り付けてもらう方式（無料で使える）。
const MENU_STORAGE_KEY = "menuApp.menu";

const makePromptBtn = document.getElementById("make-prompt-btn");
const promptArea = document.getElementById("prompt-area");
const promptOutput = document.getElementById("prompt-output");
const copyPromptBtn = document.getElementById("copy-prompt-btn");
const copyStatus = document.getElementById("copy-status");
const aiResponseInput = document.getElementById("ai-response-input");
const loadMenuBtn = document.getElementById("load-menu-btn");
const loadStatus = document.getElementById("load-status");
const menuList = document.getElementById("menu-list");

function buildPrompt() {
  const wishes = loadWishes();
  const wishText =
    wishes.length > 0 ? wishes.map((w) => `・${w.text}`).join("\n") : "（特になし）";

  const statusMap = loadWeekStatus();
  const statusLabels = { with: "旦那いる", without: "旦那いない", none: "作らない" };
  const days = getThisWeekDates()
    .map((date) => {
      const dateKey = toDateKey(date);
      const status = statusMap[dateKey];
      return `${dateKey}: ${status ? statusLabels[status] : "未定"}`;
    })
    .join("\n");

  return `あなたは家庭料理の献立を考える専門家です。以下の条件で1週間分の晩ごはんの献立を提案してください。

【条件】
・1歳の子どもも大人と同じ料理を取り分けて食べます。できるだけ薄味にしやすい、取り分けしやすい料理を中心に考えてください。
・「作らない」の日は献立を考えず、dish を null にしてください。
・「旦那いない」の日は、品数が少なめの簡単な料理でも構いません。
・以下の「食べたいものメモ」の中から、1週間の中で自然に使えそうなものがあれば積極的に取り入れてください（すべて使う必要はありません）。
・同じ料理が1週間で重複しないようにしてください。

【食べたいものメモ】
${wishText}

【今週の予定】
${days}

【出力形式】
説明や前置きは一切不要です。次のJSON形式のみを出力してください。
{
  "days": [
    { "date": "YYYY-MM-DD", "dish": "料理名またはnull", "note": "一言メモ（10〜20文字程度、取り分けのコツなど）" }
  ]
}`;
}

makePromptBtn.addEventListener("click", () => {
  promptOutput.value = buildPrompt();
  promptArea.hidden = false;
  copyStatus.textContent = "";
});

copyPromptBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(promptOutput.value);
    copyStatus.textContent = "コピーしました。Claudeアプリに貼り付けてください。";
    copyStatus.classList.remove("is-error");
  } catch {
    // クリップボードが使えない環境向けに、手動選択できるようにしておく
    promptOutput.focus();
    promptOutput.select();
    copyStatus.textContent = "自動コピーできませんでした。テキストが選択されているので、そのままコピーしてください。";
    copyStatus.classList.add("is-error");
  }
});

function loadMenu() {
  const raw = localStorage.getItem(MENU_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveMenu(menuMap) {
  localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuMap));
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

loadMenuBtn.addEventListener("click", () => {
  const text = aiResponseInput.value.trim();
  if (!text) {
    loadStatus.textContent = "AIの返事を貼り付けてから押してください。";
    loadStatus.classList.add("is-error");
    return;
  }

  const parsed = extractJson(text);
  if (!parsed || !Array.isArray(parsed.days)) {
    loadStatus.textContent = "読み取れませんでした。AIの返事をそのまま（JSON部分を含めて）貼り付けてください。";
    loadStatus.classList.add("is-error");
    return;
  }

  const menuMap = loadMenu();
  for (const day of parsed.days) {
    if (!day.date) continue;
    menuMap[day.date] = { dish: day.dish || null, note: day.note || "" };
  }
  saveMenu(menuMap);
  renderMenu();

  loadStatus.textContent = "読み込みました。下に献立が表示されています。";
  loadStatus.classList.remove("is-error");
  aiResponseInput.value = "";
});

function formatDateLabel(date) {
  return `${date.getMonth() + 1}/${date.getDate()}（${DAY_LABELS[(date.getDay() + 6) % 7]}）`;
}

function renderMenu() {
  const menuMap = loadMenu();
  menuList.innerHTML = "";

  for (const date of getThisWeekDates()) {
    const dateKey = toDateKey(date);
    const entry = menuMap[dateKey];
    if (!entry) continue;

    const li = document.createElement("li");
    li.dataset.dateKey = dateKey;

    const dateLabel = document.createElement("span");
    dateLabel.className = "menu-date";
    dateLabel.textContent = formatDateLabel(date);
    li.appendChild(dateLabel);

    const dishBtn = document.createElement("button");
    dishBtn.type = "button";
    dishBtn.className = "menu-dish-btn";
    dishBtn.textContent = entry.dish || "（作らない日・タップで入力）";
    dishBtn.addEventListener("click", () => startEditingDish(dateKey, date));
    li.appendChild(dishBtn);

    if (entry.note) {
      const noteLabel = document.createElement("span");
      noteLabel.className = "menu-note";
      noteLabel.textContent = entry.note;
      li.appendChild(noteLabel);
    }

    menuList.appendChild(li);
  }
}

function startEditingDish(dateKey, date) {
  const menuMap = loadMenu();
  const entry = menuMap[dateKey] || {};

  const li = document.createElement("li");

  const dateLabel = document.createElement("span");
  dateLabel.className = "menu-date";
  dateLabel.textContent = formatDateLabel(date);
  li.appendChild(dateLabel);

  const input = document.createElement("input");
  input.type = "text";
  input.className = "menu-dish-input";
  input.value = entry.dish || "";
  input.placeholder = "料理名を入力（空にすると「作らない」になります）";
  li.appendChild(input);

  // 既存のその日の表示を、この編集中の表示に差し替える
  const existingLi = [...menuList.children].find((child) => child.dataset.dateKey === dateKey);
  if (existingLi) {
    menuList.replaceChild(li, existingLi);
  }

  let saved = false;
  function commit() {
    if (saved) return;
    saved = true;
    const current = loadMenu();
    const newDish = input.value.trim();
    current[dateKey] = { ...current[dateKey], dish: newDish || null };
    saveMenu(current);
    renderMenu();
  }

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });

  input.focus();
  input.select();
}

renderMenu();

// PWA用：Service Workerを登録してオフラインでも開けるようにする
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // 登録に失敗してもメモ機能自体は動くので無視してよい
    });
  });
}
