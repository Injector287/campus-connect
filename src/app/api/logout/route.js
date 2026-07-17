import { NextResponse } from 'next/server';

export async function POST(request) {
    const response = NextResponse.json({ success: true });
    
    // Clear JSESSIONID
    response.cookies.set({
        name: 'JSESSIONID',
        value: '',
        expires: new Date(0),
        path: '/'
    });

    // Clear ERP_CREDS
    response.cookies.set({
        name: 'ERP_CREDS',
        value: '',
        expires: new Date(0),
        path: '/'
    });

    return response;
}
