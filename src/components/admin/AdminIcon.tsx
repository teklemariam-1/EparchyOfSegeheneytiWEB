// Admin panel icon — displayed in collapsed sidebar
// Uses inline styles because Tailwind is not loaded on admin routes
export default function AdminIcon() {
  return (
    <div
      style={{
        display: 'flex',
        height: '32px',
        width: '32px',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
      }}
    >
      <span style={{ color: '#fff', fontSize: '14px' }}>✝</span>
    </div>
  )
}
