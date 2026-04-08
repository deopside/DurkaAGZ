import { NextRequest } from "next/server";
import crypto from "node:crypto";

interface TelegramUserInfo {
  id: string;
}

function parseTelegramUserIdFromInitData(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) {
      return null;
    }

    const user = JSON.parse(userRaw) as { id?: number | string };
    if (!user?.id) {
      return null;
    }
    return String(user.id);
  } catch {
    return null;
  }
}

function isValidTelegramInitData(initData: string): boolean {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("Telegram initData validation skipped: TELEGRAM_BOT_TOKEN is missing");
      return false;
    }

    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    const authDate = Number(params.get("auth_date"));
    if (!hash || Number.isNaN(authDate)) {
      return false;
    }

    const maxAgeSec = Number(process.env.TG_INITDATA_MAX_AGE_SEC ?? "86400");
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec - authDate > maxAgeSec) {
      return false;
    }

    const dataCheckEntries: string[] = [];
    for (const [key, value] of params.entries()) {
      if (key !== "hash") {
        dataCheckEntries.push(`${key}=${value}`);
      }
    }
    dataCheckEntries.sort();
    const dataCheckString = dataCheckEntries.join("\n");

    const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const computedHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(hash, "hex"));
  } catch (error) {
    console.error("Telegram initData validation error:", error);
    return false;
  }
}

export function getTelegramUserFromRequest(req: NextRequest): TelegramUserInfo | null {
  try {
    const rawInitDataHeader = req.headers.get("x-telegram-init-data");
    let initDataHeader: string | null = null;
    if (rawInitDataHeader) {
      try {
        initDataHeader = decodeURIComponent(rawInitDataHeader);
      } catch {
        // If header is already plain text, use as-is.
        initDataHeader = rawInitDataHeader;
      }
    }
    if (initDataHeader) {
      const isValid = isValidTelegramInitData(initDataHeader);
      if (isValid) {
        const id = parseTelegramUserIdFromInitData(initDataHeader);
        if (id) {
          return { id };
        }
      }
    }

    // Dev fallback when opened outside Telegram.
    // Never trust this in production.
    if (process.env.NODE_ENV === "production") {
      return null;
    }

    const fallbackUserId = req.headers.get("x-telegram-user-id");
    if (fallbackUserId) {
      return { id: fallbackUserId };
    }

    return null;
  } catch (error) {
    console.error("getTelegramUserFromRequest failed:", error);
    return null;
  }
}

export function assertAdmin(req: NextRequest): { ok: true } | { ok: false; message: string; status: number } {
  const adminId = (process.env.ADMIN_ID ?? "").trim();
  if (!adminId) {
    return { ok: false, message: "ADMIN_ID is not configured", status: 500 };
  }

  const requester = getTelegramUserFromRequest(req);
  if (!requester || requester.id !== adminId) {
    return { ok: false, message: "Forbidden", status: 403 };
  }

  return { ok: true };
}
