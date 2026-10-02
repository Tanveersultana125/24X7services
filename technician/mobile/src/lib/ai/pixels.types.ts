/** A photo scaled down for analysis: RGBA bytes plus the original size. */
export interface Pixels {
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
  data: Uint8Array | Uint8ClampedArray
}
