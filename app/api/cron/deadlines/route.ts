import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { sendTelegramMessage } from "@/lib/server/telegram";

const WINDOWS_HOURS = [24, 12];
const WINDOW_TOLERANCE_MINUTES = 5;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const { data: assignments, error: assignError } = await supabase
    .from("topic_assignments")
    .select("telegram_user_id,subject,topic_id");
  if (assignError) {
    return NextResponse.json({ message: "Failed to load assignments" }, { status: 500 });
  }

  const { data: homeworkRows, error: homeworkError } = await supabase
    .from("homework")
    .select("subject,date,deadline_at")
    .not("deadline_at", "is", null);
  if (homeworkError) {
    return NextResponse.json({ message: "Failed to load homework deadlines" }, { status: 500 });
  }

  const { data: settingsRows, error: settingsError } = await supabase
    .from("notification_settings")
    .select("telegram_user_id,twenty_four_hours,twelve_hours");
  if (settingsError) {
    return NextResponse.json({ message: "Failed to load notification settings" }, { status: 500 });
  }

  const settingsByUser = new Map<string, { twenty_four_hours: boolean; twelve_hours: boolean }>();
  for (const row of settingsRows ?? []) {
    settingsByUser.set(row.telegram_user_id, row);
  }

  const homeworkBySubject = new Map<string, { date: string; deadline_at: string }>();
  for (const row of homeworkRows ?? []) {
    if (row.deadline_at) {
      homeworkBySubject.set(row.subject, { date: row.date, deadline_at: row.deadline_at });
    }
  }

  let sentCount = 0;
  const errors: string[] = [];
  for (const assignment of assignments ?? []) {
    const homework = homeworkBySubject.get(assignment.subject);
    if (!homework?.deadline_at) {
      continue;
    }

    const deadlineAt = new Date(homework.deadline_at);
    if (Number.isNaN(deadlineAt.getTime())) {
      continue;
    }

    const diffMs = deadlineAt.getTime() - now.getTime();
    if (diffMs < 0) {
      continue;
    }

    for (const windowHours of WINDOWS_HOURS) {
      const targetMs = windowHours * 60 * 60 * 1000;
      const toleranceMs = WINDOW_TOLERANCE_MINUTES * 60 * 1000;
      const isInWindow = Math.abs(diffMs - targetMs) <= toleranceMs;
      if (!isInWindow) {
        continue;
      }

      const settings = settingsByUser.get(assignment.telegram_user_id);
      const isEnabled = windowHours === 24 ? (settings?.twenty_four_hours ?? true) : (settings?.twelve_hours ?? false);
      if (!isEnabled) {
        continue;
      }

      const { data: logExists } = await supabase
        .from("notification_logs")
        .select("id")
        .eq("telegram_user_id", assignment.telegram_user_id)
        .eq("subject", assignment.subject)
        .eq("topic_id", assignment.topic_id)
        .eq("window_hours", windowHours)
        .eq("deadline_at", homework.deadline_at)
        .maybeSingle();

      if (logExists) {
        continue;
      }

      const text = `Напоминание: до дедлайна по ${assignment.subject} осталось ${windowHours} часов.\nТема #${assignment.topic_id}. Дата сдачи: ${homework.date}`;

      try {
        await sendTelegramMessage(assignment.telegram_user_id, text);

        const { error: logInsertError } = await supabase.from("notification_logs").insert({
          telegram_user_id: assignment.telegram_user_id,
          subject: assignment.subject,
          topic_id: assignment.topic_id,
          window_hours: windowHours,
          deadline_at: homework.deadline_at,
        });
        if (logInsertError) {
          errors.push(`notification log insert failed for user ${assignment.telegram_user_id}: ${logInsertError.message}`);
          continue;
        }

        sentCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown send error";
        errors.push(`send failed for user ${assignment.telegram_user_id}: ${message}`);
      }
    }
  }

  return NextResponse.json({ ok: true, sentCount, errors });
}
