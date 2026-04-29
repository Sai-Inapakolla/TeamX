CREATE TABLE IF NOT EXISTS tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255),
    status VARCHAR(32) NOT NULL,
    settings JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uq_tenants_subdomain UNIQUE (subdomain)
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS user_tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    joined_at TIMESTAMP,
    CONSTRAINT uq_user_tenant UNIQUE (user_id, tenant_id),
    CONSTRAINT fk_user_tenants_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_tenants_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_projects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to BIGINT,
    status VARCHAR(32) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    due_date DATE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_tasks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_name VARCHAR(32) NOT NULL,
    permission_name VARCHAR(64) NOT NULL,
    PRIMARY KEY (role_name, permission_name)
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_project ON tasks(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_assigned ON tasks(tenant_id, assigned_to);

INSERT INTO role_permissions (role_name, permission_name) VALUES
    ('ORG_ADMIN', 'PROJECT_READ'),
    ('ORG_ADMIN', 'PROJECT_WRITE'),
    ('ORG_ADMIN', 'TASK_READ'),
    ('ORG_ADMIN', 'TASK_WRITE'),
    ('ORG_ADMIN', 'TASK_ASSIGN'),
    ('ORG_ADMIN', 'USER_MANAGE'),
    ('ORG_ADMIN', 'TENANT_SETTINGS'),
    ('MANAGER', 'PROJECT_READ'),
    ('MANAGER', 'PROJECT_WRITE'),
    ('MANAGER', 'TASK_READ'),
    ('MANAGER', 'TASK_WRITE'),
    ('MANAGER', 'TASK_ASSIGN'),
    ('USER', 'PROJECT_READ'),
    ('USER', 'TASK_READ'),
    ('USER', 'TASK_WRITE');
