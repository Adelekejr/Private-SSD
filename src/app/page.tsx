import Link from "next/link";

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="topline">
        <Link className="wordmark" href="/" aria-label="PrivateSpend Network home">
          <span className="mark" aria-hidden="true">
            <span />
          </span>
          <span>PRIVATE SPEND NETWORK</span>
        </Link>
        <span className="phase-tag">DOMAIN + PERSISTENCE / PHASE 02</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">DOMAIN FOUNDATION ONLY</p>
        <h1 id="page-title">
          Agents can negotiate.
          <br />
          Constraints decide.
          <br />
          NEAR may settle.
        </h1>
        <p className="lead">
          A foundation for a procurement workflow where policy and human approval
          stay explicit.
        </p>
      </section>

      <section className="notice" aria-labelledby="stage-title">
        <div className="notice-heading">
          <span className="status-dot" aria-hidden="true" />
          <p className="eyebrow">CURRENT STATE</p>
        </div>
        <h2 id="stage-title">Product workflow not implemented</h2>
        <p>
          Phase 2 adds typed domain models, deterministic sample records, a
          process-local in-memory repository, and guarded status transitions.
          These records are not exposed through a product API or workflow UI.
          Mandate creation, supplier agents, policy evaluation, approvals,
          private inference, wallet connection, and settlement workflow remain
          unimplemented.
        </p>
        <p className="honesty-note">
          The three offers are static fixtures; no supplier was contacted and no
          policy engine was run. No wallet is connected and no settlement was
          submitted.
        </p>
      </section>

      <footer className="footer-line">
        <span>INFRASTRUCTURE STATUS</span>
        <a href="/api/health">GET /api/health</a>
        <span className="footer-note">SERVICE CHECK ONLY · NO PRODUCT ACTION</span>
      </footer>
    </main>
  );
}
