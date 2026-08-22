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
    let hourly = [];

    // Always fetch Open-Meteo for the 8 AM to 8 PM hourly forecast
    try {
        const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day&timezone=auto`;
        const res = await fetch(meteoUrl);
        if (res.ok) {
            const data = await res.json();
            
            // Get today's local date string to match
            const now = new Date();
            const todayStr = new Date(now.toLocaleString("en-US", {timeZone: data.timezone || "Asia/Kolkata"})).toDateString();
            
            let isPast8PM = false;
            if (now.getHours() > 20) {
                isPast8PM = true;
            }

            for (let idx = 0; idx < data.hourly.time.length; idx++) {
                const timeStr = data.hourly.time[idx];
                const date = new Date(timeStr);
                const dateStr = date.toDateString();
                const hour = date.getHours();
                
                // If it's past 8 PM, show tomorrow's 8 AM to 8 PM. Otherwise, show today's.
                if (isPast8PM && dateStr === todayStr) continue;
                
                // If hour is between 8 and 20 (inclusive) and we haven't collected 13 hours yet
                if (hour >= 8 && hour <= 20 && hourly.length < 13) {
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    let h12 = hour % 12;
                    h12 = h12 ? h12 : 12;
                    
                    const hCode = data.hourly.weather_code[idx];
                    const hIsDay = data.hourly.is_day[idx] === 1;
                    const hMapped = mapWmoCode(hCode, hIsDay);
                    
                    hourly.push({
                        time: `${h12} ${ampm}`,
                        temp: data.hourly.temperature_2m[idx],
                        icon: hMapped.icon,
                        description: hMapped.condition
                    });
                }
            }
            
            const code = data.current.weather_code;
            const isDay = data.current.is_day === 1;
            const { condition, icon } = mapWmoCode(code, isDay);

            finalData = {
              source: 'openmeteo',
              temp: data.current.temperature_2m,
              condition,
              description: condition,
              icon: icon,
              location: 'Loyola College',
              hourly,
              cachedAt: new Date().toISOString()
            };
        }
    } catch (e) {
        console.error('Failed to fetch from OpenMeteo', e);
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
