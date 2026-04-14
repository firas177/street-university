export default function EmptyState({
  title = "Aucune donnée disponible",
  description = "Il n’y a rien à afficher pour le moment.",
}) {
  return (
    <div className="empty-state">
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>

      <style jsx>{`
        .empty-state {
          border: 1px solid #dbeafe;
          border-radius: 22px;
          padding: 24px;
          background: #ffffff;
        }

        .empty-title {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 800;
        }

        .empty-description {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}