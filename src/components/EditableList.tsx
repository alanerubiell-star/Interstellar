import { AutoTextarea } from './AutoTextarea'
import { IconPlus, IconTrash } from './Icons'

export function EditableList({
  items,
  onChange,
  bloqueado,
  placeholder = 'Nuevo punto…',
  etiquetaAgregar = 'Agregar',
}: {
  items: string[]
  onChange: (items: string[]) => void
  bloqueado: boolean
  placeholder?: string
  etiquetaAgregar?: string
}) {
  if (bloqueado) {
    return (
      <ul className="lista-lectura">
        {items.map((t, i) => (
          <li key={i} className="small">{t}</li>
        ))}
      </ul>
    )
  }

  const editar = (i: number, v: string) => onChange(items.map((t, j) => (j === i ? v : t)))
  const quitar = (i: number) => onChange(items.filter((_, j) => j !== i))

  return (
    <div className="stack gap-8">
      {items.map((t, i) => (
        <div key={i} className="row gap-8 lista-fila">
          <span className="lista-bullet" aria-hidden="true" />
          <AutoTextarea
            className="textarea lista-input"
            valor={t}
            minAlto={40}
            onChange={(v) => editar(i, v)}
          />
          <button className="icon-btn icon-btn-sm" onClick={() => quitar(i)} aria-label="Quitar">
            <IconTrash size={15} />
          </button>
        </div>
      ))}
      <button className="btn btn-sm btn-ghost" onClick={() => onChange([...items, ''])}>
        <IconPlus size={15} />
        {etiquetaAgregar}
      </button>
      <span className="tiny muted" hidden>{placeholder}</span>
    </div>
  )
}
