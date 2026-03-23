import os
import psycopg2
from app.config import settings

def execute_sql_file(filename):
    filepath = os.path.join(os.path.dirname(__file__), 'docs', 'db', 'verification', filename)
    print(f"Executing {filename}...")
    
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    with open(filepath, 'r') as f:
        content = f.read()
        # For migration_v2.sql (contains DO block), execute the whole file as one.
        # Splitting DO block by semicolon fails.
        if filename == 'migration_v2.sql':
            cursor.execute(content)
        else:
            # Split other files by semicolon
            statements = content.split(';')
            for stmt in statements:
                if stmt.strip():
                    cursor.execute(stmt)
                
    cursor.close()
    conn.close()
    print(f"Successfully executed {filename}")

if __name__ == "__main__":
    execute_sql_file('migration_v2.sql')
    execute_sql_file('migration_v2_indexes.sql')
    print("Migration Complete.")
