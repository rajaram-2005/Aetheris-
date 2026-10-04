import assert from 'node:assert/strict'
import test from 'node:test'
import { InputReception } from '../src/runtime/inputReception.js'
import { LanguageDetection } from '../src/runtime/languageDetection.js'
import { assertLocalOnly } from './helpers.js'

test('offline detection identifies supported Latin-language samples', () => {
  const detector = new LanguageDetection()
  const samples = [
    ['en', 'The system can research and verify this request.'],
    ['es', 'Hola mundo, necesito investigar esta solicitud.'],
    ['fr', 'Bonjour monde, je veux comprendre cette demande.'],
    ['de', 'Hallo Welt, ich möchte diese Anfrage verstehen.'],
    ['pt', 'Olá mundo, preciso pesquisar esta solicitação.'],
  ]
  for (const [expected, text] of samples) {
    const result = detector.detect(text)
    assert.equal(result.language, expected)
    assert.equal(result.script, 'Latin')
    assert.equal(result.confidence > 0, true)
    assertLocalOnly(result)
  }
})

test('offline detection identifies Indic and non-Latin scripts', () => {
  const detector = new LanguageDetection()
  const samples = [
    ['hi', 'यह एक स्थानीय परीक्षण है।'],
    ['ta', 'இது ஒரு உள்ளூர் சோதனை.'],
    ['te', 'ఇది స్థానిక పరీక్ష.'],
    ['bn', 'এটি একটি স্থানীয় পরীক্ষা।'],
    ['ar', 'هذا اختبار محلي.'],
    ['ru', 'Это локальный тест.'],
    ['zh', '这是一个本地测试。'],
  ]
  for (const [expected, text] of samples) {
    const result = detector.detect(text)
    assert.equal(result.language, expected)
    assert.equal(result.confidence >= 0.72, true)
    assert.notEqual(result.script, 'Unknown')
    assertLocalOnly(result)
  }
})

test('declared language is preserved as provenance with full confidence', () => {
  const detector = new LanguageDetection()
  const result = detector.detect({ text: 'This text is declared as Tamil.', language: 'ta-IN', kind: 'text' })
  assert.equal(result.language, 'ta')
  assert.equal(result.languageName, 'Tamil')
  assert.equal(result.confidence, 1)
  assert.equal(result.method, 'user-declared')
  assert.equal(result.inputKind, 'text')
  assertLocalOnly(result)
})

test('non-text and empty input are truthful about missing language evidence', () => {
  const detector = new LanguageDetection()
  const visual = detector.detect({ kind: 'image', content: '' })
  assert.equal(visual.language, 'und')
  assert.equal(visual.confidence, 0)
  assert.equal(visual.communicationMode, 'visual-context')
  assert.equal(visual.method, 'no-text-available')
  assert.equal(visual.requiresTranscription, false)

  const voice = detector.detect({ kind: 'voice', transcript: '' })
  assert.equal(voice.language, 'und')
  assert.equal(voice.communicationMode, 'spoken-transcript')
  assert.equal(voice.requiresTranscription, true)
  assertLocalOnly(voice)
})

test('detection history is bounded and reports supported scripts', () => {
  const detector = new LanguageDetection()
  for (let index = 0; index < 105; index += 1) detector.detect(`The local run number ${index} is ready.`)
  const snapshot = detector.snapshot()
  assert.equal(snapshot.detections, 100)
  assert.equal(snapshot.offline, true)
  assert.equal(snapshot.networkUsed, false)
  assert.equal(snapshot.supportedScripts.includes('Tamil'), true)
  assert.equal(snapshot.last.language, 'en')
})

test('input reception normalizes modalities, limits attachments, and redacts sensitive metadata keys', () => {
  const events = []
  const input = new InputReception({ emit: (event) => events.push(event), maxTextLength: 12 })
  const envelope = input.receive({
    kind: 'multimodal',
    text: 'A long local request that must be bounded.',
    attachments: [
      { name: 'diagram.png', mimeType: 'image/png', size: 1024, path: '/private/path' },
      { name: 'notes.md', mimeType: 'text/markdown', size: 512 },
    ],
    metadata: { sourceTag: 'fixture', accessToken: 'synthetic-value', nested: 'kept' },
  }, { source: 'test', sessionId: 'session-fixture' })

  assert.equal(envelope.text.length, 12)
  assert.equal(envelope.truncated, true)
  assert.deepEqual(envelope.modalities.sort(), ['file', 'image'].sort())
  assert.equal(envelope.attachments.length, 2)
  assert.equal(envelope.attachments[0].kind, 'image')
  assert.equal(envelope.attachments[1].kind, 'file')
  assert.equal(envelope.metadata.sourceTag, 'fixture')
  assert.equal('accessToken' in envelope.metadata, false)
  assert.equal(envelope.attachments[0].path, '/private/path')
  assert.equal(events[0].type, 'input.received')
  assert.equal(input.snapshot().last.attachments[0].path, undefined)
  assertLocalOnly(envelope)
})
