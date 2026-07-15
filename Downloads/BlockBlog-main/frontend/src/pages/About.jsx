export default function About() {
  return (
    <div className="bb-fade-in" style={{ maxWidth: 720, margin: '0 auto', padding: 'calc(var(--space-8)*2) var(--space-6) 80px', width: '100%', boxSizing: 'border-box' }}>
      <span className="bb-tag" style={{ marginBottom: 'var(--space-4)' }}>About us</span>
      <h1 style={{ fontSize: 32, marginBottom: 'var(--space-4)', fontWeight: 800 }}>Writing worth reading, from anyone.</h1>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: '#333', marginBottom: 'var(--space-4)' }}>
        BlockBlog started as a simple idea: publishing shouldn't require a following. Every post here stands on its own, judged by readers on the words alone rather than who wrote them.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: '#333', marginBottom: 'var(--space-6)' }}>
        We're a small team building a lightweight place to write, save, and discuss — no algorithmically-optimized feed, no public follower counts, just posts and the people reading them.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-4)' }}>
        {[['Est.', '2026'], ['Team', '4 people'], ['Posts published', '1,200+']].map(([k, v]) => (
          <div key={k} className="bb-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#7353ea', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
