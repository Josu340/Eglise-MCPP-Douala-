import { useState, useEffect } from "react";
import { Search, Plus, X, Phone, MapPin, User, Users, ChevronRight, Church, Trash2, Save, Lock } from "lucide-react";
import { db } from "./firebase";
import { collection, doc, setDoc, addDoc, deleteDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";

const SEED_CHURCHES = [
  { id: "pk14", name: "MCPP PK14 – Tabernacle du Seigneur Jésus Christ", area: "PK14, Douala", pastor: "Rev. Pasteur Ela", phone: "699645413 / 672894303" },
  { id: "pk12", name: "MCPP PK12 – Tabernacle", area: "PK12, Douala", pastor: "Dr. Ndjeng Becker", phone: "696415929 / 694411211" },
  { id: "nyalla", name: "MCPP Nyalla – Tabernacle du Quartier", area: "Nyalla, Douala", pastor: "Pasteur Tsekane Bienvenue", phone: "679 61 22 31" },
];

const DEFAULT_PASSWORD = "jesus christ";

function SoundWave() {
  const bars = [3, 6, 4, 8, 5, 9, 4, 7, 3, 6, 5, 8];
  return (
    <div className="flex items-end gap-[3px] h-6" aria-hidden="true">
      {bars.map((h, i) => (
        <span key={i} className="w-[3px] rounded-full bg-[#38BDF8]" style={{ height: `${h * 2}px`, animation: `mcpp-wave 1.4s ease-in-out ${i * 0.09}s infinite` }} />
      ))}
      <style>{`
        @keyframes mcpp-wave { 0%, 100% { transform: scaleY(0.4); opacity: 0.6; } 50% { transform: scaleY(1); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { span { animation: none !important; } }
      `}</style>
    </div>
  );
}

function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="19" stroke="#38BDF8" strokeWidth="1.5" fill="#0A2C47" />
      <path d="M11 27V13l9 8 9-8v14" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="20" cy="10" r="1.6" fill="#0EA5E9" />
    </svg>
  );
}

export default function MCPPDoualaConnect() {
  const [churches, setChurches] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ screen: "directory", churchId: null });
  const [query, setQuery] = useState("");
  const [showAddChurch, setShowAddChurch] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [toast, setToast] = useState(null);

  const [editPassword, setEditPassword] = useState(DEFAULT_PASSWORD);
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("mcpp-unlocked") === "1");
  const [pendingAction, setPendingAction] = useState(null);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const churchesRef = collection(db, "churches");
    const unsubChurches = onSnapshot(churchesRef, async (snapshot) => {
      if (snapshot.empty) {
        for (const c of SEED_CHURCHES) {
          const { id, ...data } = c;
          await setDoc(doc(db, "churches", id), data);
        }
        return;
      }
      setChurches(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const membersRef = collection(db, "members");
    const unsubMembers = onSnapshot(membersRef, (snapshot) => {
      setMembers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const settingsRef = doc(db, "settings", "app");
    const unsubSettings = onSnapshot(settingsRef, async (snap) => {
      if (!snap.exists()) {
        await setDoc(settingsRef, { editPassword: DEFAULT_PASSWORD });
        return;
      }
      setEditPassword(snap.data().editPassword || DEFAULT_PASSWORD);
    });

    return () => {
      unsubChurches();
      unsubMembers();
      unsubSettings();
    };
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  function withUnlock(action) {
    return (...args) => {
      if (unlocked) {
        action(...args);
      } else {
        setPendingAction(() => () => action(...args));
        setPasswordError("");
        setShowPasswordGate(true);
      }
    };
  }

  function handlePasswordSubmit(value) {
    if (value === editPassword) {
      setUnlocked(true);
      sessionStorage.setItem("mcpp-unlocked", "1");
      setShowPasswordGate(false);
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setPasswordError("Mot de passe incorrect");
    }
  }

  async function addChurch(data) {
    const id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `eglise-${Date.now()}`;
    try {
      await setDoc(doc(db, "churches", id), data);
      setShowAddChurch(false);
      showToast("Église ajoutée");
    } catch (e) {
      showToast("Échec de l'ajout de l'église");
    }
  }

  async function deleteChurch(id) {
    try {
      await deleteDoc(doc(db, "churches", id));
      const q = query(collection(db, "members"), where("churchId", "==", id));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      showToast("Église supprimée");
      setView({ screen: "directory", churchId: null });
    } catch (e) {
      showToast("Échec de la suppression de l'église");
    }
  }

  async function addMember(data) {
    try {
      await addDoc(collection(db, "members"), data);
      setShowAddMember(false);
      showToast("Membre ajouté");
    } catch (e) {
      showToast("Échec de l'ajout du membre");
    }
  }

  async function deleteMember(id) {
    try {
      await deleteDoc(doc(db, "members", id));
      showToast("Membre supprimé");
    } catch (e) {
      showToast("Échec de la suppression du membre");
    }
  }

  const filteredChurches = churches.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.area.toLowerCase().includes(query.toLowerCase()) ||
    c.pastor.toLowerCase().includes(query.toLowerCase())
  );

  const activeChurch = churches.find((c) => c.id === view.churchId);
  const churchMembers = members.filter((m) => m.churchId === view.churchId);

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, #1E7BB8 0%, #0A2C47 100%)", fontFamily: "'Georgia', serif", color: "#F4EFE6" }}>
      <style>{`
        .mcpp-body { font-family: 'Helvetica Neue', Arial, sans-serif; }
        .mcpp-focus:focus-visible { outline: 2px solid #38BDF8; outline-offset: 2px; }
      `}</style>

      <header className="sticky top-0 z-20 mcpp-body" style={{ background: "rgba(10,44,71,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(56,189,248,0.25)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Logo />
          <div className="flex-1">
            <h1 className="text-[17px] font-semibold tracking-wide" style={{ color: "#F4EFE6" }}>MCPP Douala Connect</h1>
            <p className="text-[11px]" style={{ color: "#38BDF8" }}>Répertoire &amp; registre des membres</p>
          </div>
          <SoundWave />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 mcpp-body pb-24">
        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: "#7FA8C9" }}>Chargement…</div>
        ) : view.screen === "directory" ? (
          <DirectoryScreen churches={filteredChurches} members={members} query={query} setQuery={setQuery} onOpen={(id) => setView({ screen: "church", churchId: id })} onAdd={withUnlock(() => setShowAddChurch(true))} />
        ) : (
          <ChurchScreen church={activeChurch} members={churchMembers} onBack={() => setView({ screen: "directory", churchId: null })} onAddMember={withUnlock(() => setShowAddMember(true))} onDeleteMember={withUnlock(deleteMember)} onDeleteChurch={withUnlock(deleteChurch)} />
        )}
      </main>

      {showAddChurch && <AddChurchModal onClose={() => setShowAddChurch(false)} onSave={addChurch} />}
      {showAddMember && activeChurch && <AddMemberModal churchId={activeChurch.id} onClose={() => setShowAddMember(false)} onSave={addMember} />}
      {showPasswordGate && (
        <PasswordGateModal
          error={passwordError}
          onClose={() => { setShowPasswordGate(false); setPendingAction(null); }}
          onSubmit={handlePasswordSubmit}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[13px] mcpp-body z-50" style={{ background: "#38BDF8", color: "#0A2C47", fontWeight: 600 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function DirectoryScreen({ churches, members, query, setQuery, onOpen, onAdd }) {
  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#7FA8C9" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une église, un pasteur, un quartier…" className="mcpp-focus w-full rounded-lg pl-9 pr-3 py-2.5 text-[14px]" style={{ background: "#12395C", border: "1px solid rgba(56,189,248,0.3)", color: "#F4EFE6" }} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] uppercase tracking-wider" style={{ color: "#7FA8C9" }}>{churches.length} église{churches.length !== 1 ? "s" : ""}</h2>
        <button onClick={onAdd} className="mcpp-focus flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-full" style={{ background: "#0EA5E9", color: "#F4EFE6" }}>
          <Plus size={14} /> Église
        </button>
      </div>

      <div className="space-y-2">
        {churches.length === 0 && (
          <div className="rounded-lg p-6 text-center text-[13px]" style={{ background: "#12395C", color: "#7FA8C9", border: "1px dashed rgba(56,189,248,0.3)" }}>
            Aucune église ne correspond à votre recherche.
          </div>
        )}
        {churches.map((c) => {
          const count = members.filter((m) => m.churchId === c.id).length;
          return (
            <button key={c.id} onClick={() => onOpen(c.id)} className="mcpp-focus w-full text-left rounded-lg p-4 flex items-center gap-3 transition-transform active:scale-[0.99]" style={{ background: "#12395C", border: "1px solid rgba(56,189,248,0.18)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(56,189,248,0.15)" }}>
                <Church size={18} style={{ color: "#38BDF8" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-semibold truncate" style={{ color: "#F4EFE6", fontFamily: "'Georgia', serif" }}>{c.name}</div>
                <div className="text-[12px] flex items-center gap-1 mt-0.5" style={{ color: "#7FA8C9" }}><MapPin size={11} /> {c.area}</div>
                <div className="text-[12px] flex items-center gap-1 mt-0.5" style={{ color: "#7FA8C9" }}><User size={11} /> {c.pastor}</div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] flex items-center gap-1" style={{ color: "#38BDF8" }}><Users size={11} /> {count}</span>
                <ChevronRight size={16} style={{ color: "#7FA8C9" }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChurchScreen({ church, members, onBack, onAddMember, onDeleteMember, onDeleteChurch }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!church) return null;

  return (
    <div>
      <button onClick={onBack} className="mcpp-focus text-[13px] mb-4 flex items-center gap-1" style={{ color: "#38BDF8" }}>← Répertoire</button>

      <div className="rounded-lg p-4 mb-4" style={{ background: "#12395C", border: "1px solid rgba(56,189,248,0.18)" }}>
        <h2 className="text-[19px] font-semibold" style={{ color: "#F4EFE6", fontFamily: "'Georgia', serif" }}>{church.name}</h2>
        <div className="text-[13px] mt-1 flex items-center gap-1" style={{ color: "#7FA8C9" }}><MapPin size={12} /> {church.area}</div>
        <div className="text-[13px] mt-1 flex items-center gap-1" style={{ color: "#7FA8C9" }}><User size={12} /> {church.pastor}</div>
        {church.phone && <div className="text-[13px] mt-1 flex items-center gap-1" style={{ color: "#7FA8C9" }}><Phone size={12} /> {church.phone}</div>}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] uppercase tracking-wider" style={{ color: "#7FA8C9" }}>{members.length} membre{members.length !== 1 ? "s" : ""}</h3>
        <button onClick={onAddMember} className="mcpp-focus flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-full" style={{ background: "#0EA5E9", color: "#F4EFE6" }}>
          <Plus size={14} /> Membre
        </button>
      </div>

      <div className="space-y-2 mb-6">
        {members.length === 0 && (
          <div className="rounded-lg p-6 text-center text-[13px]" style={{ background: "#12395C", color: "#7FA8C9", border: "1px dashed rgba(56,189,248,0.3)" }}>
            Aucun membre enregistré pour cette église.
          </div>
        )}
        {members.map((m) => (
          <div key={m.id} className="rounded-lg p-3.5 flex items-center gap-3" style={{ background: "#12395C", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold" style={{ background: "rgba(14,165,233,0.2)", color: "#38BDF8" }}>
              {m.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium truncate" style={{ color: "#F4EFE6" }}>{m.name}</div>
              <div className="text-[12px] flex items-center gap-2 mt-0.5" style={{ color: "#7FA8C9" }}>
                {m.role && <span>{m.role}</span>}
                {m.phone && <span className="flex items-center gap-1"><Phone size={10} /> {m.phone}</span>}
              </div>
            </div>
            <button onClick={() => onDeleteMember(m.id)} className="mcpp-focus p-1.5 rounded-full" aria-label={`Supprimer ${m.name}`} style={{ color: "#7FA8C9" }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {!confirmDelete ? (
        <button onClick={() => setConfirmDelete(true)} className="mcpp-focus text-[12px]" style={{ color: "#7FA8C9" }}>Supprimer cette église</button>
      ) : (
        <div className="text-[12px] flex items-center gap-3" style={{ color: "#7FA8C9" }}>
          Confirmer la suppression de {church.name} et de ses membres ?
          <button onClick={() => onDeleteChurch(church.id)} className="mcpp-focus px-2 py-1 rounded" style={{ background: "#0EA5E9", color: "#F4EFE6" }}>Confirmer</button>
          <button onClick={() => setConfirmDelete(false)} className="mcpp-focus underline">Annuler</button>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(10,44,71,0.7)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 mcpp-body" style={{ background: "#12395C", border: "1px solid rgba(56,189,248,0.25)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold" style={{ color: "#F4EFE6" }}>{title}</h3>
          <button onClick={onClose} className="mcpp-focus p-1" aria-label="Fermer" style={{ color: "#7FA8C9" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function fieldStyle() { return { background: "#0A2C47", border: "1px solid rgba(56,189,248,0.3)", color: "#F4EFE6" }; }

function PasswordGateModal({ onClose, onSubmit, error }) {
  const [value, setValue] = useState("");
  return (
    <Modal title="Mot de passe requis" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "#7FA8C9" }}>
          <Lock size={14} /> Réservé aux personnes autorisées.
        </div>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSubmit(value); }}
          placeholder="Mot de passe"
          className="mcpp-focus w-full rounded-lg px-3 py-2 text-[14px]"
          style={fieldStyle()}
        />
        {error && <p className="text-[12px]" style={{ color: "#F87171" }}>{error}</p>}
        <button onClick={() => onSubmit(value)} className="mcpp-focus w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[14px] font-semibold" style={{ background: "#38BDF8", color: "#0A2C47" }}>
          <Lock size={15} /> Déverrouiller
        </button>
      </div>
    </Modal>
  );
}

function AddChurchModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [pastor, setPastor] = useState("");
  const [phone, setPhone] = useState("");

  function submit() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), area: area.trim() || "Douala", pastor: pastor.trim() || "À renseigner", phone: phone.trim() });
  }

  return (
    <Modal title="Ajouter une église" onClose={onClose}>
      <div className="space-y-3">
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'église" className="mcpp-focus w-full rounded-lg px-3 py-2 text-[14px]" style={fieldStyle()} />
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Quartier / zone" className="mcpp-focus w-full rounded-lg px-3 py-2 text-[14px]" style={fieldStyle()} />
        <input value={pastor} onChange={(e) => setPastor(e.target.value)} placeholder="Pasteur responsable" className="mcpp-focus w-full rounded-lg px-3 py-2 text-[14px]" style={fieldStyle()} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (optionnel)" className="mcpp-focus w-full rounded-lg px-3 py-2 text-[14px]" style={fieldStyle()} />
        <button onClick={submit} disabled={!name.trim()} className="mcpp-focus w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[14px] font-semibold disabled:opacity-40" style={{ background: "#38BDF8", color: "#0A2C47" }}>
          <Save size={15} /> Enregistrer
        </button>
      </div>
    </Modal>
  );
}

function AddMemberModal({ churchId, onClose, onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  function submit() {
    if (!name.trim()) return;
    onSave({ churchId, name: name.trim(), phone: phone.trim(), role: role.trim() });
  }

  return (
    <Modal title="Ajouter un membre" onClose={onClose}>
      <div className="space-y-3">
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" className="mcpp-focus w-full rounded-lg px-3 py-2 text-[14px]" style={fieldStyle()} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (optionnel)" className="mcpp-focus w-full rounded-lg px-3 py-2 text-[14px]" style={fieldStyle()} />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Rôle (diacre, chorale, jeunesse…)" className="mcpp-focus w-full rounded-lg px-3 py-2 text-[14px]" style={fieldStyle()} />
        <button onClick={submit} disabled={!name.trim()} className="mcpp-focus w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[14px] font-semibold disabled:opacity-40" style={{ background: "#38BDF8", color: "#0A2C47" }}>
          <Save size={15} /> Enregistrer
        </button>
      </div>
    </Modal>
  );
                }
