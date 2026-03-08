// Basic service to fetch FII/DII data
// In a real production app, this would scrape NSE or use a paid API.
// For now, we will simulate realistic data or fetch simple JSON if available.

export interface InstitutionalFlow {
    category: 'FII' | 'DII';
    date: string;
    buyValue: number; // In Crores
    sellValue: number; // In Crores
    netValue: number; // In Crores
}

export async function getInstitutionalFlow(): Promise<InstitutionalFlow[]> {
    // Simulating data for now as public APIs for real-time FII/DII are scarce without auth
    // In a real scenario, we would hit an endpoint like: https://www.nseindia.com/api/fiidii

    const today = new Date().toISOString().split('T')[0];

    return [
        {
            category: 'FII',
            date: today,
            buyValue: 12450.50,
            sellValue: 13100.20,
            netValue: -649.70
        },
        {
            category: 'DII',
            date: today,
            buyValue: 9800.00,
            sellValue: 8500.00,
            netValue: 1300.00
        }
    ];
}

// Helper to determine if a specific stock is likely seeing institutional action
// based on volume spikes (integrated later with volume analysis)
export function checkInstitutionalInterest(symbol: string): 'HIGH' | 'MODERATE' | 'LOW' {
    // Placeholder logic: in real app, check block deals or volume > 5x avg
    const heavyHitters = ['RELIANCE', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TCS'];
    if (heavyHitters.includes(symbol.replace('.NS', ''))) return 'HIGH';
    return 'MODERATE';
}
