// 「献立リスト」ページの画面表示
// トップ画面で保存した献立（期間のブックマーク）を一覧表示し、
// タップするとその期間を表示する状態にしてトップ画面に戻る。
const SAVED_MENUS_KEY = "menuApp.savedMenus";
const PERIOD_STORAGE_KEY = "menuApp.periodStart";
const PERIOD_END_STORAGE_KEY = "menuApp.periodEnd";

const savedMenuList = document.getElementById("saved-menu-list");
const savedMenuEmpty = document.getElementById("saved-menu-empty");

function loadSavedMenus() {
  const raw = localStorage.getItem(SAVED_MENUS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSavedMenus(list) {
  localStorage.setItem(SAVED_MENUS_KEY, JSON.stringify(list));
}

function renderSavedMenus() {
  const list = loadSavedMenus();
  savedMenuList.innerHTML = "";
  savedMenuEmpty.style.display = list.length === 0 ? "block" : "none";

  for (const item of list) {
    const li = document.createElement("li");

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "saved-menu-btn";

    const labelSpan = document.createElement("span");
    labelSpan.className = "saved-menu-label";
    labelSpan.textContent = item.label;

    const rangeSpan = document.createElement("span");
    rangeSpan.className = "saved-menu-range";
    rangeSpan.textContent = `${item.periodStart} 〜 ${item.periodEnd}`;

    openBtn.appendChild(labelSpan);
    openBtn.appendChild(rangeSpan);
    openBtn.addEventListener("click", () => {
      localStorage.setItem(PERIOD_STORAGE_KEY, item.periodStart);
      localStorage.setItem(PERIOD_END_STORAGE_KEY, item.periodEnd);
      location.href = "index.html";
    });
    li.appendChild(openBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "削除");
    deleteBtn.addEventListener("click", () => {
      const current = loadSavedMenus().filter((i) => i.id !== item.id);
      saveSavedMenus(current);
      renderSavedMenus();
    });
    li.appendChild(deleteBtn);

    savedMenuList.appendChild(li);
  }
}

renderSavedMenus();

// PWA用：Service Workerを登録してオフラインでも開けるようにする
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // 登録に失敗しても画面自体は動くので無視してよい
    });
  });
}
