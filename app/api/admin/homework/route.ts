import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/server/auth";
import { getSupabase } from "@/lib/server/supabase";
import { deadlineFromParts } from "@/lib/server/time";

export async function PUT(req: NextRequest) {
  const adminCheck = assertAdmin(req);
  if (!adminCheck.ok) {
    return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ message: "Сервер базы данных не настроен" }, { status: 503 });
  }

  const body = await req.json();
  const { subject, date, topics, hours = "10", minutes = "00" } = body as {
    subject: string;
    date: string;
    hours?: string;
    minutes?: string;
    topics: { id: number; text: string }[];
  };

  if (!subject || !date || !Array.isArray(topics)) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const deadlineAt = deadlineFromParts(date, hours, minutes);
  if (!deadlineAt) {
    return NextResponse.json({ message: "Invalid deadline date/time format" }, { status: 400 });
  }

  const { error: hwError } = await supabase.from("homework").upsert(
    { subject, date, hours, minutes, deadline_at: deadlineAt },
    { onConflict: "subject" },
  );
  if (hwError) {
    return NextResponse.json({ message: "Failed to save homework" }, { status: 500 });
  }

  const { error: deleteError } = await supabase.from("homework_topics").delete().eq("subject", subject);
  if (deleteError) {
    return NextResponse.json({ message: "Failed to replace topics" }, { status: 500 });
  }

  if (topics.length > 0) {
    const rows = topics.map((topic) => ({ subject, topic_id: topic.id, text: topic.text }));
    const { error: insertError } = await supabase.from("homework_topics").insert(rows);
    if (insertError) {
      return NextResponse.json({ message: "Failed to save topics" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const adminCheck = assertAdmin(req);
  if (!adminCheck.ok) {
    return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ message: "Сервер базы данных не настроен" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");
  if (!subject) {
    return NextResponse.json({ message: "subject is required" }, { status: 400 });
  }

  const [{ error: topicsError }, { error: assignmentsError }] = await Promise.all([
    supabase.from("homework_topics").delete().eq("subject", subject),
    supabase.from("topic_assignments").delete().eq("subject", subject),
  ]);

  if (topicsError || assignmentsError) {
    return NextResponse.json({ message: "Failed to clear subject topics" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
