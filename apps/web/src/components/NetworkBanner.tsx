import { useEffect, useState } from 'react';

export function NetworkBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function onOnline() {
      setOffline(false);
    }
    function onOffline() {
      setOffline(true);
    }
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-100 text-amber-900 text-center text-xs py-2 px-4 animate-fade-in">
      Sin conexión. Los datos pueden estar desactualizados.
    </div>
  );
}