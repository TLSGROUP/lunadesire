interface StatsCardProps {
  title: string
  value: number | string
  highlight?: boolean
}

export function StatsCard({ title, value, highlight }: StatsCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? 'border-primary bg-primary/5' : 'bg-muted/40'
      }`}
    >
      <p className="text-sm text-muted-foreground">{title}</p>
      <p
        className={`text-3xl font-bold mt-1 ${highlight ? 'text-primary' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}
