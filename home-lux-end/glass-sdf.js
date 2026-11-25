/* Based on glass-icon-reveal by zanwei (MIT License): https://github.com/zanwei/glass-icon-reveal */
const keyAlpha = (key) => (r, g, b) => Math.min(1, Math.max(0, (Math.hypot(r - key[0], g - key[1], b - key[2]) / 441 - 0.08) / 0.2))

function scan(d, TEX) {
  let opaque = true
  for (let i = 3; i < d.length; i += 4 * 97) if (d[i] < 250) { opaque = false; break }
  const key = [d[0], d[1], d[2]]
  const ka = keyAlpha(key)
  let x0 = TEX, y0 = TEX, x1 = -1, y1 = -1
  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const i = (y * TEX + x) * 4
      const a = opaque ? ka(d[i], d[i + 1], d[i + 2]) * 255 : d[i + 3]
      if (a > 8) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  return { opaque, key, x0, y0, x1, y1 }
}

function field(alpha, TEX) {
  const n = TEX * TEX
  const INF = 1e20
  const outer = new Float64Array(n)
  const inner = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const a = alpha[i * 4 + 3] / 255
    if (a >= 1) { outer[i] = 0; inner[i] = INF }
    else if (a <= 0) { outer[i] = INF; inner[i] = 0 }
    else {
      const dd = 0.5 - a
      outer[i] = dd > 0 ? dd * dd : 0
      inner[i] = dd < 0 ? dd * dd : 0
    }
  }
  const f = new Float64Array(TEX)
  const z = new Float64Array(TEX + 1)
  const v = new Uint16Array(TEX)
  edt(outer, f, v, z, INF, TEX)
  edt(inner, f, v, z, INF, TEX)
  const sdf = new Float32Array(n)
  for (let i = 0; i < n; i++) sdf[i] = (Math.sqrt(outer[i]) - Math.sqrt(inner[i])) / TEX
  return sdf
}

function edt(grid, f, v, z, INF, TEX) {
  for (let x = 0; x < TEX; x++) edt1d(grid, x, TEX, f, v, z, INF, TEX)
  for (let y = 0; y < TEX; y++) edt1d(grid, y * TEX, 1, f, v, z, INF, TEX)
}

function edt1d(grid, offset, stride, f, v, z, INF, TEX) {
  v[0] = 0
  z[0] = -INF
  z[1] = INF
  f[0] = grid[offset]
  for (let q = 1, k = 0, s = 0; q < TEX; q++) {
    f[q] = grid[offset + q * stride]
    const q2 = q * q
    do {
      const r = v[k]
      s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2
    } while (s <= z[k] && --k > -1)
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = INF
  }
  for (let q = 0, k = 0; q < TEX; q++) {
    while (z[k + 1] < q) k++
    const r = v[k]
    const qr = q - r
    grid[offset + q * stride] = f[r] + qr * qr
  }
}

self.onmessage = (e) => {
  const m = e.data
  try {
    if (m.step === "scan") {
      self.postMessage({ id: m.id, ...scan(new Uint8ClampedArray(m.pixels), m.tex) })
    } else if (m.step === "field") {
      const px = new Uint8ClampedArray(m.pixels)
      if (m.opaque) {
        const ka = keyAlpha(m.key)
        for (let i = 0; i < px.length; i += 4) px[i + 3] = Math.round(px[i + 3] * ka(px[i], px[i + 1], px[i + 2]))
      }
      const sdf = field(px, m.tex)
      self.postMessage({ id: m.id, sdf, pixels: m.opaque ? px.buffer : null }, m.opaque ? [sdf.buffer, px.buffer] : [sdf.buffer])
    }
  } catch (err) {
    self.postMessage({ id: m.id, error: String((err && err.message) || err) })
  }
}
