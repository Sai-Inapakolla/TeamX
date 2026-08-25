# TeamX — Performance Benchmarking Suite

Measure and prove your SaaS platform's performance with hard numbers.

## What This Tests

| Scenario | What It Proves | Key Metric |
|:---|:---|:---|
| **Query Time** | API latency under load (0 → 50 concurrent users) | p95 & p50 response time |
| **Concurrent Tenants** | N tenants performing CRUD simultaneously | `tenants_served` count, error rate |
| **Tenant Isolation** | Zero cross-tenant data leakage under stress | `isolation_failures == 0` |

---

## Prerequisites

### 1. Install k6

```powershell
# Windows (recommended)
winget install Grafana.k6

# or via Chocolatey
choco install k6
```

Verify: `k6 version`

### 2. Start the Backend with Benchmark Profile

The `benchmark` Spring profile seeds **50 tenants × 20 projects × 100 tasks = 100,000 tasks** on first startup.

```powershell
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=benchmark
```

Wait for the log line:  
`✅ Benchmark seeding complete in Xs — 50 tenants, 50 users, 1000 projects, 100000 tasks`

---

## Running the Benchmarks

### Run All Scenarios

```powershell
cd benchmarks
.\run-benchmarks.ps1
```

### Run a Single Scenario

```powershell
.\run-benchmarks.ps1 -Scenario query_time
.\run-benchmarks.ps1 -Scenario concurrent_tenants
.\run-benchmarks.ps1 -Scenario tenant_isolation
```

### Custom Backend URL

```powershell
.\run-benchmarks.ps1 -BaseUrl "http://myserver:8080/api/v1"
```

---

## Understanding the Results

### Query Time Results

```
project_query_ms
  p(50) .... 45ms     ← Median response time
  p(95) .... 120ms    ← 95th percentile (worst-case for most users)

task_query_ms
  p(50) .... 52ms
  p(95) .... 180ms
```

**What to claim:** _"API query response times under 200ms (p95) with 50 concurrent users across a 100K-row dataset"_

### Concurrent Tenants Results

```
tenants_served .... 5024    ← Total successful tenant operations
concurrent_errors . 0.00%   ← Zero failures
http_req_duration . p(50)=12.04ms | p(95)=139.17ms
```

**What to claim:** _"Validated 50 concurrent tenant sessions with full CRUD operations and zero errors across 5,024+ operations with p95 response time of 139.17ms"_

### Tenant Isolation Results

```
✅ TENANT ISOLATION: PASSED — Zero cross-tenant data leaks

isolation_checks   .... 102982  ← Total isolation assertions
isolation_failures ....      0  ← Must be ZERO
```

**What to claim:** _"Verified row-level tenant isolation under concurrent load with zero data leakage across 102,982 security assertions"_

---

## Before/After Index Optimization

To demonstrate measurable query-time improvement:

### Step 1: Run Baseline

```powershell
.\run-benchmarks.ps1 -Scenario query_time
# Note the p50 and p95 values from the output
```

### Step 2: Apply Optimization Indexes

Connect to your database and run:

```sql
-- From benchmarks/sql/optimization_indexes.sql
CREATE INDEX idx_projects_tenant_status ON projects(tenant_id, status);
CREATE INDEX idx_tasks_tenant_project_status ON tasks(tenant_id, project_id, status);
CREATE INDEX idx_tasks_tenant_status ON tasks(tenant_id, status);
```

### Step 3: Run Optimized Benchmark

```powershell
.\run-benchmarks.ps1 -Scenario query_time
# Compare p50 and p95 values with baseline
```

### Step 4: Calculate Improvement

```
Improvement % = ((baseline_p95 - optimized_p95) / baseline_p95) × 100
```

**What to claim:** _"Reduced p95 query latency by X% through composite covering indexes on tenant-scoped queries"_

---

## Benchmark Data Details

The `BenchmarkDataSeeder` (activated by `--spring.profiles.active=benchmark`) creates:

| Entity | Count | Pattern |
|:---|---:|:---|
| Tenants | 50 | `Benchmark Tenant 1..50` |
| Users | 50 | `bench-user-{N}@teamx.test` / password: `benchmark123` |
| User-Tenant | 50 | 1 ORG_ADMIN per tenant |
| Projects | 1,000 | 20 per tenant |
| Tasks | 100,000 | 100 per project, distributed across 4 statuses & priorities |

---

## Resume / Portfolio Phrasing

Use the actual numbers from your benchmark runs:

> **Performance & Scalability**
> - Optimized multi-tenant query performance, achieving **12.04ms (p50)** and **139.17ms (p95)** API latency under load on a 100K-row dataset
> - Load-tested and validated **50 concurrent tenant sessions** serving **5,024 tenant operations** with full CRUD and zero errors under sustained traffic
> - Verified row-level tenant data isolation under concurrent load with **zero cross-tenant data leakage** across **102,982** security assertions

---

## File Structure

```
benchmarks/
├── k6/
│   ├── config.js                           # Shared constants & thresholds
│   ├── helpers.js                          # Login & auth utilities
│   └── scenarios/
│       ├── query_time.js                   # Latency measurement
│       ├── concurrent_tenants.js           # Multi-tenant concurrency
│       └── tenant_isolation.js             # Isolation verification
├── sql/
│   └── optimization_indexes.sql            # Indexes for before/after comparison
├── results/                                # JSON output (auto-created)
├── run-benchmarks.ps1                      # Runner script
└── README.md                               # This file
```
