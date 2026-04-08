'use client';

import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface NotificationsPageProps {
  settings: {
    twentyFourHours: boolean;
    twelveHours: boolean;
  };
  onSettingsUpdate: (settings: {
    twentyFourHours: boolean;
    twelveHours: boolean;
  }) => void;
  onBackToHome: () => void;
}

export default function NotificationsPage({
  settings,
  onSettingsUpdate,
  onBackToHome,
}: NotificationsPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-white">DurkaAGZ</h1>
        <span className="ml-auto text-sm text-gray-400">Оповещения</span>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-white">
          Настройка оповещений о необходимости выполнить ДЗ
        </h2>
      </div>

      {/* Notification Toggles */}
      <div className="space-y-4">
        {/* 24 Hours Reminder */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Напоминание за 24 часа</p>
            <p className="text-xs text-gray-400">
              Получайте уведомления за день до дедлайна
            </p>
          </div>
          <Switch
            checked={settings.twentyFourHours}
            onCheckedChange={(checked) =>
              onSettingsUpdate({
                ...settings,
                twentyFourHours: checked,
              })
            }
          />
        </div>

        {/* 12 Hours Reminder */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Напоминание за 12 часов</p>
            <p className="text-xs text-gray-400">
              Получайте уведомления за пол дня до дедлайна
            </p>
          </div>
          <Switch
            checked={settings.twelveHours}
            onCheckedChange={(checked) =>
              onSettingsUpdate({
                ...settings,
                twelveHours: checked,
              })
            }
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <button
          onClick={onBackToHome}
          className="p-2 hover:bg-gray-900 rounded-lg transition"
        >
          <Home size={20} className="text-white" />
        </button>
        <p className="text-xs text-gray-600">made by deopside</p>
      </div>
    </div>
  );
}
