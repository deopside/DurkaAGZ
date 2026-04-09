'use client';

import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useHomework } from '@/lib/homework-context';

interface SubjectDetailPageProps {
  subject: string;
  onBackToHome: () => void;
}

const SERVER_OR_AUTH = 'Ошибка сервера или авторизации';

export default function SubjectDetailPage({
  subject,
  onBackToHome,
}: SubjectDetailPageProps) {
  const { homeworkData, userAssignmentsBySubject, assignTopicToUser, cancelUserAssignment, isTopicTaken } = useHomework();
  const homework = homeworkData[subject] ?? { date: '—', topics: [] };
  const [topicInput, setTopicInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const assignedTopicId = userAssignmentsBySubject[subject];

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

    if (assignedTopicId !== undefined) {
      toast({
        title: 'Ошибка',
        description: `Вы уже выбрали тему ${assignedTopicId} по этому предмету. Нажмите «Отменить», чтобы отказаться от неё.`,
        variant: 'destructive',
      });
      return;
    }

    const topicExists = homework.topics.some(t => t.id === topicId);
    if (!topicExists) {
      toast({
        title: 'Ошибка',
        description: 'Такой темы не существует',
        variant: 'destructive',
      });
      return;
    }

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
      const result = await assignTopicToUser(subject, topicId);
      if (!result.ok) {
        const st = result.status;
        if (st === 409) {
          toast({
            title: 'Конфликт',
            description: result.message ?? 'Запрос отклонён',
            variant: 'destructive',
          });
          return;
        }
        if (st === 401 || st === 403 || st === 500 || st === 503) {
          toast({
            title: 'Ошибка',
            description: SERVER_OR_AUTH,
            variant: 'destructive',
          });
          return;
        }
        toast({
          title: 'Ошибка',
          description: result.message ?? SERVER_OR_AUTH,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Тема закреплена',
        description: `Тема ${topicId} закреплена за вами. Срок: ${homework.date}`,
      });
      setTopicInput('');
    } catch {
      toast({
        title: 'Ошибка',
        description: SERVER_OR_AUTH,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelUserAssignment(subject);
      toast({
        description: 'Вы отменили выбор темы',
      });
    } catch {
      toast({
        title: 'Ошибка',
        description: SERVER_OR_AUTH,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onBackToHome}
          className="p-2 hover:bg-gray-900 rounded-lg transition"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-white truncate">DurkaAGZ</h1>
          <h2 className="text-lg font-semibold text-white truncate">{subject}</h2>
        </div>
      </div>

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

      {assignedTopicId !== undefined && (
        <div className="space-y-3">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-sm font-semibold text-white">
              Тема закреплена: №{assignedTopicId}
            </p>
          </div>
          <Button
            onClick={() => void handleCancel()}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold"
            disabled={isSubmitting}
          >
            Отменить
          </Button>
        </div>
      )}

      <div className="text-center pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">made by deopside</p>
      </div>
    </div>
  );
}
