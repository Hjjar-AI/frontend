// frontend/src/features/questions/composables/useRatingBatcher.js
//
// Shared, module-level batcher for the per-question rating fetch.
//
// USAGE
// -----
//   import { enqueueRating } from '../composables/useRatingBatcher'
//   const data = await enqueueRating(questionId)
//   // data is { question_id, user_rating, average, count } or null
//
// WHY THIS EXISTS
// ---------------
// QuestionCard used to call `GET /questions/<id>/rating/` on mount.
// On a list page with N cards that was N requests per render, on
// top of the list call that fetched the questions themselves. The
// batcher collects every id enqueued in the same tick and issues
// one `GET /questions/ratings/?ids=…` call.
//
// BATCHING WINDOW
// ---------------
// The flush is scheduled with `setTimeout(flush, 0)`, not with
// `queueMicrotask`. A list of N cards mounts inside a single Vue
// scheduler flush, but the `onMounted` hooks are not guaranteed to
// run within one synchronous frame if the list is large enough to
// trigger Vue's chunked rendering. A macrotask boundary is wide
// enough to capture every card that mounted in the same event-loop
// turn without adding noticeable latency.
//
// CHUNKING
// --------
// The server caps the id list at 500 (see QuestionRatingsBatchView).
// The batcher chunks above that limit. The current per-page card
// counts top out at 100 (PER_PAGE_OPTIONS), so chunking is a
// defensive measure against a future page-size increase rather than
// an active code path.
//
// DUPLICATE IDS
// -------------
// A single tick can enqueue the same id more than once — two
// components mounting the same question, a re-mounted card racing
// a pending flush, a virtualized list reusing ids. Each caller
// receives a distinct promise, and every waiter for a given id is
// resolved (or rejected) together when the batched response
// arrives.
//
// The previous implementation stored pending entries in a
// `Map<id, entry>` and overwrote on duplicate enqueue, leaving the
// first caller's promise permanently pending. The current shape
// keeps a flat list of waiters and groups them by id at flush time,
// so the map key is never a collision point.
//
// ERROR HANDLING
// --------------
// A failed chunk rejects every waiter grouped under the ids in that
// chunk. Callers that want to tolerate a failure (QuestionCard
// does) wrap the await in a try/catch. The batcher does not surface
// errors itself.

import { questionService } from '@/services/questionService'

const MAX_IDS_PER_REQUEST = 500

// Flat list of waiters. Each waiter is { id, resolve, reject }.
// Not a Map keyed by id: two enqueues of the same id must both be
// remembered, not one overwriting the other.
let pendingEntries = []
let scheduled = false

async function flush() {
  scheduled = false
  const entries = pendingEntries
  pendingEntries = []
  if (entries.length === 0) return

  // Group waiters by question id. Every waiter whose id lands in a
  // chunk is resolved (or rejected) together when that chunk's
  // response arrives. The wire request is still one call per chunk
  // of unique ids — grouping is purely a resolution-time concern,
  // it does not multiply the HTTP traffic.
  const waitersById = new Map()
  for (const e of entries) {
    if (!waitersById.has(e.id)) waitersById.set(e.id, [])
    waitersById.get(e.id).push(e)
  }
  const uniqueIds = Array.from(waitersById.keys())

  for (let i = 0; i < uniqueIds.length; i += MAX_IDS_PER_REQUEST) {
    const chunkIds = uniqueIds.slice(i, i + MAX_IDS_PER_REQUEST)
    try {
      const res = await questionService.batchRatings(chunkIds)
      const dataById = new Map()
      for (const it of (res?.items || [])) {
        dataById.set(it.question_id, it)
      }
      for (const id of chunkIds) {
        const data = dataById.get(id) || null
        for (const waiter of waitersById.get(id)) {
          waiter.resolve(data)
        }
      }
    } catch (err) {
      for (const id of chunkIds) {
        for (const waiter of waitersById.get(id)) {
          waiter.reject(err)
        }
      }
    }
  }
}

export function enqueueRating(id) {
  return new Promise((resolve, reject) => {
    pendingEntries.push({ id, resolve, reject })
    if (!scheduled) {
      scheduled = true
      setTimeout(flush, 0)
    }
  })
}