/**
 * draw.io file decoding: the bytes a document preview receives become the
 * mxGraph XML that a renderer consumes.
 *
 * A `.drawio` file holds either plain mxGraph XML or that same XML escaped,
 * raw-DEFLATE compressed, and base64 encoded by draw.io's own save path. Both
 * forms are decoded here so the renderer only ever sees XML.
 *
 * Inflating uses `fflate` rather than the platform `DecompressionStream`: the
 * platform stream reports a corrupt body through an internal rejection that
 * escapes as an unhandled error, and a malformed file must surface as a
 * rejection of this function instead.
 */
import { inflateSync, strFromU8 } from 'fflate'

/**
 * Base64 alphabet plus the padding an encoder may add. `<`, `>`, and whitespace
 * fall outside it, so membership separates a compressed body from raw XML
 * without depending on a particular zlib header.
 */
const BASE64 = /^[\d+/A-Za-z=]+$/u

/** Base64 alphabet in index order, matching the value each character encodes. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Raised when the bytes are neither mxGraph XML nor a decodable drawio payload. */
export class DrawioParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DrawioParseError'
  }
}

/**
 * Decode base64 to bytes without depending on a host global.
 *
 * `fflate`'s own string input is not used here: its base64 mode yields a
 * different byte sequence than the encoded payload, which then fails to inflate.
 * @param text - base64 text accepted by `BASE64`, optionally padded.
 * @returns exactly the decoded bytes.
 */
function fromBase64(text: string): Uint8Array {
  // Sizing from the characters that carry data keeps the result exact, so no
  // truncating view is needed and padding needs no special case.
  let length = 0
  for (const character of text) {
    if (character !== '=') length += 1
  }
  const bytes = new Uint8Array((length * 3) >> 2)
  let bits = 0
  let accumulated = 0
  let index = 0
  for (const character of text) {
    if (character === '=') break
    accumulated = (accumulated << 6) | ALPHABET.indexOf(character)
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes[index++] = (accumulated >> bits) & 0xFF
    }
  }
  return bytes
}

/**
 * Reverse draw.io's base64 + raw-DEFLATE + percent-escape encoding.
 * @param payload - base64 diagram body accepted by `BASE64`.
 * @returns the diagram XML text.
 * @throws DrawioParseError when the body is not valid DEFLATE.
 */
function inflateXml(payload: string): string {
  let escaped: string
  try {
    // drawio percent-escapes before deflating, so the inflated bytes are ASCII
    // and `strFromU8`'s Latin-1 mode preserves them one byte per character.
    escaped = strFromU8(inflateSync(fromBase64(payload)), true)
  } catch {
    // inflateSync throws for any body that is not a complete DEFLATE stream.
    throw new DrawioParseError('drawio: compressed body is not a valid DEFLATE stream')
  }
  try {
    return decodeURIComponent(escaped)
  } catch {
    // A stray `%` means the body was never percent-escaped; the raw text is then the XML.
    return escaped
  }
}

/**
 * Read the diagram XML out of a `.drawio` file.
 * @param data - complete file bytes as delivered by the document owner.
 * @returns the mxGraph XML text.
 * @throws DrawioParseError when the bytes carry no recognizable diagram.
 */
export function decodeDrawioXml(data: Uint8Array<ArrayBuffer>): string {
  const text = new TextDecoder().decode(data).replace(/^\uFEFF/u, '').trim()
  if (text === '') throw new DrawioParseError('drawio: file is empty')
  if (text.includes('<mxGraphModel') || text.includes('<mxfile')) return text
  if (BASE64.test(text)) return inflateXml(text)
  throw new DrawioParseError('drawio: no mxGraphModel element found')
}
