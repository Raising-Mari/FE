import { http, HttpResponse } from 'msw'
import type { components } from '@/api/generated/schema'
import { mockDisciples, mockUnits } from './courseData'

type Schemas = components['schemas']
interface MockNote {
  id: number
  discipleId: number
  unitId: number
  content: string
  createdAt: string
}

export const NOTE_LIMIT = 60
export const mockNotes: MockNote[] = []
export const mockMessages: (Schemas['ChatMessageResponse'] & { discipleId: number })[] = []
const processed = new Map<string, Schemas['TeachingTurnResponse']>()
let nextId = 1

/** 주차 목록의 "내 노트 N개"가 노트와 어긋나지 않게 맞춘다. */
function syncNoteCounts() {
  for (const [courseId, units] of mockUnits) {
    const disciple = mockDisciples.get(courseId)
    for (const unit of units) {
      unit.myNoteCount = disciple
        ? mockNotes.filter((n) => n.discipleId === disciple.id && n.unitId === unit.id).length
        : 0
    }
  }
}

export function notesOf(discipleId: number, unitId: number) {
  return mockNotes.filter((n) => n.discipleId === discipleId && n.unitId === unitId)
}

/** 과목 데이터를 되돌린 뒤에 부른다. 시안 09의 예시(노트 4개, 대화 한 번)로 시작한다. */
export function resetTeachingData() {
  nextId = 1
  processed.clear()
  const at = '2026-11-07T10:00:00Z'
  mockNotes.splice(
    0,
    mockNotes.length,
    ...[
      '나중에 넣은 데이터가 먼저 나오는 LIFO 구조입니다.',
      'push는 스택의 맨 위에 데이터를 추가합니다.',
      '접시를 위에서부터 꺼내는 것은 스택의 사례입니다.',
      '큐는 먼저 넣은 데이터가 먼저 나오는 FIFO 구조입니다.',
    ].map((content) => ({ id: nextId++, discipleId: 1, unitId: 1, content, createdAt: at })),
  )
  mockMessages.splice(
    0,
    mockMessages.length,
    {
      id: nextId++,
      discipleId: 1,
      role: 'STUDENT',
      unitId: 1,
      turnNo: 1,
      content: '큐는 먼저 넣은 데이터가 먼저 나오는 FIFO 구조입니다.',
      createdAt: at,
    },
    {
      id: nextId++,
      discipleId: 1,
      role: 'DISCIPLE',
      unitId: 1,
      turnNo: 1,
      content: '설명 고마워! 알려준 내용을 노트에 적었어. 다른 예시도 하나 알려줄래?',
      askedWhy: false,
      createdAt: at,
    },
  )
  syncNoteCounts()
}

const error = (status: number, code: string) => HttpResponse.json({ code, message: '' }, { status })

/** 앞 8글자가 같으면 비슷한 노트로 본다(실제 서버는 유사도를 계산한다). */
const similar = (a: string, b: string) => a !== b && a.slice(0, 8) === b.slice(0, 8)

export const teachingHandlers = [
  http.get('/api/disciples/:discipleId/messages', ({ request, params }) => {
    const unitId = Number(new URL(request.url).searchParams.get('unitId'))
    const items = mockMessages
      .filter((m) => m.discipleId === Number(params.discipleId) && (!unitId || m.unitId === unitId))
      .map(({ discipleId: _discipleId, ...message }) => message)
    return HttpResponse.json({
      items,
      page: 0,
      size: 100,
      totalElements: items.length,
      hasNext: false,
    } satisfies Schemas['PageResponseChatMessageResponse'])
  }),

  http.get('/api/disciples/:discipleId/notes', ({ request, params }) => {
    const discipleId = Number(params.discipleId)
    const unitParam = new URL(request.url).searchParams.get('unitId')
    const units = Array.from(mockUnits.values()).flat()
    const group = (unitId: number): Schemas['Group'] => {
      const items = notesOf(discipleId, unitId)
      return {
        unit: { id: unitId, title: units.find((u) => u.id === unitId)?.title },
        count: items.length,
        limit: NOTE_LIMIT,
        items: items.map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt,
          version: 1,
        })),
      }
    }
    const unitIds = unitParam
      ? [Number(unitParam)]
      : [...new Set(mockNotes.filter((n) => n.discipleId === discipleId).map((n) => n.unitId))]
    return HttpResponse.json({
      groups: unitIds.map(group),
    } satisfies Schemas['NotesResponse'])
  }),

  http.post('/api/disciples/:discipleId/messages', async ({ request, params }) => {
    const discipleId = Number(params.discipleId)
    const input = (await request.json()) as Schemas['SendMessageRequest']
    const saved = processed.get(input.clientMessageId)
    if (saved) return HttpResponse.json(saved, { status: 201 })
    if (!input.content.trim() || input.content.length > 2000) return error(400, 'INVALID_INPUT')

    const now = new Date().toISOString()
    const turnNo =
      mockMessages.filter((m) => m.discipleId === discipleId && m.role === 'STUDENT').length + 1
    const changes: Required<Schemas['NoteChanges']> = {
      applied: [],
      merged: [],
      mergeSuggestions: [],
      rejectedCount: 0,
      noteLimitReached: false,
    }
    for (const line of input.content.split('\n').map((l) => l.trim())) {
      if (!line) continue
      if (line.length < 5 || line.length > 300) {
        changes.rejectedCount++
        continue
      }
      const existing = notesOf(discipleId, input.unitId)
      if (existing.length >= NOTE_LIMIT) {
        changes.noteLimitReached = true
        continue
      }
      const note = { id: nextId++, discipleId, unitId: input.unitId, content: line, createdAt: now }
      const alike = existing.find((n) => similar(n.content, line))
      mockNotes.push(note)
      changes.applied.push({ op: 'ADD', entryId: note.id, content: line })
      if (alike)
        changes.mergeSuggestions.push({
          newEntryId: note.id,
          existingEntryId: alike.id,
          existingContent: alike.content,
          similarity: 0.8,
        })
    }
    const askedWhy = turnNo % 3 === 0
    const student = { id: nextId++, content: input.content, createdAt: now }
    const disciple = {
      id: nextId++,
      content: askedWhy
        ? '왜 그렇게 되는지도 알려줄래?'
        : changes.applied.length > 0
          ? '설명 고마워! 알려준 내용을 노트에 적었어.'
          : '조금 더 자세히 설명해 줄래?',
      askedWhy,
      createdAt: now,
    }
    mockMessages.push(
      { ...student, discipleId, role: 'STUDENT', unitId: input.unitId, turnNo },
      { ...disciple, discipleId, role: 'DISCIPLE', unitId: input.unitId, turnNo },
    )
    syncNoteCounts()
    const turn: Schemas['TeachingTurnResponse'] = {
      turnNo,
      studentMessage: student,
      discipleMessage: disciple,
      noteChanges: changes,
      pasteWarning: false,
    }
    processed.set(input.clientMessageId, turn)
    return HttpResponse.json(turn, { status: 201 })
  }),

  http.post('/api/disciples/:discipleId/notes/merge', async ({ request, params }) => {
    const discipleId = Number(params.discipleId)
    const input = (await request.json()) as Schemas['MergeNotesRequest']
    const keep = mockNotes.find((n) => n.id === input.keepEntryId && n.discipleId === discipleId)
    const index = mockNotes.findIndex(
      (n) => n.id === input.mergeEntryId && n.discipleId === discipleId,
    )
    if (!keep || index < 0 || mockNotes[index]!.unitId !== keep.unitId)
      return error(400, 'TEACHING_NOTE_MERGE_INVALID')
    mockNotes.splice(index, 1)
    syncNoteCounts()
    return HttpResponse.json({
      keepEntryId: input.keepEntryId,
      mergedEntryId: input.mergeEntryId,
    } satisfies Schemas['MergeNotesResponse'])
  }),
]
