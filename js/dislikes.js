// 「苦手な食材」ページの画面表示
// 「いつまで」を設定すると、その日を過ぎたらAIへの質問文には含めなくなる
// （妊娠中だけNG、のような一時的な制限のため）。空欄ならずっと有効。
const DISLIKE_STORAGE_KEY = "menuApp.dislikedIngredients";
const DEFAULT_DISLIKED_INGREDIENTS = ["レバー", "加工肉", "ベーコン"];

const dislikeForm = document.getElementById("dislike-form");
const dislikeNameInput = document.getElementById("dislike-name-input");
const dislikeUntilInput = document.getElementById("dislike-until-input");
const dislikeList = document.getElementById("dislike-list");
const dislikeEmptyMessage = document.getElementById("dislike-empty-message");

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadDislikedIngredients() {
  const raw = localStorage.getItem(DISLIKE_STORAGE_KEY);
  if (!raw) {
    const defaults = DEFAULT_DISLIKED_INGREDIENTS.map((text, i) => ({ id: i, text, until: "" }));
    saveDislikedIngredients(defaults);
    return defaults;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveDislikedIngredients(items) {
  localStorage.setItem(DISLIKE_STORAGE_KEY, JSON.stringify(items));
}

function renderDislikes() {
  const items = loadDislikedIngredients();
  dislikeList.innerHTML = "";
  dislikeEmptyMessage.style.display = items.length === 0 ? "block" : "none";

  for (const item of items) {
    const li = document.createElement("li");
    const isExpired = item.until && item.until < todayKey();
    if (isExpired) li.classList.add("is-expired");

    const nameLabel = document.createElement("span");
    nameLabel.className = "pantry-name";
    nameLabel.textContent = item.until
      ? `${item.text}（〜${item.until}${isExpired ? "・期限切れ" : ""}）`
      : item.text;
    li.appendChild(nameLabel);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "削除");
    deleteBtn.addEventListener("click", () => {
      const current = loadDislikedIngredients().filter((i) => i.id !== item.id);
      saveDislikedIngredients(current);
      renderDislikes();
    });
    li.appendChild(deleteBtn);

    dislikeList.appendChild(li);
  }
}

dislikeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = dislikeNameInput.value.trim();
  if (!text) return;
  const until = dislikeUntilInput.value;

  const items = loadDislikedIngredients();
  items.unshift({ id: Date.now(), text, until });
  saveDislikedIngredients(items);
  renderDislikes();

  dislikeNameInput.value = "";
  dislikeUntilInput.value = "";
  dislikeNameInput.focus();
});

renderDislikes();

// PWA用：Service Workerを登録してオフラインでも開けるようにする
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // 登録に失敗しても画面自体は動くので無視してよい
    });
  });
}
