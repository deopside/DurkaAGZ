import { NextRequest, NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/server/auth";
import { getSupabase } from "@/lib/server/supabase";

const MSG_TOPIC_TAKEN = "Эта тема уже занята другим пользователем.";
const MSG_USER_HAS_TOPIC = "По этому предмету у вас уже выбрана тема. Сначала отмените текущую.";
const MSG_DB_CONFLICT = "Конфликт данных: тема или предмет уже заняты. Обновите страницу и попробуйте снова.";

export async function POST(req: NextRequest) {
  try {
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      return NextResponse.json({ message: "Не удалось определить пользователя Telegram. Откройте приложение из бота." }, { status: 401 });
    }
    const telegramUserId = telegramUser.id;

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ message: "Сервер базы данных не настроен" }, { status: 503 });
    }

    let body: { subject?: string; topicId?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Некорректное тело запроса" }, { status: 400 });
    }

    const { subject, topicId } = body;
    if (!subject || topicId === undefined || topicId === null) {
      return NextResponse.json({ message: "Укажите предмет и номер темы" }, { status: 400 });
    }

    const { data: topic, error: topicError } = await supabase
      .from("homework_topics")
      .select("subject,topic_id")
      .eq("subject", subject)
      .eq("topic_id", topicId)
      .maybeSingle();

    if (topicError) {
      console.error("assign topic validate:", topicError);
      return NextResponse.json({ message: "Ошибка проверки темы" }, { status: 500 });
    }
    if (!topic) {
      return NextResponse.json({ message: "Такой темы нет в списке" }, { status: 400 });
    }

    const { data: occupiedByUser, error: occupiedByUserError } = await supabase
      .from("topic_assignments")
      .select("subject,topic_id")
      .eq("telegram_user_id", telegramUserId)
      .eq("subject", subject)
      .maybeSingle();

    if (occupiedByUserError) {
      console.error("assign user check:", occupiedByUserError);
      return NextResponse.json({ message: "Ошибка проверки вашей темы" }, { status: 500 });
    }
    if (occupiedByUser) {
      return NextResponse.json({ message: MSG_USER_HAS_TOPIC }, { status: 409 });
    }

    const { data: occupiedByTopic, error: occupiedByTopicError } = await supabase
      .from("topic_assignments")
      .select("subject,topic_id")
      .eq("subject", subject)
      .eq("topic_id", topicId)
      .maybeSingle();

    if (occupiedByTopicError) {
      console.error("assign topic occupancy:", occupiedByTopicError);
      return NextResponse.json({ message: "Ошибка проверки занятости темы" }, { status: 500 });
    }
    if (occupiedByTopic) {
      return NextResponse.json({ message: MSG_TOPIC_TAKEN }, { status: 409 });
    }

    const { error: insertError } = await supabase.from("topic_assignments").insert({
      telegram_user_id: telegramUserId,
      subject,
      topic_id: topicId,
    });

    if (insertError) {
      console.error("assign insert:", insertError);
      const code = (insertError as { code?: string }).code;
      if (code === "23505") {
        const msg = insertError.message?.includes("telegram_user_id") ? MSG_USER_HAS_TOPIC : MSG_TOPIC_TAKEN;
        return NextResponse.json({ message: msg || MSG_DB_CONFLICT }, { status: 409 });
      }
      return NextResponse.json({ message: "Не удалось закрепить тему" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, topicId, subject });
  } catch (err) {
    console.error("POST /api/topics/assign failed:", err);
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
