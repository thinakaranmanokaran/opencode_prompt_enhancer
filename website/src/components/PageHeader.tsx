type PageHeaderProps = {
  id: string
  index: string
  label: string
  title: string
  intro: string
}

export function PageHeader({ id, index, label, title, intro }: PageHeaderProps) {
  return (
    <header className="page-head">
      <p className="eyebrow">
        <span className="eyebrow-index">{index}</span>
        <span>{label}</span>
      </p>
      <h1 id={id}>{title}</h1>
      <p className="page-lede">{intro}</p>
    </header>
  )
}
