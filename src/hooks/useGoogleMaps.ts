"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    __googleMapsLoaded?: boolean;
  }
}

export function useGoogleMaps(): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already loaded
    if (window.google?.maps) {
      setLoaded(true);
      return;
    }

    // Script already injected
    if (window.__googleMapsLoaded) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          setLoaded(true);
          clearInterval(check);
        }
      }, 100);
      return () => clearInterval(check);
    }

    window.__googleMapsLoaded = true;

    const key = process.env.NEXT_PUBLIC_MAPS_KEY;
    if (!key) {
      console.warn("NEXT_PUBLIC_MAPS_KEY not set — map will not load");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=marker,places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  return loaded;
}
