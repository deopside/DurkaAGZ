'use client';

import { useState } from 'react';
import HomePage from '@/components/pages/home-page';
import SubjectDetailPage from '@/components/pages/subject-detail-page';
import AdminPanelPage from '@/components/pages/admin-panel-page';
import NotificationsPage from '@/components/pages/notifications-page';
import CalendarPage from '@/components/pages/calendar-page';
import DailySchedulePage from '@/components/pages/daily-schedule-page';
import AdminCalendarPage from '@/components/pages/admin-calendar-page';
import { useHomework } from '@/lib/homework-context';

type PageType = 'home' | 'detail' | 'admin' | 'notifications' | 'calendar' | 'daily-schedule' | 'admin-calendar';

export default function Page() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ day: number; month: number; year: number } | null>(null);
  const { notificationSettings, setNotificationSettings, saveNotificationSettings, isAdmin } = useHomework();

  const subjects = [
    'РХБЗ', 'ОСМ', 'ППП', 'ТПМИ', 'SMM',
    'УПР', 'ПМК', 'СИК', 'ППФК', 'ИНЯЗ',
  ];

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentPage('detail');
  };

  const handleDaySelect = (day: number, month: number, year: number) => {
    setSelectedDate({ day, month, year });
    setCurrentPage('daily-schedule');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black">
        {currentPage === 'home' && (
          <HomePage
            subjects={subjects}
            onSubjectSelect={handleSubjectSelect}
            onAdminClick={() => {
              if (isAdmin) {
                setCurrentPage('admin');
              }
            }}
            onCalendarClick={() => setCurrentPage('calendar')}
            isAdmin={isAdmin}
          />
        )}
        {currentPage === 'detail' && selectedSubject && (
          <SubjectDetailPage
            subject={selectedSubject}
            onNavigateToNotifications={() => setCurrentPage('notifications')}
            onBackToHome={() => setCurrentPage('home')}
          />
        )}
        {currentPage === 'admin' && isAdmin && (
          <AdminPanelPage
            subjects={subjects}
            onBackToHome={() => setCurrentPage('home')}
            onCalendarClick={() => setCurrentPage('admin-calendar')}
          />
        )}
        {currentPage === 'notifications' && (
          <NotificationsPage
            settings={notificationSettings}
            onSettingsUpdate={(settings) => {
              setNotificationSettings(settings);
              void saveNotificationSettings(settings);
            }}
            onBackToHome={() => setCurrentPage('home')}
          />
        )}
        {currentPage === 'calendar' && (
          <CalendarPage
            onDaySelect={handleDaySelect}
            onBackToHome={() => setCurrentPage('home')}
          />
        )}
        {currentPage === 'daily-schedule' && selectedDate && (
          <DailySchedulePage
            initialDay={selectedDate.day}
            initialMonth={selectedDate.month}
            initialYear={selectedDate.year}
            onBackToHome={() => setCurrentPage('home')}
            onBackToCalendar={() => setCurrentPage('calendar')}
          />
        )}
        {currentPage === 'admin-calendar' && isAdmin && (
          <AdminCalendarPage
            onBackToHome={() => setCurrentPage('home')}
          />
        )}
      </div>
    </div>
  );
}
