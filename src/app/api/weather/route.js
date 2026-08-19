import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function mapWmoCode(code, isDay = true) {
    let condition = 'Clear';
    let icon = isDay ? '01d' : '01n';
    
    if (code === 0) { condition = 'Clear'; icon = isDay ? '01d' : '01n'; }
    else if (code >= 1 && code <= 3) { condition = 'Cloudy'; icon = isDay ? '02d' : '02n'; }
    else if (code >= 45 && code <= 48) { condition = 'Fog'; icon = '50d'; }
    else if (code >= 51 && code <= 67) { condition = 'Rain'; icon = '09d'; }
    else if (code >= 71 && code <= 77) { condition = 'Snow'; icon = '13d'; }
    else if (code >= 80 && code <= 82) { condition = 'Showers'; icon = '09d'; }
    else if (code >= 95) { condition = 'Thunderstorm'; icon = '11d'; }

    return { condition, icon };
}

export async function GET(request) {
  try {
    const lat = 13.0604; // Loyola College / Nungambakkam roughly
    const lon = 80.2319;
    
    // Check Database Cache First
    const CACHE_KEY = 'GLOBAL_WEATHER_CACHE';
    try {
        const cachedSetting = await db.setting.findUnique({
            where: { key: CACHE_KEY }
        });

        if (cachedSetting) {
            const ageMs = Date.now() - cachedSetting.updatedAt.getTime();
            if (ageMs < 60 * 60 * 1000) { // 1 hour
                console.log('[Weather API] Serving from global database cache');
                const data = JSON.parse(cachedSetting.value);
                return NextResponse.json(data);
            }
        }
    } catch (e) {
        console.error('[Weather API] Error reading cache from DB', e);
    }

    let finalData = null;

    // Fetch from OpenWeather if the API key is present
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      const [currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
      ]);

      if (currentRes.ok && forecastRes.ok) {
        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();
        
        const hourly = forecastData.list
          .slice(0, 8) // Next 24 hours (8 points of 3-hour intervals)
          .map(item => {
             const date = new Date(item.dt * 1000);
             let hours = date.getHours();
             const ampm = hours >= 12 ? 'PM' : 'AM';
             hours = hours % 12;
             hours = hours ? hours : 12;
             const timeStr = `${hours} ${ampm}`;
             
             return {
                 time: timeStr,
                 temp: item.main.temp,
                 icon: item.weather[0].icon,
                 description: item.weather[0].main
             };
          });

        finalData = {
          source: 'openweather',
          temp: currentData.main.temp,
          condition: currentData.weather[0].main,
          description: currentData.weather[0].description,
          icon: currentData.weather[0].icon,
          location: currentData.name,
          hourly,
          cachedAt: new Date().toISOString()
        };
      }
    }

    // Fallback to Open-Meteo if no finalData yet
    if (!finalData) {
      const fallbackUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day&timezone=auto`;
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        const data = await res.json();
        const code = data.current.weather_code;
        const isDay = data.current.is_day === 1;
        const { condition, icon } = mapWmoCode(code, isDay);
        
        const currentHourIdx = data.hourly.time.findIndex(t => new Date(t) >= new Date());
        const hourly = [];
        
        if (currentHourIdx !== -1) {
            for (let i = 0; i < 8; i++) {
                const idx = currentHourIdx + (i * 3); // every 3 hours
                if (idx < data.hourly.time.length) {
                    const date = new Date(data.hourly.time[idx]);
                    let hours = date.getHours();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    
                    const hCode = data.hourly.weather_code[idx];
                    const hIsDay = data.hourly.is_day[idx] === 1;
                    const hMapped = mapWmoCode(hCode, hIsDay);
                    
                    hourly.push({
                        time: `${hours} ${ampm}`,
                        temp: data.hourly.temperature_2m[idx],
                        icon: hMapped.icon,
                        description: hMapped.condition
                    });
                }
            }
        }

        finalData = {
          source: 'openmeteo',
          temp: data.current.temperature_2m,
          condition,
          description: condition,
          icon: icon,
          location: 'Loyola College (Fallback)',
          hourly,
          cachedAt: new Date().toISOString()
        };
      }
    }

    if (finalData) {
        // Save to Database Cache
        try {
            await db.setting.upsert({
                where: { key: CACHE_KEY },
                update: { value: JSON.stringify(finalData) },
                create: { key: CACHE_KEY, value: JSON.stringify(finalData) }
            });
            console.log('[Weather API] Fetched fresh data and updated global database cache');
        } catch (e) {
            console.error('[Weather API] Error writing cache to DB', e);
        }
        
        return NextResponse.json(finalData);
    }

    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  } catch (error) {
    console.error('[Weather API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
