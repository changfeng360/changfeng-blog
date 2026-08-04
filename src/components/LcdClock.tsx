"use client";

import { useEffect, useState } from "react";
import { CloudSun, MapPin } from "lucide-react";

type WeatherInfo = {
  location: string;
  weather: string;
  temperature: number;
  humidity: number;
};

const WEATHER_MAP: Record<number, string> = {
  0: "SUNNY",
  1: "SUNNY",
  2: "CLOUDY",
  3: "CLOUDY",
  45: "FOGGY",
  48: "FOGGY",
  51: "DRIZZLE",
  53: "DRIZZLE",
  55: "DRIZZLE",
  56: "DRIZZLE",
  57: "DRIZZLE",
  61: "RAIN",
  63: "RAIN",
  65: "RAIN",
  66: "RAIN",
  67: "RAIN",
  71: "SNOW",
  73: "SNOW",
  75: "SNOW",
  77: "SNOW",
  80: "SHOWER",
  81: "SHOWER",
  82: "SHOWER",
  85: "SNOW",
  86: "SNOW",
  95: "STORM",
  96: "STORM",
  99: "STORM",
};

const BEIJING_COORDS = {
  latitude: 39.9042,
  longitude: 116.4074,
};

const BEIJING_FALLBACK: WeatherInfo = {
  location: "北京市",
  weather: "CLOUDY",
  temperature: 27,
  humidity: 60,
};

async function fetchWeatherData(latitude: number, longitude: number) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`,
  );
  const data = await response.json();
  const current = data?.current ?? {};

  return {
    weather: WEATHER_MAP[current.weather_code] ?? "CLOUDY",
    temperature: Math.round(current.temperature_2m ?? 27),
    humidity: Math.round(current.relative_humidity_2m ?? 60),
  };
}

function getCityFromDisplayName(displayName?: string) {
  if (!displayName) {
    return "";
  }

  const cityParts = displayName
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.endsWith("市") && !part.endsWith("省"));

  return cityParts[cityParts.length - 1] ?? "";
}

function getLocationName(
  address: Record<string, string | undefined>,
  displayName?: string,
) {
  const province =
    address.province ||
    address.state ||
    address.region ||
    "";
  const namedCity =
    address.city ||
    address.state_district ||
    address.municipality;
  const city =
    (namedCity?.endsWith("市") ? namedCity : undefined) ||
    getCityFromDisplayName(displayName) ||
    namedCity;
  const district =
    address.city_district ||
    address.county ||
    address.district;
  const parts = [province, city, district].filter(Boolean);
  const uniqueParts = parts.filter(
    (part, index) => part !== parts[index - 1],
  );

  return uniqueParts.join(" ") || address.country || "Unknown";
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function LcdClock() {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<WeatherInfo>(BEIJING_FALLBACK);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBeijingWeather = async () => {
      try {
        const data = await fetchWeatherData(
          BEIJING_COORDS.latitude,
          BEIJING_COORDS.longitude,
        );
        if (!cancelled) {
          setWeather({
            location: "北京市",
            ...data,
          });
        }
      } catch {
        if (!cancelled) {
          setWeather(BEIJING_FALLBACK);
        }
      }
    };

    if (!("geolocation" in navigator)) {
      void loadBeijingWeather();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const [geoResponse, weatherData] = await Promise.all([
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=zh-CN`,
            ),
            fetchWeatherData(latitude, longitude),
          ]);
          const geoData = await geoResponse.json();

          if (cancelled) {
            return;
          }

          setWeather({
            location: getLocationName(
              geoData?.address ?? {},
              geoData?.display_name,
            ),
            ...weatherData,
          });
        } catch {
          if (!cancelled) {
            void loadBeijingWeather();
          }
        }
      },
      () => {
        if (cancelled) {
          return;
        }
        void loadBeijingWeather();
      },
      {
        timeout: 8000,
        maximumAge: 600000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const date = now
    ? `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`
    : "----.--.--";
  const weekday = now ? weekdays[now.getDay()] : "---";
  const time = now
    ? `${pad(now.getHours())}:${pad(now.getMinutes())}`
    : "--:--";
  const seconds = now ? pad(now.getSeconds()) : "--";

  return (
    <div className="flex h-full flex-col justify-between gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <CloudSun className="h-4 w-4 text-accent-tangerine" />
          Moment
        </div>
        <span className="chip pixel-font !text-[14px]">LIVE</span>
      </div>

      <div className="lcd-screen rounded-2xl p-4">
        <div className="pixel-font flex items-baseline gap-2 text-4xl leading-none sm:text-5xl">
          <span>{time}</span>
          <span className="animate-blink-cursor text-lg">:</span>
          <span className="text-lg">{seconds}</span>
        </div>
        <div className="pixel-font mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-cyan-200/80">
          <span>{date}</span>
          <span className="text-pixel-gold">{weekday}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-cyan-300/10 pt-3 text-[12px]">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="pixel-font truncate">{weather.location}</span>
          </span>
          <span className="pixel-font shrink-0">
            {weather.temperature}°C
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="pixel-font text-cyan-200/70">
            {weather.weather}
          </span>
          <span className="pixel-font text-cyan-200/70">
            RH {weather.humidity}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>Local weather</span>
        <span>Auto sync</span>
      </div>
    </div>
  );
}
