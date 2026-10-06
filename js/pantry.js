// 「調味料マスタ」ページの画面表示
// データの読み書き(loadPantry/保存のキー)はindex.htmlのapp.jsと同じ考え方をここでも使う。
const PANTRY_STORAGE_KEY = "menuApp.pantryItems";
const DEFAULT_PANTRY_ITEMS = [
  "醤油", "みそ", "塩", "砂糖", "酢", "みりん", "料理酒",
  "サラダ油", "ごま油", "こしょう", "だしの素", "片栗粉", "マヨネーズ", "ケチャップ",
];

const pantryForm = document.getElementById("pantry-form");
const pantryInput = document.getElementById("pantry-input");
const pantryList = document.getElementById("pantry-list");

function loadPantry() {
  const raw = localStorage.getItem(PANTRY_STORAGE_KEY);
  if (!raw) {
    const defaults = DEFAULT_PANTRY_ITEMS.map((name, i) => ({ id: i, name, hasIt: true }));
    savePantry(defaults);
    return defaults;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePantry(items) {
  localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
}

function renderPantry() {
  const items = loadPantry();
  pantryList.innerHTML = "";

  for (const item of items) {
    const li = document.createElement("li");
    if (item.hasIt) li.classList.add("has-it");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "pantry-checkbox";
    checkbox.checked = item.hasIt;
    checkbox.setAttribute("aria-label", `${item.name}が家にある`);
    checkbox.addEventListener("change", () => {
      const current = loadPantry();
      const target = current.find((i) => i.id === item.id);
      if (target) target.hasIt = checkbox.checked;
      savePantry(current);
      li.classList.toggle("has-it", checkbox.checked);
    });
    li.appendChild(checkbox);

    const nameLabel = document.createElement("span");
    nameLabel.className = "pantry-name";
    nameLabel.textContent = item.name;
    li.appendChild(nameLabel);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "削除");
    deleteBtn.addEventListener("click", () => {
      const current = loadPantry().filter((i) => i.id !== item.id);
      savePantry(current);
      renderPantry();
    });
    li.appendChild(deleteBtn);

    pantryList.appendChild(li);
  }
}

pantryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = pantryInput.value.trim();
  if (!name) return;

  const items = loadPantry();
  items.push({ id: Date.now(), name, hasIt: true });
  savePantry(items);
  renderPantry();

  pantryInput.value = "";
  pantryInput.focus();
});

renderPantry();

// PWA用：Service Workerを登録してオフラインでも開けるようにする
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // 登録に失敗しても画面自体は動くので無視してよい
    });
  });
}
