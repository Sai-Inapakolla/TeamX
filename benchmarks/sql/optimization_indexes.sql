-- ============================================================================
-- TeamX Benchmark — Optimization Indexes
-- ============================================================================
-- Apply AFTER collecting baseline results, then re-run benchmarks to measure
-- the improvement. These indexes are also beneficial in production.
--
-- Run against your database manually, or via the run-benchmarks.ps1 script.
-- ============================================================================

-- Covering index: projects by tenant + status (filtered project list queries)
CREATE INDEX idx_projects_tenant_status ON projects(tenant_id, status);

-- Covering index: tasks by tenant + project + status (Kanban board query)
CREATE INDEX idx_tasks_tenant_project_status ON tasks(tenant_id, project_id, status);

-- Index: tasks by tenant + status (cross-project status filtering)
CREATE INDEX idx_tasks_tenant_status ON tasks(tenant_id, status);
