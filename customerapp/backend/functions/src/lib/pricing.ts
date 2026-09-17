import {
  halveGst,
  splitGstInclusive,
  type BusinessConfig,
  type CatalogService,
  type PriceBreakdown,
} from '@app/shared'

/**
 * The one place a booking's money is worked out.
 *
 * Everything the customer is quoted is the amount they pay, so GST is carved
 * out of the total rather than added on top — which is what "no hidden charges"
 * has to mean in practice. The split is floored on the taxable value and the
 * remainder goes to tax, so `taxable + cgst + sgst + igst` reconstructs the
 * total exactly and never lands a paisa off.
 */

export interface PriceInputs {
  service: Pick<CatalogService, 'visitFee'>
  config: Pick<BusinessConfig, 'gstRate'>
  /** Approved repair lines. Zero at booking; the approval flow raises it. */
  additional?: number
  discount?: number
  paid?: number
  /**
   * True when the supply crosses a state line, which makes it IGST instead of
   * CGST plus SGST.
   *
   * DECISION NEEDED: every area we service today is in Telangana, and the
   * seller is too, so this is always false. `serviceAreas` carries no state
   * code — the day the business crosses a border, one has to be added there
   * and compared with `config.stateCode`, or every invoice from that day
   * carries the wrong tax heads.
   */
  interState?: boolean
}

export function priceBooking({
  service,
  config,
  additional = 0,
  discount = 0,
  paid = 0,
  interState = false,
}: PriceInputs): PriceBreakdown {
  const gross = service.visitFee + additional
  // A discount can never turn into money owed to the customer.
  const total = Math.max(0, gross - discount)

  const { taxable, tax } = splitGstInclusive(total, config.gstRate)
  const { cgst, sgst } = interState
    ? { cgst: 0, sgst: 0 }
    : halveGst(tax)

  return {
    visitFee: service.visitFee,
    additional,
    discount,
    taxable,
    cgst,
    sgst,
    igst: interState ? tax : 0,
    total,
    paid,
    due: Math.max(0, total - paid),
  }
}
