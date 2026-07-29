import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function useTabState(key, defaultValue) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [activeTab, setLocalTab] = useState(searchParams.get(key) || defaultValue);

    const setActiveTab = (newTab) => {
        setLocalTab(newTab);
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, newTab);
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    };
    
    return [activeTab, setActiveTab];
}
