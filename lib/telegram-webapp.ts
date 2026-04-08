declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id?: number;
          };
        };
      };
    };
  }
}

export function getTelegramUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (!userId) {
    return null;
  }

  return String(userId);
}

export function getTelegramInitData(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const initData = window.Telegram?.WebApp?.initData;
  if (!initData) {
    return null;
  }

  return initData;
}
