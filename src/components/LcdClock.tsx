"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

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

const TRADITIONAL_TO_SIMPLIFIED: Record<string, string> = {
  區: "区",
  縣: "县",
  鄉: "乡",
  鎮: "镇",
  灣: "湾",
  臺: "台",
  東: "东",
  廣: "广",
  龍: "龙",
  鳳: "凤",
  陽: "阳",
  陰: "阴",
  長: "长",
  門: "门",
  廈: "厦",
  島: "岛",
  寧: "宁",
  蘇: "苏",
  贛: "赣",
  閩: "闽",
  魯: "鲁",
  陝: "陕",
  瓊: "琼",
  遼: "辽",
  滬: "沪",
  雲: "云",
  貴: "贵",
  萬: "万",
  與: "与",
  為: "为",
  點: "点",
  號: "号",
};

function simplifyLocation(value: string) {
  return String(value ?? "").replace(
    /[區縣鄉鎮灣臺東廣龍鳳陽陰長門廈島寧蘇贛閩魯陝瓊遼滬雲貴萬與為點號]/g,
    (char) => TRADITIONAL_TO_SIMPLIFIED[char] || char,
  );
}

async function fetchWithTimeout(url: string, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWeatherData(latitude: number, longitude: number) {
  const response = await fetchWithTimeout(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`,
  );
  if (!response.ok) {
    throw new Error("Weather request failed");
  }
  const data = await response.json();
  const current = data?.current ?? {};

  return {
    weather: WEATHER_MAP[current.weather_code] ?? "CLOUDY",
    temperature: Math.round(current.temperature_2m ?? 27),
    humidity: Math.round(current.relative_humidity_2m ?? 60),
  };
}

async function fetchNominatimName(latitude: number, longitude: number) {
  const response = await fetchWithTimeout(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=zh-CN`,
  );
  if (!response.ok) {
    throw new Error("Nominatim request failed");
  }
  const data = await response.json();
  return getLocationName(data?.address ?? {}, data?.display_name);
}

async function fetchBigDataCloudName(latitude: number, longitude: number) {
  const response = await fetchWithTimeout(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`,
  );
  if (!response.ok) {
    throw new Error("BigDataCloud request failed");
  }
  const data = await response.json();
  const province = simplifyLocation(
    data.principalSubdivision || data.region || "",
  );
  const city = simplifyLocation(data.city || data.locality || "");
  const district = simplifyLocation(data.locality || "");
  const displayDistrict = stripRepeatedCityPrefix(district || "", city || "");
  const parts = [province, city, displayDistrict].filter(Boolean);
  const uniqueParts = parts.filter(
    (part, index) => part !== parts[index - 1],
  );

  return uniqueParts.join(" ") || data.countryName || "Unknown";
}

async function fetchLocationName(latitude: number, longitude: number) {
  try {
    return simplifyLocation(await fetchNominatimName(latitude, longitude));
  } catch {
    return simplifyLocation(await fetchBigDataCloudName(latitude, longitude));
  }
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

function stripRepeatedCityPrefix(district: string, city: string) {
  const cityBase = city.replace(/市$/, "");
  if (
    cityBase &&
    district.startsWith(cityBase) &&
    district.endsWith("区")
  ) {
    return district.slice(cityBase.length);
  }
  return district;
}

function getLocationName(
  address: Record<string, string | undefined>,
  displayName?: string,
) {
  const province =
    simplifyLocation(
      address.province ||
        address.state ||
        address.region ||
        "",
    );
  const namedCity =
    simplifyLocation(
      address.city ||
        address.state_district ||
        address.municipality ||
        "",
    );
  const city =
    (namedCity?.endsWith("市") ? namedCity : undefined) ||
    getCityFromDisplayName(displayName) ||
    namedCity;
  const district =
    simplifyLocation(address.county || address.district || "");
  const displayDistrict = stripRepeatedCityPrefix(district || "", city || "");
  const parts = [province, city, displayDistrict].filter(Boolean);
  const uniqueParts = parts.filter(
    (part, index) => part !== parts[index - 1],
  );

  return (
    uniqueParts.join(" ") ||
    simplifyLocation(address.country || "") ||
    "Unknown"
  );
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
    let hasLocation = false;
    let weatherFailed = false;

    const loadBeijingWeather = async () => {
      try {
        const data = await fetchWeatherData(
          BEIJING_COORDS.latitude,
          BEIJING_COORDS.longitude,
        );
        if (!cancelled) {
          setWeather((current: WeatherInfo) => ({
            location: hasLocation ? current.location : "北京市",
            ...data,
          }));
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

        const updateWeather = async () => {
          try {
            const data = await fetchWeatherData(latitude, longitude);
            if (!cancelled) {
              setWeather((current: WeatherInfo) => ({
                ...current,
                ...data,
                location:
                  current.location && current.location !== "北京市"
                    ? current.location
                    : "当前位置",
              }));
            }
          } catch {
            weatherFailed = true;
            if (!cancelled) {
              void loadBeijingWeather();
            }
          }
        };

        const updateLocation = async () => {
          try {
            const location = await fetchLocationName(latitude, longitude);
            if (!cancelled) {
              hasLocation = true;
              setWeather((current: WeatherInfo) => ({
                ...current,
                location,
              }));
            }
          } catch {
            if (!cancelled && !weatherFailed) {
              setWeather((current: WeatherInfo) => ({
                ...current,
                location: "当前位置",
              }));
            }
          }
        };

        void updateWeather();
        void updateLocation();
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
    <div className="flex h-full flex-col justify-between gap-6 p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <span className="h-2 w-2 rounded-full bg-accent-mint shadow-[0_0_10px_rgba(110,211,182,0.9)]" />
          Moment
        </div>
        <span className="text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          Live
        </span>
      </div>

      <div className="min-h-[118px]">
        <div
          className="flex items-baseline gap-2 font-mono text-[54px] font-medium leading-none tracking-[-0.04em] text-ink sm:text-[64px]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <span>{time}</span>
          <span className="text-base font-normal text-ink-faint">
            {seconds}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
          <span>{date}</span>
          <span className="h-1 w-1 rounded-full bg-ink-faint" />
          <span>{weekday}</span>
        </div>
      </div>

      <div className="space-y-3 border-t border-black/5 pt-4 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <span className="truncate">{weather.location}</span>
          </span>
          <span className="shrink-0 text-sm font-medium text-ink">
            {weather.temperature}°C
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-ink-soft">
          <span>{weather.weather}</span>
          <span>湿度 {weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
}
