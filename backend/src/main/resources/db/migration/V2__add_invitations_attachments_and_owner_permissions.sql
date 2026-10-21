-- Flyway Migration V2: Add missing tables, columns, and OWNER permissions for production compatibility

-- 1. Add password_reset_required column to users
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('users') AND name = 'password_reset_required'
)
BEGIN
    ALTER TABLE users ADD password_reset_required BIT NOT NULL DEFAULT 0;
END;

-- 2. Create invitation_tokens table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'invitation_tokens')
BEGIN
    CREATE TABLE invitation_tokens (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        token VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        tenant_id BIGINT NOT NULL,
        role VARCHAR(32) NOT NULL,
        created_at DATETIME2,
        expires_at DATETIME2 NOT NULL,
        CONSTRAINT uq_invitation_tokens_token UNIQUE (token),
        CONSTRAINT fk_invitation_tokens_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );
    CREATE INDEX idx_invitation_tokens_tenant ON invitation_tokens(tenant_id);
    CREATE INDEX idx_invitation_tokens_email ON invitation_tokens(email);
END;

-- 3. Create task_attachments table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'task_attachments')
BEGIN
    CREATE TABLE task_attachments (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        task_id BIGINT NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        stored_filename VARCHAR(255) NOT NULL,
        content_type VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        cloudinary_public_id VARCHAR(255) NOT NULL,
        created_at DATETIME2,
        updated_at DATETIME2,
        CONSTRAINT uq_task_attachments_cloudinary UNIQUE (cloudinary_public_id),
        CONSTRAINT fk_task_attachments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_task_attachments_task FOREIGN KEY (task_id) REFERENCES tasks(id)
    );
    CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);
    CREATE INDEX idx_task_attachments_tenant ON task_attachments(tenant_id);
END;

-- 4. Insert OWNER role permissions
IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'OWNER')
BEGIN
    INSERT INTO role_permissions (role_name, permission_name) VALUES
        ('OWNER', 'PROJECT_READ'),
        ('OWNER', 'PROJECT_WRITE'),
        ('OWNER', 'TASK_READ'),
        ('OWNER', 'TASK_WRITE'),
        ('OWNER', 'TASK_ASSIGN'),
        ('OWNER', 'USER_MANAGE'),
        ('OWNER', 'TENANT_SETTINGS');
END;
