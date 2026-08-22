import re

with open('scratch.js', 'r', encoding='utf-8') as f:
    content = f.read()

grid_start = content.find('<div className="dashboard-grid">')
main_end = content.find('</main>', grid_start)

# 1. Remove dash-left-col
new_grid = '''<div className="dashboard-grid">
    {/* --- TOP ROW: 3 Widgets --- */}
    <div className="top-widgets-row">
        <div className="mobile-pw-row">
'''

pending_start = content.find('{/* Finance Snapshot Widget with Reminders inside */}')
pending_end = content.find('</div>\n                    </div>\n\n                    {/* Weather & Day Overview Widget (Calendar) */}', pending_start)
if pending_end == -1:
    pending_end = content.find('{/* Weather', pending_start)

weather_start = content.find('{/* Weather & Day Overview Widget (Calendar) */}')
weather_end = content.find('</div>\n        </div>\n\n        {/* Attendance Snapshot Widget */}', weather_start)
if weather_end == -1:
    weather_end = content.find('{/* Attendance', weather_start)
    if weather_end != -1:
        # Step back to the outer div
        weather_end = content.rfind('</div>', weather_start, weather_end) + 6

attendance_start = content.find('{/* Attendance Snapshot Widget */}')
attendance_end = content.find('{/* Current Period Banner */}', attendance_start)
if attendance_end != -1:
    attendance_end = content.rfind('</div>', attendance_start, attendance_end) + 6

cp_start = content.find('{/* Current Period Banner */}')
cp_end = content.find('    {/* Right Sidebar', cp_start)
if cp_end == -1:
    cp_end = content.find('    <div className="dash-right-col"', cp_start)

map_start = content.find('{todaysClasses.map((cls, idx) => {')
map_end = content.find('</div>\n                        </div>\n                    </div>\n                ) : (', map_start)

# We need to clean the snippets
pending_str = content[pending_start:pending_end]
weather_str = content[weather_start:weather_end]
attendance_str = content[attendance_start:attendance_end]
cp_str = content[cp_start:cp_end]
map_str = content[map_start:map_end]

top_widgets = pending_str + '\n' + weather_str + '\n        </div>\n' + attendance_str + '\n    </div>\n'
middle_row = '\n    {/* --- MIDDLE ROW: Current Period --- */}\n' + cp_str + '\n'

desktop_timeline = '''
            {/* Desktop Horizontal Timeline */}
            <div className="desktop-timeline" style={{ position: 'relative', width: '100%', padding: '2rem 0', marginTop: '1rem' }}>
                <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '2px', background: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%)', zIndex: 1 }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', position: 'relative', zIndex: 2 }}>
                    {todaysClasses.map((cls, idx) => {
                        let isCurrent = false;
                        const timeStr = timetableData.timings?.[cls.period];
                        if (timeStr && currentTime) {
                            const [startStr, endStr] = timeStr.split(' - ');
                            if (startStr && endStr) {
                                const [sh, sm] = startStr.split(':').map(Number);
                                const [eh, em] = endStr.split(':').map(Number);
                                const startMinutes = sh * 60 + sm;
                                const endMinutes = eh * 60 + em;
                                const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                                if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
                                    isCurrent = true;
                                }
                            }
                        }

                        return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flex: 1, padding: '0 0.5rem' }}>
                                <div style={{ textAlign: 'center', minHeight: '40px' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: isCurrent ? '#60a5fa' : 'white', marginBottom: '0.25rem' }}>{cls.subject}</div>
                                </div>
                                
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '50%', 
                                    background: 'rgba(15, 23, 42, 1)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    boxShadow: isCurrent ? '0 0 0 4px rgba(15, 23, 42, 1), 0 0 12px rgba(59, 130, 246, 0.6)' : '0 0 0 4px rgba(15, 23, 42, 1)'
                                }}>
                                    <div style={{
                                        width: '100%', height: '100%', borderRadius: '50%',
                                        background: isCurrent ? 'linear-gradient(135deg, var(--primary), #2563eb)' : 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.05))',
                                        border: isCurrent ? '1px solid #93c5fd' : '1px solid rgba(59,130,246,0.3)',
                                        color: isCurrent ? 'white' : '#60a5fa', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '800', fontSize: '1rem',
                                        boxShadow: isCurrent ? 'inset 0 2px 4px rgba(255,255,255,0.3)' : 'none'
                                    }}>
                                        {cls.period}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', color: isCurrent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        {timeStr}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
'''

mobile_timeline = '''
            {/* Mobile Vertical Timeline */}
            <div className="mobile-timeline" style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <div style={{ position: 'absolute', top: '18px', bottom: '18px', left: '17px', width: '2px', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
''' + map_str + '''
                </div>
            </div>
'''

bottom_row = '''
    {/* --- BOTTOM ROW: Today's Classes --- */}
    <div style={{ width: '100%' }}>
        {todaysClasses.length > 0 ? (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: '0 0 1.5rem 0' }}>Today&apos;s Classes</h2>
                ''' + desktop_timeline + mobile_timeline + '''
            </div>
        ) : (
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: '0 0 1.5rem 0', textAlign: 'left' }}>Today&apos;s Classes</h2>
                {todayCalendar?.day_order ? 'Loading classes...' : 'Enjoy your day off!'}
            </div>
        )}
    </div>
'''

final_grid = new_grid + top_widgets + middle_row + bottom_row + '</div>\n'

new_content = content[:grid_start] + final_grid + content[main_end:]

with open('src/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Rewrote page.js")
