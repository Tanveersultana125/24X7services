/**
 * A short two-note alert, synthesised so the app ships no audio file. Browsers
 * refuse to start audio before the first tap on the page; that failure is
 * silent and the visual alert still shows.
 */
export function chime(urgent = false) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const notes = urgent ? [988, 740, 988, 740] : [660, 880]
    notes.forEach((f, i) => {
      const t = ctx.currentTime + i * 0.18
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.17)
    })
    setTimeout(() => void ctx.close(), notes.length * 180 + 200)
  } catch {
    /* no audio on this device */
  }
}
