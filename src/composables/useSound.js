// frontend/src/composables/useSound.js
let _sharedAudioCtx = null

function getAudioContext() {
  if (!_sharedAudioCtx) {
    try {
      _sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      console.warn('AudioContext not supported:', e)
      return null
    }
  }

  if (_sharedAudioCtx.state === 'suspended') {
    _sharedAudioCtx.resume().catch((err) => {
      console.warn('AudioContext resume failed (user interaction required):', err)
    })
  }
  return _sharedAudioCtx
}

function play(freq = 440, duration = 0.1, type = 'sine') {
  try {
    const audioCtx = getAudioContext()
    if (!audioCtx) return
    if (audioCtx.state === 'closed') return
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = 0.05
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration)
    osc.stop(audioCtx.currentTime + duration)
  } catch (e) {
    /* ignore audio errors — sound is non-critical */
  }
}

export function useSound() {
  return {
    playCorrect: () => play(660, 0.15, 'sine'),
    playIncorrect: () => play(220, 0.2, 'square'),
    playClick: () => play(880, 0.05, 'sine'),
  }
}