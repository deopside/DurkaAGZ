import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { getTelegramUserFromRequest } from "@/lib/server/auth";
import { mskPartsFromUtcIso } from "@/lib/server/time";

export async function GET(req: NextRequest) {
  try {
    const telegramUser = getTelegramUserFromRequest(req);
    const telegramUserId = telegramUser?.id ?? null;
    const adminId = (process.env.ADMIN_ID ?? "").trim();
    const isAdmin = telegramUserId !== null && telegramUserId === adminId;

    const [{ data: homeworkRows, error: hwError }, { data: topicRows, error: topicError }, { data: scheduleRows, error: schError }, { data: assignmentRows, error: assignError }, { data: notificationRows, error: notifError }] =
      await Promise.all([
        supabase.from("homework").select("subject,date,hours,minutes,deadline_at"),
        supabase.from("homework_topics").select("subject,topic_id,text"),
        supabase.from("schedule_entries").select("id,date_key,pair_number,subjectname,type,number,room,teacher"),
        telegramUserId ? supabase.from("topic_assignments").select("subject,topic_id").eq("telegram_user_id", telegramUserId).limit(1) : Promise.resolve({ data: [], error: null }),
        telegramUserId ? supabase.from("notification_settings").select("twenty_four_hours,twelve_hours").eq("telegram_user_id", telegramUserId).limit(1) : Promise.resolve({ data: [], error: null }),
      ]);

    if (hwError || topicError || schError || assignError || notifError) {
      console.error("Bootstrap query error", {
        hwError,
        topicError,
        schError,
        assignError,
        notifError,
        telegramUserId,
      });

      return NextResponse.json({
        homeworkData: {},
        scheduleData: {},
        userAssignment: null,
        takenTopics: [],
        notificationSettings: { twentyFourHours: true, twelveHours: false },
        isAdmin: false,
      });
    }

    const homeworkData: Record<string, { date: string; topics: { id: number; text: string }[]; hours?: string; minutes?: string }> = {};
    for (const row of homeworkRows ?? []) {
      const mskParts = row.deadline_at ? mskPartsFromUtcIso(row.deadline_at) : null;
      homeworkData[row.subject] = {
        date: mskParts?.date ?? row.date,
        topics: [],
        hours: mskParts?.hours ?? row.hours ?? "10",
        minutes: mskParts?.minutes ?? row.minutes ?? "00",
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
        subjectName: row.subjectname,
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

    return NextResponse.json({ homeworkData, scheduleData, userAssignment, takenTopics, notificationSettings, isAdmin });
  } catch (error) {
    console.error("Bootstrap endpoint failed:", error);
    return NextResponse.json({
      homeworkData: {},
      scheduleData: {},
      userAssignment: null,
      takenTopics: [],
      notificationSettings: { twentyFourHours: true, twelveHours: false },
      isAdmin: false,
    });
  }
}
