'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getTelegramInitData, getTelegramUserId } from '@/lib/telegram-webapp';
import type { DailySchedule, HomeworkData, ScheduleEntry, Topic } from '@/lib/types';

interface HomeworkContextValue {
  homeworkData: HomeworkData;
  updateTopics: (subject: string, date: string, topics: Topic[], hours?: string, minutes?: string) => Promise<void>;
  clearTopics: (subject: string) => Promise<void>;
  userAssignmentsBySubject: Record<string, number>;
  assignTopicToUser: (subject: string, topicId: number) => Promise<{ ok: boolean; status?: number; message?: string }>;
  cancelUserAssignment: (subject: string) => Promise<void>;
  isTopicTaken: (subject: string, topicId: number) => boolean;
  scheduleData: DailySchedule;
  getScheduleForDate: (day: number, month: number, year: number) => ScheduleEntry[];
  updateScheduleForDate: (day: number, month: number, year: number, entries: ScheduleEntry[]) => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
}

const defaultHomeworkData: HomeworkData = {
  'РХБЗ': { date: '02.04.26', topics: [{ id: 1, text: 'Основы радиационной защиты' }, { id: 2, text: 'Защитные сооружения' }] },
  'ОСМ':  { date: '03.04.26', topics: [{ id: 1, text: 'Организация мероприятий' }, { id: 2, text: 'Планирование' }] },
  'ППП':  { date: '04.04.26', topics: [{ id: 1, text: 'Первая помощь' }, { id: 2, text: 'Перевязка' }] },
  'ТПМИ': { date: '05.04.26', topics: [{ id: 1, text: 'Теория информации' }] },
  'SMM':  { date: '06.04.26', topics: [] },
  'УПР':  { date: '07.04.26', topics: [] },
  'ПМК':  { date: '08.04.26', topics: [] },
  'СИК':  { date: '09.04.26', topics: [] },
  'ППФК': { date: '10.04.26', topics: [] },
  'ИНЯЗ': { date: '11.04.26', topics: [] },
};

const HomeworkContext = createContext<HomeworkContextValue | null>(null);

export function HomeworkProvider({ children }: { children: ReactNode }) {
  const [homeworkData, setHomeworkData] = useState<HomeworkData>(defaultHomeworkData);
  const [userAssignmentsBySubject, setUserAssignmentsBySubject] = useState<Record<string, number>>({});
  const [takenTopics, setTakenTopics] = useState<Set<string>>(new Set());
  const [scheduleData, setScheduleData] = useState<DailySchedule>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const telegramUserId = useMemo(() => getTelegramUserId(), []);
  const telegramInitData = useMemo(() => getTelegramInitData(), []);
  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (telegramUserId) {
      h['x-telegram-user-id'] = telegramUserId;
    }
    if (telegramInitData) {
      h['x-telegram-init-data'] = telegramInitData;
    }
    return h;
  }, [telegramUserId, telegramInitData]);

  const fetchOrThrow = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await fetch(input, init);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message ?? `Request failed: ${response.status}`);
    }
    return response;
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const response = await fetch('/api/bootstrap', { headers: authHeaders }).catch((err) => {
          console.error('Bootstrap fetch failed:', err);
          return null;
        });

        if (!response) {
          return;
        }

        const payload = await response.json().catch((err) => {
          console.error('Bootstrap JSON parse failed:', err);
          return {} as Record<string, unknown>;
        });

        if (cancelled) {
          return;
        }

        if (payload.homeworkData && typeof payload.homeworkData === 'object' && Object.keys(payload.homeworkData as object).length > 0) {
          setHomeworkData(payload.homeworkData as HomeworkData);
        }
        if (payload.scheduleData && typeof payload.scheduleData === 'object' && Object.keys(payload.scheduleData as object).length > 0) {
          setScheduleData(payload.scheduleData as DailySchedule);
        }
        if (payload.userAssignmentsBySubject && typeof payload.userAssignmentsBySubject === 'object') {
          setUserAssignmentsBySubject(payload.userAssignmentsBySubject as Record<string, number>);
        } else {
          setUserAssignmentsBySubject({});
        }
        if (Array.isArray(payload.takenTopics)) {
          setTakenTopics(new Set(payload.takenTopics as string[]));
        }
        if (typeof payload.isAdmin === 'boolean') {
          setIsAdmin(payload.isAdmin);
        }
      } catch (err) {
        console.error('Bootstrap error:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [authHeaders]);

  const updateTopics = async (subject: string, date: string, topics: Topic[], hours = '10', minutes = '00') => {
    await fetchOrThrow('/api/admin/homework', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ subject, date, topics, hours, minutes }),
    });
    setHomeworkData(prev => ({
      ...prev,
      [subject]: { date, topics, hours, minutes },
    }));
  };

  const clearTopics = async (subject: string) => {
    await fetchOrThrow(`/api/admin/homework?subject=${encodeURIComponent(subject)}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    setHomeworkData(prev => ({
      ...prev,
      [subject]: { ...prev[subject], topics: [] },
    }));
    setUserAssignmentsBySubject(prev => {
      const next = { ...prev };
      delete next[subject];
      return next;
    });
    setTakenTopics(prev => {
      const newSet = new Set(prev);
      for (const key of Array.from(newSet)) {
        if (key.startsWith(`${subject}-`)) newSet.delete(key);
      }
      return newSet;
    });
  };

  const assignTopicToUser = async (subject: string, topicId: number) => {
    try {
      const response = await fetch('/api/topics/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ subject, topicId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          ok: false as const,
          status: response.status,
          message: typeof payload.message === 'string' ? payload.message : undefined,
        };
      }
      setUserAssignmentsBySubject(prev => ({ ...prev, [subject]: topicId }));
      setTakenTopics(prev => new Set(prev).add(`${subject}-${topicId}`));
      return { ok: true as const };
    } catch (err) {
      console.error('assignTopicToUser:', err);
      return { ok: false as const, message: 'Не удалось связаться с сервером' };
    }
  };

  const cancelUserAssignment = async (subject: string) => {
    await fetchOrThrow(`/api/topics/cancel?subject=${encodeURIComponent(subject)}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    setUserAssignmentsBySubject(prev => {
      const topicId = prev[subject];
      if (topicId !== undefined) {
        const key = `${subject}-${topicId}`;
        setTakenTopics(t => {
          const nextSet = new Set(t);
          nextSet.delete(key);
          return nextSet;
        });
      }
      const next = { ...prev };
      delete next[subject];
      return next;
    });
  };

  const isTopicTaken = (subject: string, topicId: number): boolean => {
    return takenTopics.has(`${subject}-${topicId}`);
  };

  const getScheduleForDate = (day: number, month: number, year: number): ScheduleEntry[] => {
    const dateKey = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${String(year).padStart(2, '0')}`;
    return scheduleData[dateKey] || [];
  };

  const updateScheduleForDate = async (day: number, month: number, year: number, entries: ScheduleEntry[]) => {
    await fetchOrThrow('/api/admin/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ day, month, year, entries }),
    });
    const dateKey = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${String(year).padStart(2, '0')}`;
    setScheduleData(prev => ({
      ...prev,
      [dateKey]: entries,
    }));
  };

  return (
    <HomeworkContext.Provider
      value={{
        homeworkData,
        updateTopics,
        clearTopics,
        userAssignmentsBySubject,
        assignTopicToUser,
        cancelUserAssignment,
        isTopicTaken,
        scheduleData,
        getScheduleForDate,
        updateScheduleForDate,
        isLoading,
        isAdmin,
      }}
    >
      {children}
    </HomeworkContext.Provider>
  );
}

export function useHomework() {
  const ctx = useContext(HomeworkContext);
  if (!ctx) throw new Error('useHomework must be used inside HomeworkProvider');
  return ctx;
}
