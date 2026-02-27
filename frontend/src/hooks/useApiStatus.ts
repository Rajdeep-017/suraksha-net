import { useState, useEffect, useCallback } from 'react';
import { safetyApi } from '../api/client';
import type { PredictRiskRequest, PredictRiskResponse, NavigateSafeRequest, NavigateSafeResponse, HealthResponse } from '../api/client';

// ── Health status hook ────────────────────────────────────────────────────────
/**
 * Polls GET /api/health every 30 seconds.
 * Returns the current online status and whether ML models are loaded.
 */
export function useApiHealth() {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [online, setOnline] = useState<boolean | null>(null); // null = unknown yet

    const check = useCallback(async () => {
        try {
            const res = await safetyApi.health();
            setHealth(res.data);
            setOnline(true);
        } catch {
            setHealth(null);
            setOnline(false);
        }
    }, []);

    // Check on mount, then every 30 s
    useEffect(() => {
        check();
        const interval = setInterval(check, 30_000);
        return () => clearInterval(interval);
    }, [check]);

    return { health, online, refetch: check };
}

// ── Predict risk for a single point ──────────────────────────────────────────
/**
 * POST /api/predict-risk
 * Returns { risk_level, risk_score } for a lat/lng coordinate.
 */
export function usePredictRisk() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictRiskResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const predictRisk = useCallback(async (payload: PredictRiskRequest) => {
        setLoading(true);
        setError(null);
        try {
            const res = await safetyApi.predictRisk(payload);
            setResult(res.data);
            return res.data;
        } catch (err: any) {
            const msg =
                err?.response?.data?.detail ||
                err?.message ||
                'Prediction failed. Are ML models loaded?';
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { predictRisk, loading, result, error };
}

// ── Navigate safe (Mappls multi-route ranking) ────────────────────────────────
/**
 * POST /api/navigate-safe
 * Returns the safest route + alternatives ranked by a weighted risk score.
 * Requires a MAPPLS_API_KEY in the backend .env.
 */
export function useNavigateSafe() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<NavigateSafeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const navigateSafe = useCallback(async (payload: NavigateSafeRequest) => {
        setLoading(true);
        setError(null);
        try {
            const res = await safetyApi.navigateSafe(payload);
            setResult(res.data);
            return res.data;
        } catch (err: any) {
            const msg =
                err?.response?.data?.detail ||
                err?.message ||
                'Navigation failed. Check MAPPLS_API_KEY in backend .env.';
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { navigateSafe, loading, result, error };
}
