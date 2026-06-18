import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'payflow.db')


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_connection()
    cursor = conn.cursor()

    # ── Usuarios ──────────────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT    UNIQUE NOT NULL,
            nombre     TEXT    NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    ''')

    # ── Cuenta financiera (1 por usuario) ────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cuenta (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id        INTEGER NOT NULL UNIQUE,
            saldo             REAL    NOT NULL DEFAULT 0.0,
            antiguedad_meses  INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    ''')

    # ── Presupuesto / Fondos (1 activo por usuario) ──────────────────────────
    # Almacena montos absolutos para respetar el contrato del frontend.
    # La conversión a porcentajes ocurre en el router al invocar el dominio.
    cursor.execute('''
        DROP TABLE IF EXISTS presupuesto
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS presupuesto (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id           INTEGER NOT NULL UNIQUE,
            pmt                  REAL    NOT NULL DEFAULT 0.0,
            ahorro_meta          REAL    NOT NULL DEFAULT 0.0,
            servicios_monto      REAL    NOT NULL DEFAULT 0.0,
            suscripciones_monto  REAL    NOT NULL DEFAULT 0.0,
            ocio_monto           REAL    NOT NULL DEFAULT 0.0,
            estado               TEXT    NOT NULL DEFAULT 'CONFIGURACION',
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    ''')

    # ── Suscripciones ─────────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS suscripciones (
            id          TEXT    PRIMARY KEY,
            usuario_id  INTEGER NOT NULL,
            nombre      TEXT    NOT NULL,
            monto       REAL    NOT NULL,
            fecha_cobro TEXT,               -- ISO date YYYY-MM-DD, NULL si suspendida
            estado      TEXT    NOT NULL,   -- Pendiente | Pagada | Vencida | Suspendida
            ciclo       TEXT    NOT NULL,   -- monthly | annual | quarterly
            categoria   TEXT    NOT NULL,   -- digital | services
            icono       TEXT,
            color_icono TEXT,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    ''')

    # ── Gastos variables ──────────────────────────────────────────────────────
    # max_historico se calcula como MAX(monto) por (usuario_id, categoria)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gastos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id  INTEGER NOT NULL,
            categoria   TEXT    NOT NULL,   -- hogar | ocio
            monto       REAL    NOT NULL,
            fecha       TEXT    NOT NULL,   -- ISO date YYYY-MM-DD
            descripcion TEXT,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()


def get_max_historico(usuario_id: int, categoria: str, conn: sqlite3.Connection) -> float:
    """
    Calcula el gasto máximo histórico por categoría para un usuario.
    Usado como límite razonable en registrar_gasto().
    Valor de fallback: 1000.0 si aún no hay historial.
    """
    result = conn.execute(
        "SELECT MAX(monto) FROM gastos WHERE usuario_id = ? AND categoria = ?",
        (usuario_id, categoria)
    ).fetchone()
    value = result[0]
    return float(value) if value is not None else 1000.0


if __name__ == '__main__':
    init_db()
    print("DB inicializada correctamente.")
