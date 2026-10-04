const SCRIPT_RULES = [
  ['Devanagari', /[\u0900-\u097F]/g, 'hi', 'Hindi'],
  ['Tamil', /[\u0B80-\u0BFF]/g, 'ta', 'Tamil'],
  ['Telugu', /[\u0C00-\u0C7F]/g, 'te', 'Telugu'],
  ['Bengali', /[\u0980-\u09FF]/g, 'bn', 'Bengali'],
  ['Gujarati', /[\u0A80-\u0AFF]/g, 'gu', 'Gujarati'],
  ['Kannada', /[\u0C80-\u0CFF]/g, 'kn', 'Kannada'],
  ['Malayalam', /[\u0D00-\u0D7F]/g, 'ml', 'Malayalam'],
  ['Gurmukhi', /[\u0A00-\u0A7F]/g, 'pa', 'Punjabi'],
  ['Arabic', /[\u0600-\u06FF]/g, 'ar', 'Arabic'],
  ['Hebrew', /[\u0590-\u05FF]/g, 'he', 'Hebrew'],
  ['Thai', /[\u0E00-\u0E7F]/g, 'th', 'Thai'],
  ['Hangul', /[\uAC00-\uD7AF]/g, 'ko', 'Korean'],
  ['Cyrillic', /[\u0400-\u04FF]/g, 'ru', 'Russian'],
  ['Greek', /[\u0370-\u03FF]/g, 'el', 'Greek'],
  ['Han', /[\u3400-\u9FFF]/g, 'zh', 'Chinese'],
]

const LATIN_MARKERS = {
  en: ['the', 'and', 'is', 'to', 'of', 'in', 'for', 'with', 'this', 'that', 'what', 'from'],
  es: ['el', 'la', 'los', 'las', 'que', 'para', 'con', 'una', 'como', 'del', 'por', 'hola', 'mundo', 'esto', 'está'],
  fr: ['le', 'la', 'les', 'des', 'une', 'pour', 'avec', 'est', 'que', 'dans', 'sur', 'bonjour', 'monde', 'vous', 'avec'],
  de: ['der', 'die', 'das', 'und', 'ist', 'nicht', 'für', 'mit', 'eine', 'den', 'von', 'hallo', 'welt', 'dies'],
  pt: ['o', 'a', 'os', 'as', 'que', 'para', 'com', 'uma', 'não', 'dos', 'por', 'olá', 'mundo', 'isso', 'está'],
  it: ['il', 'lo', 'la', 'gli', 'che', 'per', 'con', 'una', 'sono', 'del', 'nel', 'ciao', 'mondo', 'questo'],
  nl: ['de', 'het', 'een', 'en', 'van', 'voor', 'met', 'dat', 'niet', 'zijn'],
}

export class LanguageDetection {
  constructor({ emit = () => {} } = {}) {
    this.emit = emit
    this.detected = []
  }

  detect(input = {}) {
    const text = typeof input === 'string' ? input : String(input.text || input.transcript || input.content || '')
    const kind = typeof input === 'string' ? 'text' : input.kind || input.type || 'text'
    const declared = typeof input === 'object' ? input.language || input.lang : null
    const result = declared ? declaredLanguage(declared, text, kind) : detectLanguage(text, kind)
    const output = { ...result, inputKind: kind, localOnly: true, networkUsed: false, detectedAt: new Date().toISOString() }
    this.detected.unshift(output)
    this.detected = this.detected.slice(0, 100)
    this.emit({ type: 'language.detected', language: output })
    return output
  }

  snapshot() {
    return { detections: this.detected.length, last: this.detected[0] || null, supportedScripts: SCRIPT_RULES.map(([script]) => script), offline: true, networkUsed: false }
  }
}

function detectLanguage(text, kind) {
  const value = String(text || '').trim()
  const communicationMode = ['voice', 'audio'].includes(kind) ? 'spoken-transcript' : ['image', 'video', 'screen'].includes(kind) ? 'visual-context' : 'written'
  if (!value) return { language: 'und', languageName: 'Undetermined', confidence: 0, script: 'Unknown', candidates: [], communicationMode, method: 'no-text-available', requiresTranscription: ['voice', 'audio', 'video'].includes(kind) }

  const scriptCounts = SCRIPT_RULES.map(([script, pattern, language, languageName]) => ({ script, language, languageName, count: (value.match(pattern) || []).length })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count)
  if (scriptCounts.length) {
    const top = scriptCounts[0]
    const totalLetters = Math.max((value.match(/[\p{L}]/gu) || []).length, top.count)
    const confidence = Math.min(0.99, Number((0.72 + (top.count / totalLetters) * 0.27).toFixed(3)))
    return { language: top.language, languageName: top.languageName, confidence, script: top.script, candidates: scriptCounts.slice(0, 3).map((item) => ({ language: item.language, score: Number((item.count / totalLetters).toFixed(3)) })), communicationMode, method: 'unicode-script-detection', requiresTranscription: false }
  }

  const tokens = value.toLowerCase().replace(/[^a-záéíóúüñàâçèêëîïôœùûÿäöß']/g, ' ').split(/\s+/).filter(Boolean)
  const scores = Object.entries(LATIN_MARKERS).map(([language, markers]) => ({ language, score: markers.reduce((total, marker) => total + (tokens.includes(marker) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score)
  const top = scores[0]
  const hasLatin = /[A-Za-z]/.test(value)
  const confidence = top.score ? Math.min(0.96, Number((0.42 + top.score / Math.max(tokens.length, 1) * 1.8).toFixed(3))) : hasLatin ? 0.35 : 0
  return { language: top.score || hasLatin ? top.language : 'und', languageName: languageName(top.score || hasLatin ? top.language : 'und'), confidence, script: hasLatin ? 'Latin' : 'Unknown', candidates: scores.filter((item) => item.score > 0).slice(0, 3).map((item) => ({ language: item.language, score: Number((item.score / Math.max(tokens.length, 1)).toFixed(3)) })), communicationMode, method: top.score ? 'offline-lexical-detection' : hasLatin ? 'latin-script-fallback' : 'undetermined', requiresTranscription: false }
}

function declaredLanguage(language, text, kind) {
  const normalized = String(language).toLowerCase().split(/[-_]/)[0]
  const detected = detectLanguage(text, kind)
  return { ...detected, language: normalized || 'und', languageName: languageName(normalized), confidence: 1, method: 'user-declared' }
}

function languageName(language) {
  return ({ en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', it: 'Italian', nl: 'Dutch', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', ar: 'Arabic', he: 'Hebrew', th: 'Thai', ko: 'Korean', ru: 'Russian', el: 'Greek', zh: 'Chinese' })[language] || 'Undetermined'
}
