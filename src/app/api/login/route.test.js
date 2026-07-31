import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { db } from '@/lib/db';
import { encrypt } from '@/utils/crypto';

vi.mock('@/lib/db', () => ({
    db: {
        setting: { findUnique: vi.fn() },
        user: { findUnique: vi.fn(), upsert: vi.fn() }
    }
}));

vi.mock('@/utils/crypto', () => ({
    encrypt: vi.fn((val) => 'encrypted_' + val)
}));

vi.mock('axios', () => {
    const postMock = vi.fn().mockResolvedValue({ data: 'mock HTML data' });
    const getMock = vi.fn().mockResolvedValue({ data: 'mock HTML data' });
    return {
        default: {
            create: vi.fn(() => ({
                post: postMock,
                get: getMock
            }))
        }
    };
});

vi.mock('axios-cookiejar-support', () => ({
    wrapper: vi.fn((client) => {
        client.post = vi.fn().mockResolvedValue({ data: 'Welcome User' }); // successful login HTML
        client.get = vi.fn().mockResolvedValue({ data: 'mock' });
        return client;
    })
}));

vi.mock('tough-cookie', () => {
    return {
        CookieJar: class {
            getCookies() {
                return Promise.resolve([{ key: 'JSESSIONID', value: '12345' }]);
            }
        }
    };
});

describe('POST /api/login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 for missing credentials', async () => {
        const req = new Request('http://localhost/api/login', {
            method: 'POST',
            body: JSON.stringify({})
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toMatch(/Valid username and password required/);
    });

    it('should reject extremely long strings', async () => {
        const req = new Request('http://localhost/api/login', {
            method: 'POST',
            body: JSON.stringify({ username: 'a'.repeat(200), password: 'password123' })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('should successfully authenticate and set cookies', async () => {
        db.setting.findUnique.mockResolvedValue({ value: 'BLACKLIST' });
        db.user.findUnique.mockResolvedValue(null); // new user
        
        const req = new Request('http://localhost/api/login', {
            method: 'POST',
            body: JSON.stringify({ username: '22UCA101', password: 'password123', stayLoggedIn: true })
        });
        
        const res = await POST(req);
        expect(res.status).toBe(200);
        
        const data = await res.json();
        expect(data.success).toBe(true);
        
        const cookies = res.headers.get('set-cookie');
        expect(cookies).toContain('JSESSIONID=12345');
        expect(cookies).toContain('ERP_USERNAME=22UCA101');
    });

    it('should block users in WHITELIST mode if not approved', async () => {
        db.setting.findUnique.mockResolvedValue({ value: 'WHITELIST' });
        db.user.findUnique.mockResolvedValue(null);
        
        const req = new Request('http://localhost/api/login', {
            method: 'POST',
            body: JSON.stringify({ username: '22UCA101', password: 'password123' })
        });
        
        const res = await POST(req);
        expect(res.status).toBe(403);
    });
});
