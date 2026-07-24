-- ============================================================================
-- Datos de referencia obligatorios para que la aplicación funcione desde el día 1.
-- ============================================================================

INSERT INTO roles (name) VALUES ('PASSENGER'), ('DRIVER'), ('ADMIN');

INSERT INTO payment_methods (code, display_name) VALUES
    ('CASH', 'Efectivo'),
    ('YAPE', 'Yape');

-- Usuario administrador inicial.
-- Contraseña temporal: "Utqallya#2026" (hash BCrypt real, verificado). CAMBIAR inmediatamente tras el primer despliegue.
INSERT INTO users (full_name, email, phone, password_hash, role_id, blocked)
SELECT 'Administrador Utqallya',
       'admin@utqallya.pe',
       '900000000',
       '$2b$10$sD6S8WwzLAojG1IrnxIbhOOq2HriHPoX06PqQ4khGEx6rsUvuqPuS',
       r.id,
       FALSE
FROM roles r WHERE r.name = 'ADMIN';
