import { useRef, useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { TextInput } from '@/components/ui/TextInput'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/stores/toastStore'
import { MAX_PDF_BYTES, MAX_TEXT_LENGTH, MAX_TITLE_LENGTH } from '../api'
import { useUploadMaterial } from '../hooks/useMaterials'

/** 고른 파일이 올릴 수 있는 것인지 미리 본다. 서버도 다시 검사한다(확장자·MIME·머리말). */
function checkFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'PDF 파일만 올릴 수 있어요.'
  if (file.size === 0) return '빈 파일이에요. 다른 파일을 골라 주세요.'
  if (file.size > MAX_PDF_BYTES) return '파일이 너무 커요. 20MB 이하의 PDF를 올려 주세요.'
  return null
}

/** 자료 추가(시안 10 왼쪽). PDF 를 고르면 파일로, 아니면 붙여넣은 글로 올린다. */
export function MaterialForm({ courseId }: { courseId: number }) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [consent, setConsent] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const upload = useUploadMaterial(courseId)

  const fileError = file ? checkFile(file) : null
  const hasSource = file ? !fileError : text.trim().length > 0
  const canSubmit = title.trim().length > 0 && hasSource && consent && !upload.isPending

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setFailure(null)
    upload.mutate(
      { title: title.trim(), file, text },
      {
        onSuccess: () => {
          setTitle('')
          setFile(null)
          setText('')
          setConsent(false)
          if (fileInput.current) fileInput.current.value = ''
          toast.info('자료를 받았어요. 처리가 끝나면 주차에 연결할 수 있어요.')
        },
        onError: (error) => setFailure(getErrorMessage(error)),
      },
    )
  }

  return (
    <Card as="section" aria-labelledby="material-form-title">
      <h2 id="material-form-title" className="mb-5 text-18 text-ink">
        자료 추가
      </h2>
      <form className="flex flex-col gap-5" onSubmit={submit}>
        <TextInput
          label="자료 이름"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          disabled={upload.isPending}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="material-file" className="text-11 text-muted">
            PDF 파일 (선택)
          </label>
          <input
            id="material-file"
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            disabled={upload.isPending}
            aria-describedby="material-file-hint"
            aria-invalid={fileError ? true : undefined}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-11 text-ink file:mr-3 file:min-h-9 file:cursor-pointer file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:text-11 file:text-ink"
          />
          <p
            id="material-file-hint"
            role={fileError ? 'alert' : undefined}
            className={fileError ? 'text-11 text-danger' : 'text-10 text-subtle'}
          >
            {fileError ?? '20MB 이하 · 글자를 뽑을 수 없는 스캔본은 처리하지 못해요.'}
          </p>
        </div>
        <Textarea
          label="원문 붙여넣기"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="PDF에서 글을 추출하거나 원문을 직접 붙여넣어주세요."
          maxLength={MAX_TEXT_LENGTH}
          rows={6}
          disabled={upload.isPending || file !== null}
          hint={file ? 'PDF를 골랐어요. 글로 올리려면 파일 선택을 지워 주세요.' : undefined}
        />
        {file && (
          <div>
            <Button
              variant="link"
              onClick={() => {
                setFile(null)
                if (fileInput.current) fileInput.current.value = ''
              }}
            >
              파일 선택 지우기
            </Button>
          </div>
        )}
        <Checkbox
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={upload.isPending}
          label="자료를 사용할 권한이 있으며, 문제 생성에 사용하는 것에 동의해요."
        />
        <p className="text-10 text-subtle">
          개인정보는 빼고 올려 주세요. 같은 과목 학생에게 근거 문장 일부가 보일 수 있어요.
        </p>
        {failure && (
          <p role="alert" className="text-12 text-danger">
            {failure}
          </p>
        )}
        <div>
          <Button type="submit" loading={upload.isPending} disabled={!canSubmit}>
            자료 저장
          </Button>
        </div>
      </form>
    </Card>
  )
}
