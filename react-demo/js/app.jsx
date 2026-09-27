"use strict";

/* ============================================================
   Splitzy — bill-splitting demo
   React 18 (CDN UMD) + Babel standalone: no build step, no imports.
   Demonstrates: custom hooks (useLocalStorage, useBalances),
   Context (no prop drilling), controlled forms + inline validation,
   derived state via useMemo, a greedy min-transfer settle algorithm.
   ============================================================ */

const { useState, useEffect, useMemo, useContext, createContext } = React;

/* ---------------------------- helpers ---------------------------- */

const STORAGE_KEY = "splitzy-…e-v1";
const EPS = 0.005; // half a cent: below this we call a balance "settled"

const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmt = (n) => Math.abs(n).toFixed(2); // currency-agnostic: plain numbers
const initial = (name) => name.trim().slice(0, 1).toUpperCase();

/** The explicit demo seed reviewers can load with one click. */
function makeDemoData() {
  const ana = uid();
  const bilal = uid();
  const chen = uid();
  const now = Date.now();
  return {
    people: [
      { id: ana, name: "Ana" },
      { id: bilal, name: "Bilal" },
      { id: chen, name: "Chen" },
    ],
    expenses: [
      { id: uid(), payerId: chen, description: "WiFi upgrade (2 months)", amount: 30, splitIds: [ana, chen], createdAt: now - 100000 },
      { id: uid(), payerId: bilal, description: "Cab to the airport", amount: 45.5, splitIds: [ana, bilal, chen], createdAt: now - 200000 },
      { id: uid(), payerId: ana, description: "Groceries for the week", amount: 60, splitIds: [ana, bilal, chen], createdAt: now - 300000 },
    ],
  };
}

/* ---------------------------- custom hooks ---------------------------- */

/** useState, persisted to localStorage (reads lazily, writes on change). */
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch (err) {
      /* corrupted storage: fall through to the default */
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* private mode / quota: the app still works in memory */
    }
  }, [key, value]);

  return [value, setValue];
}

/** Per-person net balances + a minimal set of settle-up transfers. */
function useBalances(state) {
  return useMemo(() => {
    const balances = computeBalances(state);
    const totalOutstanding = round2(
      balances.reduce((sum, b) => sum + Math.max(b.balance, 0), 0)
    );
    return {
      balances,
      transfers: computeTransfers(balances),
      totalOutstanding,
    };
  }, [state]);
}

/* --------------------- pure money math (unit-testable) --------------------- */

/**
 * Balance = (what you paid for the group) − (your share of every expense).
 * Positive → the group owes you. Negative → you owe the group.
 */
function computeBalances(state) {
  const map = {};
  const order = [];
  state.people.forEach((p) => {
    map[p.id] = { id: p.id, name: p.name, balance: 0, paid: 0, owed: 0 };
    order.push(p.id);
  });

  state.expenses.forEach((e) => {
    const payer = map[e.payerId];
    if (!payer) return;
    const participants = e.splitIds.filter((id) => map[id]);
    if (!participants.length) return;
    const share = e.amount / participants.length;
    payer.paid += e.amount;
    payer.balance += e.amount;
    participants.forEach((id) => {
      map[id].owed += share;
      map[id].balance -= share;
    });
  });

  return order.map((id) => {
    const b = map[id];
    return {
      id: b.id,
      name: b.name,
      balance: round2(b.balance),
      paid: round2(b.paid),
      owed: round2(b.owed),
    };
  });
}

/**
 * Greedy "settle up": repeatedly let the biggest debtor pay the biggest
 * creditor for as much as possible. Each transfer zeroes out at least one
 * person, so it never needs more than (n − 1) transfers.
 */
function computeTransfers(balances) {
  const creditors = balances
    .filter((b) => b.balance > EPS)
    .map((b) => ({ name: b.name, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((b) => b.balance < -EPS)
    .map((b) => ({ name: b.name, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].amount, debtors[j].amount);
    transfers.push({
      from: debtors[j].name,
      to: creditors[i].name,
      amount: round2(amount),
    });
    creditors[i].amount = round2(creditors[i].amount - amount);
    debtors[j].amount = round2(debtors[j].amount - amount);
    if (creditors[i].amount <= EPS) i += 1;
    if (debtors[j].amount <= EPS) j += 1;
  }
  return transfers;
}

/* ---------------------------- context ---------------------------- */
/* Three small contexts so no component is drilled more than one level:
   state (rarely changes), actions (stable), derived values (memoized). */

const StateContext = createContext(null);
const ActionsContext = createContext(null);
const DerivedContext = createContext(null);

const useAppState = () => useContext(StateContext);
const useAppActions = () => useContext(ActionsContext);
const useDerived = () => useContext(DerivedContext);

/* ---------------------------- App ---------------------------- */

function App() {
  const [state, setState] = useLocalStorage(STORAGE_KEY, {
    people: [],
    expenses: [],
  });

  // One stable bag of intents — children never receive setState directly.
  const actions = useMemo(
    () => ({
      addPerson(name) {
        setState((s) => ({
          ...s,
          people: [...s.people, { id: uid(), name }],
        }));
      },
      removePerson(id) {
        setState((s) => ({
          people: s.people.filter((p) => p.id !== id),
          expenses: s.expenses
            .filter((e) => e.payerId !== id) // expenses they paid vanish...
            .map((e) => ({
              ...e,
              splitIds: e.splitIds.filter((p) => p !== id), // ...and they leave other splits
            })),
        }));
      },
      addExpense(expense) {
        setState((s) => ({
          ...s,
          expenses: [{ ...expense, id: uid(), createdAt: Date.now() }, ...s.expenses],
        }));
      },
      deleteExpense(id) {
        setState((s) => ({
          ...s,
          expenses: s.expenses.filter((e) => e.id !== id),
        }));
      },
      resetDemo() {
        setState(makeDemoData());
      },
      clearAll() {
        setState({ people: [], expenses: [] });
      },
    }),
    [setState]
  );

  const derived = useBalances(state);

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>
        <DerivedContext.Provider value={derived}>
          <div className="app">
            <Header />
            <main className="layout">
              <div className="col col--primary">
                <PersonManager />
                <ExpenseForm />
                <ExpenseList />
              </div>
              <aside className="col col--secondary">
                <BalancePanel />
                <SettleSuggestions />
              </aside>
            </main>
            <Announcer />
            <footer className="footer">
              React demo built by Faraz Malang Jan — personal project ·{" "}
              React 18 + Babel via CDN, zero build step · data stays in your
              browser (localStorage)
            </footer>
          </div>
        </DerivedContext.Provider>
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}

/* ---------------------------- Header ---------------------------- */

function Header() {
  const { people, expenses } = useAppState();
  const { totalOutstanding } = useDerived();
  const { resetDemo, clearAll } = useAppActions();

  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <div className="header__logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 6v20M8 12l6 4-6 4M24 12l-6 4 6 4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="header__title">Splitzy</h1>
            <p className="header__tag">
              Split bills with roommates &amp; trip mates — fairly.
            </p>
          </div>
        </div>
        <div className="header__meta">
          <span className="stat-pill">
            {people.length} {people.length === 1 ? "person" : "people"} ·{" "}
            {expenses.length}{" "}
            {expenses.length === 1 ? "expense" : "expenses"}
          </span>
          <span className="stat-pill stat-pill--teal">
            {totalOutstanding > EPS ? fmt(totalOutstanding) + " unsettled" : "All settled"}
          </span>
          <div className="header__actions">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                resetDemo();
                announce("Demo data loaded: 3 people, 3 expenses.");
              }}
            >
              Reset demo
            </button>
            {people.length > 0 && (
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={() => {
                  clearAll();
                  announce("Everything cleared.");
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------- PersonManager ---------------------------- */

function PersonManager() {
  const { people, expenses } = useAppState();
  const { addPerson, removePerson } = useAppActions();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a name first.");
    if (trimmed.length > 24) return setError("Keep names under 24 characters.");
    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()))
      return setError(trimmed + " is already in the group.");
    addPerson(trimmed);
    setName("");
    setError("");
    announce(trimmed + " added to the group.");
  };

  const handleRemove = (person) => {
    const paidCount = expenses.filter((e) => e.payerId === person.id).length;
    const warning =
      paidCount > 0
        ? "Remove " + person.name + "? " +
          paidCount + " expense" + (paidCount === 1 ? "" : "s") +
          " they paid will be deleted, and they will leave every other split."
        : "Remove " + person.name + " from the group?";
    if (!window.confirm(warning)) return;
    removePerson(person.id);
    announce(person.name + " removed.");
  };

  return (
    <section className="card" aria-labelledby="people-title">
      <div className="card__head">
        <h2 className="card__title" id="people-title">People</h2>
        <span className="card__hint">
          {people.length ? "Tap × to remove someone" : "start with 2+ names"}
        </span>
      </div>

      <form className="person-form" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="new-person">New person name</label>
        <input
          id="new-person"
          className={"input" + (error ? " input--invalid" : "")}
          placeholder="e.g. Sara"
          value={name}
          maxLength={40}
          autoComplete="off"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "new-person-error" : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
        />
        <button type="submit" className="btn btn--primary">Add person</button>
      </form>
      {error && <p className="field-error" id="new-person-error">{error}</p>}

      {people.length === 0 ? (
        <div className="empty">
          <p className="empty__title">No people yet</p>
          <p className="empty__body">
            Add at least two people to start splitting — or hit “Reset demo”
            to explore with sample data.
          </p>
        </div>
      ) : (
        <ul className="chips">
          {people.map((p) => (
            <li key={p.id} className="chip">
              <span className="chip__avatar" aria-hidden="true">{initial(p.name)}</span>
              <span className="chip__name">{p.name}</span>
              <button
                type="button"
                className="chip__remove"
                aria-label={"Remove " + p.name}
                onClick={() => handleRemove(p)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------------------- ExpenseForm ---------------------------- */

function ExpenseForm() {
  const { people } = useAppState();
  const { addExpense } = useAppActions();
  const [payerId, setPayerId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitIds, setSplitIds] = useState([]);
  const [errors, setErrors] = useState({});

  const peopleIds = useMemo(() => people.map((p) => p.id), [people]);
  // Fall back to the first person if the stored payer was deleted.
  const activePayer = peopleIds.includes(payerId) ? payerId : peopleIds[0] || "";
  const activeSplit = splitIds.filter((id) => peopleIds.includes(id));

  // Keep splits sane as the group changes: drop deleted people,
  // and default brand-new people to "included".
  useEffect(() => {
    setSplitIds((prev) => {
      const kept = prev.filter((id) => peopleIds.includes(id));
      const added = peopleIds.filter((id) => !prev.includes(id));
      return kept.concat(added);
    });
  }, [people]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSplit = (id) => {
    setSplitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setErrors((prev) => ({ ...prev, split: undefined }));
  };

  const allChecked = activeSplit.length === people.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    const value = Number(amount.replace(/,/g, ""));
    if (!description.trim()) next.description = "Give the expense a name.";
    if (!amount.trim()) next.amount = "Enter an amount.";
    else if (!isFinite(value) || value <= 0)
      next.amount = "Amount must be greater than 0.";
    if (activeSplit.length < 2)
      next.split = "Split between at least 2 people.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    addExpense({
      payerId: activePayer,
      description: description.trim(),
      amount: round2(value),
      splitIds: activeSplit,
    });
    setDescription("");
    setAmount("");
    setErrors({});
    announce("Expense added: " + description.trim() + ", " + fmt(value) + ".");
  };

  if (people.length < 2) {
    return (
      <section className="card" aria-labelledby="expense-title">
        <div className="card__head">
          <h2 className="card__title" id="expense-title">Add expense</h2>
        </div>
        <div className="empty">
          <p className="empty__title">Need more people</p>
          <p className="empty__body">
            Add at least 2 people above before recording an expense.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="expense-title">
      <div className="card__head">
        <h2 className="card__title" id="expense-title">Add expense</h2>
        <span className="card__hint">amounts are unit-free (currency-agnostic)</span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="field form-grid--full">
            <label className="field__label" htmlFor="exp-desc">Description</label>
            <input
              id="exp-desc"
              className={"input" + (errors.description ? " input--invalid" : "")}
              placeholder="e.g. Dinner at the night market"
              value={description}
              maxLength={80}
              autoComplete="off"
              aria-invalid={errors.description ? "true" : "false"}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
            />
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="exp-amount">Amount</label>
            <input
              id="exp-amount"
              className={"input" + (errors.amount ? " input--invalid" : "")}
              placeholder="0.00"
              inputMode="decimal"
              value={amount}
              aria-invalid={errors.amount ? "true" : "false"}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
            />
            {errors.amount && <p className="field-error">{errors.amount}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="exp-payer">Paid by</label>
            <select
              id="exp-payer"
              className="select"
              value={activePayer}
              onChange={(e) => setPayerId(e.target.value)}
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="split-head">
          <span className="field__label">Split between ({activeSplit.length})</span>
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={() => {
              setSplitIds(allChecked ? [] : peopleIds.slice());
              setErrors((prev) => ({ ...prev, split: undefined }));
            }}
          >
            {allChecked ? "Clear all" : "Everyone"}
          </button>
        </div>
        <div
          className="split-grid"
          role="group"
          aria-label="People to split this expense between"
        >
          {people.map((p) => {
            const checked = activeSplit.includes(p.id);
            return (
              <label key={p.id} className={"check" + (checked ? " check--on" : "")}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSplit(p.id)}
                />
                <span className="check__name">{p.name}</span>
              </label>
            );
          })}
        </div>
        {errors.split && <p className="field-error">{errors.split}</p>}

        <div style={{ marginTop: 14 }}>
          <button type="submit" className="btn btn--primary">Add expense</button>
        </div>
      </form>
    </section>
  );
}

/* ---------------------------- ExpenseList ---------------------------- */

function ExpenseList() {
  const { people, expenses } = useAppState();
  const { deleteExpense } = useAppActions();

  const nameOf = useMemo(() => {
    const map = {};
    people.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [people]);

  const sorted = useMemo(
    () => [...expenses].sort((a, b) => b.createdAt - a.createdAt),
    [expenses]
  );

  return (
    <section className="card" aria-labelledby="list-title">
      <div className="card__head">
        <h2 className="card__title" id="list-title">Expenses</h2>
        <span className="card__hint">newest first</span>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <p className="empty__title">No expenses yet</p>
          <p className="empty__body">
            Who paid for what? Add your first expense above and balances
            update instantly.
          </p>
        </div>
      ) : (
        <ul className="expense-list">
          {sorted.map((e) => (
            <li key={e.id} className="expense">
              <span className="expense__avatar" aria-hidden="true">
                {initial(nameOf[e.payerId] || "?")}
              </span>
              <div className="expense__body">
                <p className="expense__desc">{e.description}</p>
                <p className="expense__meta">
                  paid by {nameOf[e.payerId] || "removed"} · split{" "}
                  {e.splitIds.length} {e.splitIds.length === 1 ? "way" : "ways"}
                  {" · "}{fmt(e.amount / Math.max(e.splitIds.length, 1))} each
                </p>
              </div>
              <span className="expense__amount">{fmt(e.amount)}</span>
              <button
                type="button"
                className="rowdel"
                aria-label={"Delete expense " + e.description}
                onClick={() => {
                  deleteExpense(e.id);
                  announce("Expense removed: " + e.description + ".");
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------------------- BalancePanel ---------------------------- */

function BalancePanel() {
  const { people } = useAppState();
  const { balances } = useDerived();

  return (
    <section className="card" aria-labelledby="balance-title">
      <div className="card__head">
        <h2 className="card__title" id="balance-title">Balances</h2>
        <span className="card__hint">live, recomputed with useMemo</span>
      </div>

      {people.length === 0 ? (
        <div className="empty">
          <p className="empty__title">Nothing to balance yet</p>
          <p className="empty__body">Add people and expenses to see who owes whom.</p>
        </div>
      ) : (
        <ul className="balance-list">
          {balances.map((b) => {
            const isPos = b.balance > EPS;
            const isNeg = b.balance < -EPS;
            return (
              <li key={b.id} className="balance-row">
                <div className="balance-row__body">
                  <p className="balance-row__name">{b.name}</p>
                  <p className="balance-row__meta">
                    paid {fmt(b.paid)} · owes group {fmt(b.owed)}
                  </p>
                </div>
                <span
                  className={
                    "pill " + (isPos ? "pill--pos" : isNeg ? "pill--neg" : "pill--zero")
                  }
                >
                  {isPos ? "+" + fmt(b.balance) : isNeg ? "−" + fmt(b.balance) : "settled"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {people.length > 0 && (
        <p className="legend">
          <strong style={{ color: "var(--green-ink)" }}>+</strong> gets back ·{" "}
          <strong style={{ color: "var(--red-ink)" }}>−</strong> still owes ·
          balances always sum to zero.
        </p>
      )}
    </section>
  );
}

/* ---------------------------- SettleSuggestions ---------------------------- */

function SettleSuggestions() {
  const { people } = useAppState();
  const { transfers, totalOutstanding } = useDerived();

  return (
    <section className="card" aria-labelledby="settle-title">
      <div className="card__head">
        <h2 className="card__title" id="settle-title">Settle up</h2>
        <span className="card__hint">fewest transfers</span>
      </div>

      {people.length < 2 ? (
        <div className="empty">
          <p className="empty__title">No suggestions yet</p>
          <p className="empty__body">
            Add at least two people — Splitzy will work out the simplest way
            to square everyone.
          </p>
        </div>
      ) : transfers.length === 0 ? (
        <div className="settled-note">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M6 10.4l2.6 2.6L14.2 7.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All settled up — nobody owes anybody.
        </div>
      ) : (
        <ul className="settle-list">
          {transfers.map((t, idx) => (
            <li key={idx} className="settle-row">
              <span className="settle-row__avatar settle-row__avatar--from" aria-hidden="true">
                {initial(t.from)}
              </span>
              <span className="settle-row__names">
                <b>{t.from}</b> pays <b>{t.to}</b>
              </span>
              <span className="settle-row__arrow" aria-hidden="true">→</span>
              <span className="settle-row__avatar settle-row__avatar--to" aria-hidden="true">
                {initial(t.to)}
              </span>
              <span className="settle-row__amt">{fmt(t.amount)}</span>
            </li>
          ))}
          <li className="settle-foot" role="presentation">
            {transfers.length} {transfers.length === 1 ? "transfer" : "transfers"}
            {" "}moving {fmt(totalOutstanding)} total — greedy pairing: biggest
            debtor pays biggest creditor.
          </li>
        </ul>
      )}
    </section>
  );
}

/* ---------------------------- announcements ---------------------------- */

/* Tiny module-level pub/sub so deeply nested components can announce to the
   aria-live region without threading callbacks through props. */
const liveListeners = [];
function announce(message) {
  liveListeners.forEach((fn) => fn(message));
}

function Announcer() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    liveListeners.push(setMessage);
    return () => {
      const i = liveListeners.indexOf(setMessage);
      if (i !== -1) liveListeners.splice(i, 1);
    };
  }, []);
  return (
    <div className="sr-only" aria-live="polite" role="status">
      {message}
    </div>
  );
}

/* ---------------------------- mount ---------------------------- */

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
window.__SPLITZY_MOUNTED__ = true;
