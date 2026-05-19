"""
Generate a rich mockup screenshot of the four dashboard chart cards
(Projects by Category, Beban Kerja Teknisi, Tugas per Teknisi,
Tugas per Tenggat Waktu) with fabricated data so the cards LOOK busy
and colorful for the BAB V 5.3 "Inovasi Sistem" docx.

Output: naskah/bab5_final/_build/mockups/dashboard_charts_rich.png
"""

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

OUT = Path(__file__).resolve().parent / 'mockups' / 'dashboard_charts_rich.png'
OUT.parent.mkdir(parents=True, exist_ok=True)

# ----- Color palette (match Tailwind-ish dashboard styles) -----
C = {
    'belum_mulai':       '#94A3B8',  # slate-400
    'dikerjakan':        '#10B981',  # emerald-500
    'selesai':           '#059669',  # emerald-600
    'review':            '#8B5CF6',  # violet-500
    'terlambat':         '#F59E0B',  # amber-500
    'lewat_deadline':    '#EF4444',  # red-500
    'tepat_waktu':       '#10B981',
    # Project categories
    'cat_instalasi':     '#3B82F6',  # blue-500
    'cat_maintenance':   '#10B981',
    'cat_survey':        '#F59E0B',
    'cat_konsultasi':    '#8B5CF6',
    'cat_konfigurasi':   '#EC4899',  # pink-500
}

TECHNICIANS = ['Rizky\nRamadhan', 'Andi\nWijaya', 'Reza\nPratama',
               'Fajar\nNugroho', 'Hendra\nSaputra']

# Fabricated "ramai" data
WORKLOAD_DONE      = [12, 9,  14, 7,  11]   # tugas selesai
WORKLOAD_DOING     = [5,  6,  3,  8,  4]    # sedang dikerjakan
WORKLOAD_LATE      = [2,  3,  1,  4,  2]    # terlambat

STATUS_BELUM       = [3,  4,  2,  5,  3]
STATUS_DIKERJAKAN  = [5,  6,  3,  8,  4]
STATUS_REVIEW      = [2,  1,  3,  1,  2]
STATUS_SELESAI     = [12, 9, 14, 7, 11]
STATUS_TERLAMBAT   = [1,  2,  1,  2,  1]
STATUS_LEWAT_DDL   = [1,  2,  0,  3,  1]

MONTHS = ['2026-03', '2026-04', '2026-05', '2026-06']
M_BELUM      = [3,  5, 7, 9]
M_DIKERJAKAN = [4, 8, 11, 6]
M_REVIEW     = [2, 3, 4, 2]
M_SELESAI    = [15, 18, 22, 8]
M_TERLAMBAT  = [1, 2, 3, 4]
M_LEWAT_DDL  = [0, 1, 2, 5]

CATEGORIES   = ['Instalasi', 'Maintenance', 'Survey', 'Konsultasi', 'Konfigurasi']
CAT_COUNTS   = [18, 12, 8, 5, 4]
CAT_COLORS   = [C['cat_instalasi'], C['cat_maintenance'], C['cat_survey'],
                C['cat_konsultasi'], C['cat_konfigurasi']]


def style_card(ax, title):
    """Match the white-card-with-title look of the live dashboard."""
    ax.set_title(title, loc='left', fontsize=11, fontweight='600',
                 color='#0F172A', pad=12)
    ax.set_facecolor('#FFFFFF')
    for spine in ('top', 'right'):
        ax.spines[spine].set_visible(False)
    for spine in ('left', 'bottom'):
        ax.spines[spine].set_color('#E2E8F0')
    ax.tick_params(axis='both', colors='#64748B', labelsize=8)
    ax.grid(axis='x', color='#F1F5F9', linewidth=0.8, zorder=0)


def build():
    fig, axes = plt.subplots(2, 2, figsize=(10.4, 6.6),
                             facecolor='#F8FAFC')
    fig.subplots_adjust(left=0.08, right=0.96, top=0.94, bottom=0.10,
                        wspace=0.32, hspace=0.45)
    (ax_pie, ax_workload), (ax_per_tech, ax_per_due) = axes

    # ---------- Card 1: Projects by Category (pie) ----------
    style_card(ax_pie, 'Projects by Category')
    ax_pie.axis('off')
    ax_pie.set_title('Projects by Category', loc='left', fontsize=11,
                     fontweight='600', color='#0F172A', pad=12)
    wedges, _ = ax_pie.pie(
        CAT_COUNTS, colors=CAT_COLORS, startangle=90,
        wedgeprops={'edgecolor': 'white', 'linewidth': 2},
    )
    total = sum(CAT_COUNTS)
    legend_handles = [
        mpatches.Patch(color=col, label=f'{lbl} ({n})')
        for col, lbl, n in zip(CAT_COLORS, CATEGORIES, CAT_COUNTS)
    ]
    ax_pie.legend(handles=legend_handles, loc='center left',
                  bbox_to_anchor=(-0.1, -0.18), ncol=3, frameon=False,
                  fontsize=7.5, handlelength=1.0, handleheight=0.8,
                  columnspacing=0.8)
    ax_pie.text(0, 0, f'Total\n{total}', ha='center', va='center',
                fontsize=9, color='#64748B')

    # ---------- Card 2: Beban Kerja Teknisi (stacked horiz) ----------
    style_card(ax_workload, 'Beban Kerja Teknisi')
    y = np.arange(len(TECHNICIANS))
    done = np.array(WORKLOAD_DONE)
    doing = np.array(WORKLOAD_DOING)
    late = np.array(WORKLOAD_LATE)
    ax_workload.barh(y, done, color=C['selesai'], label='Selesai', height=0.55)
    ax_workload.barh(y, doing, left=done, color=C['dikerjakan'],
                     label='Dikerjakan', height=0.55)
    ax_workload.barh(y, late, left=done + doing, color=C['terlambat'],
                     label='Terlambat', height=0.55)
    ax_workload.set_yticks(y)
    ax_workload.set_yticklabels(TECHNICIANS)
    ax_workload.invert_yaxis()
    ax_workload.legend(loc='upper center', bbox_to_anchor=(0.5, -0.12),
                       ncol=3, frameon=False, fontsize=8,
                       handlelength=1.0, handleheight=0.8)

    # ---------- Card 3: Tugas per Teknisi (stacked horiz, 6 status) ----------
    style_card(ax_per_tech, 'Tugas per Teknisi')
    statuses = [
        ('Belum Mulai', STATUS_BELUM,      C['belum_mulai']),
        ('Dalam Proses', STATUS_DIKERJAKAN, C['dikerjakan']),
        ('Review',       STATUS_REVIEW,     C['review']),
        ('Selesai',      STATUS_SELESAI,    C['selesai']),
        ('Terlambat',    STATUS_TERLAMBAT,  C['terlambat']),
        ('Lewat Deadline', STATUS_LEWAT_DDL, C['lewat_deadline']),
    ]
    left = np.zeros(len(TECHNICIANS))
    for label, vals, color in statuses:
        arr = np.array(vals)
        ax_per_tech.barh(y, arr, left=left, color=color,
                         label=label, height=0.55)
        left += arr
    ax_per_tech.set_yticks(y)
    ax_per_tech.set_yticklabels(TECHNICIANS)
    ax_per_tech.invert_yaxis()
    ax_per_tech.legend(loc='upper center', bbox_to_anchor=(0.5, -0.12),
                       ncol=3, frameon=False, fontsize=7.5,
                       handlelength=0.9, handleheight=0.7,
                       columnspacing=0.7)

    # ---------- Card 4: Tugas per Tenggat Waktu (stacked vert) ----------
    style_card(ax_per_due, 'Tugas per Tenggat Waktu')
    x = np.arange(len(MONTHS))
    series = [
        ('Belum Mulai', M_BELUM,      C['belum_mulai']),
        ('Sedang Dikerjakan', M_DIKERJAKAN, C['dikerjakan']),
        ('Review',       M_REVIEW,     C['review']),
        ('Selesai',      M_SELESAI,    C['selesai']),
        ('Terlambat',    M_TERLAMBAT,  C['terlambat']),
        ('Lewat Deadline', M_LEWAT_DDL, C['lewat_deadline']),
    ]
    bottom = np.zeros(len(MONTHS))
    for label, vals, color in series:
        arr = np.array(vals)
        ax_per_due.bar(x, arr, bottom=bottom, color=color, label=label, width=0.55)
        bottom += arr
    ax_per_due.set_xticks(x)
    ax_per_due.set_xticklabels(MONTHS, fontsize=8)
    ax_per_due.grid(axis='x', visible=False)
    ax_per_due.grid(axis='y', color='#F1F5F9', linewidth=0.8, zorder=0)
    ax_per_due.legend(loc='upper center', bbox_to_anchor=(0.5, -0.18),
                      ncol=3, frameon=False, fontsize=7.5,
                      handlelength=0.9, handleheight=0.7,
                      columnspacing=0.7)

    plt.savefig(OUT, dpi=160, facecolor='#F8FAFC', bbox_inches='tight')
    plt.close(fig)
    print(f'Saved: {OUT}  ({OUT.stat().st_size/1024:.1f} KB)')


if __name__ == '__main__':
    build()
