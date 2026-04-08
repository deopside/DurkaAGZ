'use client';

import { useState } from 'react';
import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarPageProps {
  onDaySelect: (day: number, month: number, year: number) => void;
  onBackToHome: () => void;
}

const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const DAY_ABBREVIATIONS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

const getDayOfWeek = (day: number, month: number, year: number): string => {
  const date = new Date(year, month - 1, day);
  return DAY_ABBREVIATIONS[date.getDay()];
};

export default function CalendarPage({ onDaySelect, onBackToHome }: CalendarPageProps) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const getDaysInMonth = (m: number, y: number): number => {
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (m === 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) return 29;
    return days[m - 1] || 31;
  };

  const daysInMonth = getDaysInMonth(month, year);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const handlePrevMonth = () => {
    setMonth(prevMonth);
    setYear(prevYear);
  };

  const handleNextMonth = () => {
    setMonth(nextMonth);
    setYear(nextYear);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">DurkaAGZ</h1>
        <span className="text-sm text-gray-400">Календарь</span>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-900 rounded transition">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{MONTH_NAMES[month - 1]}</p>
          <p className="text-sm text-gray-400">{year}</p>
        </div>
        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-900 rounded transition">
          <ChevronRight size={20} className="text-white" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-6 gap-2">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => onDaySelect(d, month, year)}
            className="aspect-square flex flex-col items-center justify-center rounded-lg bg-gray-900 border border-gray-800 text-white hover:bg-gray-800 hover:border-gray-700 transition"
          >
            <span className="text-xs text-gray-500">{getDayOfWeek(d, month, year)}</span>
            <span className="font-semibold">{d}</span>
          </button>
        ))}
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
