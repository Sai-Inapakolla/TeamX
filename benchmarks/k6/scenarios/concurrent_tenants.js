// --------------------------------------------------------------------------
// TeamX Benchmark — Concurrent Tenants
// --------------------------------------------------------------------------
// Proves N tenants can operate simultaneously with full CRUD operations
// and no errors.  Each VU acts as a unique tenant's admin:
//   1. Lists projects   (read)
//   2. Lists tasks      (read)
//   3. Creates a project (write)
//   4. Creates a task    (write)
//
// Run:  k6 run benchmarks/k6/scenarios/concurrent_tenants.js
// --------------------------------------------------------------------------

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js';
import { BASE_URL, NUM_TENANTS } from '../config.js';
import { login, authHeaders } from '../helpers.js';

// ── Custom Metrics ──────────────────────────────────────────────────────────
const tenantsServed     = new Counter('tenants_served');
const concurrentErrors  = new Rate('concurrent_errors');
const iterationDuration = new Trend('iteration_duration_ms', true);

// ── Scenario Config ─────────────────────────────────────────────────────────
export const options = {
    scenarios: {
        all_tenants: {
            executor:  'constant-vus',
            vus:       NUM_TENANTS,   // 50 VUs = 50 tenants
            duration:  '3m',
        },
    },
    thresholds: {
        'concurrent_errors': ['rate<0.01'],
        'tenants_served':    [`count>=${NUM_TENANTS}`],
    },
};

// ── Setup ───────────────────────────────────────────────────────────────────
export function setup() {
    const tokens = [];
    for (let i = 1; i <= NUM_TENANTS; i++) {
        const res = login(i);
        tokens.push(res ? res.accessToken : null);
    }
    const valid = tokens.filter(Boolean).length;
    console.log(`Setup: ${valid}/${NUM_TENANTS} tenants ready`);
    return { tokens };
}

// ── Main VU loop ────────────────────────────────────────────────────────────
export default function (data) {
    const tenantIdx = (__VU - 1) % NUM_TENANTS;
    const token     = data.tokens[tenantIdx];
    if (!token) { concurrentErrors.add(true); return; }

    const hdrs    = authHeaders(token);
    const iterStart = Date.now();
    let   hasError  = false;

    // 1. List projects
    group('List Projects', () => {
        const res = http.get(`${BASE_URL}/projects`, {
            headers: hdrs,
            tags: { name: 'Concurrent_ListProjects' },
        });
        if (!check(res, { 'list-projects 200': (r) => r.status === 200 })) {
            hasError = true;
        }
    });

    sleep(0.2);

    // 2. List tasks for first project
    let projectId = null;
    group('List Tasks', () => {
        const projRes = http.get(`${BASE_URL}/projects`, { headers: hdrs });
        if (projRes.status === 200) {
            const projects = JSON.parse(projRes.body);
            if (projects && projects.length > 0) {
                projectId = projects[0].id;
                const taskRes = http.get(`${BASE_URL}/projects/${projectId}/tasks`, {
                    headers: hdrs,
                    tags: { name: 'Concurrent_ListTasks' },
                });
                if (!check(taskRes, { 'list-tasks 200': (r) => r.status === 200 })) {
                    hasError = true;
                }
            }
        }
    });

    sleep(0.2);

    // 3. Create a project
    let newProjectId = null;
    group('Create Project', () => {
        const payload = JSON.stringify({
            name:        `Load Test Project VU${__VU} Iter${__ITER}`,
            description: 'Created during concurrent tenant benchmark',
            status:      'ACTIVE',
        });
        const res = http.post(`${BASE_URL}/projects`, payload, {
            headers: hdrs,
            tags: { name: 'Concurrent_CreateProject' },
        });
        if (check(res, { 'create-project 200': (r) => r.status === 200 || r.status === 201 })) {
            const body = JSON.parse(res.body);
            newProjectId = body.id;
        } else {
            hasError = true;
        }
    });

    sleep(0.2);

    // 4. Create a task in the new project (or fallback to existing)
    group('Create Task', () => {
        const pid = newProjectId || projectId;
        if (!pid) { hasError = true; return; }

        const payload = JSON.stringify({
            title:       `Bench Task VU${__VU} Iter${__ITER}`,
            description: 'Created during concurrent tenant benchmark',
            priority:    'MEDIUM',
            status:      'TODO',
        });
        const res = http.post(`${BASE_URL}/projects/${pid}/tasks`, payload, {
            headers: hdrs,
            tags: { name: 'Concurrent_CreateTask' },
        });
        if (!check(res, { 'create-task 200': (r) => r.status === 200 || r.status === 201 })) {
            hasError = true;
        }
    });

    // Record metrics
    concurrentErrors.add(hasError);
    if (!hasError) {
        tenantsServed.add(1);
    }
    iterationDuration.add(Date.now() - iterStart);

    sleep(1);
}

// ── Summary Handler ─────────────────────────────────────────────────────────
export function handleSummary(data) {
    const ts   = new Date().toISOString().replace(/[:.]/g, '-');
    const file = `results/concurrent_tenants_${ts}.json`;
    return {
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
        [file]: JSON.stringify(data, null, 2),
    };
}
