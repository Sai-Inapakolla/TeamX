// --------------------------------------------------------------------------
// TeamX Benchmark — Shared k6 Configuration
// --------------------------------------------------------------------------
// Usage:  import { BASE_URL, NUM_TENANTS, ... } from '../config.js';
// --------------------------------------------------------------------------

export const BASE_URL       = __ENV.BASE_URL || 'http://localhost:8080/api/v1';
export const NUM_TENANTS    = parseInt(__ENV.NUM_TENANTS || '50', 10);
export const BENCH_PASSWORD = __ENV.BENCH_PASSWORD || 'benchmark123';

/**
 * Returns the email address for the benchmark user of tenant `index` (1-based).
 */
export function benchEmail(index) {
    return `bench-user-${index}@teamx.test`;
}

// Default thresholds (can be overridden per-scenario)
export const DEFAULT_THRESHOLDS = {
    http_req_duration: ['p(95)<500', 'p(50)<200'],
    http_req_failed:   ['rate<0.01'],
};
