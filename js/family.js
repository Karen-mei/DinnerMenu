// 「家族構成」ページの画面表示
// ここで登録した人が、トップ画面の「今週の予定」で日ごとに選べるようになる。
const FAMILY_STORAGE_KEY = "menuApp.familyMembers";
const DEFAULT_FAMILY_MEMBERS = [
  { id: 0, name: "ママ", type: "adult" },
  { id: 1, name: "パパ", type: "adult" },
  { id: 2, name: "子ども", type: "child" },
];

const familyForm = document.getElementById("family-form");
const familyNameInput = document.getElementById("family-name-input");
const familyTypeInput = document.getElementById("family-type-input");
const familyList = document.getElementById("family-list");

function loadFamilyMembers() {
  const raw = localStorage.getItem(FAMILY_STORAGE_KEY);
  if (!raw) {
    saveFamilyMembers(DEFAULT_FAMILY_MEMBERS);
    return DEFAULT_FAMILY_MEMBERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveFamilyMembers(members) {
  localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(members));
}

function renderFamily() {
  const members = loadFamilyMembers();
  familyList.innerHTML = "";

  for (const member of members) {
    const li = document.createElement("li");

    const nameLabel = document.createElement("span");
    nameLabel.className = "pantry-name";
    nameLabel.textContent = `${member.name}（${member.type === "adult" ? "大人" : "子ども"}）`;
    li.appendChild(nameLabel);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "削除");
    deleteBtn.addEventListener("click", () => {
      const current = loadFamilyMembers().filter((m) => m.id !== member.id);
      saveFamilyMembers(current);
      renderFamily();
    });
    li.appendChild(deleteBtn);

    familyList.appendChild(li);
  }
}

familyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = familyNameInput.value.trim();
  if (!name) return;
  const type = familyTypeInput.value === "child" ? "child" : "adult";

  const members = loadFamilyMembers();
  members.push({ id: Date.now(), name, type });
  saveFamilyMembers(members);
  renderFamily();

  familyNameInput.value = "";
  familyNameInput.focus();
});

renderFamily();

// PWA用：Service Workerを登録してオフラインでも開けるようにする
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // 登録に失敗しても画面自体は動くので無視してよい
    });
  });
}
