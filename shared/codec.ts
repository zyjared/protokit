import { Buffer } from 'node:buffer'

export function isBuffer(raw: any): raw is Buffer {
  return raw instanceof Buffer
}

export function isBase64(raw: any): boolean {
  return raw.includes('base64,')
}

export function toBufferFromBase64(raw: any) {
  const isBase64 = raw.indexOf('base64,')
  if (isBase64 === -1) {
    return null
  }
  const base64Data = raw.slice(isBase64 + 7).trim()
  return Buffer.from(base64Data, 'base64')
}

export function isHex(raw: any): boolean {
  const c = raw.replace(/\s/g, '')
  return /^[0-9a-f]*$/i.test(c) && c.length % 2 === 0
}

export function toBufferFromHex(raw: any) {
  return isHex(raw) ? Buffer.from(raw.replace(/\s/g, ''), 'hex') : null
}

export function toBuffer(raw: any) {
  if (isBuffer(raw)) {
    return raw
  }

  if (typeof raw === 'string') {
    const funcs = [
      [isBase64, toBufferFromBase64],
      [isHex, toBufferFromHex],
    ] as const

    for (const [func, decoder] of funcs) {
      if (func(raw)) {
        return decoder(raw)
      }
    }
  }

  return null
}
