'use client';

import { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import { useHomework } from '@/lib/homework-context';

interface DailySchedulePageProps {
  initialDay: number;
  initialMonth: number;
  initialYear: number;
  onBackToHome: () => void;
  onBackToCalendar: () => void;
}

const MONTH_NAMES = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
const DAY_ABBREVIATIONS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

const getDayOfWeek = (day: number, month: number, year: number): string => {
  const date = new Date(year, month - 1, day);
  return DAY_ABBREVIATIONS[date.getDay()];
};

export default function DailySchedulePage({ initialDay, initialMonth, initialYear, onBackToHome, onBackToCalendar }: DailySchedulePageProps) {
  const { getScheduleForDate } = useHomework();
  const [day, setDay] = useState(initialDay);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const getDaysInMonth = (m: number, y: number): number => {
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (m === 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) return 29;
    return days[m - 1] || 31;
  };

  const schedule = getScheduleForDate(day, month, year);
  const daysInMonth = getDaysInMonth(month, year);

  const incrementDay = () => {
    let newDay = day + 1;
    let newMonth = month;
    let newYear = year;
    if (newDay > daysInMonth) {
      newDay = 1;
      newMonth = month + 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear = year + 1;
      }
    }
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);
  };

  const decrementDay = () => {
    let newDay = day - 1;
    let newMonth = month;
    let newYear = year;
    if (newDay < 1) {
      newMonth = month - 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear = year - 1;
      }
      newDay = getDaysInMonth(newMonth, newYear);
    }
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);
  };

  const incrementMonth = () => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear = year + 1;
    }
    setMonth(newMonth);
    setYear(newYear);
    setDay(Math.min(day, getDaysInMonth(newMonth, newYear)));
  };

  const decrementMonth = () => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear = year - 1;
    }
    setMonth(newMonth);
    setYear(newYear);
    setDay(Math.min(day, getDaysInMonth(newMonth, newYear)));
  };

  const incrementYear = () => {
    setYear(year + 1);
  };

  const decrementYear = () => {
    setYear(Math.max(year - 1, 1900));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">DurkaAGZ</h1>
        <span className="text-sm text-gray-400">Календарь</span>
      </div>

      {/* Date Picker */}
      <div className="space-y-3">
        <label className="text-sm text-gray-400">Выберите дату</label>
        <div className="grid grid-cols-3 gap-2">
          {/* Day */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 text-center">День</p>
            <div className="flex flex-col items-center gap-1">
              <button onClick={incrementDay} className="p-1 hover:bg-gray-800 rounded">▲</button>
              <input
                type="text"
                value={String(day).padStart(2, '0')}
                onChange={(e) => { const v = e.target.value; if (!isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= daysInMonth) setDay(Number(v)); }}
                className="w-12 bg-gray-800 border border-gray-700 rounded text-white text-center text-sm"
              />
              <button onClick={decrementDay} className="p-1 hover:bg-gray-800 rounded">▼</button>
            </div>
          </div>

          {/* Month */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 text-center">Месяц</p>
            <div className="flex flex-col items-center gap-1">
              <button onClick={incrementMonth} className="p-1 hover:bg-gray-800 rounded">▲</button>
              <input
                type="text"
                value={String(month).padStart(2, '0')}
                onChange={(e) => { const v = e.target.value; if (!isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 12) setMonth(Number(v)); }}
                className="w-12 bg-gray-800 border border-gray-700 rounded text-white text-center text-sm"
              />
              <button onClick={decrementMonth} className="p-1 hover:bg-gray-800 rounded">▼</button>
            </div>
          </div>

          {/* Year */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 text-center">Год</p>
            <div className="flex flex-col items-center gap-1">
              <button onClick={incrementYear} className="p-1 hover:bg-gray-800 rounded">▲</button>
              <input
                type="text"
                value={String(year).padStart(4, '0')}
                onChange={(e) => { const v = e.target.value; if (!isNaN(Number(v))) setYear(Number(v)); }}
                className="w-14 bg-gray-800 border border-gray-700 rounded text-white text-center text-sm"
              />
              <button onClick={decrementYear} className="p-1 hover:bg-gray-800 rounded">▼</button>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-400 text-center">{day} {MONTH_NAMES[month - 1]} {year} ({getDayOfWeek(day, month, year)})</p>
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        <label className="text-sm text-gray-400">Расписание</label>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
          {schedule.length === 0 ? (
            <p className="text-sm text-gray-600">Нет пар в этот день</p>
          ) : (
            schedule.map((entry) => (
              <div key={entry.id} className="bg-gray-800 p-3 rounded space-y-1">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-white">Пара {entry.pairNumber}</p>
                </div>
                <p className="text-sm text-gray-300">{entry.subjectName}</p>
                <p className="text-xs text-gray-500">
                  {entry.type} • Номер: {entry.number} • Аудитория: {entry.room} • Преподаватель: {entry.teacher}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <button onClick={onBackToHome} className="p-2 hover:bg-gray-900 rounded-lg transition">
          <Home size={20} className="text-white" />
        </button>
        <p className="text-xs text-gray-600">made by deopside</p>
      </div>
    </div>
  );
}
