// 複数のページで共通して使うデータ読み込み関数をまとめたファイル。
// 「家族構成」と「調味料マスタ」は、トップ画面・苦手な食材ページ・各自のページの
// 3箇所以上で必要になるので、ここに1つだけ定義しておく（前はページごとに
// コピーしていて、片方だけ直し忘れる事故が起きやすかったため）。
// index.html / family.html / dislikes.html / pantry.html で、各ページ自身の
// スクリプトより先に読み込む。

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
