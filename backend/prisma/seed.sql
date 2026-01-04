-- Insérer les rôles
INSERT INTO "Role" (name, permissions) VALUES
('Admin', ARRAY['manage_users', 'manage_roles', 'view_classes', 'manage_classes', 'view_students', 'manage_students', 'view_payments', 'manage_payments', 'view_courses', 'manage_courses', 'view_reports', 'export_data', 'view_audit_logs', 'manage_settings', 'delete_records']),
('Directeur', ARRAY['view_classes', 'manage_classes', 'view_students', 'manage_students', 'view_payments', 'manage_payments', 'view_courses', 'manage_courses', 'view_reports', 'export_data', 'view_audit_logs']),
('Comptable', ARRAY['view_students', 'view_payments', 'manage_payments', 'view_reports', 'export_data']),
('Enseignant', ARRAY['view_classes', 'view_students', 'view_courses']);

-- Insérer l'utilisateur admin (mot de passe: admin123)
-- Le hash bcrypt pour 'admin123' est: $2a$10$rGHQZ8kZ5qXYqGxZ5qXYqOqXYqGxZ5qXYqGxZ5qXYqGxZ5qXYqGxZ
-- Note: Tu devras régénérer un vrai hash bcrypt
INSERT INTO "User" (username, password, "fullName", "roleId", "createdAt", "updatedAt") 
VALUES ('admin', '$2a$10$rKZqVxGxZ5qXYqGxZ5qXYqOqXYqGxZ5qXYqGxZ5qXYqGxZ5qXYqGx', 'Administrateur Principal', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
