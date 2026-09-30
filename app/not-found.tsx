export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#08161F', color: '#EEF1F0', fontFamily: 'Manrope, sans-serif', textAlign: 'center', padding: 24 }}>
      <div>
        <p style={{ letterSpacing: '.26em', fontSize: 12, color: '#D8C9A8', textTransform: 'uppercase' }}>Page introuvable</p>
        <h1 style={{ fontFamily: '"EB Garamond", Georgia, serif', fontWeight: 500, fontSize: 48, margin: '16px 0 28px' }}>Cette page n'existe pas.</h1>
        <a href="/" style={{ color: '#EEF1F0' }}>Revenir à l'accueil</a>
      </div>
    </main>
  );
}
