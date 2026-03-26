// Admin panel logo — displayed in Payload's sidebar
// Uses inline styles because Tailwind is not loaded on admin routes
export default function AdminLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
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
        <span style={{ color: '#fff', fontSize: '12px' }}>✝</span>
      </div>
      <div>
        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, lineHeight: 1.25, margin: 0 }}>
          Eparchy of Segeneyti
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: 1.25, margin: 0 }}>
          Content Management
        </p>
      </div>
    </div>
  )
}
