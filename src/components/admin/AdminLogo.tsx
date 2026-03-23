// Admin panel logo — displayed in Payload's sidebar
export default function AdminLogo() {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
        <span className="text-white text-xs">✝</span>
      </div>
      <div>
        <p className="text-white text-sm font-bold leading-tight">Eparchy of Segeneyti</p>
        <p className="text-white/60 text-xs leading-tight">Content Management</p>
      </div>
    </div>
  )
}
