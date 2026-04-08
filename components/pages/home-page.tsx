'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface HomePageProps {
  subjects: string[];
  onSubjectSelect: (subject: string) => void;
  onAdminClick: () => void;
  onCalendarClick: () => void;
}

const HOME_INFO_TEXT = `Пункт 1. ОРХЗ – Основы радиационной и химической защиты. Преподаватели: Лекция - Ткаченко Т.Е., ПЗ - Кольцов Г.И.
Пункт 2. ОСМ – Организация специальных мероприятий. Преподаватели: Лекция и ПЗ - Игнатенко Е.М.
Пункт 3. ППП – Первая помощь пострадавшему. Преподаватели: Лекция и ПЗ: Статкевич А.Р.
Пункт 4. ТПМИ – Теория и практика массовой информации. Преподаватели: Лекция и ПЗ - Сорокин А.К.
Пункт 5. SMM – SMM –Технологии. Преподаватели: Лекция и ПЗ - Орлова Е.А.
Пункт 6. УПР – Управление профессиональным развитием. Преподаватели: Лекция и ПЗ - Гусев С.А.
Пункт 7. ПМК - Психология массовых коммуникаций. Лекция - Котова Е.В., ПЗ - Савин С.Н
Пункт 8. СИК - Спичрайтинг и копирайтинг. Лекция и ПЗ - Карпова Г.Г.
Пункт 9. ППФК - Профессионально-прикладная физическая культура. ПЗ - Сидорова О.О.
Пункт 10. ИНЯЗ - Иностранный язык в профессиональной деятельности. ПЗ - Поминова А.М.
Команды бота – Напишите номер темы чат с ботом, чтобы закрепить за собой данную тему. Нажмите «Отменить», чтобы открепить выбранную тему. В разделе «Календарь» вы сможете увидеть расписанеие пар на каждый день`;

export default function HomePage({
  subjects,
  onSubjectSelect,
  onAdminClick,
  onCalendarClick,
}: HomePageProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">DurkaAGZ</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAdminClick}
            className="bg-transparent border-gray-700 text-white hover:bg-gray-900"
          >
            ADMIN
          </Button>
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-2 hover:bg-gray-900 rounded-lg transition"
          >
            <Info size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Subject Grid */}
      <div className="grid grid-cols-2 gap-3">
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => onSubjectSelect(subject)}
            className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 transition text-white font-semibold text-center"
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Calendar Button */}
      <Button
        onClick={onCalendarClick}
        className="w-full bg-white text-black hover:bg-gray-200 font-semibold"
      >
        Календарь
      </Button>

      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="bg-gray-900 border border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Информация о предметах</DialogTitle>
            <DialogDescription className="sr-only">
              Список всех предметов с информацией о преподавателях
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto pr-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {HOME_INFO_TEXT}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">made by deopside</p>
      </div>
    </div>
  );
}
