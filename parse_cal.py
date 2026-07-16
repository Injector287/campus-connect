import json
import re

def parse_calendar(input_file, output_file):
    events = []
    
    # Regex to match Date, Day, Event (optional), and Day Order (optional)
    pattern = re.compile(
        r'^(?P<date>\d{2}\.\d{2}\.\d{4})\s+'
        r'(?P<day>[A-Z]{3})'
        r'(?:\s+(?P<rest>.*))?$'
    )
    
    day_order_pattern = re.compile(r'(?P<day_order>W(?P<week_num>\d+)\s+Day\s*-\s*\d+|Day\s*-\s*\d+|Day\s+\d+|\*)$')
    day_num_pattern = re.compile(r'Day\s*-?\s*(\d+)')

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    current_week = None
        
    for line in lines:
        line = line.strip()
        if not line or line.isupper() and not line.startswith(('0','1','2','3')): 
            continue
            
        match = pattern.match(line)
        if match:
            date_str = match.group('date')
            day_str = match.group('day')
            rest = match.group('rest') or ''
            
            event_str = ''
            day_order_str = ''
            day_order_int = None
            
            do_match = day_order_pattern.search(rest)
            if do_match:
                day_order_str = do_match.group('day_order')
                event_str = rest[:do_match.start()].strip()
                if do_match.group('week_num'):
                    current_week = int(do_match.group('week_num'))
            else:
                event_str = rest.strip()
                
            is_holiday = day_order_str == '*'
            is_working_day = bool(day_order_str) and not is_holiday
            
            if is_working_day:
                num_match = day_num_pattern.search(day_order_str)
                if num_match:
                    day_order_int = int(num_match.group(1))
            
            events.append({
                'date': date_str,
                'day': day_str,
                'event': event_str if event_str else None,
                'is_working_day': is_working_day,
                'is_holiday': is_holiday,
                'week': current_week,
                'day_order': day_order_int
            })

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=4)

if __name__ == '__main__':
    parse_calendar('calendar_raw.txt', 'calendar.json')
