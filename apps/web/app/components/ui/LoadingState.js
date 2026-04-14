export default function LoadingState({
  title = "Chargement...",
  description = "Veuillez patienter pendant le chargement des données.",
}) {
  return (
    <div className="loading-state">
      <h3 className="loading-title">{title}</h3>
      <p className="loading-description">{description}</p>

      <style jsx>{`
        .loading-state {
          border: 1px solid #dbeafe;
          border-radius: 22px;
          padding: 24px;
          background: linear-gradient(135deg, #ffffff, #eff6ff);
        }

        .loading-title {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 800;
        }

        .loading-description {
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