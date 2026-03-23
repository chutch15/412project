### --- 412project --- ###

# --- First-time setup ---

# Connect to PostgreSQL
psql -d postgres

# Create the database
CREATE DATABASE minecraft;

# Exit psql
\q

# Run schema + data script
psql -d minecraft -f data_creation.sql


# --- Viewing the data ---

# Connect to the database
psql -d minecraft

# Enable expanded (clean) output
\x

# View sample data
SELECT * FROM public.item LIMIT 5;

# --- Running the demo ---
psql -d minecraft -f project_midterm_demo.sql


