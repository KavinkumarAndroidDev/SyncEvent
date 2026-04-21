import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div>
        <h1 style={{ fontSize: "72px", fontWeight: 700 }}>404</h1>

        <p style={{ margin: "12px 0", color: "#6b7280" }}>
          Page not found. You probably typed a wrong URL.
        </p>

        <Link to="/" className="btn-primary">
          Go Home
        </Link>
      </div>
    </main>
  );
}