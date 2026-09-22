// frontend/src/utils/downloadFile.js
//
// Centralised browser download helpers.
//
// TWO DOWNLOAD SHAPES IN THE APP
// ------------------------------
// Callers download files in one of two ways:
//
//   • A Blob is already in memory (a JSON export assembled on the
//     client, or a fetch() response body). The download needs a
//     `URL.createObjectURL` round-trip.
//
//   • A URL points at a server-side route that returns a file
//     (a report, a CSV, a backup). The browser navigates to the URL
//     and the Content-Disposition header drives the filename; no
//     blob is involved.
//
// Both shapes were open-coded in several places, and one of them
// (QuestionCardActions) revoked the object URL immediately while
// another (ExportButtons) deferred revocation because an immediate
// revoke can cancel a download in Safari and in some Chromium
// builds. The two behaviours disagreed on the one point that
// matters.
//
// The helpers below resolve that disagreement once: object URLs are
// always revoked after a short delay, never immediately.

// The delay is 2000 ms. Empirically this is enough for the
// browser's download machinery to pick up the blob reference across
// the engines this app targets (Chromium, WebKit, Gecko). A shorter
// delay has been observed to cancel the download in Safari; a
// longer one delays freeing the memory for no benefit.
const REVOKE_DELAY_MS = 2000

/**
 * Trigger a download of an in-memory Blob.
 *
 * The object URL is revoked after `REVOKE_DELAY_MS` — never
 * immediately — because an immediate revoke can cancel the download
 * before the browser has read the blob.
 *
 * @param {Blob}   blob
 * @param {string} filename  what the browser names the saved file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}

/**
 * Trigger a download by navigating to a URL the server serves.
 *
 * The server's `Content-Disposition` header drives the saved
 * filename. The `filename` argument is a client-side hint used only
 * when the server does not set the header; passing it is optional
 * and safe.
 *
 * No blob URL is created, so no revocation is required.
 *
 * @param {string}  url
 * @param {string=} filename
 */
export function downloadUrl(url, filename) {
  const link = document.createElement('a')
  link.href = url
  if (filename) link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}