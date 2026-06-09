"""
Mockup illustrasi "Perhitungan Schedule Performance Index (SPI) Otomatis
dari Rasio Penyelesaian Tugas" untuk BAB V 5.3 Inovasi Sistem.

Layout (1 frame, 4 panel):
  [A] Header proyek (nama, klien, kategori, tanggal, hari berjalan)
  [B] Rasio penyelesaian tugas (donut + counter Selesai / Total)
  [C] Kartu rumus SPI dengan substitusi angka + badge hasil
  [D] Kurva Planned Value vs Earned Value (kumulatif harian)

Output: naskah/bab5_final/_build/mockups/spi_calculation_card.png
"""

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np

OUT = Path(__file__).resolve().parent / 'mockups' / 'spi_calculation_card.png'
OUT.parent.mkdir(parents=True, exist_ok=True)

# ----- Palette (Tailwind-ish, samakan dengan mockup dashboard) -----
C = {
    'bg':          '#F8FAFC',
    'card':        '#FFFFFF',
    'border':      '#E2E8F0',
    'text':        '#0F172A',
    'muted':       '#64748B',
    'grid':        '#F1F5F9',
    'green':       '#10B981',
    'green_dark':  '#059669',
    'amber':       '#F59E0B',
    'red':         '#EF4444',
    'blue':        '#3B82F6',
    'violet':      '#8B5CF6',
    'slate':       '#94A3B8',
}

# ----- Demo data (fabricated tapi konsisten secara aritmetika) -----
PROJECT = {
    'nama':       'Instalasi Smart Lighting Cluster Anggrek',
    'klien':      'PT Graha Anggrek Residence',
    'kategori':   'Instalasi',
    'mulai':      '2026-04-01',
    'akhir':      '2026-06-30',
    'hari_total': 90,
    'hari_lewat': 54,
    'teknisi':    ['Rizky', 'Andi', 'Reza', 'Fajar'],
}
TASK_TOTAL    = 20
TASK_SELESAI  = 11

# Turunan SPI
PROGRES_AKTUAL  = TASK_SELESAI / TASK_TOTAL                      # 0.55
PROGRES_RENCANA = PROJECT['hari_lewat'] / PROJECT['hari_total']  # 0.60
SPI             = PROGRES_AKTUAL / PROGRES_RENCANA               # 0.9167

if SPI >= 0.95:
    STATUS_LABEL = 'SEHAT'
    STATUS_COLOR = C['green']
elif SPI >= 0.85:
    STATUS_LABEL = 'PERINGATAN'
    STATUS_COLOR = C['amber']
else:
    STATUS_LABEL = 'KRITIS'
    STATUS_COLOR = C['red']


def card(ax, title=None):
    # Transparent so rounded background patch shows through.
    ax.set_facecolor('none')
    for s in ax.spines.values():
        s.set_visible(False)
    if title:
        ax.set_title(title, loc='left', fontsize=11, fontweight='600',
                     color=C['text'], pad=12)


def rounded_bg(fig, rect, color=C['card'], edge=C['border']):
    """rect = (x, y, w, h) in figure coords. Draws BEHIND axes."""
    x, y, w, h = rect
    patch = FancyBboxPatch(
        (x, y), w, h,
        boxstyle='round,pad=0.0,rounding_size=0.012',
        linewidth=1.0, edgecolor=edge, facecolor=color,
        transform=fig.transFigure,
    )
    patch.set_zorder(-10)
    fig.patches.append(patch)


def panel_header(ax):
    """Panel A: header proyek."""
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.set_facecolor('none')
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xticks([]); ax.set_yticks([])

    # Nama proyek
    ax.text(0.02, 0.78, PROJECT['nama'], fontsize=14, fontweight='700',
            color=C['text'], va='center')
    # Klien + kategori (sub line)
    ax.text(0.02, 0.55,
            f"Klien: {PROJECT['klien']}    •    Kategori: {PROJECT['kategori']}",
            fontsize=9, color=C['muted'], va='center')

    # Tag tanggal
    ax.text(0.02, 0.28,
            f"Periode: {PROJECT['mulai']} → {PROJECT['akhir']}",
            fontsize=9, color=C['text'], va='center')
    ax.text(0.02, 0.10,
            f"Hari berjalan: {PROJECT['hari_lewat']} / {PROJECT['hari_total']} hari",
            fontsize=9, color=C['muted'], va='center')

    # Status pill di kanan atas
    pill_x, pill_y, pill_w, pill_h = 0.78, 0.55, 0.20, 0.32
    pill = FancyBboxPatch(
        (pill_x, pill_y), pill_w, pill_h,
        boxstyle='round,pad=0.0,rounding_size=0.05',
        linewidth=0, facecolor=STATUS_COLOR, transform=ax.transAxes,
    )
    ax.add_patch(pill)
    ax.text(pill_x + pill_w / 2, pill_y + pill_h / 2,
            f'SPI {SPI:.2f}  •  {STATUS_LABEL}',
            ha='center', va='center', fontsize=11, fontweight='700',
            color='white', transform=ax.transAxes)

    # Progress bar hari berjalan
    bar_y, bar_h = 0.02, 0.06
    ax.add_patch(plt.Rectangle((0.02, bar_y), 0.96, bar_h,
                               facecolor=C['grid'], edgecolor='none',
                               transform=ax.transAxes))
    ax.add_patch(plt.Rectangle(
        (0.02, bar_y), 0.96 * (PROJECT['hari_lewat'] / PROJECT['hari_total']),
        bar_h, facecolor=C['blue'], edgecolor='none',
        transform=ax.transAxes,
    ))


def panel_completion(ax):
    """Panel B: donut + counter rasio penyelesaian tugas."""
    card(ax, 'Rasio Penyelesaian Tugas')
    ax.set_xticks([]); ax.set_yticks([])
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)

    # Donut
    sisa = TASK_TOTAL - TASK_SELESAI
    wedge_ax = ax.inset_axes([0.05, 0.10, 0.55, 0.78])
    wedge_ax.axis('off')
    wedges, _ = wedge_ax.pie(
        [TASK_SELESAI, sisa],
        colors=[C['green'], C['grid']],
        startangle=90, counterclock=False,
        wedgeprops={'edgecolor': 'white', 'linewidth': 3, 'width': 0.35},
    )
    wedge_ax.text(0, 0.10, f'{PROGRES_AKTUAL*100:.0f}%',
                  ha='center', va='center',
                  fontsize=20, fontweight='700', color=C['text'])
    wedge_ax.text(0, -0.20, 'progres aktual',
                  ha='center', va='center', fontsize=8, color=C['muted'])

    # Counter di kanan
    ax.text(0.66, 0.80, 'Selesai',  fontsize=9,  color=C['muted'])
    ax.text(0.66, 0.66, f'{TASK_SELESAI}', fontsize=22, fontweight='700',
            color=C['green_dark'])

    ax.text(0.66, 0.50, 'Total tugas', fontsize=9, color=C['muted'])
    ax.text(0.66, 0.36, f'{TASK_TOTAL}', fontsize=22, fontweight='700',
            color=C['text'])

    ax.text(0.66, 0.20, 'Rasio',         fontsize=9, color=C['muted'])
    ax.text(0.66, 0.07,
            f'{TASK_SELESAI}/{TASK_TOTAL} = {PROGRES_AKTUAL:.2f}',
            fontsize=11, fontweight='600', color=C['text'])


def panel_formula(ax):
    """Panel C: rumus SPI dengan substitusi angka."""
    card(ax, 'Komputasi SPI Otomatis')
    ax.axis('off')
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)

    # Persamaan simbolik
    ax.text(0.04, 0.85,
            r'$\mathrm{SPI} = \dfrac{\,\mathrm{tugas\ selesai}\,/\,\mathrm{tugas\ total}\,}'
            r'{\,\mathrm{hari\ berjalan}\,/\,\mathrm{hari\ total}\,}$',
            fontsize=13, color=C['text'], va='center')

    # Substitusi angka
    ax.text(0.04, 0.58,
            rf'$\mathrm{{SPI}} = \dfrac{{{TASK_SELESAI}\,/\,{TASK_TOTAL}}}'
            rf'{{{PROJECT["hari_lewat"]}\,/\,{PROJECT["hari_total"]}}} = '
            rf'\dfrac{{{PROGRES_AKTUAL:.2f}}}{{{PROGRES_RENCANA:.2f}}} = '
            rf'{SPI:.2f}$',
            fontsize=12, color=C['text'], va='center')

    # Garis pemisah
    ax.plot([0.04, 0.96], [0.42, 0.42], color=C['border'], linewidth=0.8)

    # Tiga komponen ringkas
    def chip(x, label, value, color):
        ax.text(x, 0.32, label, fontsize=8, color=C['muted'])
        ax.text(x, 0.21, value, fontsize=12, fontweight='700', color=color)

    chip(0.06, 'Progres Aktual', f'{PROGRES_AKTUAL*100:.0f}%', C['green_dark'])
    chip(0.40, 'Progres Rencana', f'{PROGRES_RENCANA*100:.0f}%', C['blue'])
    chip(0.74, 'Deviasi', f'{(PROGRES_AKTUAL-PROGRES_RENCANA)*100:+.1f}%',
         C['amber'])

    # Catatan
    ax.text(0.04, 0.06,
            'Nilai diperbarui otomatis setiap kali status tugas berubah '
            '— tanpa input persen manual.',
            fontsize=8, color=C['muted'], style='italic')


def panel_evm(ax):
    """Panel D: kurva Planned vs Earned Value (kumulatif harian)."""
    card(ax, 'Kurva Planned vs Earned Value')
    for spine in ('top', 'right'):
        ax.spines[spine].set_visible(False)
    for spine in ('left', 'bottom'):
        ax.spines[spine].set_color(C['border'])
    ax.tick_params(axis='both', colors=C['muted'], labelsize=8)
    ax.grid(axis='y', color=C['grid'], linewidth=0.8, zorder=0)

    hari_total = PROJECT['hari_total']
    hari_lewat = PROJECT['hari_lewat']
    days = np.arange(0, hari_total + 1)

    # Planned linear 0 -> 100%
    planned = days / hari_total * 100

    # Earned: kurva realistis yang naik bertahap (selesai per tugas), dijepit
    # supaya endpoint = PROGRES_AKTUAL*100 di hari_lewat
    rng = np.random.default_rng(42)
    completion_days = np.sort(rng.integers(2, hari_lewat - 1,
                                           size=TASK_SELESAI))
    earned = np.zeros_like(days, dtype=float)
    step = 100.0 / TASK_TOTAL
    for cd in completion_days:
        earned[cd:] += step
    # Garis earned hanya digambar sampai hari_lewat (sisanya tanpa data)
    earned_plot = earned.copy()
    earned_plot[hari_lewat + 1:] = np.nan

    ax.plot(days, planned, color=C['blue'], linewidth=2.2,
            label='Planned Value (PV)')
    ax.plot(days, earned_plot, color=C['green_dark'], linewidth=2.2,
            label='Earned Value (EV)')

    # Area gap (deviasi) antara PV dan EV sampai hari_lewat
    mask = days <= hari_lewat
    ax.fill_between(days[mask], earned[mask], planned[mask],
                    where=planned[mask] > earned[mask],
                    color=C['amber'], alpha=0.18, linewidth=0,
                    label='Deviasi')

    # Titik now
    ax.scatter([hari_lewat], [earned[hari_lewat]], s=42,
               color=C['green_dark'], zorder=5)
    ax.scatter([hari_lewat], [planned[hari_lewat]], s=42,
               color=C['blue'], zorder=5)
    ax.axvline(hari_lewat, color=C['muted'], linewidth=0.8,
               linestyle='--', alpha=0.5)
    ax.text(hari_lewat + 1, 6, f'Hari ke-{hari_lewat}',
            fontsize=8, color=C['muted'])

    ax.set_xlim(0, hari_total)
    ax.set_ylim(0, 105)
    ax.set_xlabel('Hari proyek', fontsize=9, color=C['muted'])
    ax.set_ylabel('Progres kumulatif (%)', fontsize=9, color=C['muted'])
    ax.legend(loc='upper left', frameon=False, fontsize=8,
              handlelength=1.4)


def build():
    fig = plt.figure(figsize=(12.0, 7.6), facecolor=C['bg'])

    # Grid: header sepanjang lebar, lalu 2x2 panel di bawah
    gs = fig.add_gridspec(
        nrows=3, ncols=2,
        height_ratios=[0.85, 1.6, 1.6],
        hspace=0.55, wspace=0.18,
        left=0.05, right=0.97, top=0.95, bottom=0.06,
    )
    ax_header = fig.add_subplot(gs[0, :])
    ax_comp   = fig.add_subplot(gs[1, 0])
    ax_form   = fig.add_subplot(gs[1, 1])
    ax_evm    = fig.add_subplot(gs[2, :])

    # Background card kotak (di belakang setiap axes)
    def card_bg(ax):
        bbox = ax.get_position()
        pad = 0.012
        rect = (bbox.x0 - pad, bbox.y0 - pad,
                bbox.width + 2 * pad, bbox.height + 2 * pad)
        rounded_bg(fig, rect)

    for a in (ax_header, ax_comp, ax_form, ax_evm):
        card_bg(a)

    panel_header(ax_header)
    panel_completion(ax_comp)
    panel_formula(ax_form)
    panel_evm(ax_evm)

    plt.savefig(OUT, dpi=160, facecolor=C['bg'], bbox_inches='tight')
    plt.close(fig)
    print(f'Saved: {OUT}  ({OUT.stat().st_size/1024:.1f} KB)')


if __name__ == '__main__':
    build()
