import assert from 'node:assert/strict'

export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function waitFor(predicate, { timeout = 3000, interval = 5, label = 'condition' } = {}) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (predicate()) return
    await sleep(interval)
  }
  assert.fail(`Timed out waiting for ${label} after ${timeout}ms`)
}

export function assertOrdered(values, selector = (value) => value) {
  const numbers = values.map(selector)
  assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b))
}

export function assertLocalOnly(value) {
  assert.equal(value.localOnly, true)
  assert.equal(value.networkUsed, false)
}
