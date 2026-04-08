'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useHomework } from '@/lib/homework-context';

interface SubjectDetailPageProps {
  subject: string;
  onNavigateToNotifications: () => void;
  onBackToHome: () => void;
}

export default function SubjectDetailPage({
  subject,
  onNavigateToNotifications,
  onBackToHome,
}: SubjectDetailPageProps) {
  const { homeworkData, userAssignment, assignTopicToUser, cancelUserAssignment, isTopicTaken } = useHomework();
  const homework = homeworkData[subject];
  const [topicInput, setTopicInput] = useState('');
  const { toast } = useToast();

  const handleSubmitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = topicInput.trim();

    if (!trimmedValue || isNaN(Number(trimmedValue))) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, введите корректный номер темы.',
        variant: 'destructive',
      });
      return;
    }

    const topicId = Number(trimmedValue);

    // Step 1: Check if user already has a topic assigned
    if (userAssignment && userAssignment.subject === subject) {
      toast({
        title: 'Ошибка',
        description: `Вы уже выбрали тему ${userAssignment.topicId}. Нажмите отменить чтобы отказаться от нее.`,
        variant: 'destructive',
      });
      return;
    }

    // Step 2: Check if topic exists
    const topicExists = homework.topics.some(t => t.id === topicId);
    if (!topicExists) {
      toast({
        title: 'Ошибка',
        description: 'Такой темы не существует',
        variant: 'destructive',
      });
      return;
    }

    // Step 3: Check if topic is already taken
    if (isTopicTaken(subject, topicId)) {
      toast({
        title: 'Ошибка',
        description: 'Данная тема уже занята. Выберите другую.',
        variant: 'destructive',
      });
      return;
    }

    // Success: Assign topic to user
    const result = await assignTopicToUser(subject, topicId);
    if (!result.ok) {
      toast({
        title: 'Ошибка',
        description: result.message ?? 'Не удалось закрепить тему',
        variant: 'destructive',
      });
      return;
    }
    toast({
      description: `Тема ${topicId} закреплена за вашим аккаунтом. Выполните до ${homework.date}`,
    });
    setTopicInput('');
  };

  const handleCancel = async () => {
    await cancelUserAssignment();
    toast({
      description: 'Вы отменили выбор темы',
    });
  };

  const isUserAssignedToThisSubject = userAssignment && userAssignment.subject === subject;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBackToHome}
          className="p-2 hover:bg-gray-900 rounded-lg transition"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">DurkaAGZ</h1>
        <button
          onClick={onNavigateToNotifications}
          className="ml-auto text-sm text-gray-300 hover:text-white transition"
        >
          Оповещение
        </button>
        <h2 className="text-lg font-semibold text-white">{subject}</h2>
      </div>

      {/* Homework Display */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Дата сдачи:</span>
          <span className="text-sm font-semibold text-white">{homework.date}</span>
        </div>
        
        {homework.topics.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Доступные темы:</p>
            <div className="space-y-1">
              {homework.topics.map((topic) => (
                <div key={topic.id} className={`text-sm p-2 rounded ${isTopicTaken(subject, topic.id) ? 'bg-gray-800 text-gray-500 line-through' : 'text-gray-200'}`}>
                  {topic.id}. {topic.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Topic Input */}
      <form onSubmit={handleSubmitTopic} className="space-y-3">
        <p className="text-sm text-gray-400">Введите номер темы:</p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Номер темы"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600"
          />
          <Button
            type="submit"
            className="bg-white text-black hover:bg-gray-200 font-semibold"
          >
            Отправить
          </Button>
        </div>
      </form>

      {/* Status Display */}
      {isUserAssignedToThisSubject && (
        <div className="space-y-3">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-sm font-semibold text-white">Вы выбрали тему {userAssignment.topicId}</p>
          </div>
          <Button
            onClick={handleCancel}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold"
          >
            Отменить
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">made by deopside</p>
      </div>
    </div>
  );
}
