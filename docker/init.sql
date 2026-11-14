-- FitForge Database Initialization
-- Ensure fitforge user is SUPERUSER and owns all schemas for migrations
ALTER USER fitforge WITH SUPERUSER CREATEDB;
ALTER DATABASE fitforge_db OWNER TO fitforge;
ALTER SCHEMA public OWNER TO fitforge;
GRANT ALL ON SCHEMA public TO fitforge;
GRANT ALL PRIVILEGES ON DATABASE fitforge_db TO fitforge;

-- Grant permissions on template1 so shadow databases inherit full permissions
\c template1
ALTER SCHEMA public OWNER TO fitforge;
GRANT ALL ON SCHEMA public TO fitforge;
