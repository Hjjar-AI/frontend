import { reactive, ref } from 'vue'

/**
 * Consistent form-validation timing:
 * - a field stays quiet until blur;
 * - after blur it validates while the user edits;
 * - submit reveals and validates every field.
 *
 * Validators return an empty string when valid, or a localized message.
 */
export function useFormValidation(validators) {
  const errors = reactive({})
  const touched = reactive({})
  const submitted = ref(false)

  for (const name of Object.keys(validators)) {
    errors[name] = ''
    touched[name] = false
  }

  function validateField(name) {
    const validator = validators[name]
    if (!validator) return true
    errors[name] = validator() || ''
    return !errors[name]
  }

  function touch(name) {
    touched[name] = true
    return validateField(name)
  }

  function revalidate(name) {
    if (touched[name] || submitted.value) return validateField(name)
    return true
  }

  function validateAll() {
    submitted.value = true
    let valid = true
    for (const name of Object.keys(validators)) {
      touched[name] = true
      if (!validateField(name)) valid = false
    }
    return valid
  }

  function clearField(name) {
    if (name in errors) errors[name] = ''
  }

  function resetValidation() {
    submitted.value = false
    for (const name of Object.keys(validators)) {
      errors[name] = ''
      touched[name] = false
    }
  }

  return {
    errors,
    touched,
    submitted,
    validateField,
    validateAll,
    touch,
    revalidate,
    clearField,
    resetValidation,
  }
}
