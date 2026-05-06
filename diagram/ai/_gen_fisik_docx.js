const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat,
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };

const COL = [600, 2400, 1800, 3360, 1200];
const TBL_W = COL.reduce((a, b) => a + b, 0);

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts })],
    spacing: { after: 120 },
    ...(opts.paragraph || {}),
  });
}

function cell(text, opts = {}) {
  const widthIdx = opts.widthIdx ?? 0;
  return new TableCell({
    borders,
    width: { size: COL[widthIdx], type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: opts.header ? { fill: "D9E2F3", type: ShadingType.CLEAR } : undefined,
    verticalAlign: "center",
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text, bold: !!opts.header, size: 22 })],
    })],
  });
}

function headerRow() {
  return new TableRow({
    tableHeader: true,
    children: [
      cell("No", { header: true, align: AlignmentType.CENTER, widthIdx: 0 }),
      cell("Nama Field", { header: true, align: AlignmentType.CENTER, widthIdx: 1 }),
      cell("Tipe Data", { header: true, align: AlignmentType.CENTER, widthIdx: 2 }),
      cell("Panjang Karakter", { header: true, align: AlignmentType.CENTER, widthIdx: 3 }),
      cell("Constraint", { header: true, align: AlignmentType.CENTER, widthIdx: 4 }),
    ],
  });
}

function dataRow(no, field, type, length, constraint) {
  return new TableRow({
    children: [
      cell(String(no), { align: AlignmentType.CENTER, widthIdx: 0 }),
      cell(field, { widthIdx: 1 }),
      cell(type, { widthIdx: 2 }),
      cell(length, { widthIdx: 3 }),
      cell(constraint, { widthIdx: 4 }),
    ],
  });
}

function tableCaption(num, name) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 80 },
    children: [new TextRun({ text: `Tabel ${num} ${name}`, italics: true })],
  });
}

function tableHeader(num, title, pk, fkLines = []) {
  const lines = [
    new Paragraph({
      numbering: { reference: "list", level: 0 },
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: `Tabel ${title}`, bold: true })],
    }),
    new Paragraph({
      indent: { left: 720 },
      spacing: { after: 40 },
      children: [new TextRun({ text: `Nama Tabel: ${title}` })],
    }),
    new Paragraph({
      indent: { left: 720 },
      spacing: { after: 40 },
      children: [new TextRun({ text: `Primary Key: ${pk}` })],
    }),
  ];
  for (const fk of fkLines) {
    lines.push(new Paragraph({
      indent: { left: 720 },
      spacing: { after: 40 },
      children: [new TextRun({ text: `Foreign Key: ${fk}` })],
    }));
  }
  return lines;
}

function buildTable(rows) {
  return new Table({
    width: { size: TBL_W, type: WidthType.DXA },
    columnWidths: COL,
    rows: [headerRow(), ...rows.map((r, i) => dataRow(i + 1, ...r))],
  });
}

const tables = [
  {
    num: "4.6", title: "User", pk: "id_user", fk: [],
    rows: [
      ["id_user", "BIGINT", "20", "PK"],
      ["name", "VARCHAR", "255", ""],
      ["email", "VARCHAR", "255", "Unique"],
      ["password_hash", "VARCHAR", "255", ""],
      ["role", "ENUM", "'technician','manager','admin'", ""],
      ["is_active", "TINYINT", "1", "Default: 1"],
      ["created_at", "TIMESTAMP", "-", ""],
    ],
  },
  {
    num: "4.7", title: "Klien", pk: "id_klien", fk: [],
    rows: [
      ["id_klien", "BIGINT", "20", "PK"],
      ["name", "VARCHAR", "255", ""],
      ["address", "VARCHAR", "255", ""],
      ["phone", "VARCHAR", "20", ""],
      ["email", "VARCHAR", "255", ""],
      ["created_at", "TIMESTAMP", "-", ""],
    ],
  },
  {
    num: "4.8", title: "Penugasan Proyek", pk: "(id_proyek, id_user)",
    fk: ["id_proyek (terhubung dengan Proyek)", "id_user (terhubung dengan User)"],
    rows: [
      ["id_proyek", "BIGINT", "20", "PK, FK"],
      ["id_user", "BIGINT", "20", "PK, FK"],
      ["assigned_at", "TIMESTAMP", "-", ""],
    ],
  },
  {
    num: "4.9", title: "Proyek", pk: "id_proyek",
    fk: ["id_klien (terhubung dengan Klien)", "created_by (terhubung dengan User)"],
    rows: [
      ["id_proyek", "BIGINT", "20", "PK"],
      ["name", "VARCHAR", "255", ""],
      ["id_klien", "BIGINT", "20", "FK"],
      ["start_date", "DATE", "-", ""],
      ["end_date", "DATE", "-", ""],
      ["status", "ENUM", "'active','completed','on-hold'", "Default: active"],
      ["phase", "ENUM", "'survey','execution'", "Default: survey"],
      ["project_value", "DECIMAL", "15,2", ""],
      ["survey_approved", "TINYINT", "1", "Default: 0"],
      ["created_by", "BIGINT", "20", "FK"],
      ["created_at", "TIMESTAMP", "-", ""],
    ],
  },
  {
    num: "4.10", title: "Kesehatan Proyek", pk: "id_proyek",
    fk: ["id_proyek (terhubung dengan Proyek)"],
    rows: [
      ["id_proyek", "BIGINT", "20", "PK, FK"],
      ["spi_value", "DECIMAL", "5,2", ""],
      ["status", "ENUM", "'green','amber','red'", ""],
      ["deviation_percent", "DECIMAL", "5,2", ""],
      ["actual_progress", "DECIMAL", "5,2", ""],
      ["planned_progress", "DECIMAL", "5,2", ""],
      ["total_tasks", "INT", "11", ""],
      ["completed_tasks", "INT", "11", ""],
      ["last_updated", "TIMESTAMP", "-", ""],
    ],
  },
  {
    num: "4.11", title: "Tugas", pk: "id_tugas",
    fk: [
      "id_proyek (terhubung dengan Proyek)",
      "assigned_to (terhubung dengan User)",
      "created_by (terhubung dengan User)",
    ],
    rows: [
      ["id_tugas", "BIGINT", "20", "PK"],
      ["id_proyek", "BIGINT", "20", "FK"],
      ["name", "VARCHAR", "255", ""],
      ["assigned_to", "BIGINT", "20", "FK"],
      ["status", "ENUM", "'to_do','working_on_it','done'", "Default: to_do"],
      ["due_date", "DATE", "-", ""],
      ["sort_order", "INT", "11", ""],
      ["created_by", "BIGINT", "20", "FK"],
      ["created_at", "TIMESTAMP", "-", ""],
      ["updated_at", "TIMESTAMP", "-", ""],
    ],
  },
  {
    num: "4.12", title: "Bukti Tugas", pk: "id_bukti",
    fk: ["id_tugas (terhubung dengan Tugas)", "uploaded_by (terhubung dengan User)"],
    rows: [
      ["id_bukti", "BIGINT", "20", "PK"],
      ["id_tugas", "BIGINT", "20", "FK"],
      ["file_path", "VARCHAR", "500", ""],
      ["file_name", "VARCHAR", "255", ""],
      ["file_type", "ENUM", "'image','document','video'", ""],
      ["file_size", "INT", "11", ""],
      ["uploaded_by", "BIGINT", "20", "FK"],
      ["uploaded_at", "TIMESTAMP", "-", ""],
    ],
  },
  {
    num: "4.13", title: "Eskalasi", pk: "id_eskalasi",
    fk: [
      "id_proyek (terhubung dengan Proyek)",
      "id_tugas (terhubung dengan Tugas)",
      "reported_by (terhubung dengan User)",
    ],
    rows: [
      ["id_eskalasi", "BIGINT", "20", "PK"],
      ["id_proyek", "BIGINT", "20", "FK"],
      ["id_tugas", "BIGINT", "20", "FK"],
      ["reported_by", "BIGINT", "20", "FK"],
      ["title", "VARCHAR", "255", ""],
      ["description", "TEXT", "-", ""],
      ["priority", "ENUM", "'low','medium','high'", "Default: medium"],
      ["status", "ENUM", "'open','handled','closed'", "Default: open"],
      ["created_at", "TIMESTAMP", "-", ""],
    ],
  },
];

const children = [
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 200 },
    children: [new TextRun({ text: "4.3.3 Perancangan Fisik Basis Data", bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200 },
    indent: { firstLine: 720 },
    children: [new TextRun({
      text: "Perancangan model fisik basis data merupakan tahap terakhir dalam proses desain basis data. Pada tahap ini, skema logis atau model ERD yang telah dirancang sebelumnya diwujudkan menjadi basis data nyata dengan menggunakan perangkat lunak manajemen basis data (DBMS) yang dipilih. Tujuan utama dari perancangan fisik ini adalah untuk mencapai efisiensi dalam pemrosesan dan pengelolaan data. Berikut adalah perancangan model fisik basis data untuk manajemen proyek di PT SHI.",
    })],
  }),
];

for (const t of tables) {
  children.push(...tableHeader(t.num, t.title, t.pk, t.fk));
  children.push(tableCaption(t.num, t.title));
  children.push(buildTable(t.rows));
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Times New Roman" },
        paragraph: { spacing: { before: 200, after: 200 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [{
      reference: "list",
      levels: [{
        level: 0,
        format: LevelFormat.DECIMAL,
        text: "%1)",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("D:/__CODING/05-MyProjects/__IRENE/shi-crm/diagram/ai/4.3.3_PERANCANGAN_FISIK.docx", buf);
  console.log("OK");
});
