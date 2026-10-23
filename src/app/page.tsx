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
        <span className="phase-tag">FOUNDATION / PHASE 01</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">LOCAL PROJECT SKELETON</p>
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
          This stage establishes the repository, app shell, and server health
          check only. Mandates, supplier offers, policy evaluation, approvals,
          private inference, and settlement are intentionally out of scope until
          the foundation is reviewed and a later stage is approved.
        </p>
        <p className="honesty-note">
          No provider is called, no wallet is connected, and no simulated,
          testnet, or live transaction is performed by this foundation.
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
