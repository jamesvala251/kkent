import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSrc from '../assets/logo.png';
import type { Challan } from '../types';

interface CompanyInfo {
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
}

type PdfMode = 'download' | 'print';

let cachedLogo: { dataUrl: string; width: number; height: number } | null = null;

async function loadLogoImage(): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (cachedLogo) return cachedLogo;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Downscale large logo for PDF size / performance
        const maxPx = 800;
        const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        cachedLogo = {
          dataUrl: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
        };
        resolve(cachedLogo);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = logoSrc;
  });
}

async function buildChallanPdf(
  challan: Challan,
  company?: CompanyInfo,
  options?: { title?: string; filePrefix?: string },
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const docTitle = options?.title || 'DELIVERY CHALLAN';
  const filePrefix = options?.filePrefix || 'Challan';

  const address = company?.address || '';
  const phone = company?.phone || '';
  const email = company?.email || '';
  const gst = company?.gst_number || '';

  const logo = await loadLogoImage();
  let y = 8;

  if (logo) {
    const maxH = 18;
    const maxW = 70;
    const ratio = logo.width / logo.height;
    let h = maxH;
    let w = h * ratio;
    if (w > maxW) {
      w = maxW;
      h = w / ratio;
    }
    doc.addImage(logo.dataUrl, 'PNG', (pageWidth - w) / 2, y, w, h);
    y += h + 3;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(26, 35, 126);
    doc.text(company?.company_name || 'KK Enterprise', pageWidth / 2, 14, { align: 'center' });
    y = 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60);
  if (address) {
    doc.text(address, pageWidth / 2, y, { align: 'center', maxWidth: pageWidth - 40 });
    y += 5;
  }
  const contactLine = [phone && `Phone: ${phone}`, email && `Email: ${email}`].filter(Boolean).join('  |  ');
  if (contactLine) {
    doc.text(contactLine, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }
  if (gst) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${gst}`, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  y += 2;
  doc.setDrawColor(26, 35, 126);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 35, 126);
  doc.text(docTitle, pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(0);
  const leftX = margin;
  const midX = pageWidth * 0.45;
  const rightX = pageWidth * 0.72;
  const dateStr = (challan.date || '').toString().split('T')[0];

  const drawLabelValue = (label: string, value: string, x: number, yy: number, maxW = 70) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, yy);
    doc.setFont('helvetica', 'normal');
    const labelW = doc.getTextWidth(`${label}: `);
    doc.text(value || '-', x + labelW, yy, { maxWidth: maxW });
  };

  const consigneeBlock = [challan.consignee, challan.consignee_address].filter(Boolean).join('\n');
  doc.setFont('helvetica', 'bold');
  doc.text('Consignee Name & Address:', leftX, y);
  doc.setFont('helvetica', 'normal');
  const consigneeLines = doc.splitTextToSize(consigneeBlock || '-', 100);
  doc.text(consigneeLines, leftX, y + 4);

  drawLabelValue('Delivery Challan No.', challan.challan_no, midX, y, 55);
  drawLabelValue('Date', dateStr, rightX, y, 40);

  y += Math.max(12, consigneeLines.length * 4 + 4);
  drawLabelValue('Consignee GST No.', challan.consignee_gst || '-', leftX, y, 80);
  drawLabelValue('Dispatched From', challan.dispatched_from || '-', midX, y, 90);
  y += 6;

  drawLabelValue('Transporter', challan.transporter || '-', leftX, y, 70);
  drawLabelValue('Vehicle No.', challan.vehicle_no || '-', midX, y, 40);
  drawLabelValue('LR No.', challan.lr_no || '-', rightX, y, 40);
  y += 6;

  drawLabelValue('PO No.', challan.po_no || '-', leftX, y, 50);
  drawLabelValue('E-Way Bill No.', challan.e_way_bill_no || '-', midX, y, 50);
  drawLabelValue('Prepared By', challan.prepared_by || '-', rightX, y, 50);
  y += 8;

  const lines = Array.isArray(challan.item_table)
    ? challan.item_table
    : (typeof challan.item_table === 'string'
      ? (JSON.parse(challan.item_table || '[]') as Challan['item_table'])
      : []);
  const body = lines.map((line, idx) => [
    String(idx + 1),
    line.name,
    line.hsn || '1234567',
    line.unit,
    Number(line.weight).toFixed(3),
    Number(line.rate).toFixed(2),
    Number(line.amount).toFixed(2),
  ]);

  const subtotal = Number(challan.subtotal ?? lines.reduce((s, l) => s + Number(l.amount), 0));
  const cgst = Number(challan.cgst ?? subtotal * 0.09);
  const sgst = Number(challan.sgst ?? subtotal * 0.09);
  const total = Number(challan.total ?? subtotal + cgst + sgst);

  autoTable(doc, {
    startY: y,
    head: [['Sr. No.', 'Product Description', 'HSN No.', 'Unit', 'Weight', 'Rate', 'Amount']],
    body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [26, 35, 126], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 16,halign: 'center' },
      3: {halign: 'center' },
      4: {halign: 'right' },
      5: {halign: 'right' },
      6: {halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error autotable extends jsPDF
  const finalY = (doc.lastAutoTable?.finalY || y + 20) + 4;
  const totalsX = pageWidth - margin - 70;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal:', totalsX, finalY);
  doc.text(subtotal.toFixed(2), pageWidth - margin, finalY, { align: 'right' });
  doc.text('CGST 9%:', totalsX, finalY + 5);
  doc.text(cgst.toFixed(2), pageWidth - margin, finalY + 5, { align: 'right' });
  doc.text('SGST 9%:', totalsX, finalY + 10);
  doc.text(sgst.toFixed(2), pageWidth - margin, finalY + 10, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', totalsX, finalY + 16);
  doc.text(total.toFixed(2), pageWidth - margin, finalY + 16, { align: 'right' });

  const footerY = Math.min(finalY + 30, doc.internal.pageSize.getHeight() - 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Terms & Conditions', leftX, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('1. Goods once dispatched will not be taken back.', leftX, footerY + 5);
  doc.text('2. Subject to jurisdiction of local courts.', leftX, footerY + 9);
  doc.text('3. Please check goods at the time of delivery.', leftX, footerY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('(Authorised Signatory)', pageWidth - margin, footerY + 13, { align: 'right' });

  const safeName = (challan.challan_no || 'challan').replace(/\//g, '-');
  return { doc, filename: `${filePrefix}_${safeName}.pdf` };
}

function outputPdf(doc: jsPDF, filename: string, mode: PdfMode = 'download') {
  if (mode === 'print') {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
    return;
  }
  doc.save(filename);
}

export async function downloadChallanPdf(challan: Challan, company?: CompanyInfo, mode: PdfMode = 'download') {
  const { doc, filename } = await buildChallanPdf(challan, company, {
    title: 'DELIVERY CHALLAN',
    filePrefix: 'Challan',
  });
  outputPdf(doc, filename, mode);
}

export async function downloadBiltyPdf(challan: Challan, company?: CompanyInfo, mode: PdfMode = 'download') {
  const { doc, filename } = await buildChallanPdf(challan, company, {
    title: 'BILTY / LORRY RECEIPT',
    filePrefix: 'Bilty',
  });
  outputPdf(doc, filename, mode);
}

export function exportChallanExcel(challan: Challan) {
  const lines = Array.isArray(challan.item_table)
    ? challan.item_table
    : (typeof challan.item_table === 'string'
      ? (JSON.parse(challan.item_table || '[]') as Challan['item_table'])
      : []);
  const headers = [
    'Challan No', 'Date', 'Consignee', 'Transporter', 'Vendor', 'Dispatched From',
    'LR No', 'PO No', 'Vehicle No', 'E-Way Bill No', 'Prepared By',
    'Sr No', 'Product', 'HSN', 'Unit', 'Weight', 'Rate', 'Amount',
  ];

  const rows = lines.length
    ? lines.map((line, idx) => [
        challan.challan_no,
        (challan.date || '').toString().split('T')[0],
        challan.consignee,
        challan.transporter,
        challan.vendor,
        challan.dispatched_from,
        challan.lr_no || '',
        challan.po_no || '',
        challan.vehicle_no || '',
        challan.e_way_bill_no || '',
        challan.prepared_by || '',
        String(idx + 1),
        line.name,
        line.hsn || '1234567',
        line.unit,
        Number(line.weight).toFixed(3),
        Number(line.rate).toFixed(2),
        Number(line.amount).toFixed(2),
      ])
    : [[
        challan.challan_no,
        (challan.date || '').toString().split('T')[0],
        challan.consignee,
        challan.transporter,
        challan.vendor,
        challan.dispatched_from,
        challan.lr_no || '',
        challan.po_no || '',
        challan.vehicle_no || '',
        challan.e_way_bill_no || '',
        challan.prepared_by || '',
        '', '', '', '', '', '', '',
      ]];

  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (challan.challan_no || 'challan').replace(/\//g, '-');
  link.href = url;
  link.download = `Challan_${safeName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
