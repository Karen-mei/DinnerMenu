// この関数はブラウザ(スマホ)から直接ではなく、Vercelの「裏方サーバー」として動く。
// ここでだけAPIキーを使うので、スマホ側のコードにキーが出てくることはない。

// スマホアプリを公開しているURL。ここからの呼び出しだけ許可する。
const ALLOWED_ORIGIN = "https://karen-mei.github.io";

const STATUS_LABELS = {
  with: "旦那いる",
  without: "旦那いない",
  none: "作らない",
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "POSTだけ受け付けています" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "サーバーにAPIキーが設定されていません" });
    return;
  }

  const { wishList = [], weekStatus = {} } = req.body || {};
  const prompt = buildPrompt(wishList, weekStatus);

  try {
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      res.status(502).json({ error: "AIの呼び出しに失敗しました", detail });
      return;
    }

    const data = await aiResponse.json();
    const text = data.content?.[0]?.text || "";
    const menu = extractJson(text);

    if (!menu) {
      res.status(502).json({ error: "AIの返答を読み取れませんでした", raw: text });
      return;
    }

    res.status(200).json({ menu });
  } catch (err) {
    res.status(500).json({ error: "サーバーエラーが発生しました", detail: String(err) });
  }
};

function buildPrompt(wishList, weekStatus) {
  const wishText =
    wishList.length > 0 ? wishList.map((w) => `・${w.text}`).join("\n") : "（特になし）";

  const days = Object.entries(weekStatus)
    .filter(([, status]) => status)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, status]) => `${date}: ${STATUS_LABELS[status] || status}`)
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
${days || "（登録なし）"}

【出力形式】
説明や前置きは一切不要です。次のJSON形式のみを出力してください。
{
  "days": [
    { "date": "YYYY-MM-DD", "dish": "料理名またはnull", "note": "一言メモ（10〜20文字程度、取り分けのコツなど）" }
  ]
}`;
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
