// NOTE: DB write is temporarily disabled for webhook connectivity testing.
// const { supabase } = require("./_supabase");
//
// async function upsertTelegramUser({ chatId, from }) {
//   const payload = {
//     chat_id: String(chatId),
//     telegram_user_id: from?.id ? String(from.id) : null,
//     username: from?.username ?? null,
//     first_name: from?.first_name ?? null,
//     last_name: from?.last_name ?? null,
//     language_code: from?.language_code ?? null,
//     last_seen_at: new Date().toISOString(),
//   };
//
//   const { error } = await supabase.from("telegram_users").upsert(payload, { onConflict: "chat_id" });
//   if (error) {
//     throw new Error(error.message);
//   }
// }

async function sendMessage(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!r.ok) {
    const details = await r.text();
    throw new Error(`Telegram sendMessage failed: ${details}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Optional hardening: set this secret when you call setWebhook(secret_token=...)
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const got = req.headers["x-telegram-bot-api-secret-token"];
    if (got !== expectedSecret) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  try {
    const update = req.body;
    const message = update?.message;
    const text = message?.text ?? "";
    const chatId = message?.chat?.id;
    if (!chatId) {
      return res.status(200).json({ ok: true });
    }

    if (text.startsWith("/start")) {
      await sendMessage(chatId, "Привет");
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("telegram-webhook error:", err);
    return res.status(200).json({ ok: false }); // return 200 to avoid Telegram retries storm
  }
};

