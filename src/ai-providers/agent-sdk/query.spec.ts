import { describe, it, expect } from 'vitest'
import { buildAuthEnv } from './query.js'

describe('buildAuthEnv', () => {
  it('x-api-key mode (default): sets ANTHROPIC_API_KEY, clears AUTH_TOKEN', () => {
    const env = buildAuthEnv({}, { apiKey: 'sk-x', loginMethod: 'api-key' })
    expect(env.ANTHROPIC_API_KEY).toBe('sk-x')
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined()
    expect(env.CLAUDE_CODE_SIMPLE).toBe('1')
  })

  it('absent authMode behaves as x-api-key', () => {
    const env = buildAuthEnv({}, { apiKey: 'sk-x' })
    expect(env.ANTHROPIC_API_KEY).toBe('sk-x')
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined()
  })

  it('bearer mode: sets ANTHROPIC_AUTH_TOKEN, clears API_KEY', () => {
    const env = buildAuthEnv({}, { apiKey: 'sk-mm', authMode: 'bearer', loginMethod: 'api-key' })
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe('sk-mm')
    expect(env.ANTHROPIC_API_KEY).toBeUndefined()
    expect(env.CLAUDE_CODE_SIMPLE).toBe('1')
  })

  it('never sets BOTH key vars — bearer clears an inherited API_KEY', () => {
    const env = buildAuthEnv(
      { ANTHROPIC_API_KEY: 'stale-inherited' },
      { apiKey: 'sk-mm', authMode: 'bearer' },
    )
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe('sk-mm')
    expect(env.ANTHROPIC_API_KEY).toBeUndefined()
  })

  it('never sets BOTH key vars — x-api-key clears an inherited AUTH_TOKEN', () => {
    const env = buildAuthEnv(
      { ANTHROPIC_AUTH_TOKEN: 'stale-inherited' },
      { apiKey: 'sk-x', authMode: 'x-api-key' },
    )
    expect(env.ANTHROPIC_API_KEY).toBe('sk-x')
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined()
  })

  it('OAuth mode (claudeai): strips both API_KEY and CLAUDE_CODE_SIMPLE, ignores authMode', () => {
    const env = buildAuthEnv(
      { ANTHROPIC_API_KEY: 'inherited', CLAUDE_CODE_SIMPLE: '1' },
      { loginMethod: 'claudeai', apiKey: 'ignored', authMode: 'bearer' },
    )
    expect(env.ANTHROPIC_API_KEY).toBeUndefined()
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined()
    expect(env.CLAUDE_CODE_SIMPLE).toBeUndefined()
  })

  it('preserves unrelated env vars', () => {
    const env = buildAuthEnv({ PATH: '/usr/bin', HOME: '/home/u' }, { apiKey: 'sk-x' })
    expect(env.PATH).toBe('/usr/bin')
    expect(env.HOME).toBe('/home/u')
  })

  it('no apiKey in api-key mode: leaves key vars unset but still forces CLAUDE_CODE_SIMPLE', () => {
    const env = buildAuthEnv({}, { loginMethod: 'api-key' })
    expect(env.ANTHROPIC_API_KEY).toBeUndefined()
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined()
    expect(env.CLAUDE_CODE_SIMPLE).toBe('1')
  })
})
