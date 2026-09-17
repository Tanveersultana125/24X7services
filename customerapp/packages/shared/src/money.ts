import { z } from 'zod'

/**
 * Money is a whole number of paise everywhere it is stored, sent or computed.
 * Rupees exist only in what a person reads, which is why the only rupee-facing
 * function here returns a string. Nothing in the app should ever do arithmetic
 * on a float amount.
 */

export const paiseSchema = z
  .number()
  .int('Amounts must be a whole number of paise')
  .min(0, 'Amounts cannot be negative')
  .max(100_000_000, 'Amount is implausibly large')

export type Paise = number

export function rupeesToPaise(rupees: number): Paise {
  return Math.round(rupees * 100)
}

export function paiseToRupees(paise: Paise): number {
  return paise / 100
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const INR_WITH_PAISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Render an amount for display. Whole rupees are shown without decimals because
 * that is how prices read on a bill here; an amount with paise keeps both
 * digits so a GST split never appears to have lost a rounding remainder.
 */
export function formatPaise(paise: Paise): string {
  return paise % 100 === 0
    ? INR.format(paiseToRupees(paise))
    : INR_WITH_PAISE.format(paiseToRupees(paise))
}

export function sumPaise(amounts: readonly Paise[]): Paise {
  return amounts.reduce((total, amount) => total + amount, 0)
}

/**
 * Split a GST-inclusive total into its taxable value and tax. Everything the
 * customer is quoted is the amount they pay, so the tax is carved out of it
 * rather than added on top.
 *
 * The taxable value is floored and the tax takes the remainder, so
 * `taxable + tax` is always exactly the total and never a paisa off.
 */
export function splitGstInclusive(
  totalPaise: Paise,
  gstRatePercent: number
): { taxable: Paise; tax: Paise } {
  const taxable = Math.floor((totalPaise * 100) / (100 + gstRatePercent))
  return { taxable, tax: totalPaise - taxable }
}

/**
 * Halve a GST amount into CGST and SGST for an intra-state supply. The odd
 * paisa goes to CGST so the two halves still add back to the whole.
 */
export function halveGst(taxPaise: Paise): { cgst: Paise; sgst: Paise } {
  const sgst = Math.floor(taxPaise / 2)
  return { cgst: taxPaise - sgst, sgst }
}
