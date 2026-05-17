"""
Display-only transformer: substitute base table names with BAB IV
nomenclature (tb_*) inside extracted handler code. Runtime source
is NOT modified.

Substitution only happens after SQL identifier keywords (FROM, INTO,
UPDATE, JOIN, REFERENCES, EXISTS) so we don't accidentally rename
JS-side variable names that contain the word 'users' or similar.
"""

import re

TABLE_MAP = {
    'users':               'tb_user',
    'clients':             'tb_klien',
    'projects':            'tb_proyek',
    'project_assignments': 'tb_penugasan_proyek',
    'tasks':               'tb_tugas',
    'task_evidence':       'tb_bukti',
    'escalations':         'tb_eskalasi',
}

# Order longest first to prevent partial overlaps (e.g., task_evidence before tasks)
KEYWORDS = ['FROM', 'INTO', 'UPDATE', 'JOIN', 'REFERENCES', 'TABLE',
            'INSERT INTO', 'DELETE FROM']


def transform_code(code: str) -> str:
    out = code
    # Sort table names so longer first (task_evidence before tasks)
    pairs = sorted(TABLE_MAP.items(), key=lambda kv: -len(kv[0]))
    for old, new in pairs:
        # Match keyword + whitespace + table name, with optional alias following
        # \b ensures word boundary so 'tasks' won't match 'task_evidence'
        pattern = re.compile(
            r'(\b(?:FROM|INTO|UPDATE|JOIN|REFERENCES|TABLE)\s+)' + re.escape(old) + r'\b',
            re.IGNORECASE,
        )
        out = pattern.sub(r'\g<1>' + new, out)
    return out


if __name__ == '__main__':
    sample = """
    const result = await query(
      'SELECT id, name FROM users WHERE email = $1', [email]
    );
    await query(
      'INSERT INTO tasks (project_id, name) VALUES ($1, $2)', [pid, name]
    );
    await query(
      'UPDATE projects SET status = $1 WHERE id = $2', [s, id]
    );
    await query(
      `SELECT t.id, u.name AS technician
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.project_id = $1`, [pid]
    );
    await query(
      'DELETE FROM task_evidence WHERE task_id = $1', [tid]
    );
    """
    print(transform_code(sample))
