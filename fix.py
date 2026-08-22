import re
import sys

with open('src/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <div className="dash-left-col" ...>
content = content.replace(
    '<div className="dash-left-col" style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>',
    '<div className="dash-left-col" style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>'
)

# Actually, I'll just restore the original globals.css and use the mobile-only / desktop-only classes to add the horizontal timeline cleanly without breaking his existing working phone layout.
