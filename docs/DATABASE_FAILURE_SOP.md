# DATABASE FAILURE SOP

If PostgreSQL drops, system relies on Redis for last-known state but halts writing new incidents until restored.
