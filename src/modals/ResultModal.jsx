export default function ResultModal({ type = "success", title, message, onClose }) {
  const isSuccess = type === "success";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: 16,
      backdropFilter: "blur(2px)",
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes resultModalPop {
          0%   { transform: scale(0.85); opacity: 0; }
          70%  { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .result-modal-card {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          padding: 36px 32px 28px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          font-family: var(--font-ui), sans-serif;
          box-sizing: border-box;
          animation: resultModalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: center;
        }
        .result-icon-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .result-modal-title {
          font-family: var(--font-display), 'DM Serif Display', Georgia, serif;
          font-size: 22px;
          font-weight: 500;
          color: #0F172A;
          margin: 0 0 10px;
        }
        .result-modal-message {
          font-size: 13.5px;
          color: #64748B;
          line-height: 1.6;
          margin: 0 0 28px;
        }
        .result-modal-btn {
          padding: 11px 32px;
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
        }
        .result-modal-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
      `}} />

      <div className="result-modal-card">
        {/* Icon */}
        <div
          className="result-icon-circle"
          style={{
            background: isSuccess ? "#FFF5F5" : "#FEF2F2",
            border: isSuccess ? "1.5px solid rgba(128,0,0,0.12)" : "1.5px solid rgba(239,68,68,0.15)",
          }}
        >
          {isSuccess ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke="#800000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h3 className="result-modal-title">
          {title || (isSuccess ? "Success!" : "Something went wrong")}
        </h3>

        {/* Message */}
        <p className="result-modal-message">
          {message || (isSuccess
            ? "The action was completed successfully."
            : "An error occurred. Please try again."
          )}
        </p>

        {/* Close Button */}
        <button
          className="result-modal-btn"
          style={{
            background: isSuccess ? "#800000" : "#EF4444",
            boxShadow: isSuccess
              ? "0 2px 8px rgba(128,0,0,0.2)"
              : "0 2px 8px rgba(239,68,68,0.2)",
          }}
          onClick={onClose}
        >
          {isSuccess ? "Got it!" : "Try Again"}
        </button>
      </div>
    </div>
  );
}
