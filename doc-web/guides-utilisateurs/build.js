// Générateur des guides utilisateurs CÈCHÉMOI (docx).
// Usage : node build.js boutique|crm  -> out/<fichier>.docx
const fs = require('fs');
const path = require('path');
const sizeOf = (f) => {
  const { execSync } = require('child_process');
  const o = execSync(`sips -g pixelWidth -g pixelHeight "${f}"`).toString();
  return { w: +o.match(/pixelWidth: (\d+)/)[1], h: +o.match(/pixelHeight: (\d+)/)[1] };
};
const {
  Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType,
  Header, Footer, PageNumber, LevelFormat, BorderStyle, ShadingType, Table, TableRow,
  TableCell, WidthType, PageBreak, TabStopType,
} = require('docx');

const BRAND = '8B5230';
const BRAND_LIGHT = 'FBF1E9';
const INK = '1F2937';
const MUTED = '6B7280';
const FONT = 'Calibri';
const SHOTS = path.join(__dirname, 'shotsj');
const LOGO = '/Users/juste/Desktop/DOSSIER-BUREAU/PROJETS-ENCOURS/0-CECHEMOI-COM/public/logo/web/icon-512.png';
const TEXT_W_PX = 620; // largeur utile ≈ 16,4 cm

// **gras** dans les chaînes
function runs(text, base = {}) {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) =>
    t.startsWith('**')
      ? new TextRun({ text: t.slice(2, -2), bold: true, ...base })
      : new TextRun({ text: t, ...base }));
}

let listInstance = 0;
function render(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b.h1) {
      out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: !b.noBreak, children: [new TextRun(b.h1)] }));
      if (b.lead) out.push(new Paragraph({ spacing: { after: 200 }, children: runs(b.lead, { color: MUTED, size: 23, italics: true }) }));
    } else if (b.h2) {
      out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: [new TextRun(b.h2)] }));
    } else if (b.h3) {
      out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, children: [new TextRun(b.h3)] }));
    } else if (b.p) {
      out.push(new Paragraph({ spacing: { after: 120 }, children: runs(b.p) }));
    } else if (b.steps) {
      const inst = ++listInstance;
      b.steps.forEach((s) => out.push(new Paragraph({
        numbering: { reference: 'steps', level: 0, instance: inst },
        spacing: { after: 80 }, children: runs(s),
      })));
    } else if (b.bullets) {
      b.bullets.forEach((s) => out.push(new Paragraph({
        numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: runs(s),
      })));
    } else if (b.img) {
      const f = path.join(SHOTS, b.img.replace(/\.(png|jpg)$/, '.jpg'));
      const { w, h } = sizeOf(f);
      const width = b.width || TEXT_W_PX;
      out.push(new Paragraph({
        alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 40 },
        children: [new ImageRun({
          type: f.endsWith('.png') ? 'png' : 'jpg', data: fs.readFileSync(f),
          transformation: { width, height: Math.round((width * h) / w) },
        })],
      }));
      if (b.cap) out.push(new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 220 },
        children: [new TextRun({ text: b.cap, italics: true, size: 18, color: MUTED })],
      }));
    } else if (b.note || b.warn) {
      const warn = !!b.warn;
      const n = b.note || b.warn;
      const fill = warn ? 'FDECEC' : BRAND_LIGHT;
      const bar = warn ? 'C0392B' : BRAND;
      const lines = Array.isArray(n.text) ? n.text : [n.text];
      const border = { left: { style: BorderStyle.SINGLE, size: 24, color: bar, space: 8 } };
      out.push(new Paragraph({
        shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, border, keepNext: true,
        spacing: { before: 120, after: 0 }, indent: { left: 160, right: 160 },
        children: [new TextRun({ text: n.title || (warn ? 'Attention' : 'À savoir'), bold: true, color: bar })],
      }));
      lines.forEach((l, i) => out.push(new Paragraph({
        shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, border,
        indent: { left: 160, right: 160 }, keepNext: i < lines.length - 1,
        spacing: { after: i === lines.length - 1 ? 200 : 40 }, children: runs(l),
      })));
    } else if (b.table) {
      const { head, rows, widths } = b.table;
      const total = 9360;
      const cols = widths || head.map(() => Math.floor(total / head.length));
      const border = { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' };
      const borders = { top: border, bottom: border, left: border, right: border };
      const cell = (t, i, isHead) => new TableCell({
        borders, width: { size: cols[i], type: WidthType.DXA },
        shading: isHead ? { type: ShadingType.CLEAR, fill: BRAND, color: 'auto' } : undefined,
        margins: { top: 70, bottom: 70, left: 110, right: 110 },
        children: [new Paragraph({ children: runs(t, isHead ? { bold: true, color: 'FFFFFF' } : {}) })],
      });
      out.push(new Table({
        width: { size: cols.reduce((a, c) => a + c, 0), type: WidthType.DXA }, columnWidths: cols,
        rows: [
          new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, i, true)) }),
          ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, i, false)) })),
        ],
      }));
      out.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
    } else if (b.pb) {
      out.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }
  return out;
}

function cover(meta) {
  return [
    new Paragraph({ spacing: { before: 1400 }, alignment: AlignmentType.CENTER, children: [
      new ImageRun({ type: 'png', data: fs.readFileSync(LOGO), transformation: { width: 190, height: 190 } }),
    ] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500, after: 120 }, children: [
      new TextRun({ text: meta.kicker, size: 24, color: MUTED, allCaps: true, characterSpacing: 40 }),
    ] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
      new TextRun({ text: meta.title, size: 60, bold: true, color: BRAND }),
    ] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 }, children: [
      new TextRun({ text: meta.subtitle, size: 26, color: INK }),
    ] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: 'Espace de gestion : gestion.cechemoi.com', size: 22, color: INK }),
    ] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [
      new TextRun({ text: meta.version, size: 20, color: MUTED }),
    ] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200 }, children: [
      new TextRun({ text: 'Document interne à l’équipe CÈCHÉMOI — ne pas diffuser à l’extérieur.', size: 18, italics: true, color: MUTED }),
    ] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: 'Les noms et numéros visibles sur les captures sont des exemples fictifs.', size: 18, italics: true, color: MUTED }),
    ] }),
  ];
}

function toc(blocks) {
  const items = blocks.filter((b) => b.h1);
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun('Sommaire')] }),
    ...items.map((b, i) => new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: `${i + 1}.  `, bold: true, color: BRAND, size: 24 }),
        new TextRun({ text: b.h1.replace(/^\d+\.\s*/, ''), size: 24 }),
        ...(b.lead ? [new TextRun({ text: '  —  ' + b.lead.replace(/\*\*/g, ''), size: 19, color: MUTED })] : []),
      ],
    })),
  ];
}

async function build(which) {
  const meta = require(`./content-${which}.js`);
  // numérote les titres de chapitre
  let n = 0;
  meta.blocks.forEach((b) => { if (b.h1) b.h1 = `${++n}. ${b.h1}`; });
  const doc = new Document({
    creator: 'CÈCHÉMOI', title: meta.title, description: meta.subtitle,
    styles: {
      default: { document: { run: { font: FONT, size: 22, color: INK } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 36, bold: true, color: BRAND, font: FONT },
          paragraph: { spacing: { before: 0, after: 160 }, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND, space: 6 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, color: INK, font: FONT },
          paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, color: BRAND, font: FONT },
          paragraph: { spacing: { before: 220, after: 80 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'steps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { run: { bold: true, color: BRAND }, paragraph: { indent: { left: 460, hanging: 360 } } } }] },
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { run: { color: BRAND }, paragraph: { indent: { left: 460, hanging: 300 } } } }] },
    ] },
    sections: [
      { properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: cover(meta) },
      {
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 }, pageNumbers: { start: 2 } } },
        headers: { default: new Header({ children: [new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: 9638 }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB', space: 4 } },
          children: [
            new TextRun({ text: 'CÈCHÉMOI', bold: true, color: BRAND, size: 18 }),
            new TextRun({ text: `\t${meta.title}`, color: MUTED, size: 18 }),
          ] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: 'Page ', color: MUTED, size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 18 }),
          new TextRun({ text: ' / ', color: MUTED, size: 18 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], color: MUTED, size: 18 }),
        ] })] }) },
        children: [...toc(meta.blocks), ...render(meta.blocks)],
      },
    ],
  });
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  const file = path.join(__dirname, 'out', meta.file);
  fs.writeFileSync(file, await Packer.toBuffer(doc));
  console.log(file);
}

build(process.argv[2]).catch((e) => { console.error(e); process.exit(1); });
