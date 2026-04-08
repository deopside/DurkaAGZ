import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { getTelegramUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const telegramUser = getTelegramUserFromRequest(req);
  const telegramUserId = telegramUser?.id ?? null;

  const [{ data: homeworkRows, error: hwError }, { data: topicRows, error: topicError }, { data: scheduleRows, error: schError }, { data: assignmentRows, error: assignError }, { data: notificationRows, error: notifError }] =
    await Promise.all([
      supabase.from("homework").select("subject,date,hours,minutes"),
      supabase.from("homework_topics").select("subject,topic_id,text"),
      supabase.from("schedule_entries").select("id,date_key,pair_number,subjectName,type,number,room,teacher"),
      telegramUserId ? supabase.from("topic_assignments").select("subject,topic_id").eq("telegram_user_id", telegramUserId).limit(1) : Promise.resolve({ data: [], error: null }),
      telegramUserId ? supabase.from("notification_settings").select("twenty_four_hours,twelve_hours").eq("telegram_user_id", telegramUserId).limit(1) : Promise.resolve({ data: [], error: null }),
    ]);

  if (hwError || topicError || schError || assignError || notifError) {
    return NextResponse.json({ message: "Failed to load data" }, { status: 500 });
  }

  const homeworkData: Record<string, { date: string; topics: { id: number; text: string }[]; hours?: string; minutes?: string }> = {};
  for (const row of homeworkRows ?? []) {
    homeworkData[row.subject] = {
      date: row.date,
      topics: [],
      hours: row.hours ?? "10",
      minutes: row.minutes ?? "00",
    };
  }

  for (const row of topicRows ?? []) {
    if (!homeworkData[row.subject]) {
      homeworkData[row.subject] = { date: "01.01.26", topics: [] };
    }
    homeworkData[row.subject].topics.push({ id: row.topic_id, text: row.text });
  }

  for (const subject of Object.keys(homeworkData)) {
    homeworkData[subject].topics.sort((a, b) => a.id - b.id);
  }

  const scheduleData: Record<string, { id: string; pairNumber: number; subjectName: string; type: string; number: string; room: string; teacher: string }[]> = {};
  for (const row of scheduleRows ?? []) {
    if (!scheduleData[row.date_key]) {
      scheduleData[row.date_key] = [];
    }
    scheduleData[row.date_key].push({
      id: row.id,
      pairNumber: row.pair_number,
      subjectName: row.subjectName,
      type: row.type,
      number: row.number,
      room: row.room,
      teacher: row.teacher,
    });
  }
  for (const dateKey of Object.keys(scheduleData)) {
    scheduleData[dateKey].sort((a, b) => a.pairNumber - b.pairNumber);
  }

  const takenTopics = (assignmentRows ?? []).map((a) => `${a.subject}-${a.topic_id}`);
  const userAssignment = assignmentRows?.[0] ? { subject: assignmentRows[0].subject, topicId: assignmentRows[0].topic_id } : null;
  const notificationSettings = notifError || !notificationRows?.[0]
    ? { twentyFourHours: true, twelveHours: false }
    : {
        twentyFourHours: notificationRows[0].twenty_four_hours,
        twelveHours: notificationRows[0].twelve_hours,
      };

  return NextResponse.json({ homeworkData, scheduleData, userAssignment, takenTopics, notificationSettings });
}
