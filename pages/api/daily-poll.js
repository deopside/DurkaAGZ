const { supabase } = require("./_supabase");

const POLL_QUESTION = "Развод";
const POLL_OPTIONS = [
  "Буду к 1 паре к 9:00",
  "Опоздаю на 15/30 минут",
  "Опоздаю на 45 минут",
  "Буду ко 2 паре, на 1 пару БУ",
  "Не буду (БУ)",
  "Не буду (Б)",
  "Не буду (О)",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendPoll(chatId) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const r = await fetch(`https://api.telegram.org/bot${botToken}/sendPoll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      question: POLL_QUESTION,
      options: POLL_OPTIONS,
      is_anonymous: false,
    }),
  });

  if (!r.ok) {
    const details = await r.text();
    throw new Error(`Telegram sendPoll failed for ${chatId}: ${details}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { data: users, error } = await supabase.from("telegram_users").select("chat_id");
  if (error) {
    return res.status(500).json({ message: "Failed to load users" });
  }

  const delayMs = Number(process.env.POLL_SEND_DELAY_MS ?? "120");

  let sent = 0;
  const errors = [];
  for (const user of users ?? []) {
    const chatId = user.chat_id;
    if (!chatId) continue;
    try {
      await sendPoll(chatId);
      sent += 1;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
    // small delay to avoid Telegram 429
    await sleep(delayMs);
  }

  return res.status(200).json({ ok: true, sent, errorsCount: errors.length, errors: errors.slice(0, 20) });
};

