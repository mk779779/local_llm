import sqlite3
from dataclasses import dataclass
from pathlib import Path
import uuid


@dataclass
class SQliteChatStore:
    db_path: Path = Path("chat.db")

    def __post_init__(self) -> None:
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.init_db()

    def init_db(self) -> None:
        self.conn.execute(
            """
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
        )

        self.conn.execute(
            """
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
        )
        """
        )

        self.conn.commit()

    def create_session(self, title: str | None = None) -> int:
        session_id = uuid.uuid4().hex
        cursor = self.conn.execute(
            "INSERT INTO chat_sessions (id, title) VALUES (?, ?)",
            (
                session_id,
                title,
            ),
        )
        self.conn.commit()
        return int(cursor.lastrowid)

    def add_message(self, session_id: int, role: str, content: str) -> int:
        chat_id = uuid.uuid4().hex
        try:
            cursor = self.conn.execute(
                """
            INSERT INTO chat_messages (id,session_id, role, content)
            VALUES (?, ?, ?)
            """,
                (chat_id, session_id, role, content),
            )

            self.conn.execute(
                """
            UPDATE chat_sessions
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
                (session_id,),
            )

            self.conn.commit()
            return int(cursor.lastrowid)

        except Exception as e:
            self.conn.rollback()
            raise RuntimeError(f"Failed to add message: {e}") from e

    def get_messages(self, session_id: int) -> list[dict]:
        cursor = self.conn.execute(
            """
        SELECT id, role, content, created_at
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY id ASC
        """,
            (session_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
