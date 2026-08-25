// --------------------------------------------------------------------------
// TeamX Benchmark — k6 Auth & Request Helpers
// --------------------------------------------------------------------------

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, BENCH_PASSWORD, benchEmail } from './config.js';

/**
 * Authenticate as the benchmark user for `tenantIndex` (1-based).
 * Returns the full login response body (parsed JSON) or null on failure.
 */
export function login(tenantIndex) {
    const payload = JSON.stringify({
        email:    benchEmail(tenantIndex),
        password: BENCH_PASSWORD,
    });

    const res = http.post(`${BASE_URL}/auth/login`, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags:    { name: 'Login' },
    });

    const ok = check(res, {
        'login status 200': (r) => r.status === 200,
    });

    if (!ok) {
        console.error(
            `Login failed for tenant ${tenantIndex} (${benchEmail(tenantIndex)}): ` +
            `status=${res.status} body=${res.body}`
        );
        return null;
    }

    return JSON.parse(res.body);
}

/**
 * Build an Authorization + Content-Type headers object for authenticated requests.
 */
export function authHeaders(accessToken) {
    return {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };
}
