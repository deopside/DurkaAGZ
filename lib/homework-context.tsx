'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getTelegramInitData, getTelegramUserId } from '@/lib/telegram-webapp';
import type { DailySchedule, HomeworkData, NotificationSettings, ScheduleEntry, Topic, UserAssignment } from '@/lib/types';

interface HomeworkContextValue {
  homeworkData: HomeworkData;
  updateTopics: (subject: string, date: string, topics: Topic[], hours?: string, minutes?: string) => Promise<void>;
  clearTopics: (subject: string) => Promise<void>;
  userAssignment: UserAssignment | null;
  assignTopicToUser: (subject: string, topicId: number) => Promise<{ ok: boolean; message?: string }>;
  cancelUserAssignment: () => Promise<void>;
  isTopicTaken: (subject: string, topicId: number) => boolean;
  scheduleData: DailySchedule;
  getScheduleForDate: (day: number, month: number, year: number) => ScheduleEntry[];
  updateScheduleForDate: (day: number, month: number, year: number, entries: ScheduleEntry[]) => Promise<void>;
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: NotificationSettings) => void;
  saveNotificationSettings: (settings: NotificationSettings) => Promise<void>;
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
  const [userAssignment, setUserAssignment] = useState<UserAssignment | null>(null);
  const [takenTopics, setTakenTopics] = useState<Set<string>>(new Set());
  const [scheduleData, setScheduleData] = useState<DailySchedule>({});
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    twentyFourHours: true,
    twelveHours: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const telegramUserId = useMemo(() => getTelegramUserId(), []);
  const telegramInitData = useMemo(() => getTelegramInitData(), []);
  const authHeaders = useMemo(
    () => ({
      ...(telegramUserId ? { 'x-telegram-user-id': telegramUserId } : {}),
      ...(telegramInitData ? { 'x-telegram-init-data': telegramInitData } : {}),
    }),
    [telegramUserId, telegramInitData],
  );

  const fetchOrThrow = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await fetch(input, init);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message ?? `Request failed: ${response.status}`);
    }
    return response;
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch('/api/bootstrap', { headers: authHeaders });
        if (!response.ok) return;
        const payload = await response.json();
        if (payload.homeworkData) setHomeworkData(payload.homeworkData);
        if (payload.scheduleData) setScheduleData(payload.scheduleData);
        if (payload.userAssignment) setUserAssignment(payload.userAssignment);
        if (Array.isArray(payload.takenTopics)) setTakenTopics(new Set(payload.takenTopics));
        if (payload.notificationSettings) setNotificationSettings(payload.notificationSettings);
        setIsAdmin(Boolean(payload.isAdmin));
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
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
    setUserAssignment(prev => (prev?.subject === subject ? null : prev));
    setTakenTopics(prev => {
      const newSet = new Set(prev);
      for (const key of Array.from(newSet)) {
        if (key.startsWith(`${subject}-`)) newSet.delete(key);
      }
      return newSet;
    });
  };

  const assignTopicToUser = async (subject: string, topicId: number) => {
    const response = await fetch('/api/topics/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ subject, topicId }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return { ok: false, message: payload.message as string | undefined };
    }
    setUserAssignment({ subject, topicId });
    setTakenTopics(prev => new Set(prev).add(`${subject}-${topicId}`));
    return { ok: true };
  };

  const cancelUserAssignment = async () => {
    await fetchOrThrow('/api/topics/cancel', {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (userAssignment) {
      const key = `${userAssignment.subject}-${userAssignment.topicId}`;
      setTakenTopics(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
    setUserAssignment(null);
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

  const saveNotificationSettings = async (settings: NotificationSettings) => {
    await fetchOrThrow('/api/notifications/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(settings),
    });
  };

  return (
    <HomeworkContext.Provider value={{ homeworkData, updateTopics, clearTopics, userAssignment, assignTopicToUser, cancelUserAssignment, isTopicTaken, scheduleData, getScheduleForDate, updateScheduleForDate, notificationSettings, setNotificationSettings, saveNotificationSettings, isLoading, isAdmin }}>
      {children}
    </HomeworkContext.Provider>
  );
}

export function useHomework() {
  const ctx = useContext(HomeworkContext);
  if (!ctx) throw new Error('useHomework must be used inside HomeworkProvider');
  return ctx;
}
