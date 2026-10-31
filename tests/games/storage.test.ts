import { describe, expect, it, beforeEach } from 'vitest'
import { getGameBest, saveGameBestIfNew, gameBestKey, GAME_ID } from '@/lib/games/storage'

describe('games storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(getGameBest(GAME_ID.numberSequence, 'score')).toBeNull()
  })

  it('persists and reads back a best score', () => {
    saveGameBestIfNew(GAME_ID.binaryHex, 'score', 80)
    expect(getGameBest(GAME_ID.binaryHex, 'score')).toBe(80)
    expect(window.localStorage.getItem(gameBestKey(GAME_ID.binaryHex, 'score'))).toBe('80')
  })

  it('does not overwrite an existing best with a lower value', () => {
    saveGameBestIfNew(GAME_ID.binaryHex, 'score', 80)
    const isNew = saveGameBestIfNew(GAME_ID.binaryHex, 'score', 30)
    expect(isNew).toBe(false)
    expect(getGameBest(GAME_ID.binaryHex, 'score')).toBe(80)
  })

  it('overwrites with a higher value and reports a new best', () => {
    saveGameBestIfNew(GAME_ID.mathChallenge, 'score', 50)
    const isNew = saveGameBestIfNew(GAME_ID.mathChallenge, 'score', 120)
    expect(isNew).toBe(true)
    expect(getGameBest(GAME_ID.mathChallenge, 'score')).toBe(120)
  })

  it('rejects non-finite and negative values', () => {
    expect(saveGameBestIfNew(GAME_ID.mathChallenge, 'score', 50)).toBe(true)
    expect(saveGameBestIfNew(GAME_ID.mathChallenge, 'score', -5)).toBe(false)
    expect(saveGameBestIfNew(GAME_ID.mathChallenge, 'score', Number.NaN)).toBe(false)
    expect(saveGameBestIfNew(GAME_ID.mathChallenge, 'score', Infinity)).toBe(false)
    expect(getGameBest(GAME_ID.mathChallenge, 'score')).toBe(50)
  })

  it('migrates the legacy number-sequence high score key', () => {
    window.localStorage.setItem('number_sequence_highscore', '170')
    expect(getGameBest(GAME_ID.numberSequence, 'score')).toBe(170)
    // Promoted to the versioned key...
    expect(window.localStorage.getItem(gameBestKey(GAME_ID.numberSequence, 'score'))).toBe('170')
    // ...and the legacy key is retired.
    expect(window.localStorage.getItem('number_sequence_highscore')).toBeNull()
  })

  it('migrates the legacy key even when a malformed newer entry also exists', () => {
    window.localStorage.setItem('number_sequence_highscore', '55')
    window.localStorage.setItem(gameBestKey(GAME_ID.numberSequence, 'score'), 'not-a-number')
    expect(getGameBest(GAME_ID.numberSequence, 'score')).toBe(55)
  })

  it('discards corrupt non-numeric entries', () => {
    window.localStorage.setItem(gameBestKey(GAME_ID.mathChallenge, 'score'), '12abc')
    expect(getGameBest(GAME_ID.mathChallenge, 'score')).toBeNull()
  })
})
