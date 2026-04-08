import { NextRequest, NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/server/auth";
import { supabase } from "@/lib/server/supabase";

export async function PUT(req: NextRequest) {
  const telegramUser = getTelegramUserFromRequest(req);
  if (!telegramUser) {
    return NextResponse.json({ message: "Missing Telegram user id" }, { status: 401 });
  }
  const telegramUserId = telegramUser.id;

  const body = await req.json();
  const { twentyFourHours, twelveHours } = body as { twentyFourHours: boolean; twelveHours: boolean };

  const { error } = await supabase.from("notification_settings").upsert(
    {
      telegram_user_id: telegramUserId,
      twenty_four_hours: Boolean(twentyFourHours),
      twelve_hours: Boolean(twelveHours),
    },
    { onConflict: "telegram_user_id" },
  );

  if (error) {
    return NextResponse.json({ message: "Failed to save notification settings" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
