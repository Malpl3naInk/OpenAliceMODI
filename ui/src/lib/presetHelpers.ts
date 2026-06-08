/**
 * Shared preset-catalog helpers — the single source for turning a serialized
 * Preset (from /api/config/presets) into the enumerations the UI surfaces
 * (endpoint dropdowns, model suggestions) and for resolving a vendor/baseUrl to
 * its preset. Used by both the AI Provider credential vault and the per-workspace
 * AI config modal so the vendor map can't drift between them.
 *
 * The preset is the enumeration backbone: its `endpoints` → schema.baseUrl.oneOf,
 * its `models` → schema.model.oneOf (see src/ai-providers/presets.ts buildJsonSchema).
 */

import type { Preset, SerializedWire, WireShape } from '../api'

export interface LabeledOption {
  id: string
  label: string
}

// ==================== Wire shapes ====================

/** Compact label for a wire shape (list chips / credential rows). */
export const WIRE_SHAPE_SHORT: Record<WireShape, string> = {
  anthropic: 'Anthropic',
  'openai-chat': 'OpenAI Chat',
  'openai-responses': 'OpenAI Responses',
}

/** The wire shapes a preset supports (each with its endpoint table). */
export function presetWires(p: Preset | null | undefined): SerializedWire[] {
  return p?.wires ?? []
}

/** The endpoints (region variants) for a given wire shape of a preset. */
export function wireEndpoints(p: Preset | null | undefined, shape: WireShape): LabeledOption[] {
  return presetWires(p).find((w) => w.shape === shape)?.endpoints ?? []
}

/** The shape a preset defaults to (its first declared wire). */
export function defaultWireShape(p: Preset | null | undefined): WireShape | undefined {
  return presetWires(p)[0]?.shape
}

/** Reverse lookup: which wire shape's endpoint list contains this baseUrl (for edit mode). */
export function wireShapeForBaseUrl(p: Preset | null | undefined, baseUrl: string): WireShape | undefined {
  return presetWires(p).find((w) => w.endpoints.some((e) => e.id === baseUrl))?.shape
}

function schemaProps(schema: Preset['schema']): Record<string, Record<string, unknown>> {
  return (schema?.properties as Record<string, Record<string, unknown>>) ?? {}
}

function oneOf(schema: Preset['schema'], field: string): LabeledOption[] {
  const f = schemaProps(schema)[field] as { oneOf?: Array<{ const: string; title: string }> } | undefined
  return f?.oneOf ? f.oneOf.map((o) => ({ id: o.const, label: o.title })) : []
}

/** Enumerated models for a preset (empty for custom / un-enumerated presets). */
export function presetModels(p: Preset): LabeledOption[] {
  return oneOf(p.schema, 'model')
}

/** Only api-key presets belong in the credential vault — oauth ones log in via the CLI. */
export function isApiKeyPreset(p: Preset): boolean {
  return 'apiKey' in schemaProps(p.schema)
}

/** Vendor tag stored on a credential, by preset id (api-key presets only). */
export const VENDOR_BY_PRESET: Record<string, string> = {
  'claude-api': 'anthropic',
  'codex-api': 'openai',
  gemini: 'google',
  minimax: 'minimax',
  glm: 'glm',
  kimi: 'kimi',
  deepseek: 'deepseek',
  custom: 'custom',
}

/** Reverse: the api-key preset for a vendor (falls back to 'custom'). */
export function vendorPreset(vendor: string, presets: Preset[]): Preset | undefined {
  const presetId = Object.entries(VENDOR_BY_PRESET).find(([, v]) => v === vendor)?.[0]
  return presets.find((p) => p.id === presetId) ?? presets.find((p) => p.id === 'custom')
}

// Mirrors the backend baseUrl→vendor heuristic (src/core/credential-inference.ts
// VENDORS_BY_BASEURL). Kept in sync by hand — it's a tiny, stable map.
const VENDOR_BY_BASEURL: Array<[RegExp, string]> = [
  [/bigmodel\.cn|z\.ai/i, 'glm'],
  [/minimaxi\.com|minimax\.io/i, 'minimax'],
  [/moonshot\.cn|moonshot\.ai/i, 'kimi'],
  [/deepseek\.com/i, 'deepseek'],
]

/**
 * Infer the provider vendor from a baseUrl, used to pick which model list to
 * suggest. A recognized gateway URL wins; otherwise `fallback` (the agent tab's
 * implied vendor, e.g. claude→anthropic, codex→openai) decides. Returns null
 * when nothing is known (e.g. a custom/local endpoint) → caller shows no
 * suggestions (free text), which is correct: custom providers have no catalog.
 */
export function baseUrlToVendor(baseUrl: string | null | undefined, fallback?: string | null): string | null {
  const url = (baseUrl ?? '').trim()
  for (const [pattern, vendor] of VENDOR_BY_BASEURL) {
    if (pattern.test(url)) return vendor
  }
  return fallback ?? null
}
