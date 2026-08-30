import React, { useState, useEffect, useMemo } from "react";

// --- Données des églises MCPP à Douala ---------------------------------
// ⚠️ Ce sont des exemples de structure. Josué enverra les vraies infos
// (nom du responsable, adresse précise, horaires de culte, contact)
// pour remplacer ce tableau.
const EGLISES_EXEMPLE = [
  {
    id: "pk14",
    quartier: "PK14",
    nom: "Tabernacle du Seigneur Jésus-Christ — Douala PK14",
    responsable: "Rev. Pasteur Ela",
    adresse: "Douala IIIe · GPS 4.075914, 9.806030 · Plus Code 3RG4+9C6",
    cultes: "Horaires à préciser",
    contact: "699 64 54 13 / 672 89 43 03",
    email: "elazingaaferdinand@gmail.com",
    exemple: false,
  },
  {
    id: "pk12",
    quartier: "PK12",
    nom: "Tabernacle du Seigneur Jésus-Christ — Douala PK12",
    responsable: "Dr. Ndjeng Becker",
    adresse: "76 Rue LT0008D03, Douala",
    cultes: "Horaires à préciser",
    contact: "696 41 59 29 / 694 41 12 11",
    exemple: false,
  },
  {
    id: "bonamoussadi",
    quartier: "Bonamoussadi",
    nom: "MCPP Bonamoussadi",
    adresse: "À préciser",
    cultes: "Dimanche 8h30",
    contact: "À préciser",
    exemple: true,
  },
  {
    id: "bonaberi",
    quartier: "Bonabéri",
    nom: "MCPP Bonabéri",
    adresse: "À préciser",
    cultes: "Dimanche 9h",
    contact: "À préciser",
    exemple: true,
  },
];

const palette = {
  bg: "#12211D",
  surface: "#1C2E28",
  surfaceRaised: "#24382F",
  border: "rgba(243,238,221,0.12)",
  gold: "#E3A54B",
  clay: "#BD5B38",
  text: "#F3EEDD",
  muted: "#9FB3A8",
};

function SoundWave({ pulse = true }) {
  const bars = [6, 14, 22, 30, 22, 30, 40, 30, 22, 30, 22, 14, 6];
  return (
    <div
      aria-hidden="true"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, height: 44 }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: h,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${palette.gold}, ${palette.clay})`,
            animation: pulse ? `mcpp-wave 1.8s ease-in-out ${i * 0.07}s infinite` : "none",
          }}
        />
      ))}
      <style>{`
        @keyframes mcpp-wave {
          0%, 100% { transform: scaleY(0.5); opacity: 0.6; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          div[aria-hidden="true"] > div { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function MCPPLogo({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Logo MCPP">
      <defs>
        <radialGradient id="mcpp-bg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#DCEFEA" />
          <stop offset="100%" stopColor="#A9CFC9" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#mcpp-bg)" stroke="#12211D" strokeWidth="2" />

      {/* texte circulaire simplifié */}
      <text x="100" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3F7A3A" letterSpacing="1">
        VÉRITÉ · TRUTH
      </text>
      <text x="100" y="184" textAnchor="middle" fontSize="12" fontWeight="700" fill="#C1440E" letterSpacing="1">
        AMOUR · LOVE
      </text>
      <text x="34" y="100" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1C2E64" transform="rotate(-90 34 100)">
        PAIX
      </text>
      <text x="166" y="100" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1C2E64" transform="rotate(90 166 100)">
        PEACE
      </text>

      {/* triangle supérieur avec croix */}
      <polygon points="100,44 132,96 68,96" fill="none" stroke="#12211D" strokeWidth="3" strokeLinejoin="round" />
      <line x1="100" y1="58" x2="100" y2="84" stroke="#12211D" strokeWidth="3" />
      <line x1="90" y1="66" x2="110" y2="66" stroke="#12211D" strokeWidth="3" />

      {/* pyramide avec livre */}
      <polygon points="60,146 140,146 118,100 82,100" fill="none" stroke="#12211D" strokeWidth="3" strokeLinejoin="round" />
      <path
        d="M76 132 Q100 122 124 132 L124 140 Q100 130 76 140 Z"
        fill="#F3EEDD"
        stroke="#12211D"
        strokeWidth="1.5"
      />
      <line x1="100" y1="124" x2="100" y2="140" stroke="#12211D" strokeWidth="1" />

      <text x="100" y="116" textAnchor="middle" fontSize="13" fontWeight="800" fill="#E3A54B" letterSpacing="1">
        MCPP
      </text>
    </svg>
  );
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export default function App() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({ nom: "", quartier: "", contact: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      setLoadingMembers(true);
      setLoadError(null);
      try {
        const list = await window.storage.list("member:", true);
        const keys = list?.keys || [];
        const results = await Promise.all(
          keys.map(async (k) => {
            try {
              const r = await window.storage.get(k, true);
              return r ? JSON.parse(r.value) : null;
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) {
          setMembers(results.filter(Boolean).sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0)));
        }
      } catch (e) {
        if (!cancelled) setLoadError("Impossible de charger la liste des membres pour le moment.");
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }
    loadMembers();
    return () => {
      cancelled = true;
    };
  }, []);

  const eglisesFiltrees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return EGLISES_EXEMPLE;
    return EGLISES_EXEMPLE.filter(
      (e) => e.quartier.toLowerCase().includes(q) || e.nom.toLowerCase().includes(q)
    );
  }, [search]);

  const membresGroupes = useMemo(() => {
    const groups = {};
    for (const m of members) {
      const key = m.quartier || "Quartier non précisé";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [members]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    if (!form.nom.trim() || !form.quartier.trim()) {
      setSubmitError("Le nom et le quartier sont obligatoires.");
      return;
    }
    setSubmitting(true);
    const id = `member:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      nom: form.nom.trim(),
      quartier: form.quartier.trim(),
      contact: form.contact.trim(),
      joinedAt: Date.now(),
    };
    try {
      const result = await window.storage.set(id, JSON.stringify(record), true);
      if (!result) throw new Error("Échec de l'enregistrement");
      setMembers((prev) => [record, ...prev]);
      setForm({ nom: "", quartier: "", contact: "" });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) {
      setSubmitError("L'inscription a échoué. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: palette.bg, color: palette.text, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        .mcpp-display { font-family: 'Fraunces', serif; }
        .mcpp-body { font-family: 'Work Sans', sans-serif; }
        .mcpp-mono { font-family: 'Space Mono', monospace; }
        .mcpp-input:focus, .mcpp-btn:focus-visible {
          outline: 2px solid ${palette.gold};
          outline-offset: 2px;
        }
      `}</style>

      {/* HERO */}
      <header className="mcpp-body" style={{ padding: "48px 20px 32px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <MCPPLogo size={92} />
        </div>
        <div
          className="mcpp-mono"
          style={{
            fontSize: 12,
            letterSpacing: 3,
            color: palette.gold,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Mission Chrétienne de la Parole Parlée — Douala
        </div>
        <h1
          className="mcpp-display"
          style={{ fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 600, lineHeight: 1.1, margin: "0 0 14px" }}
        >
          La Parole rassemble Douala
        </h1>
        <p style={{ color: palette.muted, maxWidth: 540, margin: "0 auto 28px", fontSize: 16, lineHeight: 1.6 }}>
          Retrouve l'église MCPP la plus proche de chez toi, et fais-toi connaître
          des autres membres de la mission dans ton quartier.
        </p>
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <input
            className="mcpp-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher un quartier (Akwa, Deido, Bonabéri...)"
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 10,
              border: `1px solid ${palette.border}`,
              background: palette.surface,
              color: palette.text,
              fontSize: 15,
              boxSizing: "border-box",
            }}
          />
        </div>
      </header>

      <SoundWave />

      {/* EGLISES */}
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "20px 20px 8px" }}>
        <h2 className="mcpp-display" style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
          Nos églises à Douala
        </h2>
        <p className="mcpp-body" style={{ color: palette.muted, fontSize: 14, marginBottom: 20 }}>
          {eglisesFiltrees.length} église{eglisesFiltrees.length > 1 ? "s" : ""} trouvée
          {eglisesFiltrees.length > 1 ? "s" : ""}
        </p>

        {eglisesFiltrees.length === 0 ? (
          <div
            className="mcpp-body"
            style={{
              padding: 24,
              borderRadius: 12,
              border: `1px dashed ${palette.border}`,
              color: palette.muted,
              textAlign: "center",
            }}
          >
            Aucune église trouvée pour « {search} ». Essaie un autre quartier.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {eglisesFiltrees.map((e) => (
              <div
                key={e.id}
                className="mcpp-body"
                style={{
                  background: palette.surface,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 14,
                  padding: 18,
                  position: "relative",
                }}
              >
                {e.exemple && (
                  <span
                    className="mcpp-mono"
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      fontSize: 9,
                      letterSpacing: 1,
                      color: palette.clay,
                      border: `1px solid ${palette.clay}`,
                      borderRadius: 999,
                      padding: "2px 7px",
                      textTransform: "uppercase",
                    }}
                  >
                    Exemple
                  </span>
                )}
                <div
                  className="mcpp-mono"
                  style={{ fontSize: 11, color: palette.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}
                >
                  {e.quartier}
                </div>
                <div className="mcpp-display" style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
                  {e.nom}
                </div>
                <div style={{ fontSize: 13.5, color: palette.muted, lineHeight: 1.7 }}>
                  {e.responsable && <div>🙏 {e.responsable}</div>}
                  <div>📍 {e.adresse}</div>
                  <div>🕊️ {e.cultes}</div>
                  <div>📞 {e.contact}</div>
                  {e.email && <div>✉️ {e.email}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ margin: "36px auto", maxWidth: 880, padding: "0 20px" }}>
        <div style={{ height: 1, background: palette.border }} />
      </div>

      {/* MEMBRES */}
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px 60px" }}>
        <h2 className="mcpp-display" style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
          Se retrouver entre membres
        </h2>
        <p className="mcpp-body" style={{ color: palette.muted, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          Inscris-toi pour que d'autres membres de la MCPP dans ton quartier puissent te
          retrouver. Ces informations sont visibles par tous les visiteurs de l'application.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mcpp-body"
          style={{
            background: palette.surfaceRaised,
            border: `1px solid ${palette.border}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 28,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <input
              className="mcpp-input"
              type="text"
              placeholder="Ton nom"
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              style={inputStyle}
            />
            <input
              className="mcpp-input"
              type="text"
              placeholder="Ton quartier"
              value={form.quartier}
              onChange={(e) => setForm((f) => ({ ...f, quartier: e.target.value }))}
              style={inputStyle}
            />
            <input
              className="mcpp-input"
              type="text"
              placeholder="Contact (optionnel)"
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              style={inputStyle}
            />
          </div>
          {submitError && (
            <div style={{ color: palette.clay, fontSize: 13, marginTop: 10 }}>{submitError}</div>
          )}
          {submitted && (
            <div style={{ color: palette.gold, fontSize: 13, marginTop: 10 }}>
              Inscription enregistrée. Merci !
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mcpp-btn"
            style={{
              marginTop: 14,
              padding: "11px 22px",
              borderRadius: 999,
              border: "none",
              background: submitting ? palette.muted : `linear-gradient(90deg, ${palette.gold}, ${palette.clay})`,
              color: "#12211D",
              fontWeight: 600,
              fontSize: 14,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Inscription en cours..." : "Rejoindre le répertoire"}
          </button>
        </form>

        {loadingMembers ? (
          <div className="mcpp-body" style={{ color: palette.muted, fontSize: 14 }}>Chargement des membres...</div>
        ) : loadError ? (
          <div className="mcpp-body" style={{ color: palette.clay, fontSize: 14 }}>{loadError}</div>
        ) : membresGroupes.length === 0 ? (
          <div
            className="mcpp-body"
            style={{
              padding: 24,
              borderRadius: 12,
              border: `1px dashed ${palette.border}`,
              color: palette.muted,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            Personne ne s'est encore inscrit. Sois le premier à te faire connaître !
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {membresGroupes.map(([quartier, list]) => (
              <div key={quartier}>
                <div
                  className="mcpp-mono"
                  style={{ fontSize: 11, color: palette.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}
                >
                  {quartier} · {list.length}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {list.map((m, idx) => (
                    <div
                      key={idx}
                      className="mcpp-body"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: palette.surface,
                        border: `1px solid ${palette.border}`,
                        borderRadius: 999,
                        padding: "7px 14px 7px 7px",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${palette.gold}, ${palette.clay})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#12211D",
                          flexShrink: 0,
                        }}
                      >
                        {initials(m.nom)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.nom}</div>
                        {m.contact && <div style={{ fontSize: 11.5, color: palette.muted }}>{m.contact}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer
        className="mcpp-body"
        style={{ textAlign: "center", padding: "24px 20px 40px", color: palette.muted, fontSize: 12.5 }}
      >
        Mission Chrétienne de la Parole Parlée · Douala, Cameroun
      </footer>
    </div>
  );
}

const inputStyle = {
  padding: "11px 14px",
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  background: palette.bg,
  color: palette.text,
  fontSize: 14,
  boxSizing: "border-box",
};
