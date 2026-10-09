import { useEffect, useState } from 'react';
import { getTodayDateStr } from './dateUtils.ts';

export function useTodayDate(): string {
  const [today, setToday] = useState(getTodayDateStr);
  useEffect(() => {
    const refresh = () => setToday(getTodayDateStr());
    const timer = setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return today;
}
