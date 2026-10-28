import { describe, expect, it } from 'vitest'
import { containsForbiddenApi, newNonce } from '@/lib/code/harness'

describe('containsForbiddenApi', () => {
  it('flags network and eval entry points', () => {
    expect(containsForbiddenApi('fetch("/x")')).toBe(true)
    expect(containsForbiddenApi('eval("2+2")')).toBe(true)
    expect(containsForbiddenApi('new Function("return 1")')).toBe(true)
    expect(containsForbiddenApi('new WebSocket("wss://x")')).toBe(true)
  })

  it('allows ordinary code and words containing the substrings', () => {
    expect(containsForbiddenApi('const fetched = [1,2].reduce((a,b)=>a+b,0)')).toBe(false)
    expect(containsForbiddenApi('function sum(nums){return nums.length}')).toBe(false)
    expect(containsForbiddenApi('const evaluator = 3')).toBe(false)
  })
})

describe('newNonce', () => {
  it('returns distinct values', () => {
    expect(newNonce()).not.toBe(newNonce())
    expect(newNonce().length).toBeGreaterThan(8)
  })
})
