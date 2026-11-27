const Skeleton = ({ width = '100%', height = '20px', style = {} }) => (
  <div className="skeleton" style={{ width, height, ...style }} />
);

export const SkeletonCard = () => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <Skeleton height="14px" width="60%" />
    <Skeleton height="32px" width="80%" />
    <Skeleton height="12px" width="40%" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
        <Skeleton height="16px" width="20%" />
        <Skeleton height="16px" width="30%" />
        <Skeleton height="16px" width="20%" />
        <Skeleton height="16px" width="15%" />
      </div>
    ))}
  </div>
);

export default Skeleton;
