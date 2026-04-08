'use client';

import { useState, useEffect } from 'react';
import { Home, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHomework } from '@/lib/homework-context';
import type { Topic } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelPageProps {
  subjects: string[];
  onBackToHome: () => void;
  onCalendarClick: () => void;
}

export default function AdminPanelPage({ subjects, onBackToHome, onCalendarClick }: AdminPanelPageProps) {
  const { homeworkData, updateTopics, clearTopics } = useHomework();
  const { toast } = useToast();

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [nextTopicId, setNextTopicId] = useState(1);
  const [day, setDay] = useState('01');
  const [month, setMonth] = useState('01');
  const [year, setYear] = useState('26');
  const [hours, setHours] = useState('10');
  const [minutes, setMinutes] = useState('00');

  // Pre-populate fields when subject is selected
  useEffect(() => {
    if (selectedSubject && homeworkData[selectedSubject]) {
      const { date, topics: existingTopics } = homeworkData[selectedSubject];
      const parts = date.split('.');
      if (parts.length === 3) {
        setDay(parts[0]);
        setMonth(parts[1]);
        setYear(parts[2]);
      }
      setTopics(existingTopics);
      const maxId = existingTopics.length > 0 ? Math.max(...existingTopics.map(t => t.id)) : 0;
      setNextTopicId(maxId + 1);
      setTopicInput(`${maxId + 1}. `);
    }
  }, [selectedSubject, homeworkData]);

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const text = topicInput.slice(String(nextTopicId).length + 2).trim();
    
    if (!text) {
      toast({ description: 'Введите текст темы', variant: 'destructive' });
      return;
    }

    const newTopic: Topic = { id: nextTopicId, text };
    const updatedTopics = [...topics, newTopic];
    setTopics(updatedTopics);
    setNextTopicId(nextTopicId + 1);
    setTopicInput(`${nextTopicId + 1}. `);
  };

  const removeTopic = (id: number) => {
    const updatedTopics = topics.filter(t => t.id !== id);
    setTopics(updatedTopics);
  };

  const handleSave = async () => {
    if (!selectedSubject) return;
    const dateStr = `${day}.${month}.${year}`;
    await updateTopics(selectedSubject, dateStr, topics, hours, minutes);
    toast({ description: `Темы для "${selectedSubject}" сохранены. Дедлайн: ${dateStr}` });
    setTopics([]);
    setSelectedSubject('');
    setNextTopicId(1);
    setTopicInput('');
  };

  const handleClearAllTopics = async () => {
    if (!selectedSubject) return;
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить все темы для этого предмета?`
    );
    if (!confirmed) return;
    await clearTopics(selectedSubject);
    setTopics([]);
    setNextTopicId(1);
    setTopicInput('1. ');
    toast({ description: `Все темы для "${selectedSubject}" были успешно удалены` });
  };

  const getDaysInMonth = (m: number): number => {
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return days[m - 1] || 31;
  };

  const daysInMonth = getDaysInMonth(parseInt(month));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-white">DurkaAGZ</h1>
        <span className="ml-auto text-sm text-gray-400">ADMIN</span>
        <button onClick={onCalendarClick} className="text-sm text-gray-400 hover:text-white transition">
          Календарь
        </button>
      </div>

      {/* Subject Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Выберите предмет</label>
          <button
            type="button"
            onClick={handleClearAllTopics}
            disabled={!selectedSubject}
            title="Удалить все темы"
            className="p-1 rounded transition-colors text-gray-600 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
            <SelectValue placeholder="Выбрать предмет" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800">
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject} className="text-white">
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSubject && (
        <>
          {/* Topics List */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400">Темы</label>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
              {topics.length === 0 ? (
                <p className="text-sm text-gray-600">Нет тем</p>
              ) : (
                topics.map((topic) => (
                  <div key={topic.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                    <span className="text-sm text-white">{topic.id}. {topic.text}</span>
                    <button
                      onClick={() => removeTopic(topic.id)}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <X size={16} className="text-gray-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Topic Input */}
          <form onSubmit={handleAddTopic} className="space-y-3">
            <label className="text-sm text-gray-400">Добавить тему</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={`${nextTopicId}. Введите текст темы`}
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600"
                onFocus={() => {
                  if (!topicInput.startsWith(`${nextTopicId}. `)) {
                    setTopicInput(`${nextTopicId}. `);
                  }
                }}
              />
              <Button
                type="submit"
                className="bg-white text-black hover:bg-gray-200 font-semibold"
              >
                Добавить
              </Button>
            </div>
          </form>

          {/* Date/Time Picker */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400">Дата сдачи ДЗ</label>
            <div className="grid grid-cols-5 gap-2">
              {/* Day */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 text-center">День</p>
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => setDay(String(Math.min(parseInt(day) + 1, daysInMonth)).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▲</button>
                  <input
                    type="text"
                    value={day}
                    onChange={(e) => { const v = e.target.value.slice(0, 2); if (!isNaN(Number(v))) setDay(v.padStart(2, '0')); }}
                    className="w-10 bg-gray-800 border border-gray-700 rounded text-white text-center text-sm"
                  />
                  <button type="button" onClick={() => setDay(String(Math.max(parseInt(day) - 1, 1)).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▼</button>
                </div>
              </div>

              {/* Month */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 text-center">Месяц</p>
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => setMonth(String(Math.min(parseInt(month) + 1, 12)).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▲</button>
                  <input
                    type="text"
                    value={month}
                    onChange={(e) => { const v = e.target.value.slice(0, 2); if (!isNaN(Number(v))) setMonth(v.padStart(2, '0')); }}
                    className="w-10 bg-gray-800 border border-gray-700 rounded text-white text-center text-sm"
                  />
                  <button type="button" onClick={() => setMonth(String(Math.max(parseInt(month) - 1, 1)).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▼</button>
                </div>
              </div>

              {/* Year */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 text-center">Год</p>
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => setYear(String(Math.min(parseInt(year) + 1, 99)).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▲</button>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => { const v = e.target.value.slice(0, 2); if (!isNaN(Number(v))) setYear(v.padStart(2, '0')); }}
                    className="w-10 bg-gray-800 border border-gray-700 rounded text-white text-center text-sm"
                  />
                  <button type="button" onClick={() => setYear(String(Math.max(parseInt(year) - 1, 0)).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▼</button>
                </div>
              </div>

              {/* Hours */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 text-center">Часы</p>
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => setHours(String((parseInt(hours) + 1) % 24).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▲</button>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => { const v = e.target.value.slice(0, 2); if (!isNaN(Number(v))) setHours(v.padStart(2, '0')); }}
                    className="w-10 bg-gray-800 border border-gray-700 rounded text-white text-center text-sm"
                  />
                  <button type="button" onClick={() => setHours(String((parseInt(hours) - 1 + 24) % 24).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▼</button>
                </div>
              </div>

              {/* Minutes */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 text-center">Минуты</p>
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => setMinutes(String((parseInt(minutes) + 1) % 60).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▲</button>
                  <input
                    type="text"
                    value={minutes}
                    onChange={(e) => { const v = e.target.value.slice(0, 2); if (!isNaN(Number(v))) setMinutes(v.padStart(2, '0')); }}
                    className="w-10 bg-gray-800 border border-gray-700 rounded text-white text-center text-sm"
                  />
                  <button type="button" onClick={() => setMinutes(String((parseInt(minutes) - 1 + 60) % 60).padStart(2, '0'))} className="p-1 hover:bg-gray-800 rounded">▼</button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
            <button onClick={onBackToHome} className="p-2 hover:bg-gray-900 rounded-lg transition">
              <Home size={20} className="text-white" />
            </button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-white text-black hover:bg-gray-200 font-semibold"
              disabled={topics.length === 0}
            >
              Сохранить темы
            </Button>
            <p className="text-xs text-gray-600">made by deopside</p>
          </div>
        </>
      )}
    </div>
  );
}
