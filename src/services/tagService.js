// frontend/src/services/tagService.js
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const tagService = {
  /**
   * List all tags with question counts.
   *
   * Was two methods (list + listAdminTags) hitting two endpoints
   * that returned byte-identical payloads. The admin endpoint has
   * been removed; both call sites now use this one.
   */
  list() {
    return apiClient.get(ENDPOINTS.QUESTIONS.TAGS)
  },

  /**
   * Hierarchical tag tree built from the self-referential `parent`
   * FK. Requires 'questions.manage_tags'.
   *
   * Returns `{ tree: [{ id, name, children: [...] }, ...] }`.
   *
   * Was previously called inline from Tags.vue via `apiClient.get`
   * against `ENDPOINTS.ADMIN.TAGS_TREE`. The URL is unchanged; the
   * call now goes through the service layer like every other tag
   * operation.
   */
  getTree() {
    return apiClient.get(ENDPOINTS.ADMIN.TAGS_TREE)
  },

  renameTag(oldName, newName) {
    return apiClient.post(ENDPOINTS.ADMIN.TAG_RENAME(oldName), { new_name: newName })
  },
  deleteTag(name) {
    return apiClient.delete(ENDPOINTS.ADMIN.TAG_DELETE(name))
  },
  mergeTags(sourceTags, targetTag) {
    return apiClient.post(ENDPOINTS.ADMIN.TAG_MERGE, { source_tags: sourceTags, target_tag: targetTag })
  },
}