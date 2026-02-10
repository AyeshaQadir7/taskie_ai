"""Reset problematic database tables"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.pool import QueuePool

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=3600,
    pool_pre_ping=True,
    connect_args={"sslmode": "require", "connect_timeout": 10}
)

# Drop tables with foreign key conflicts in correct order
with engine.connect() as conn:
    try:
        print("Dropping tool_calls table...")
        conn.execute(text("DROP TABLE IF EXISTS tool_calls CASCADE"))
        conn.commit()
        print("✓ tool_calls dropped")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    try:
        print("Dropping messages table...")
        conn.execute(text("DROP TABLE IF EXISTS messages CASCADE"))
        conn.commit()
        print("✓ messages dropped")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    try:
        print("Dropping conversations table...")
        conn.execute(text("DROP TABLE IF EXISTS conversations CASCADE"))
        conn.commit()
        print("✓ conversations dropped")
    except Exception as e:
        print(f"✗ Error: {e}")

print("\nDatabase reset complete! Tables will be recreated on next backend startup.")
