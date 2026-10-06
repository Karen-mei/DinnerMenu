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

// 「苦手な食材」のデータ読み書き（画面はdislikes.htmlの方にある）
// ここに登録したものは、毎回のAIへの質問文で「使わないでください」として伝える。
// 「いつまで」が設定されていて、その日を過ぎていたら対象外にする（妊娠中だけNG、等）。
const DISLIKE_STORAGE_KEY = "menuApp.dislikedIngredients";
const DEFAULT_DISLIKED_INGREDIENTS = ["レバー", "加工肉", "ベーコン"];

function loadDislikedIngredients() {
  const raw = localStorage.getItem(DISLIKE_STORAGE_KEY);
  if (!raw) {
    const defaults = DEFAULT_DISLIKED_INGREDIENTS.map((text, i) => ({ id: i, text, until: "" }));
    localStorage.setItem(DISLIKE_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadActiveDislikedIngredients() {
  const todayKeyValue = toDateKey(new Date());
  return loadDislikedIngredients().filter((item) => !item.until || item.until >= todayKeyValue);
}

// 「今ある食材」機能
// 家にある食材（品名＋量）を書いておくと、AIへの質問文に含めて使い切りを提案してもらえる。
// 買う食材リストからも自動で除外される。
const STOCK_STORAGE_KEY = "menuApp.stock";

const stockForm = document.getElementById("stock-form");
const stockNameInput = document.getElementById("stock-name-input");
const stockAmountInput = document.getElementById("stock-amount-input");
const stockList = document.getElementById("stock-list");
const stockEmptyMessage = document.getElementById("stock-empty-message");

function loadStock() {
  const raw = localStorage.getItem(STOCK_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStock(items) {
  localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(items));
}

function renderStock() {
  const items = loadStock();
  stockList.innerHTML = "";
  stockEmptyMessage.style.display = items.length === 0 ? "block" : "none";

  for (const item of items) {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.className = "wish-text";
    span.textContent = item.amount ? `${item.name}（${item.amount}）` : item.name;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "削除");
    deleteBtn.addEventListener("click", () => {
      const current = loadStock().filter((i) => i.id !== item.id);
      saveStock(current);
      renderStock();
      renderShoppingList();
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    stockList.appendChild(li);
  }
}

stockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = stockNameInput.value.trim();
  if (!name) return;
  const amount = stockAmountInput.value.trim();

  const items = loadStock();
  items.unshift({ id: Date.now(), name, amount });
  saveStock(items);
  renderStock();
  renderShoppingList();

  stockNameInput.value = "";
  stockAmountInput.value = "";
  stockNameInput.focus();
});

renderStock();

// 「調味料マスタ」のデータ読み書き（画面はpantry.htmlの方にある）
// 家にある調味料をチェックしておくと、買う食材リストから自動で除外される。
const PANTRY_STORAGE_KEY = "menuApp.pantryItems";
const DEFAULT_PANTRY_ITEMS = [
  "醤油", "みそ", "塩", "砂糖", "酢", "みりん", "料理酒",
  "サラダ油", "ごま油", "こしょう", "だしの素", "片栗粉", "マヨネーズ", "ケチャップ",
];

function loadPantry() {
  const raw = localStorage.getItem(PANTRY_STORAGE_KEY);
  if (!raw) {
    // 初回だけ、よくある調味料をデフォルトで入れておく
    const defaults = DEFAULT_PANTRY_ITEMS.map((name, i) => ({ id: i, name, hasIt: true }));
    localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 「家族構成」のデータ読み書き（画面はfamily.htmlの方にある）
const FAMILY_STORAGE_KEY = "menuApp.familyMembers";
const DEFAULT_FAMILY_MEMBERS = [
  { id: 0, name: "ママ", type: "adult", phase: "" },
  { id: 1, name: "パパ", type: "adult", phase: "" },
  { id: 2, name: "子ども", type: "child", phase: "〜3歳（大人の1/3〜1/2程度）" },
];

function loadFamilyMembers() {
  const raw = localStorage.getItem(FAMILY_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(DEFAULT_FAMILY_MEMBERS));
    return DEFAULT_FAMILY_MEMBERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 「今週の予定」機能
// 日付(YYYY-MM-DD)ごとに、晩ごはんにいる家族のID一覧(presentIds)と、
// 作らない日かどうか(cooking: false)を保存する。
const WEEK_STORAGE_KEY = "menuApp.weekStatus";
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

const weekList = document.getElementById("week-list");

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 表示する期間（開始日〜終了日）。買い物の日がずれても前後に動かせるように、
// 「今週固定」ではなく開始日・終了日を保存しておく方式にしている。
// 例えば「木曜〜次の火曜」のような、月曜始まりではない期間にもできる。
const PERIOD_STORAGE_KEY = "menuApp.periodStart";
const PERIOD_END_STORAGE_KEY = "menuApp.periodEnd";

function parseDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getDefaultPeriodStart() {
  const today = new Date();
  // getDay(): 日=0, 月=1, ... 土=6 なので、月曜始まりに揃える
  const diffFromMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffFromMonday);
  return toDateKey(monday);
}

function loadPeriodStart() {
  return localStorage.getItem(PERIOD_STORAGE_KEY) || getDefaultPeriodStart();
}

function savePeriodStart(dateKey) {
  localStorage.setItem(PERIOD_STORAGE_KEY, dateKey);
}

function loadPeriodEnd() {
  const saved = localStorage.getItem(PERIOD_END_STORAGE_KEY);
  if (saved && parseDateKey(saved) >= parseDateKey(loadPeriodStart())) return saved;
  // 保存がない・開始日より前になってしまっている場合は、開始日から6日後（7日間）にする
  const start = parseDateKey(loadPeriodStart());
  const fallback = new Date(start);
  fallback.setDate(start.getDate() + 6);
  return toDateKey(fallback);
}

function savePeriodEnd(dateKey) {
  localStorage.setItem(PERIOD_END_STORAGE_KEY, dateKey);
}

function getPeriodKey() {
  return `${loadPeriodStart()}_${loadPeriodEnd()}`;
}

function getPeriodDates() {
  const start = parseDateKey(loadPeriodStart());
  const end = parseDateKey(loadPeriodEnd());

  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
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
  const members = loadFamilyMembers();
  const todayKey = toDateKey(new Date());
  weekList.innerHTML = "";

  for (const date of getPeriodDates()) {
    const dateKey = toDateKey(date);
    const entry = statusMap[dateKey];
    const notCooking = Boolean(entry && entry.cooking === false);
    const presentIds = entry && entry.cooking !== false ? entry.presentIds || [] : [];

    const li = document.createElement("li");
    if (dateKey === todayKey) li.classList.add("is-today");

    const label = document.createElement("span");
    label.className = "day-label";
    label.textContent = `${date.getMonth() + 1}/${date.getDate()}（${DAY_LABELS[(date.getDay() + 6) % 7]}）`;

    const group = document.createElement("div");
    group.className = "status-group";

    for (const member of members) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "status-btn member-btn";
      btn.textContent = member.name;
      if (!notCooking && presentIds.includes(member.id)) {
        btn.classList.add("is-selected");
      }
      btn.addEventListener("click", () => {
        const current = loadWeekStatus();
        const currentEntry =
          current[dateKey] && current[dateKey].cooking !== false ? current[dateKey] : { cooking: true, presentIds: [] };
        const ids = new Set(currentEntry.presentIds || []);
        if (ids.has(member.id)) ids.delete(member.id);
        else ids.add(member.id);
        current[dateKey] = { cooking: true, presentIds: [...ids] };
        saveWeekStatus(current);
        renderWeek();
      });
      group.appendChild(btn);
    }

    const noCookBtn = document.createElement("button");
    noCookBtn.type = "button";
    noCookBtn.className = "status-btn no-cook-btn";
    noCookBtn.textContent = "作らない";
    if (notCooking) noCookBtn.classList.add("is-selected");
    noCookBtn.addEventListener("click", () => {
      const current = loadWeekStatus();
      if (current[dateKey] && current[dateKey].cooking === false) {
        delete current[dateKey]; // もう一度押したら未定に戻す
      } else {
        current[dateKey] = { cooking: false };
      }
      saveWeekStatus(current);
      renderWeek();
    });
    group.appendChild(noCookBtn);

    li.appendChild(label);
    li.appendChild(group);
    weekList.appendChild(li);
  }
}

renderWeek();

// 期間コントロール（開始日・終了日・前の期間/次の期間）
const periodStartInput = document.getElementById("period-start-input");
const periodEndInput = document.getElementById("period-end-input");
const prevPeriodBtn = document.getElementById("prev-period-btn");
const nextPeriodBtn = document.getElementById("next-period-btn");

function refreshPeriodInput() {
  periodStartInput.value = loadPeriodStart();
  periodEndInput.value = loadPeriodEnd();
}

function renderAll() {
  renderWeek();
  renderMenu(); // この中でrenderShoppingList()も呼ばれる
  renderPeriodNotes();
  renderSideDishes();
}

function shiftPeriod(direction) {
  const dates = getPeriodDates();
  const lengthDays = dates.length;
  const newStart = new Date(dates[0]);
  newStart.setDate(newStart.getDate() + direction * lengthDays);
  const newEnd = new Date(newStart);
  newEnd.setDate(newStart.getDate() + lengthDays - 1);

  savePeriodStart(toDateKey(newStart));
  savePeriodEnd(toDateKey(newEnd));
  refreshPeriodInput();
  renderAll();
}

prevPeriodBtn.addEventListener("click", () => shiftPeriod(-1));
nextPeriodBtn.addEventListener("click", () => shiftPeriod(1));
periodStartInput.addEventListener("change", () => {
  if (!periodStartInput.value) return;
  savePeriodStart(periodStartInput.value);
  if (parseDateKey(loadPeriodEnd()) < parseDateKey(periodStartInput.value)) {
    savePeriodEnd(periodStartInput.value);
  }
  refreshPeriodInput();
  renderAll();
});
periodEndInput.addEventListener("change", () => {
  if (!periodEndInput.value) return;
  if (parseDateKey(periodEndInput.value) < parseDateKey(loadPeriodStart())) {
    periodEndInput.value = loadPeriodEnd();
    return;
  }
  savePeriodEnd(periodEndInput.value);
  renderAll();
});

refreshPeriodInput();

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
const shoppingList = document.getElementById("shopping-list");
const shoppingEmpty = document.getElementById("shopping-empty");
const budgetEstimate = document.getElementById("budget-estimate");

function buildPrompt() {
  const wishes = loadWishes();
  const wishText =
    wishes.length > 0 ? wishes.map((w) => `・${w.text}`).join("\n") : "（特になし）";

  const stockItems = loadStock();
  const stockText =
    stockItems.length > 0
      ? stockItems.map((i) => `・${i.name}${i.amount ? `（${i.amount}）` : ""}`).join("\n")
      : "（特になし）";

  const dislikedItems = loadActiveDislikedIngredients();
  const dislikedText =
    dislikedItems.length > 0 ? dislikedItems.map((i) => `・${i.text}`).join("\n") : "（特になし）";

  const statusMap = loadWeekStatus();
  const members = loadFamilyMembers();
  const memberById = new Map(members.map((m) => [m.id, m]));
  const days = getPeriodDates()
    .map((date) => {
      const dateKey = toDateKey(date);
      const entry = statusMap[dateKey];
      if (!entry) return `${dateKey}: 未定`;
      if (entry.cooking === false) return `${dateKey}: 作らない`;

      const present = (entry.presentIds || []).map((id) => memberById.get(id)).filter(Boolean);
      const adults = present.filter((m) => m.type === "adult").length;
      const children = present.filter((m) => m.type === "child").length;
      const names =
        present
          .map((m) => (m.type === "child" && m.phase ? `${m.name}【${m.phase}】` : m.name))
          .join("・") || "未選択";
      return `${dateKey}: 大人${adults}人・子ども${children}人（${names}）`;
    })
    .join("\n");

  const extraInstruction = loadExtraInstruction();
  const extraInstructionBlock = extraInstruction
    ? `\n【追加の指示】\n${extraInstruction}\n`
    : "";

  const dayCount = getPeriodDates().length;

  return `あなたは家庭料理の献立を考える専門家です。以下の条件で、指定された期間（${dayCount}日間）分の晩ごはんの献立を提案してください。

【条件】
・1歳の子どもも大人と同じ料理を取り分けて食べます。できるだけ薄味にしやすい、取り分けしやすい料理を中心に考えてください。
・子どもの鉄分摂取も意識して、赤身の肉やほうれん草、ひじき、あさりなど鉄分が多い食材を週に数回は取り入れてください。
・以下の「苦手な食材」は使わないでください。
・「作らない」の日、または人数が0人や未選択の日は献立を考えず、dish を null、ingredients を空配列にしてください。
・各日に書かれている人数（大人◯人・子ども◯人）に合わせて、使う食材と分量を計算してください。人数が少ない日は、品数が少なめの簡単な料理でも構いません。
・子どもの名前の後ろに【】で年齢層が書かれている場合は、その年齢層に応じて、その子ども分の食材量を加減してください。
・できるだけ無添加・手作りの味付けにしたいので、カレールーやシチューのルー、めんつゆの素などの市販の合わせ調味料はなるべく使わず、しょうゆ・みそ・砂糖などを組み合わせて一から味付けする料理を優先してください。
・以下の「今ある食材」は、できるだけ使い切れるように献立に組み込んでください（無理に全部使う必要はありません）。
・以下の「食べたいものメモ」の中から、期間中に自然に使えそうなものがあれば積極的に取り入れてください（すべて使う必要はありません）。
・同じ料理が期間中に重複しないようにしてください。
・ingredients には、その日の料理に使う食材を全て入れてください（「今ある食材」で賄える分も、記録のためそのまま含めてください）。野菜だけでなく、肉・魚・調味料・加工品なども含めてください。各食材には name（食材名）、amount（分量、例: "300g"）、category（"肉・魚" "野菜" "調味料" "その他" のいずれか）、price（今の日本の物価を踏まえた概算の金額。円単位の数値。わからなければ0）を付けてください。
・メインの献立とは別に、週2品くらいを目安に副菜（取り分けしやすい小鉢料理など）も提案し、sideDishes に入れてください。
${extraInstructionBlock}
【苦手な食材（使わないでください）】
${dislikedText}

【食べたいものメモ】
${wishText}

【今ある食材】
${stockText}

【対象期間の予定】
${days}

【出力形式】
説明や前置きは一切不要です。次のJSON形式のみを出力してください。
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dish": "料理名またはnull",
      "note": "一言メモ（10〜20文字程度、取り分けのコツなど）",
      "ingredients": [
        { "name": "食材名", "amount": "分量", "category": "肉・魚", "price": 300 }
      ]
    }
  ],
  "sideDishes": [
    { "dish": "副菜名", "note": "一言メモ" }
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

// 「軽めに」「豚肉なしで」のような追加指示（次に質問文を作るときに反映される）
const EXTRA_INSTRUCTION_KEY = "menuApp.extraInstruction";
const extraInstructionInput = document.getElementById("extra-instruction-input");

function loadExtraInstruction() {
  return localStorage.getItem(EXTRA_INSTRUCTION_KEY) || "";
}

extraInstructionInput.value = loadExtraInstruction();
extraInstructionInput.addEventListener("blur", () => {
  localStorage.setItem(EXTRA_INSTRUCTION_KEY, extraInstructionInput.value.trim());
});

// 期間ごとの「結果・メモ」欄
const PERIOD_NOTES_KEY = "menuApp.periodNotes";
const periodNotesInput = document.getElementById("period-notes-input");

function loadAllPeriodNotes() {
  const raw = localStorage.getItem(PERIOD_NOTES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function renderPeriodNotes() {
  const all = loadAllPeriodNotes();
  periodNotesInput.value = all[getPeriodKey()] || "";
}

periodNotesInput.addEventListener("blur", () => {
  const all = loadAllPeriodNotes();
  const text = periodNotesInput.value.trim();
  const periodKey = getPeriodKey();
  if (text) {
    all[periodKey] = text;
  } else {
    delete all[periodKey];
  }
  localStorage.setItem(PERIOD_NOTES_KEY, JSON.stringify(all));
});

renderPeriodNotes();

// AIが提案する「副菜」（期間ごとに保存）
const SIDE_DISH_KEY = "menuApp.sideDishes";
const sideDishList = document.getElementById("side-dish-list");
const sideDishEmpty = document.getElementById("side-dish-empty");

function loadAllSideDishes() {
  const raw = localStorage.getItem(SIDE_DISH_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSideDishesForPeriod(periodKey, dishes) {
  const all = loadAllSideDishes();
  all[periodKey] = dishes;
  localStorage.setItem(SIDE_DISH_KEY, JSON.stringify(all));
}

function renderSideDishes() {
  const dishes = loadAllSideDishes()[getPeriodKey()] || [];
  sideDishList.innerHTML = "";
  sideDishEmpty.style.display = dishes.length === 0 ? "block" : "none";

  for (const dish of dishes) {
    const li = document.createElement("li");

    const dishLabel = document.createElement("span");
    dishLabel.className = "menu-dish-btn";
    dishLabel.textContent = dish.dish || "";
    li.appendChild(dishLabel);

    if (dish.note) {
      const noteLabel = document.createElement("span");
      noteLabel.className = "menu-note";
      noteLabel.textContent = dish.note;
      li.appendChild(noteLabel);
    }

    sideDishList.appendChild(li);
  }
}

renderSideDishes();

// 「献立リスト」への保存（期間に名前を付けてブックマークしておく機能。画面は menus.html）
const SAVED_MENUS_KEY = "menuApp.savedMenus";
const saveMenuForm = document.getElementById("save-menu-form");
const saveMenuLabelInput = document.getElementById("save-menu-label-input");
const saveMenuStatus = document.getElementById("save-menu-status");

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

saveMenuForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const start = loadPeriodStart();
  const end = loadPeriodEnd();
  const label = saveMenuLabelInput.value.trim() || `${start} 〜 ${end}`;

  const list = loadSavedMenus();
  list.unshift({
    id: Date.now(),
    periodStart: start,
    periodEnd: end,
    label,
    savedAt: new Date().toISOString(),
  });
  saveSavedMenus(list);

  saveMenuLabelInput.value = "";
  saveMenuStatus.textContent = "保存しました。「保存した献立リストを見る」から確認できます。";
  saveMenuStatus.classList.remove("is-error");
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
    const rawIngredients = day.ingredients || day.vegetables;
    menuMap[day.date] = {
      dish: day.dish || null,
      note: day.note || "",
      ingredients: Array.isArray(rawIngredients)
        ? rawIngredients.filter(Boolean).map(normalizeIngredient)
        : [],
    };
  }
  saveMenu(menuMap);
  renderMenu();

  if (Array.isArray(parsed.sideDishes)) {
    saveSideDishesForPeriod(getPeriodKey(), parsed.sideDishes.filter((d) => d && d.dish));
    renderSideDishes();
  }

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

  for (const date of getPeriodDates()) {
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

  renderShoppingList();
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

  const vegLabel = document.createElement("span");
  vegLabel.className = "menu-veg-label";
  vegLabel.textContent = "買う食材（1行に1つ。例: 鶏もも肉 300g）";
  li.appendChild(vegLabel);

  const vegInput = document.createElement("textarea");
  vegInput.className = "menu-veg-input";
  vegInput.rows = 2;
  vegInput.value = (entry.ingredients || entry.vegetables || [])
    .map((item) => {
      const { name, amount } = normalizeIngredient(item);
      return amount ? `${name} ${amount}` : name;
    })
    .join("\n");
  li.appendChild(vegInput);

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
    const newIngredients = vegInput.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(normalizeIngredient);
    current[dateKey] = { ...current[dateKey], dish: newDish || null, ingredients: newIngredients };
    saveMenu(current);
    renderMenu();
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
  input.addEventListener("blur", (event) => {
    if (event.relatedTarget !== vegInput) commit();
  });
  vegInput.addEventListener("blur", (event) => {
    if (event.relatedTarget !== input) commit();
  });

  input.focus();
  input.select();
}

// 肉や魚 → 野菜 → その他 → 調味料 の順で買う食材リストに並べる
const CATEGORY_ORDER = ["肉・魚", "野菜", "その他", "調味料"];

// AIや手入力で表記がゆれやすい食材名（ひらがな/漢字など）を、調味料マスタ・在庫と
// 正しく照合できるようにまとめる。グループの先頭が表示・照合に使う代表名になる。
const INGREDIENT_SYNONYMS = [
  ["醤油", "しょうゆ", "しょう油", "醬油"],
  ["味噌", "みそ", "お味噌"],
  ["料理酒", "酒", "清酒", "日本酒"],
  ["ごま油", "胡麻油"],
  ["こしょう", "胡椒", "コショウ"],
  ["だしの素", "出汁の素", "顆粒だし"],
  ["片栗粉", "かたくり粉"],
];

function canonicalizeIngredientName(name) {
  const trimmed = (name || "").trim();
  for (const group of INGREDIENT_SYNONYMS) {
    if (group.includes(trimmed)) return group[0];
  }
  return trimmed;
}

function normalizeIngredient(item) {
  if (typeof item === "string") {
    const match = item.match(/^(\S+)\s*(.*)$/);
    const name = canonicalizeIngredientName(match ? match[1] : item);
    const amount = match ? match[2].trim() : "";
    return { name, amount, category: "その他", price: 0 };
  }
  const name = canonicalizeIngredientName((item && item.name) || "");
  const amount = (item && item.amount) || "";
  const category = CATEGORY_ORDER.includes(item && item.category) ? item.category : "その他";
  const price = Number.isFinite(item && item.price) ? item.price : 0;
  return { name, amount, category, price };
}

// 「2本」「300g」「大さじ2」のような分量を、できる範囲で数値として読み取る。
// 単位が同じもの同士だけ合計できる（単位が違う・読み取れないものが混ざっていたら合計はしない）。
function parseAmount(amount) {
  if (!amount) return null;
  const trimmed = amount.trim();

  // 「2本」「300g」「1/2個」のように数字が先にあるパターン
  let match = trimmed.match(/^(\d+\/\d+|\d+(?:\.\d+)?)\s*(\S*)$/);
  if (match) {
    let value;
    if (match[1].includes("/")) {
      const [a, b] = match[1].split("/").map(Number);
      value = b ? a / b : NaN;
    } else {
      value = parseFloat(match[1]);
    }
    if (Number.isNaN(value)) return null;
    return { value, unit: match[2] || "" };
  }

  // 「大さじ2」「小さじ1」のように数字が後ろにあるパターン
  match = trimmed.match(/^(\D+?)(\d+(?:\.\d+)?)$/);
  if (match) {
    const value = parseFloat(match[2]);
    if (Number.isNaN(value)) return null;
    return { value, unit: match[1] };
  }

  return null;
}

function sumAmounts(amounts) {
  const nonEmpty = amounts.filter(Boolean);
  if (nonEmpty.length === 0) return null;

  const parsed = nonEmpty.map(parseAmount);
  if (parsed.some((p) => !p)) return null;

  const unit = parsed[0].unit;
  if (!parsed.every((p) => p.unit === unit)) return null;

  const total = Math.round(parsed.reduce((sum, p) => sum + p.value, 0) * 100) / 100;
  return `${total}${unit}`;
}

// 「ほしいもの」を自分で買う食材リストに手動で追加する機能（期間ごとに保存）
const EXTRA_SHOPPING_KEY = "menuApp.extraShoppingItems";
const extraShoppingForm = document.getElementById("extra-shopping-form");
const extraShoppingNameInput = document.getElementById("extra-shopping-name-input");
const extraShoppingAmountInput = document.getElementById("extra-shopping-amount-input");

function loadAllExtraShoppingItems() {
  const raw = localStorage.getItem(EXTRA_SHOPPING_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function loadExtraShoppingItems(periodKey) {
  return loadAllExtraShoppingItems()[periodKey] || [];
}

function saveExtraShoppingItems(periodKey, items) {
  const all = loadAllExtraShoppingItems();
  all[periodKey] = items;
  localStorage.setItem(EXTRA_SHOPPING_KEY, JSON.stringify(all));
}

extraShoppingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = extraShoppingNameInput.value.trim();
  if (!name) return;
  const amount = extraShoppingAmountInput.value.trim();

  const periodKey = getPeriodKey();
  const items = loadExtraShoppingItems(periodKey);
  items.push({ id: Date.now(), name, amount });
  saveExtraShoppingItems(periodKey, items);
  renderShoppingList();

  extraShoppingNameInput.value = "";
  extraShoppingAmountInput.value = "";
  extraShoppingNameInput.focus();
});

const SHOPPING_CHECKED_KEY = "menuApp.shoppingChecked";

function loadShoppingChecked() {
  const raw = localStorage.getItem(SHOPPING_CHECKED_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveShoppingChecked(checkedMap) {
  localStorage.setItem(SHOPPING_CHECKED_KEY, JSON.stringify(checkedMap));
}

function renderShoppingList() {
  const menuMap = loadMenu();
  const grouped = new Map(); // 食材名 -> { category, items: [{ dayLabel, amount, price }] }

  for (const date of getPeriodDates()) {
    const entry = menuMap[toDateKey(date)];
    const ingredients = entry && (entry.ingredients || entry.vegetables);
    if (!ingredients) continue;

    const dayLabel = DAY_LABELS[(date.getDay() + 6) % 7];
    for (const raw of ingredients) {
      const { name, amount, category, price } = normalizeIngredient(raw);
      if (!name) continue;
      if (!grouped.has(name)) grouped.set(name, { category, items: [] });
      grouped.get(name).items.push({ dayLabel, amount, price });
    }
  }

  // 調味料マスタで「家にある」ものと、「今ある食材」に登録済みのものは買う食材リストから除く
  const excludeSet = new Set([
    ...loadPantry().filter((item) => item.hasIt).map((item) => canonicalizeIngredientName(item.name)),
    ...loadStock().map((item) => canonicalizeIngredientName(item.name)),
  ]);
  for (const name of excludeSet) {
    grouped.delete(name);
  }

  shoppingList.innerHTML = "";

  const checkedMap = loadShoppingChecked();
  const extraItems = loadExtraShoppingItems(getPeriodKey());

  shoppingEmpty.style.display = grouped.size === 0 && extraItems.length === 0 ? "block" : "none";

  let totalBudget = 0;

  function appendShoppingRow(name, detailText, { deletable, onDelete } = {}) {
    const li = document.createElement("li");
    li.className = "shopping-item";
    if (checkedMap[name]) li.classList.add("is-checked");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "shopping-checkbox";
    checkbox.checked = Boolean(checkedMap[name]);
    checkbox.setAttribute("aria-label", `${name}を買った`);
    checkbox.addEventListener("change", () => {
      const current = loadShoppingChecked();
      current[name] = checkbox.checked;
      saveShoppingChecked(current);
      li.classList.toggle("is-checked", checkbox.checked);
    });
    li.appendChild(checkbox);

    const textWrap = document.createElement("span");
    textWrap.className = "shopping-text";

    const nameLabel = document.createElement("span");
    nameLabel.className = "shopping-name";
    nameLabel.textContent = name;
    textWrap.appendChild(nameLabel);

    if (detailText) {
      const detailLabel = document.createElement("span");
      detailLabel.className = "shopping-detail";
      detailLabel.textContent = detailText;
      textWrap.appendChild(detailLabel);
    }

    li.appendChild(textWrap);

    if (deletable) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "×";
      deleteBtn.setAttribute("aria-label", "削除");
      deleteBtn.addEventListener("click", onDelete);
      li.appendChild(deleteBtn);
    }

    shoppingList.appendChild(li);
  }

  for (const category of CATEGORY_ORDER) {
    const entries = [...grouped].filter(([, value]) => value.category === category);
    if (entries.length === 0) continue;

    const headerLi = document.createElement("li");
    headerLi.className = "shopping-category";
    headerLi.textContent = category;
    shoppingList.appendChild(headerLi);

    for (const [name, { items }] of entries) {
      const itemTotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
      totalBudget += itemTotal;

      const breakdown = items
        .map((item) => {
          const base = item.amount ? `${item.dayLabel} ${item.amount}` : item.dayLabel;
          return item.price ? `${base}（¥${item.price.toLocaleString()}）` : base;
        })
        .join(" ・ ");

      const total = sumAmounts(items.map((item) => item.amount));
      const detailText = total ? `合計 ${total} （${breakdown}）` : breakdown;

      appendShoppingRow(name, detailText);
    }
  }

  if (extraItems.length > 0) {
    const headerLi = document.createElement("li");
    headerLi.className = "shopping-category";
    headerLi.textContent = "追加した物";
    shoppingList.appendChild(headerLi);

    for (const item of extraItems) {
      appendShoppingRow(item.name, item.amount, {
        deletable: true,
        onDelete: () => {
          const current = loadExtraShoppingItems(getPeriodKey()).filter((i) => i.id !== item.id);
          saveExtraShoppingItems(getPeriodKey(), current);
          renderShoppingList();
        },
      });
    }
  }

  budgetEstimate.textContent =
    totalBudget > 0 ? `推定予算：約¥${totalBudget.toLocaleString()}（AIによる概算）` : "";
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
