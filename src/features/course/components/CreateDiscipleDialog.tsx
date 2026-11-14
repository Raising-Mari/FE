import { useState } from 'react'
import { getErrorMessage, hasErrorCode } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextInput } from '@/components/ui/TextInput'
import mariRound from '@/assets/mari/mari_round.webp'
import { useCreateDisciple } from '../hooks/useCourses'

export function CreateDiscipleDialog({
  courseId,
  onClose,
}: {
  courseId: number
  onClose: () => void
}) {
  const [name, setName] = useState('마리')
  const create = useCreateDisciple(courseId)
  return (
    <Dialog open title="나의 제자 만들기" onClose={onClose} dismissible={!create.isPending}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim() && !create.isPending)
            create.mutate(
              { name: name.trim(), characterKey: 'mari' },
              {
                onSuccess: onClose,
                onError: (error) => {
                  if (hasErrorCode(error, 'DISCIPLE_ALREADY_EXISTS')) onClose()
                },
              },
            )
        }}
      >
        <TextInput
          label="제자 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={30}
          disabled={create.isPending}
        />
        <fieldset>
          <legend className="mb-3 text-11 text-muted">제자 모습</legend>
          <label className="flex w-fit cursor-pointer items-center gap-3 rounded-lg border border-primary bg-primary-tint p-3">
            <input type="radio" name="character" value="mari" defaultChecked />
            <svg viewBox="75 30 610 625" role="img" aria-label="마리" className="h-[90px] w-[90px]">
              <image href={mariRound} width="1448" height="1086" />
            </svg>
            <span>마리</span>
          </label>
        </fieldset>
        <p className="text-11 text-muted">
          과목마다 한 명의 제자를 키워요. 제자를 만들면 이 과목에 참여해요.
        </p>
        {create.isError && (
          <p role="alert" className="text-12 text-danger">
            {getErrorMessage(create.error)}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            취소
          </Button>
          <Button type="submit" disabled={!name.trim()} loading={create.isPending}>
            제자 만들기
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
