package com.saas.platform.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds a large multi-tenant dataset for benchmarking.
 * <p>
 * Activated only when the {@code benchmark} Spring profile is active.
 * Creates {@value #NUM_TENANTS} tenants, each with {@value #PROJECTS_PER_TENANT}
 * projects and {@value #TASKS_PER_PROJECT} tasks per project, totalling
 * {@code 50 × 20 × 100 = 100,000} tasks.
 * </p>
 * <p>
 * Every benchmark user logs in with the password {@value #BENCHMARK_PASSWORD}.
 * Email pattern: {@code bench-user-{N}@teamx.test} where N = 1..50.
 * </p>
 */
@Slf4j
@Component
@Profile("benchmark")
@SuppressWarnings("null")
public class BenchmarkDataSeeder implements CommandLineRunner {

    static final int NUM_TENANTS         = 50;
    static final int PROJECTS_PER_TENANT = 20;
    static final int TASKS_PER_PROJECT   = 100;
    static final String BENCHMARK_PASSWORD = "benchmark123";

    private static final String[] STATUSES   = {"TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"};
    private static final String[] PRIORITIES = {"LOW", "MEDIUM", "HIGH", "URGENT"};
    private static final int BATCH_CHUNK     = 1000;

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public BenchmarkDataSeeder(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // ── 0. Ensure role_permissions table exists (no JPA entity; Flyway disabled) ──
        try {
            jdbcTemplate.queryForObject("SELECT COUNT(*) FROM role_permissions", Integer.class);
        } catch (Exception e) {
            log.info("  Creating role_permissions table (not managed by JPA) …");
            jdbcTemplate.execute(
                    "CREATE TABLE role_permissions ("
                            + "role_name VARCHAR(32) NOT NULL, "
                            + "permission_name VARCHAR(64) NOT NULL, "
                            + "PRIMARY KEY (role_name, permission_name))");
            String insertRp = "INSERT INTO role_permissions (role_name, permission_name) VALUES (?, ?)";
            jdbcTemplate.batchUpdate(insertRp, List.of(
                    new Object[]{"ORG_ADMIN", "PROJECT_READ"},
                    new Object[]{"ORG_ADMIN", "PROJECT_WRITE"},
                    new Object[]{"ORG_ADMIN", "TASK_READ"},
                    new Object[]{"ORG_ADMIN", "TASK_WRITE"},
                    new Object[]{"ORG_ADMIN", "TASK_ASSIGN"},
                    new Object[]{"ORG_ADMIN", "USER_MANAGE"},
                    new Object[]{"ORG_ADMIN", "TENANT_SETTINGS"},
                    new Object[]{"MANAGER", "PROJECT_READ"},
                    new Object[]{"MANAGER", "PROJECT_WRITE"},
                    new Object[]{"MANAGER", "TASK_READ"},
                    new Object[]{"MANAGER", "TASK_WRITE"},
                    new Object[]{"MANAGER", "TASK_ASSIGN"},
                    new Object[]{"USER", "PROJECT_READ"},
                    new Object[]{"USER", "TASK_READ"},
                    new Object[]{"USER", "TASK_WRITE"}));
            log.info("  ✓ role_permissions table created and seeded");
        }

        // Guard: skip if benchmark data was already seeded
        Integer existing = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tenants WHERE name LIKE 'Benchmark Tenant%'", Integer.class);
        if (existing != null && existing > 0) {
            log.info("✅ Benchmark data already present ({} tenants). Skipping seeder.", existing);
            return;
        }

        int totalProjects = NUM_TENANTS * PROJECTS_PER_TENANT;
        int totalTasks    = totalProjects * TASKS_PER_PROJECT;
        log.info("🚀 Seeding benchmark data: {} tenants, {} projects, {} tasks …",
                NUM_TENANTS, totalProjects, totalTasks);

        long startMs = System.currentTimeMillis();
        Timestamp now = Timestamp.from(Instant.now());
        String hash  = passwordEncoder.encode(BENCHMARK_PASSWORD);

        // ── 1. Tenants ──────────────────────────────────────────────────────
        List<Long> tenantIds = new ArrayList<>(NUM_TENANTS);
        for (int i = 1; i <= NUM_TENANTS; i++) {
            tenantIds.add(insertAndReturnKey(
                    "INSERT INTO tenants (name, subdomain, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                    "Benchmark Tenant " + i, "bench-" + i, "ACTIVE", now, now));
        }
        log.info("  ✓ {} tenants", tenantIds.size());

        // ── 2. Users (one admin per tenant) ─────────────────────────────────
        List<Long> userIds = new ArrayList<>(NUM_TENANTS);
        for (int i = 1; i <= NUM_TENANTS; i++) {
            userIds.add(insertAndReturnKey(
                    "INSERT INTO users (email, password_hash, password_reset_required, first_name, last_name, status, created_at, updated_at) "
                            + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    "bench-user-" + i + "@teamx.test", hash,
                    false,
                    "Bench", "User" + i, "ACTIVE", now, now));
        }
        log.info("  ✓ {} users", userIds.size());

        // ── 3. User-Tenant mappings ─────────────────────────────────────────
        for (int i = 0; i < NUM_TENANTS; i++) {
            jdbcTemplate.update(
                    "INSERT INTO user_tenants (user_id, tenant_id, role, status, joined_at) VALUES (?, ?, ?, ?, ?)",
                    userIds.get(i), tenantIds.get(i), "ORG_ADMIN", "ACTIVE", now);
        }
        log.info("  ✓ {} user-tenant mappings", NUM_TENANTS);

        // ── 4. Projects ─────────────────────────────────────────────────────
        Map<Long, List<Long>> projectsByTenant = new LinkedHashMap<>();
        for (int t = 0; t < NUM_TENANTS; t++) {
            List<Long> pids = new ArrayList<>(PROJECTS_PER_TENANT);
            for (int p = 1; p <= PROJECTS_PER_TENANT; p++) {
                pids.add(insertAndReturnKey(
                        "INSERT INTO projects (tenant_id, name, description, owner_id, status, created_by, created_at, updated_at) "
                                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        tenantIds.get(t),
                        "Benchmark Project " + p,
                        "Auto-generated project for load testing",
                        userIds.get(t), "ACTIVE", userIds.get(t), now, now));
            }
            projectsByTenant.put(tenantIds.get(t), pids);
        }
        log.info("  ✓ {} projects", totalProjects);

        // ── 5. Tasks (batch-inserted in chunks of {}) ───────────────────────
        String taskSql = "INSERT INTO tasks "
                + "(tenant_id, project_id, title, description, assigned_to, "
                + "status, priority, due_date, created_by, created_at, updated_at) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        List<Object[]> batch = new ArrayList<>(BATCH_CHUNK);
        int seeded = 0;

        for (int t = 0; t < NUM_TENANTS; t++) {
            Long tid = tenantIds.get(t);
            Long uid = userIds.get(t);
            List<Long> pids = projectsByTenant.get(tid);

            for (int p = 0; p < pids.size(); p++) {
                Long pid = pids.get(p);
                for (int k = 1; k <= TASKS_PER_PROJECT; k++) {
                    batch.add(new Object[]{
                            tid, pid,
                            "Task " + k + " – P" + (p + 1) + " – T" + (t + 1),
                            "Benchmark task for load testing. Distributed across statuses and priorities.",
                            uid,
                            STATUSES[seeded % STATUSES.length],
                            PRIORITIES[seeded % PRIORITIES.length],
                            java.sql.Date.valueOf(LocalDate.now().plusDays(k % 30)),
                            uid, now, now
                    });
                    seeded++;

                    if (batch.size() >= BATCH_CHUNK) {
                        jdbcTemplate.batchUpdate(taskSql, batch);
                        batch.clear();
                    }
                }
            }
        }
        if (!batch.isEmpty()) {
            jdbcTemplate.batchUpdate(taskSql, batch);
        }
        log.info("  ✓ {} tasks", seeded);

        long elapsed = System.currentTimeMillis() - startMs;
        log.info("✅ Benchmark seeding complete in {}s — {} tenants, {} users, {} projects, {} tasks",
                elapsed / 1000, NUM_TENANTS, NUM_TENANTS, totalProjects, seeded);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Execute a single INSERT and return the generated primary key.
     *
     * @param sql  INSERT statement with {@code ?} placeholders
     * @param args parameter values matching the {@code ?} markers
     * @return the auto-generated key
     */
    private Long insertAndReturnKey(String sql, Object... args) {
        GeneratedKeyHolder kh = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) {
                ps.setObject(i + 1, args[i]);
            }
            return ps;
        }, kh);
        Number key = kh.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to retrieve generated key for insert: " + sql);
        }
        return key.longValue();
    }
}
