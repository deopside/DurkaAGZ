import { NextRequest, NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/server/auth";
import { supabase } from "@/lib/server/supabase";

export async function DELETE(req: NextRequest) {
  const telegramUser = getTelegramUserFromRequest(req);
  if (!telegramUser) {
    return NextResponse.json({ message: "Missing Telegram user id" }, { status: 401 });
  }
  const telegramUserId = telegramUser.id;

  const { error } = await supabase.from("topic_assignments").delete().eq("telegram_user_id", telegramUserId);
  if (error) {
    return NextResponse.json({ message: "Failed to cancel assignment" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
