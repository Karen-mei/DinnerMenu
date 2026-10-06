// 「家族構成」ページの画面表示
// ここで登録した人が、トップ画面の「今週の予定」で日ごとに選べるようになる。
const FAMILY_STORAGE_KEY = "menuApp.familyMembers";
const DEFAULT_FAMILY_MEMBERS = [
  { id: 0, name: "ママ", type: "adult", phase: "" },
  { id: 1, name: "パパ", type: "adult", phase: "" },
  { id: 2, name: "子ども", type: "child", phase: "〜3歳（大人の1/3〜1/2程度）" },
];

const familyForm = document.getElementById("family-form");
const familyNameInput = document.getElementById("family-name-input");
const familyTypeInput = document.getElementById("family-type-input");
const familyPhaseInput = document.getElementById("family-phase-input");
const familyList = document.getElementById("family-list");

familyTypeInput.addEventListener("change", () => {
  familyPhaseInput.hidden = familyTypeInput.value !== "child";
});

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

function moveMember(id, direction) {
  const members = loadFamilyMembers();
  const index = members.findIndex((m) => m.id === id);
  const newIndex = index + direction;
  if (index === -1 || newIndex < 0 || newIndex >= members.length) return;

  [members[index], members[newIndex]] = [members[newIndex], members[index]];
  saveFamilyMembers(members);
  renderFamily();
}

function renderFamily() {
  const members = loadFamilyMembers();
  familyList.innerHTML = "";

  members.forEach((member, index) => {
    const li = document.createElement("li");

    const reorderGroup = document.createElement("div");
    reorderGroup.className = "reorder-group";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "reorder-btn";
    upBtn.textContent = "▲";
    upBtn.setAttribute("aria-label", "上へ移動");
    upBtn.disabled = index === 0;
    upBtn.addEventListener("click", () => moveMember(member.id, -1));
    reorderGroup.appendChild(upBtn);

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "reorder-btn";
    downBtn.textContent = "▼";
    downBtn.setAttribute("aria-label", "下へ移動");
    downBtn.disabled = index === members.length - 1;
    downBtn.addEventListener("click", () => moveMember(member.id, 1));
    reorderGroup.appendChild(downBtn);

    li.appendChild(reorderGroup);

    const nameLabel = document.createElement("span");
    nameLabel.className = "pantry-name";
    const typeLabel = member.type === "adult" ? "大人" : "子ども";
    const phaseLabel = member.type === "child" && member.phase ? `・${member.phase}` : "";
    nameLabel.textContent = `${member.name}（${typeLabel}${phaseLabel}）`;
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
  });
}

familyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = familyNameInput.value.trim();
  if (!name) return;
  const type = familyTypeInput.value === "child" ? "child" : "adult";
  const phase = type === "child" ? familyPhaseInput.value : "";

  const members = loadFamilyMembers();
  members.push({ id: Date.now(), name, type, phase });
  saveFamilyMembers(members);
  renderFamily();

  familyNameInput.value = "";
  familyTypeInput.value = "adult";
  familyPhaseInput.value = "";
  familyPhaseInput.hidden = true;
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
