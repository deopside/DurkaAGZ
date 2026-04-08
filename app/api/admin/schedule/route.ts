import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/server/auth";
import { supabase } from "@/lib/server/supabase";
import { toDateKey } from "@/lib/server/time";

export async function PUT(req: NextRequest) {
  const adminCheck = assertAdmin(req);
  if (!adminCheck.ok) {
    return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status });
  }

  const body = await req.json();
  const { day, month, year, entries } = body as {
    day: number;
    month: number;
    year: number;
    entries: Array<{ pairNumber: number; subjectName: string; type: string; number: string; room: string; teacher: string }>;
  };

  if (!day || !month || !year || !Array.isArray(entries)) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const dateKey = toDateKey(day, month, year);

  const { error: deleteError } = await supabase.from("schedule_entries").delete().eq("date_key", dateKey);
  if (deleteError) {
    return NextResponse.json({ message: "Failed to replace schedule" }, { status: 500 });
  }

  if (entries.length > 0) {
    const rows = entries.map((entry, index) => ({
      date_key: dateKey,
      pair_number: index + 1,
      subjectname: entry.subjectName,
      type: entry.type,
      number: entry.number,
      room: entry.room,
      teacher: entry.teacher,
    }));

    const { error: insertError } = await supabase.from("schedule_entries").insert(rows);
    if (insertError) {
      return NextResponse.json({ message: "Failed to save schedule" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, dateKey });
}
