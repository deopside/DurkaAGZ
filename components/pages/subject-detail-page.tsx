'use client';

import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
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
    if (userAssignment) {
      toast({
        title: 'Ошибка',
        description:
          userAssignment.subject === subject
            ? `Вы уже выбрали тему ${userAssignment.topicId}. Нажмите 'Отменить', чтобы отказаться от неё.`
            : "Вы уже выбрали другую тему. Нажмите 'Отменить', чтобы сменить её",
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

    setIsSubmitting(true);
    try {
      // Success: Assign topic to user
      const result = await assignTopicToUser(subject, topicId);
      if (!result.ok) {
        if (result.status === 409) {
          if (result.message === 'Topic already taken') {
            toast({
              title: 'Ошибка',
              description: 'Эта тема уже занята другим пользователем',
              variant: 'destructive',
            });
            return;
          }
          if (result.message === 'User already has assigned topic') {
            toast({
              title: 'Ошибка',
              description: "Вы уже выбрали другую тему. Нажмите 'Отменить', чтобы сменить её",
              variant: 'destructive',
            });
            return;
          }
        }

        toast({
          title: 'Ошибка',
          description: result.message ?? 'Ошибка сервера. Попробуйте позже',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Успешно',
        description: `Тема ${topicId} закреплена за вашим аккаунтом. Выполните до ${homework.date}`,
      });
      setTopicInput('');
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
            className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-white text-black hover:bg-gray-200 font-semibold"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Отправка...
              </span>
            ) : (
              'Отправить'
            )}
          </Button>
        </div>
      </form>

      {/* Status Display */}
      {userAssignment && (
        <div className="space-y-3">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-sm font-semibold text-white">
              Вы выбрали тему {userAssignment.topicId}
              {!isUserAssignedToThisSubject ? ` (${userAssignment.subject})` : ''}
            </p>
          </div>
          <Button
            onClick={handleCancel}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold"
            disabled={isSubmitting}
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
