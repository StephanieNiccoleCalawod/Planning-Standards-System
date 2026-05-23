import { COLORS } from "../constants/colors";

export default function ArchiveModal({ service, onConfirm, onCancel, mode = "archive" }) {
  const serviceName = service?.name || "This service";
  const isArchive = mode === "archive";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 16,
      backdropFilter: "blur(1px)",
    }}>
      {/* Premium Styles to exactly match user's mockup image */}
      <style dangerouslySetInnerHTML={{ __html: `
        .premium-confirm-card {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          font-family: var(--font-ui), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
          animation: slideUpConfirm 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          border: 1px solid #E2E8F0;
        }
        @keyframes slideUpConfirm {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .confirm-top-section {
          padding: 32px 32px 24px 32px;
        }

        .confirm-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .confirm-icon-box.archive-mode {
          background: #FEF2F2;
          color: #DC2626;
        }
        .confirm-icon-box.unarchive-mode {
          background: #ECFDF5;
          color: #10B981;
        }

        .confirm-title {
          font-size: 18px;
          font-weight: 600;
          color: #0F172A;
          margin: 0 0 14px 0;
          letter-spacing: -0.01em;
        }

        .confirm-description {
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }
        .confirm-name-highlight {
          font-weight: 600;
          color: #0F172A;
        }

        .confirm-bottom-bar {
          background: #F8FAFC;
          padding: 16px 32px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid #F1F5F9;
        }

        .confirm-btn-ghost {
          padding: 9px 18px;
          font-size: 13.5px;
          font-weight: 600;
          color: #334155;
          background: #ffffff;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .confirm-btn-ghost:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
          color: #0F172A;
        }

        .confirm-btn-action {
          padding: 9px 18px;
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .confirm-btn-action.archive-mode {
          background: #DC2626;
        }
        .confirm-btn-action.archive-mode:hover {
          background: #B91C1C;
        }
        .confirm-btn-action.unarchive-mode {
          background: #10B981;
        }
        .confirm-btn-action.unarchive-mode:hover {
          background: #059669;
        }
      ` }} />

      <div className="premium-confirm-card">
        {/* Top Info section */}
        <div className="confirm-top-section">
          <div className={`confirm-icon-box ${isArchive ? "archive-mode" : "unarchive-mode"}`}>
            {isArchive ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <polyline points="3 3 3 8 8 8"></polyline>
              </svg>
            )}
          </div>
          
          <h3 className="confirm-title">
            {isArchive ? "Archive this service?" : "Unarchive this service?"}
          </h3>

          <p className="confirm-description">
            {isArchive ? (
              <>
                <span className="confirm-name-highlight">{serviceName}</span> will be archived and hidden from the Service Catalogue. It will no longer be selectable in new commitments. This action can be reversed.
              </>
            ) : (
              <>
                <span className="confirm-name-highlight">{serviceName}</span> will be unarchived and restored to the active Service Catalogue list. It will become selectable in new commitments. This action can be reversed.
              </>
            )}
          </p>
        </div>

        {/* Bottom Actions section */}
        <div className="confirm-bottom-bar">
          <button className="confirm-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className={`confirm-btn-action ${isArchive ? "archive-mode" : "unarchive-mode"}`} 
            onClick={onConfirm}
          >
            {isArchive ? "Archive Service" : "Unarchive Service"}
          </button>
        </div>
      </div>
    </div>
  );
}
