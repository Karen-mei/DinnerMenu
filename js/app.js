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

// PWA用：Service Workerを登録してオフラインでも開けるようにする
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // 登録に失敗してもメモ機能自体は動くので無視してよい
    });
  });
}
