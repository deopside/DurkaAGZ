'use client';

import { useState } from 'react';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHomework } from '@/lib/homework-context';
import type { ScheduleEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AdminCalendarPageProps {
  onBackToHome: () => void;
}

const MONTH_NAMES = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
const DAY_ABBREVIATIONS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

const getDayOfWeek = (day: number, month: number, year: number): string => {
  const date = new Date(year, month - 1, day);
  return DAY_ABBREVIATIONS[date.getDay()];
};

export default function AdminCalendarPage({ onBackToHome }: AdminCalendarPageProps) {
  const { getScheduleForDate, updateScheduleForDate } = useHomework();
  const { toast } = useToast();

  const today = new Date();
  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [type, setType] = useState('');
  const [number, setNumber] = useState('');
  const [room, setRoom] = useState('');
  const [teacher, setTeacher] = useState('');

  const getDaysInMonth = (m: number, y: number): number => {
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (m === 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) return 29;
    return days[m - 1] || 31;
  };

  const daysInMonth = getDaysInMonth(month, year);

  const loadScheduleForDate = () => {
    const schedule = getScheduleForDate(day, month, year);
    setEntries(schedule);
    clearInputs();
  };

  const clearInputs = () => {
    setSubjectName('');
    setType('');
    setNumber('');
    setRoom('');
    setTeacher('');
  };

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

  const handleAddPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !type.trim() || !number.trim() || !room.trim() || !teacher.trim()) {
      toast({ description: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    const newEntry: ScheduleEntry = {
      id: `${day}-${month}-${year}-${entries.length + 1}`,
      pairNumber: entries.length + 1,
      subjectName,
      type,
      number,
      room,
      teacher,
    };
    setEntries([...entries, newEntry]);
    clearInputs();
  };

  const removeEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    const reindexed = updated.map((e, i) => ({ ...e, pairNumber: i + 1 }));
    setEntries(reindexed);
  };

  const handleConfirm = async () => {
    await updateScheduleForDate(day, month, year, entries);
    toast({ description: `Расписание для ${day} ${MONTH_NAMES[month - 1]} сохранено` });
    setEntries([]);
    clearInputs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">DurkaAGZ</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-400">ADMIN</span>
          <span className="text-sm text-gray-400">Календарь</span>
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <label className="text-sm text-gray-400">Выберите день</label>
        <p className="text-sm text-gray-400 text-center">{day} {MONTH_NAMES[month - 1]} {year} ({getDayOfWeek(day, month, year)})</p>
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
        <Button onClick={loadScheduleForDate} className="w-full bg-gray-800 text-white hover:bg-gray-700 text-xs">
          Загрузить расписание
        </Button>
      </div>

      {/* Schedule Builder */}
      <div className="space-y-3">
        <label className="text-sm text-gray-400">Расписание</label>
        
        {/* Subject Name */}
        <div>
          <Input
            placeholder="Название предмета"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600"
          />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-500 text-center block">Тип</label>
            <Input
              placeholder="Тип"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 text-sm text-center"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 text-center block">Номер</label>
            <Input
              placeholder="Номер"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 text-sm text-center"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 text-center block">Аудитория</label>
            <Input
              placeholder="Аудитория"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 text-sm text-center"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 text-center block">Преподаватель</label>
            <Input
              placeholder="Преподаватель"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 text-sm text-center"
            />
          </div>
        </div>

        {/* Add Button */}
        <Button
          onClick={handleAddPair}
          className="w-full bg-white text-black hover:bg-gray-200 font-semibold"
        >
          Добавить
        </Button>

        {/* Entries List */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-600">Нет пар</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between bg-gray-800 p-2 rounded">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Пара {entry.pairNumber}: {entry.subjectName}</p>
                  <p className="text-xs text-gray-500">{entry.type} • {entry.number} • {entry.room} • {entry.teacher}</p>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800 gap-2">
        <button onClick={onBackToHome} className="p-2 hover:bg-gray-900 rounded-lg transition">
          <Home size={20} className="text-white" />
        </button>
        <Button
          onClick={handleConfirm}
          disabled={entries.length === 0}
          className="flex-1 bg-white text-black hover:bg-gray-200 font-semibold"
        >
          Подтвердить
        </Button>
        <p className="text-xs text-gray-600">made by deopside</p>
      </div>
    </div>
  );
}
