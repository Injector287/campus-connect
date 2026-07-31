export default function SkeletonPage() {
  return (
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="skeleton skeleton-title" style={{ width: '40%', maxWidth: '200px', margin: 0 }}></div>
      </div>
      <div className="skeleton-container">
        <div className="skeleton skeleton-card" style={{ height: '120px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '250px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '150px' }}></div>
      </div>
    </main>
  );
}
