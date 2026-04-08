import { NextRequest, NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/server/auth";
import { supabase } from "@/lib/server/supabase";

export async function POST(req: NextRequest) {
  const telegramUser = getTelegramUserFromRequest(req);
  if (!telegramUser) {
    return NextResponse.json({ message: "Missing Telegram user id" }, { status: 401 });
  }
  const telegramUserId = telegramUser.id;

  const body = await req.json();
  const { subject, topicId } = body as { subject: string; topicId: number };

  if (!subject || !topicId) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const { data: topic, error: topicError } = await supabase
    .from("homework_topics")
    .select("subject,topic_id")
    .eq("subject", subject)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (topicError) {
    return NextResponse.json({ message: "Failed to validate topic" }, { status: 500 });
  }
  if (!topic) {
    return NextResponse.json({ message: "Topic does not exist" }, { status: 400 });
  }

  const { data: occupiedByUser, error: occupiedByUserError } = await supabase
    .from("topic_assignments")
    .select("subject,topic_id")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (occupiedByUserError) {
    return NextResponse.json({ message: "Failed to validate assignment" }, { status: 500 });
  }
  if (occupiedByUser) {
    return NextResponse.json({ message: "User already has assigned topic" }, { status: 409 });
  }

  const { data: occupiedByTopic, error: occupiedByTopicError } = await supabase
    .from("topic_assignments")
    .select("subject,topic_id")
    .eq("subject", subject)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (occupiedByTopicError) {
    return NextResponse.json({ message: "Failed to validate topic occupancy" }, { status: 500 });
  }
  if (occupiedByTopic) {
    return NextResponse.json({ message: "Topic already taken" }, { status: 409 });
  }

  const { error: insertError } = await supabase.from("topic_assignments").insert({
    telegram_user_id: telegramUserId,
    subject,
    topic_id: topicId,
  });

  if (insertError) {
    return NextResponse.json({ message: "Failed to assign topic" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
