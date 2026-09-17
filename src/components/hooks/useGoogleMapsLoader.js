import { useEffect, useState } from 'react';

const SCRIPT_ID = 'google-maps-script';

export function useGoogleMapsLoader(apiKey) {
  console.log(apiKey)
  const [loaded, setLoaded] = useState(Boolean(window.google?.maps));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.google?.maps) {
      setLoaded(true);
      return;
    }

    if (document.getElementById(SCRIPT_ID)) {
      // Another mount already injected the script - just wait for it.
      const check = setInterval(() => {
        if (window.google?.maps) {
          setLoaded(true);
          clearInterval(check);
        }
      }, 100);
      return () => clearInterval(check);
    }

    // if (apiKey === 'AIzaSyCYAhV6XQDNjXEtZV5v6Poej6ukfU5BfQI') {
    //   setError('Missing VITE_GOOGLE_MAPS_API_KEY - set it in frontend/.env');
    //   return;
    // }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps script');
    document.head.appendChild(script);
  }, [apiKey]);

  return { loaded, error };
}
