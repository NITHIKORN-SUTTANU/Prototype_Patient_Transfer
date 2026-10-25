import type { Actor } from '../data/actors'

interface Props { actor: Actor; selected: boolean; onSelect: () => void }
export function ActorCard({ actor, selected, onSelect }: Props) {
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={`actor-card group ${selected ? 'actor-card-selected' : ''}`}>
    <span className="flex items-center justify-between gap-4"><span className="actor-number">{actor.number}</span><span className="text-sm font-semibold text-primary">{actor.id}</span></span>
    <span className="mt-6 block text-2xl font-semibold">{actor.name}</span>
    <span lang="en" className="mt-1 block text-sm text-muted">{actor.english}</span>
    <span className="mt-4 block text-base leading-7 text-muted">{actor.description}</span>
    <span className="mt-6 block border-t border-border pt-4 text-sm text-muted">{actor.tasks}</span>
    <span className="mt-5 flex min-h-14 items-center justify-between gap-3 rounded-xl bg-accent px-4 font-semibold text-primary">{selected ? 'เลือกบทบาทนี้แล้ว' : 'เลือกบทบาทนี้'}<span aria-hidden="true">{selected ? '✓' : '→'}</span></span>
  </button>
}
