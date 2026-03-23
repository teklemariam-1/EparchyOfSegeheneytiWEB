interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-parchment-200 text-maroon-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-charcoal-800">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-charcoal-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
