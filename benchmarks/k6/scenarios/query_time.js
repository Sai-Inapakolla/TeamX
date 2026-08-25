// --------------------------------------------------------------------------
// TeamX Benchmark — Query Time Measurement
// --------------------------------------------------------------------------
// Measures p50 / p95 latency for the core read endpoints:
//   GET /projects          (list all projects for a tenant)
//   GET /projects/{id}/tasks  (list tasks for a project)
//
// Run:  k6 run benchmarks/k6/scenarios/query_time.js
// --------------------------------------------------------------------------

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js';
import { BASE_URL } from '../config.js';
import { login, authHeaders } from '../helpers.js';

// ── Custom Metrics ──────────────────────────────────────────────────────────
const projectQueryTime = new Trend('project_query_ms', true);
const taskQueryTime    = new Trend('task_query_ms',    true);
const errorRate        = new Rate('query_errors');
const totalQueries     = new Counter('total_queries');

// ── Scenario Config ─────────────────────────────────────────────────────────
export const options = {
    scenarios: {
        query_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s',  target: 10 },   // warm-up
                { duration: '2m',   target: 10 },   // sustained baseline
                { duration: '30s',  target: 50 },   // spike ramp
                { duration: '1m',   target: 50 },   // spike sustained
                { duration: '30s',  target: 0  },   // cool-down
            ],
        },
    },
    thresholds: {
        'project_query_ms': ['p(95)<500', 'p(50)<200'],
        'task_query_ms':    ['p(95)<500', 'p(50)<200'],
        'query_errors':     ['rate<0.01'],
    },
};

// ── Setup (runs once: authenticate all benchmark tenants) ───────────────────
export function setup() {
    // Pre-login 50 tenants; each VU will pick one by index
    const tokens = [];
    for (let i = 1; i <= 50; i++) {
        const res = login(i);
        tokens.push(res ? res.accessToken : null);
    }
    const valid = tokens.filter(Boolean).length;
    console.log(`Setup complete — ${valid}/50 tenants authenticated`);
    return { tokens };
}

// ── Main VU loop ────────────────────────────────────────────────────────────
export default function (data) {
    const idx   = (__VU - 1) % data.tokens.length;
    const token = data.tokens[idx];
    if (!token) return;                       // skip if login failed

    const hdrs = authHeaders(token);

    // ── GET /projects ───────────────────────────────────────────────────
    group('GET /projects', () => {
        const res = http.get(`${BASE_URL}/projects`, {
            headers: hdrs,
            tags: { name: 'ListProjects' },
        });

        const ok = check(res, { 'projects 200': (r) => r.status === 200 });
        projectQueryTime.add(res.timings.duration);
        errorRate.add(!ok);
        totalQueries.add(1);
    });

    sleep(0.3);

    // ── GET /projects/{id}/tasks ────────────────────────────────────────
    group('GET /projects/{id}/tasks', () => {
        // Fetch project list to get a real project ID
        const listRes = http.get(`${BASE_URL}/projects`, { headers: hdrs });
        if (listRes.status === 200) {
            const projects = JSON.parse(listRes.body);
            if (projects && projects.length > 0) {
                // Pick a random project to avoid caching bias
                const proj = projects[Math.floor(Math.random() * projects.length)];
                const taskRes = http.get(
                    `${BASE_URL}/projects/${proj.id}/tasks`,
                    { headers: hdrs, tags: { name: 'ListTasks' } }
                );

                const ok = check(taskRes, { 'tasks 200': (r) => r.status === 200 });
                taskQueryTime.add(taskRes.timings.duration);
                errorRate.add(!ok);
                totalQueries.add(1);
            }
        }
    });

    sleep(0.5);
}

// ── Summary Handler (exports JSON results) ──────────────────────────────────
export function handleSummary(data) {
    const ts   = new Date().toISOString().replace(/[:.]/g, '-');
    const file = `results/query_time_${ts}.json`;
    return {
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
        [file]: JSON.stringify(data, null, 2),
    };
}
