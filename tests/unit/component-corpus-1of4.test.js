// frontend/tests/unit/component-corpus-1of4.test.js
//
// Shard 1 of 4 for the component corpus.
//
// The shards split the mount pass across four Vitest workers. Each
// file is a single call to the shared runner; see
// `tests/helpers/componentCorpus.js` for the mount logic and the
// rationale for sharding.
import { runComponentCorpusTest } from '../helpers/componentCorpus'

runComponentCorpusTest(0, 4)