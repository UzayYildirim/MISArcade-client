/**
 * Audio utility functions for playing sound effects
 */

/**
 * Play the ticket won sound effect
 */
export function playTicketWonSound(): void {
  try {
    const audio = new Audio('/assets/audio/ticketwon.wav')
    audio.volume = 0.7 // Set a reasonable volume
    audio.play().catch((error) => {
      console.warn('Failed to play ticket won sound:', error)
    })
  } catch (error) {
    console.warn('Failed to create audio element for ticket won sound:', error)
  }
}

/**
 * Play a sound effect with optional volume control
 * @param soundPath - Path to the audio file
 * @param volume - Volume level (0.0 to 1.0)
 */
export function playSound(soundPath: string, volume: number = 0.7): void {
  try {
    const audio = new Audio(soundPath)
    audio.volume = Math.max(0, Math.min(1, volume)) // Clamp between 0 and 1
    audio.play().catch((error) => {
      console.warn(`Failed to play sound ${soundPath}:`, error)
    })
  } catch (error) {
    console.warn(`Failed to create audio element for ${soundPath}:`, error)
  }
}
