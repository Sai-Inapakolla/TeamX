// --------------------------------------------------------------------------
// TeamX Benchmark — Tenant Isolation Verification Under Load
// --------------------------------------------------------------------------
// Each VU logs in as a DIFFERENT tenant's admin and verifies that:
//   1. All returned projects belong to the VU's own tenant
//   2. Attempting to access another tenant's project returns 403/404
//   3. No cross-tenant data leakage occurs even under heavy concurrency
//
// A single isolation violation = test FAILURE.
//
// Run:  k6 run benchmarks/k6/scenarios/tenant_isolation.js
// --------------------------------------------------------------------------

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js';
import { BASE_URL, NUM_TENANTS } from '../config.js';
import { login, authHeaders } from '../helpers.js';

// ── Custom Metrics ──────────────────────────────────────────────────────────
const isolationChecks   = new Counter('isolation_checks');
const isolationFailures = new Counter('isolation_failures');
const isolationErrorRate = new Rate('isolation_error_rate');

// ── Scenario Config ─────────────────────────────────────────────────────────
export const options = {
    scenarios: {
        isolation_test: {
            executor: 'constant-vus',
            vus:      NUM_TENANTS,
            duration: '2m',
        },
    },
    thresholds: {
        'isolation_failures': ['count==0'],   // ZERO tolerance
        'isolation_error_rate': ['rate==0'],
    },
};

// ── Setup: authenticate all tenants & collect project IDs per tenant ────────
export function setup() {
    const tenants = [];

    for (let i = 1; i <= NUM_TENANTS; i++) {
        const loginRes = login(i);
        if (!loginRes) {
            tenants.push(null);
            continue;
        }

        const token = loginRes.accessToken;
        const hdrs  = authHeaders(token);

        // Fetch this tenant's project IDs
        const projRes = http.get(`${BASE_URL}/projects`, { headers: hdrs });
        let projectIds = [];
        if (projRes.status === 200) {
            const projects = JSON.parse(projRes.body);
            projectIds = projects.map((p) => p.id);
        }

        tenants.push({ token, projectIds, tenantIndex: i });
    }

    // Build a map of "other tenant project IDs" for cross-tenant access tests
    const allProjectIds = tenants
        .filter(Boolean)
        .flatMap((t) => t.projectIds);

    console.log(`Setup: ${tenants.filter(Boolean).length}/${NUM_TENANTS} tenants ready, ` +
                `${allProjectIds.length} total projects indexed`);

    return { tenants };
}

// ── Main VU loop ────────────────────────────────────────────────────────────
export default function (data) {
    const myIdx  = (__VU - 1) % NUM_TENANTS;
    const myData = data.tenants[myIdx];
    if (!myData) return;

    const hdrs       = authHeaders(myData.token);
    const myProjects = myData.projectIds;

    // ── Check 1: All returned projects belong to my tenant ──────────────
    group('Verify Own Projects', () => {
        const res = http.get(`${BASE_URL}/projects`, {
            headers: hdrs,
            tags: { name: 'Isolation_ListProjects' },
        });

        if (res.status === 200) {
            const projects = JSON.parse(res.body);
            projects.forEach((proj) => {
                isolationChecks.add(1);

                // Verify this project ID is in my tenant's known set
                const belongsToMe = myProjects.includes(proj.id);
                if (!belongsToMe) {
                    console.error(
                        `🚨 ISOLATION VIOLATION: Tenant ${myData.tenantIndex} received ` +
                        `project ID ${proj.id} which does NOT belong to it!`
                    );
                    isolationFailures.add(1);
                    isolationErrorRate.add(true);
                } else {
                    isolationErrorRate.add(false);
                }
            });
        }
    });

    sleep(0.3);

    // ── Check 2: Cannot access another tenant's project ─────────────────
    group('Cross-Tenant Access Blocked', () => {
        // Pick another tenant's project ID
        const otherIdx = (myIdx + 1) % NUM_TENANTS;
        const otherData = data.tenants[otherIdx];
        if (!otherData || otherData.projectIds.length === 0) return;

        const foreignId = otherData.projectIds[0];
        const res = http.get(`${BASE_URL}/projects/${foreignId}`, {
            headers: hdrs,
            tags: { name: 'Isolation_CrossTenant' },
        });

        isolationChecks.add(1);
        const blocked = check(res, {
            'cross-tenant blocked (403 or 404)': (r) =>
                r.status === 403 || r.status === 404,
        });

        if (!blocked) {
            console.error(
                `🚨 ISOLATION VIOLATION: Tenant ${myData.tenantIndex} was able to ` +
                `access project ${foreignId} (status ${res.status}) which belongs to ` +
                `tenant ${otherData.tenantIndex}!`
            );
            isolationFailures.add(1);
            isolationErrorRate.add(true);
        } else {
            isolationErrorRate.add(false);
        }
    });

    sleep(0.3);

    // ── Check 3: Tasks for own project are scoped correctly ─────────────
    group('Verify Task Scoping', () => {
        if (myProjects.length === 0) return;

        const pid = myProjects[Math.floor(Math.random() * myProjects.length)];
        const res = http.get(`${BASE_URL}/projects/${pid}/tasks`, {
            headers: hdrs,
            tags: { name: 'Isolation_ListTasks' },
        });

        isolationChecks.add(1);
        const ok = check(res, { 'own-tasks 200': (r) => r.status === 200 });
        if (!ok) {
            isolationFailures.add(1);
            isolationErrorRate.add(true);
        } else {
            isolationErrorRate.add(false);
        }
    });

    sleep(0.5);
}

// ── Summary Handler ─────────────────────────────────────────────────────────
export function handleSummary(data) {
    const ts   = new Date().toISOString().replace(/[:.]/g, '-');
    const file = `results/tenant_isolation_${ts}.json`;

    // Add a prominent pass/fail banner
    const failures = data.metrics.isolation_failures
        ? data.metrics.isolation_failures.values.count
        : 0;
    const banner = failures === 0
        ? '\n✅ TENANT ISOLATION: PASSED — Zero cross-tenant data leaks\n'
        : `\n🚨 TENANT ISOLATION: FAILED — ${failures} violations detected!\n`;

    return {
        stdout: banner + textSummary(data, { indent: ' ', enableColors: true }),
        [file]: JSON.stringify(data, null, 2),
    };
}
