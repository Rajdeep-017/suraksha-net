// ─────────────────────────────────────────────────────────────
// Mock data layer — seeded records so every chart and table
// renders even without a live backend.
// ─────────────────────────────────────────────────────────────

export interface IncidentRecord {
    id: string;
    reporterName: string;
    contact: string;
    timestamp: string;
    location: string;
    lat: number;
    lng: number;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
    weather: string;
    roadCondition: string;
    status: 'Pending' | 'Reviewed' | 'Resolved';
    adminNote?: string;
    resolvedAt?: string;
    resolvedBy?: string;
}

export interface AccidentRow {
    id: number;
    timestamp: string;
    city: string;
    location: string;
    lat: number;
    lng: number;
    weather: string;
    weatherSeverity: number;
    roadCondition: string;
    timeBin: string;
    dayNight: string;
    trafficDensity: number;
    fatalities: number;
    seriousInjuries: number;
    minorInjuries: number;
    riskScore: number;
}

// ── Seeded accident rows (Pune area) ─────────────────────────
const LOCATIONS = [
    'Hinjewadi Phase 1', 'Katraj Bypass', 'Sinhagad Road', 'Pune Station',
    'Kothrud', 'Hadapsar', 'Viman Nagar', 'Baner', 'Wakad', 'Aundh',
    'Shivajinagar', 'Deccan Gymkhana', 'Magarpatta', 'Koregaon Park',
    'Pimpri-Chinchwad', 'Nigdi', 'Bhosari', 'Yerawada', 'Kharadi', 'Wagholi',
];

const WEATHERS = ['Clear', 'Rainy', 'Foggy', 'Cloudy', 'Stormy'];
const ROAD_CONDITIONS = ['Dry', 'Wet', 'Slippery', 'Potholed', 'Under Construction', 'Good'];
const TIME_BINS = ['Morning Rush', 'Midday', 'Afternoon', 'Evening Rush', 'Night', 'Late Night'];
const DAY_NIGHTS = ['Daytime', 'Nighttime'];

function seededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

const rng = seededRandom(42);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

export const ACCIDENT_DATA: AccidentRow[] = Array.from({ length: 200 }, (_, i) => {
    const month = randInt(1, 12);
    const day = randInt(1, 28);
    const hour = randInt(0, 23);
    return {
        id: i + 1,
        timestamp: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(randInt(0, 59)).padStart(2, '0')}:00`,
        city: 'Pune',
        location: pick(LOCATIONS),
        lat: 18.45 + rng() * 0.15,
        lng: 73.75 + rng() * 0.2,
        weather: pick(WEATHERS),
        weatherSeverity: randInt(1, 5),
        roadCondition: pick(ROAD_CONDITIONS),
        timeBin: pick(TIME_BINS),
        dayNight: pick(DAY_NIGHTS),
        trafficDensity: randInt(1, 10),
        fatalities: rng() > 0.85 ? randInt(1, 3) : 0,
        seriousInjuries: rng() > 0.6 ? randInt(1, 4) : 0,
        minorInjuries: randInt(0, 6),
        riskScore: Math.round((rng() * 80 + 10) * 10) / 10,
    };
});

// ── KPI helpers ──────────────────────────────────────────────
export const TOTAL_ACCIDENTS = ACCIDENT_DATA.length;
export const TOTAL_FATALITIES = ACCIDENT_DATA.reduce((s, r) => s + r.fatalities, 0);
export const AVG_RISK_SCORE = Math.round(ACCIDENT_DATA.reduce((s, r) => s + r.riskScore, 0) / TOTAL_ACCIDENTS * 10) / 10;

const locationRisk = ACCIDENT_DATA.reduce<Record<string, { sum: number; count: number }>>((acc, r) => {
    if (!acc[r.location]) acc[r.location] = { sum: 0, count: 0 };
    acc[r.location].sum += r.riskScore;
    acc[r.location].count++;
    return acc;
}, {});
export const HIGHEST_RISK_ZONE = Object.entries(locationRisk)
    .map(([loc, { sum, count }]) => ({ location: loc, avgRisk: sum / count }))
    .sort((a, b) => b.avgRisk - a.avgRisk)[0];

// ── Top 10 dangerous locations ───────────────────────────────
export const TOP_10_LOCATIONS = Object.entries(locationRisk)
    .map(([loc, { sum, count }]) => {
        const rows = ACCIDENT_DATA.filter(r => r.location === loc);
        const fatalities = rows.reduce((s, r) => s + r.fatalities, 0);
        const weatherCounts: Record<string, number> = {};
        const timeBinCounts: Record<string, number> = {};
        rows.forEach(r => {
            weatherCounts[r.weather] = (weatherCounts[r.weather] || 0) + 1;
            timeBinCounts[r.timeBin] = (timeBinCounts[r.timeBin] || 0) + 1;
        });
        const dominantWeather = Object.entries(weatherCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        const dominantTimeBin = Object.entries(timeBinCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        return {
            location: loc,
            avgRisk: Math.round(sum / count * 10) / 10,
            totalAccidents: count,
            totalFatalities: fatalities,
            dominantWeather,
            dominantTimeBin,
        };
    })
    .sort((a, b) => b.avgRisk - a.avgRisk)
    .slice(0, 10);

// ── Chart data ───────────────────────────────────────────────
export const ACCIDENTS_BY_TIME_BIN = TIME_BINS.map(bin => ({
    name: bin,
    count: ACCIDENT_DATA.filter(r => r.timeBin === bin).length,
}));

export const RISK_DISTRIBUTION = (() => {
    const bins = [
        { range: '0-10', min: 0, max: 10 },
        { range: '10-20', min: 10, max: 20 },
        { range: '20-30', min: 20, max: 30 },
        { range: '30-40', min: 30, max: 40 },
        { range: '40-50', min: 40, max: 50 },
        { range: '50-60', min: 50, max: 60 },
        { range: '60-70', min: 60, max: 70 },
        { range: '70-80', min: 70, max: 80 },
        { range: '80-90', min: 80, max: 90 },
        { range: '90-100', min: 90, max: 100 },
    ];
    return bins.map(b => ({
        range: b.range,
        count: ACCIDENT_DATA.filter(r => r.riskScore >= b.min && r.riskScore < b.max).length,
    }));
})();

export const WEATHER_VS_RISK = WEATHERS.map(w => {
    const rows = ACCIDENT_DATA.filter(r => r.weather === w);
    return {
        weather: w,
        avgRisk: rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.riskScore, 0) / rows.length * 10) / 10 : 0,
    };
});

export const FATALITIES_BY_MONTH = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const rows = ACCIDENT_DATA.filter(r => parseInt(r.timestamp.slice(5, 7)) === month);
    return {
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        fatalities: rows.reduce((s, r) => s + r.fatalities, 0),
        accidents: rows.length,
    };
});

export const TRAFFIC_VS_RISK = ACCIDENT_DATA.map(r => ({
    trafficDensity: r.trafficDensity,
    riskScore: r.riskScore,
}));

export const ROAD_CONDITION_BREAKDOWN = ROAD_CONDITIONS.map(rc => ({
    name: rc,
    value: ACCIDENT_DATA.filter(r => r.roadCondition === rc).length,
}));

// ── Model monitoring ─────────────────────────────────────────
export const MODEL_METRICS = {
    type: 'Random Forest Classifier',
    trainingDate: '2026-02-22',
    trainingRows: 1842,
    featureCount: 15,
    accuracy: 0.8835,
    precision: 0.8848,
    recall: 0.8827,
    f1: 0.8834,
};

export const FEATURE_IMPORTANCE = [
    { feature: 'casualty_severity_idx', importance: 0.2185 },
    { feature: 'weather_road_risk', importance: 0.1340 },
    { feature: 'Fatalities', importance: 0.1184 },
    { feature: 'Road_Condition_enc', importance: 0.0814 },
    { feature: 'road_risk_num', importance: 0.0795 },
    { feature: 'total_casualties', importance: 0.0770 },
    { feature: 'Serious_Injuries', importance: 0.0562 },
    { feature: 'Traffic_Density', importance: 0.0520 },
    { feature: 'Weather_Severity', importance: 0.0477 },
    { feature: 'Weather_enc', importance: 0.0406 },
    { feature: 'Time_Bin_enc', importance: 0.0268 },
    { feature: 'time_risk_num', importance: 0.0254 },
    { feature: 'Minor_Injuries', importance: 0.0240 },
    { feature: 'Day_Night_enc', importance: 0.0101 },
    { feature: 'is_night', importance: 0.0084 },
];

export const CONFUSION_MATRIX = {
    labels: ['Low', 'Medium', 'High'],
    matrix: [
        [120, 4, 1],
        [14, 106, 4],
        [2, 18, 100],
    ],
};

export const WEEKLY_ACCURACY = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    accuracy: 0.85 + (seededRandom(i + 100)() * 0.08 - 0.03),
}));

// ── Seeded incidents ─────────────────────────────────────────
const INCIDENT_DESCS = [
    'Two-wheeler skidded on wet road near junction',
    'Head-on collision between truck and autorickshaw',
    'Pedestrian hit at unmarked crossing',
    'Chain collision involving 4 vehicles during heavy fog',
    'Pothole caused bike to lose control',
    'Overspeeding car hit divider on flyover',
    'Bus brake failure on downhill slope',
    'Hit and run case reported by passerby',
    'Drunk driving led to collision with parked vehicles',
    'Road cave-in caused accident during monsoon',
];

const STATUSES: IncidentRecord['status'][] = ['Pending', 'Reviewed', 'Resolved'];

export const SEEDED_INCIDENTS: IncidentRecord[] = Array.from({ length: 15 }, (_, i) => ({
    id: `INC-${String(1000 + i)}`,
    reporterName: `Reporter ${i + 1}`,
    contact: `+91 98${randInt(10000000, 99999999)}`,
    timestamp: `2026-02-${String(randInt(1, 21)).padStart(2, '0')}T${String(randInt(6, 23)).padStart(2, '0')}:${String(randInt(0, 59)).padStart(2, '0')}:00`,
    location: pick(LOCATIONS),
    lat: 18.45 + rng() * 0.15,
    lng: 73.75 + rng() * 0.2,
    severity: pick(['Low', 'Medium', 'High'] as const),
    description: pick(INCIDENT_DESCS),
    weather: pick(WEATHERS),
    roadCondition: pick(ROAD_CONDITIONS),
    status: pick(STATUSES),
}));

// ── Correlation insights ─────────────────────────────────────
const foggySlippery = ACCIDENT_DATA.filter(r => r.weather === 'Foggy' && r.roadCondition === 'Slippery');
const otherRows = ACCIDENT_DATA.filter(r => !(r.weather === 'Foggy' && r.roadCondition === 'Slippery'));
const foggySlipperyAvg = foggySlippery.length > 0 ? foggySlippery.reduce((s, r) => s + r.riskScore, 0) / foggySlippery.length : 0;
const otherAvg = otherRows.length > 0 ? otherRows.reduce((s, r) => s + r.riskScore, 0) / otherRows.length : 1;
const foggyMultiplier = otherAvg > 0 ? (foggySlipperyAvg / otherAvg).toFixed(1) : '?';

const lateNightFatalities = ACCIDENT_DATA.filter(r => r.timeBin === 'Late Night').reduce((s, r) => s + r.fatalities, 0);
const lateNightPct = TOTAL_FATALITIES > 0 ? Math.round(lateNightFatalities / TOTAL_FATALITIES * 100) : 0;

export const CORRELATION_INSIGHTS = [
    `Foggy + Slippery roads produce ${foggyMultiplier}x higher Risk Score than average conditions.`,
    `${lateNightPct}% of all fatalities occur during the Late Night time bin.`,
    `Nighttime accidents account for ${Math.round(ACCIDENT_DATA.filter(r => r.dayNight === 'Nighttime').length / TOTAL_ACCIDENTS * 100)}% of all incidents.`,
    `Potholed roads have ${Math.round(ACCIDENT_DATA.filter(r => r.roadCondition === 'Potholed').reduce((s, r) => s + r.riskScore, 0) / Math.max(1, ACCIDENT_DATA.filter(r => r.roadCondition === 'Potholed').length))} avg risk score — highest among road conditions.`,
];
