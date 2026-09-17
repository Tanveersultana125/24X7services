import PDFDocument from 'pdfkit'
import { getStorage } from 'firebase-admin/storage'
import { formatPaise, storagePaths, type Invoice } from '@app/shared'
import { adminApp } from './admin'

/**
 * The invoice as a file, for anyone who needs to hand it to an accountant.
 *
 * Everything on it comes from the invoice document, never from config read at
 * render time — the same rule the on-screen version follows, for the same
 * reason. Regenerating this PDF a year later has to produce the same document.
 *
 * It uses the built-in Helvetica rather than a bundled font. A font file would
 * have to survive the deploy and be found at a path that exists in the runtime,
 * and an invoice that fails to render because a .ttf moved is a worse trade
 * than plain type.
 */

const PAGE_MARGIN = 50
const INK = '#0a0a0a'
const MUTED = '#6b7280'
const RULE = '#e5e5e5'

export async function renderInvoicePdf(invoice: Invoice): Promise<string> {
  const buffer = await draw(invoice)
  const path = storagePaths.invoice(invoice.uid, invoice.id)

  await getStorage(adminApp())
    .bucket()
    .file(path)
    .save(buffer, {
      contentType: 'application/pdf',
      metadata: {
        // The customer reads this back through the app; nothing caches it
        // publicly, and the rules only let the owner read the path at all.
        cacheControl: 'private, max-age=3600',
      },
    })

  return path
}

function draw(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const width = doc.page.width - PAGE_MARGIN * 2
    const right = PAGE_MARGIN + width

    // --- Header -----------------------------------------------------------
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(20).text('TAX INVOICE')
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(MUTED)
      .text(`Invoice ${invoice.number}`)
      .text(new Date(invoice.issuedAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      }))

    doc.moveDown(1.2)

    // --- Parties ----------------------------------------------------------
    const partiesTop = doc.y
    const column = width / 2 - 10

    doc
      .fillColor(MUTED)
      .fontSize(8)
      .text('FROM', PAGE_MARGIN, partiesTop, { width: column })
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(invoice.seller.legalName, { width: column })
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(invoice.seller.address, { width: column })
      .text(`GSTIN: ${invoice.seller.gstin}`, { width: column })

    const fromBottom = doc.y

    doc
      .fillColor(MUTED)
      .fontSize(8)
      .text('TO', PAGE_MARGIN + column + 20, partiesTop, { width: column })
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(invoice.buyer.name, { width: column })
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(invoice.buyer.address, { width: column })

    doc.y = Math.max(fromBottom, doc.y) + 18
    rule(doc, right)

    // --- Lines ------------------------------------------------------------
    doc.moveDown(0.6)
    doc.fillColor(MUTED).fontSize(8).text('DESCRIPTION', PAGE_MARGIN, doc.y)
    doc.moveUp()
    doc.text('AMOUNT', PAGE_MARGIN, doc.y, { width, align: 'right' })
    doc.moveDown(0.4)
    rule(doc, right)
    doc.moveDown(0.5)

    for (const line of invoice.lines) {
      const top = doc.y
      doc
        .fillColor(INK)
        .font('Helvetica')
        .fontSize(10)
        .text(line.label, PAGE_MARGIN, top, { width: width - 120 })
      doc.text(formatPaise(line.amount), PAGE_MARGIN, top, {
        width,
        align: 'right',
      })
      doc.moveDown(0.5)
    }

    doc.moveDown(0.3)
    rule(doc, right)
    doc.moveDown(0.6)

    // --- Tax --------------------------------------------------------------
    const half = invoice.gstRate / 2
    total(doc, width, 'Taxable value', formatPaise(invoice.price.taxable), MUTED)
    if (invoice.price.igst > 0) {
      total(doc, width, `IGST @ ${invoice.gstRate}%`, formatPaise(invoice.price.igst), MUTED)
    } else {
      total(doc, width, `CGST @ ${half}%`, formatPaise(invoice.price.cgst), MUTED)
      total(doc, width, `SGST @ ${half}%`, formatPaise(invoice.price.sgst), MUTED)
    }

    doc.moveDown(0.3)
    rule(doc, right)
    doc.moveDown(0.5)
    total(doc, width, 'Total', formatPaise(invoice.price.total), INK, true)

    if (invoice.price.due > 0) {
      total(doc, width, 'Paid', formatPaise(invoice.price.paid), MUTED)
      total(doc, width, 'Due', formatPaise(invoice.price.due), INK, true)
    }

    // --- Footer -----------------------------------------------------------
    doc.moveDown(2)
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(`SAC code: ${invoice.sacCode}`, PAGE_MARGIN, doc.y, { width })
      .text(
        invoice.price.due > 0
          ? `Outstanding: ${formatPaise(invoice.price.due)}.`
          : 'Paid in full. Thank you.',
        { width }
      )
      .text('This is a computer-generated invoice and needs no signature.', {
        width,
      })

    doc.end()
  })
}

function rule(doc: PDFKit.PDFDocument, right: number): void {
  doc
    .strokeColor(RULE)
    .lineWidth(1)
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(right, doc.y)
    .stroke()
}

function total(
  doc: PDFKit.PDFDocument,
  width: number,
  label: string,
  value: string,
  colour: string,
  bold = false
): void {
  const top = doc.y
  doc
    .fillColor(colour)
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(bold ? 12 : 10)
    .text(label, PAGE_MARGIN, top, { width: width - 120 })
  doc.text(value, PAGE_MARGIN, top, { width, align: 'right' })
  doc.moveDown(0.4)
}
