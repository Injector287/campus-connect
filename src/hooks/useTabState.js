import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function useTabState(key, defaultValue) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const activeTab = searchParams.get(key) || defaultValue;
    
    const setActiveTab = (newTab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, newTab);
        // use router.replace to avoid cluttering history
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };
    
    return [activeTab, setActiveTab];
}
