import fitz, pathlib, re

src = r'D:\__CODING\05-MyProjects\__IRENE\shi-crm\diagram\Naskah TA 04-05-26.pdf'
out = pathlib.Path(r'D:\__CODING\05-MyProjects\__IRENE\shi-crm\naskah')
img_dir = out / 'images'

# wipe previous category files (keep DIAGRAM_RULES.md, _build.py, images/, INDEX.md will be rewritten)
for old in out.glob('*.md'):
    if old.name not in ('DIAGRAM_RULES.md',):
        old.unlink()


def categorize(sid, bab):
    if not sid:
        if bab.startswith('BAB I '): return ('01_pendahuluan', 'BAB I - Pendahuluan')
        if bab.startswith('BAB II'): return ('03_landasan_teori', 'BAB II - Konteks Umum')
        if bab.startswith('BAB III'): return ('04_metode_penelitian', 'BAB III - Konteks Umum')
        if bab.startswith('BAB IV'): return ('06_analisis_sistem', 'BAB IV - Konteks Umum')
        if bab.startswith('BAB V'): return ('15_implementasi', 'BAB V - Konteks Umum')
        if bab.startswith('BAB VI'): return ('16_penutup', 'BAB VI - Konteks Umum')
        return ('00_frontmatter', 'Halaman Awal')
    if sid.startswith('1.'): return ('01_pendahuluan', 'BAB I - Pendahuluan')
    if sid.startswith('2.1'): return ('02_kajian_terdahulu', '2.1 Kajian Penelitian Terdahulu')
    if sid.startswith('2.2'): return ('03_landasan_teori', '2.2 Landasan Teori')
    if sid.startswith('3.1'): return ('04_metode_penelitian', '3.1 Metode Penelitian (Prototyping)')
    if sid.startswith('3.2'): return ('05_obyek_penelitian', '3.2 Obyek Penelitian (PT SHI)')
    if sid.startswith('4.1'): return ('06_analisis_sistem', '4.1 Analisis Sistem (As-Is + Diusulkan)')
    if sid.startswith('4.2'): return ('07_kebutuhan_sistem', '4.2 Analisa Kebutuhan')
    if sid.startswith('4.3.1.1'): return ('08_use_case', '4.3.1.1 Use Case Diagram')
    if sid.startswith('4.3.1.2'): return ('09_activity_diagram', '4.3.1.2 Activity Diagram (5 diagrams)')
    if sid.startswith('4.3.1.3'): return ('10_sequence_diagram', '4.3.1.3 Sequence Diagram (TARGET - belum dibuat)')
    if sid.startswith('4.3.1.4'): return ('11_class_diagram', '4.3.1.4 Class Diagram')
    if sid.startswith('4.3.1'): return ('08_use_case', '4.3.1 Pemodelan UML (root)')
    if sid.startswith('4.3.2') or sid.startswith('4.3.3') or sid.startswith('4.3.4'):
        return ('12_perancangan_data', '4.3.2-4 Perancangan Data + Basis Data')
    if sid.startswith('4.3.5'): return ('13_perancangan_ui', '4.3.5 Perancangan Antarmuka')
    if sid.startswith('4.3'): return ('08_use_case', '4.3 Perancangan Sistem (root)')
    if sid.startswith('4.4'): return ('14_anggaran', '4.4 Rancangan Anggaran')
    if sid.startswith('5.'): return ('15_implementasi', 'BAB V - Implementasi & Pembahasan')
    if sid.startswith('6.'): return ('16_penutup', 'BAB VI - Penutup + Daftar Pustaka')
    return ('99_misc', 'Misc')


def clean(t):
    t = re.sub(r'\n{3,}', '\n\n', t)
    return '\n'.join(line.rstrip() for line in t.split('\n')).strip()


doc = fitz.open(src)
SEC_RE = re.compile(r'^(\d+\.\d+(?:\.\d+){0,2})\s+(.+?)\s*$', re.M)
BAB_RE = re.compile(r'^BAB\s+([IVX]+)\s*$', re.M)

chunks = []
current_bab = ''
current_sid = ''
current_stitle = ''

for i, page in enumerate(doc, 1):
    raw = page.get_text()

    bm = BAB_RE.search(raw)
    if bm:
        lines = raw.split('\n')
        for idx, ln in enumerate(lines):
            if re.match(r'^BAB\s+[IVX]+\s*$', ln.strip()):
                title = ''
                for nxt in lines[idx + 1:idx + 4]:
                    if nxt.strip():
                        title = nxt.strip()
                        break
                current_bab = f'BAB {bm.group(1)} - {title}' if title else f'BAB {bm.group(1)}'
                break

    img_files = sorted(img_dir.glob(f'p{i:02d}_img*.png'))
    img_refs = [f'images/{f.name}' for f in img_files]

    sec_matches = list(SEC_RE.finditer(raw))

    if not sec_matches:
        chunks.append({
            'page': i, 'bab': current_bab, 'sid': current_sid, 'stitle': current_stitle,
            'text': raw, 'images': img_refs,
        })
        continue

    first = sec_matches[0]
    if first.start() > 0:
        pre = raw[:first.start()]
        if pre.strip():
            chunks.append({
                'page': i, 'bab': current_bab, 'sid': current_sid, 'stitle': current_stitle,
                'text': pre, 'images': [],
            })

    for j, m in enumerate(sec_matches):
        start = m.start()
        end = sec_matches[j + 1].start() if j + 1 < len(sec_matches) else len(raw)
        sid = m.group(1)
        stitle = m.group(2).strip()
        text = raw[start:end]
        is_last = (j == len(sec_matches) - 1)
        chunks.append({
            'page': i, 'bab': current_bab, 'sid': sid, 'stitle': stitle,
            'text': text, 'images': img_refs if is_last else [],
        })
        current_sid = sid
        current_stitle = stitle

buckets = {}
for c in chunks:
    cat_id, label = categorize(c['sid'], c['bab'])
    b = buckets.setdefault(cat_id, {'label': label, 'chunks': [], 'label_sid': ''})
    b['chunks'].append(c)
    if c['sid'] and len(c['sid']) > len(b['label_sid']):
        b['label'] = label
        b['label_sid'] = c['sid']

written = []
for cat_id in sorted(buckets.keys()):
    b = buckets[cat_id]
    cs = b['chunks']
    pages = sorted(set(c['page'] for c in cs))
    page_range = f'{pages[0]}-{pages[-1]}' if len(pages) > 1 else str(pages[0])
    all_imgs = [img for c in cs for img in c['images']]
    sections = []
    for c in cs:
        s = f'{c["sid"]} {c["stitle"]}'.strip()
        if s and s not in sections:
            sections.append(s)

    md = [f'# {b["label"]}', '',
          f'**Source:** Naskah TA 04-05-26.pdf, halaman {page_range}',
          f'**Bab:** {cs[0]["bab"] or "-"}']
    if sections:
        md.append('**Sections covered:**')
        for s in sections:
            md.append(f'- {s}')
    if all_imgs:
        md.append('')
        md.append(f'**Images ({len(all_imgs)}):**')
        for p in all_imgs:
            md.append(f'- `{p}`')
    md += ['', '---', '']

    last_sid = None
    for c in cs:
        body = clean(c['text'])
        if not body:
            continue
        sid_now = c['sid']
        if sid_now != last_sid:
            md.append('')
            heading = f'## {sid_now} {c["stitle"]} (Page {c["page"]})' if sid_now else f'## (carry-over, Page {c["page"]})'
            md.append(heading)
            last_sid = sid_now
        else:
            md.append(f'### Page {c["page"]} (cont.)')
        if c['images']:
            md.append('')
            md.append('Images: ' + ', '.join(f'`{p}`' for p in c['images']))
        md.append('')
        md.append(body)
        md.append('')

    target = out / f'{cat_id}.md'
    target.write_text('\n'.join(md), encoding='utf-8')
    written.append((cat_id, b['label'], page_range, len(all_imgs), target.stat().st_size))

idx = ['# Naskah TA - Category Index', '',
       'Source: `Naskah TA 04-05-26.pdf` (62 pages, 18 images)',
       'Grouped per **section/topic**, not per page. In-page section splits handled.',
       '',
       '| Category | Topic | Pages | Images | Size |',
       '|----------|-------|-------|--------|------|']
for cat_id, label, pr, nimg, size in written:
    idx.append(f'| [{cat_id}.md]({cat_id}.md) | {label} | {pr} | {nimg} | {size // 1024}KB |')

idx += ['',
        '## Sequence Diagram task - relevant files',
        '',
        '- `08_use_case.md` - actor & use case definitions',
        '- `09_activity_diagram.md` - activity narratives (sequence mirrors these flows)',
        '- `10_sequence_diagram.md` - target placeholder (empty in naskah)',
        '- `11_class_diagram.md` - class structure for object/method names',
        '- `12_perancangan_data.md` - data model + table names',
        '- `../diagram/STANDARD.md` - drawio style spec',
        '- `../diagram/TODO.md` - sequence diagram specs (already written)',
        '']
(out / 'INDEX.md').write_text('\n'.join(idx), encoding='utf-8')

print('done. categories:')
for r in written:
    print(f'  {r[0]:30s} | pages {r[2]:7s} | {r[3]} imgs | {r[4] // 1024}KB')
