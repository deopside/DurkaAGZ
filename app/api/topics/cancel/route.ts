import { NextRequest, NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/server/auth";
import { getSupabase } from "@/lib/server/supabase";

export async function DELETE(req: NextRequest) {
  try {
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      return NextResponse.json({ message: "Не удалось определить пользователя Telegram" }, { status: 401 });
    }
    const telegramUserId = telegramUser.id;

    const subject = new URL(req.url).searchParams.get("subject");
    if (!subject) {
      return NextResponse.json({ message: "Не указан предмет" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ message: "Сервер базы данных не настроен" }, { status: 503 });
    }

    const { error } = await supabase
      .from("topic_assignments")
      .delete()
      .eq("telegram_user_id", telegramUserId)
      .eq("subject", subject);

    if (error) {
      console.error("cancel assignment:", error);
      return NextResponse.json({ message: "Не удалось отменить закрепление" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/topics/cancel failed:", err);
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
