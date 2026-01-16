import React, { useState, useEffect, useMemo } from "react";
import "./FinancialSituation.css";

/* =========================
   OUTILS
========================= */

// Normaliser clés storage
const normalizeKey = (section, classe, prefix) => {
  const s = (section || "section")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const c = (classe || "classe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return `${prefix}_${s}_${c}`;
};

const monthDefs = [
  { key: "sept", label: "SEPT", num: 9 },
  { key: "oct", label: "OCT", num: 10 },
  { key: "nov", label: "NOV", num: 11 },
  { key: "dec", label: "DÉC", num: 12 },
  { key: "jan", label: "JAN", num: 1 },
  { key: "fev", label: "FÉV", num: 2 },
  { key: "mars", label: "MARS", num: 3 },
  { key: "avr", label: "AVR", num: 4 },
  { key: "mai", label: "MAI", num: 5 },
  { key: "juin", label: "JUIN", num: 6 },
];

const F_KEYS = ["f1", "f2", "f3"];

const getMonthlyFee = (section, classe) => {
  const s = (section || "").toLowerCase();
  const c = (classe || "").toLowerCase();
  const secondaire =
    s.includes("secondaire") ||
    ["7", "8", "1", "2", "3", "4"].some((n) => c.startsWith(n));
  return secondaire ? 25000 : 16500;
};

const mapMonthIndex = (m) => (m >= 9 ? m - 9 : m + 3);

/* =========================
   COMPOSANT
========================= */

export default function FinancialSituation({ selectedClass, onBack }) {
  const [students, setStudents] = useState([]);
  const [paymentsMap, setPaymentsMap] = useState({});
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    if (typeof window !== "undefined" && selectedClass) {
      window.PDF_CONTEXT = {
        type: "situation-financiere",
        data: {
          classe: selectedClass?.classe,
          section: selectedClass?.section,
          students,
          payments: paymentsMap,
        },
      };
      return () => {
        delete window.PDF_CONTEXT;
      };
    }
  }, [selectedClass, students, paymentsMap]);
        ? getMonthlyFee(
            selectedClass.sectionName,
            selectedClass.className
          )
        : 0,
    [selectedClass]
  );

  const studentsKey = useMemo(() => {
    if (!selectedClass) return "";
    return normalizeKey(
      selectedClass.sectionName,
      selectedClass.className,
      "lr_students"
    );
  }, [selectedClass]);

  const paymentsKey = useMemo(() => {
    if (!selectedClass) return "";
    return normalizeKey(
      selectedClass.sectionName,
      selectedClass.className,
      "lr_payments"
    );
  }, [selectedClass]);

  /* ===== Charger élèves ===== */
  useEffect(() => {
    if (!studentsKey) return setStudents([]);
    try {
      const raw = localStorage.getItem(studentsKey);
      const parsed = JSON.parse(raw || "[]");
      setStudents(Array.isArray(parsed) ? parsed : []);
    } catch {
      setStudents([]);
    }
  }, [studentsKey]);

  /* ===== Charger paiements ===== */
  useEffect(() => {
    if (!paymentsKey) return setPaymentsMap({});
    try {
      const raw = localStorage.getItem(paymentsKey);
      const parsed = JSON.parse(raw || "{}");
      setPaymentsMap(parsed || {});
    } catch {
      setPaymentsMap({});
    }
  }, [paymentsKey]);

  /* ===== Normalisation élèves ===== */
  const normalizedStudents = useMemo(
    () =>
      students.map((s, i) => ({
        ...s,
        rowId: s.id || `${i + 1}`,
        fullName: [s.nom, s.postnom, s.prenom].filter(Boolean).join(" "),
      })),
    [students]
  );

  /* ===== Paiement utils ===== */
  const getStudentMonthPayment = (id, key) => {
    const e = paymentsMap?.[id]?.[key];
    return { amount: Number(e?.amount) || 0 };
  };

  const getStudentFPayment = (id, key) => {
    const e = paymentsMap?.[id]?.[key];
    return { amount: Number(e?.amount) || 0 };
  };

  const isMonthPayable = (m, start) =>
    mapMonthIndex(m) >= mapMonthIndex(start);

  const getStartMonth = (insc) => {
    if (!insc) return 9;
    const d = new Date(insc);
    if (isNaN(d)) return 9;
    return d.getDate() > 20 ? d.getMonth() + 2 : d.getMonth() + 1;
  };

  const schoolYear = useMemo(() => {
    const n = new Date();
    return n.getMonth() + 1 >= 9 ? n.getFullYear() : n.getFullYear() - 1;
  }, []);

  const calculateDebt = (stu) => {
    let due = 0;
    let paid = 0;
    const start = getStartMonth(stu.inscription);

    monthDefs.forEach(({ key, num }) => {
      const mp = getStudentMonthPayment(stu.rowId, key);
      if (isMonthPayable(num, start)) {
        const y = num >= 9 ? schoolYear : schoolYear + 1;
        if (new Date() >= new Date(y, num, 5)) due += monthlyFee;
      }
      paid += mp.amount;
    });

    F_KEYS.forEach((f) => {
      due += 9000;
      paid += getStudentFPayment(stu.rowId, f).amount;
    });

    return Math.max(0, due - paid);
  };

  const getTotalPaid = (stu) => {
    let t = 0;
    monthDefs.forEach(({ key }) => {
      t += getStudentMonthPayment(stu.rowId, key).amount;
    });
    F_KEYS.forEach((f) => {
      t += getStudentFPayment(stu.rowId, f).amount;
    });
    return t;
  };

  const sortedStudents = [...normalizedStudents].sort((a, b) =>
    sortBy === "payment"
      ? getTotalPaid(b) - getTotalPaid(a)
      : a.fullName.localeCompare(b.fullName)
  );

  /* ===== CONTEXTE PDF (UNIQUE ET CORRECT) ===== */
  useEffect(() => {
    if (selectedClass && students.length > 0) {
      window.PDF_CONTEXT = {
        type: "situation-financiere",
        data: {
          className: selectedClass.className || "",
          sectionName: selectedClass.sectionName || "",
          students: students,
          payments: paymentsMap || {},
        },
      };
    } else {
      window.PDF_CONTEXT = null;
    }
    return () => {
      delete window.PDF_CONTEXT;
    };
  }, [selectedClass, students, paymentsMap]);

  /* ===== RENDER ===== */
  if (!selectedClass) {
    return (
      <div className="financial-situation">
        <h2>Aucune classe sélectionnée</h2>
      </div>
    );
  }

  return (
    <div className="financial-situation">
      <div className="header">
        <h1>
          Situation financière — {selectedClass.sectionName} /{" "}
          {selectedClass.className}
        </h1>
        <button onClick={onBack}>← Retour</button>
        <button onClick={() => setSortBy(sortBy === "name" ? "payment" : "name")}>
          Trier par {sortBy === "name" ? "paiement" : "nom"}
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>N°</th>
            <th>Matricule</th>
            <th>Nom</th>
            {monthDefs.map((m) => (
              <th key={m.key}>{m.label}</th>
            ))}
            <th>F1</th>
            <th>F2</th>
            <th>F3</th>
            <th>Dette</th>
            <th>Payé</th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((stu, i) => (
            <tr key={stu.rowId}>
              <td>{i + 1}</td>
              <td>{stu.matricule}</td>
              <td>{stu.fullName}</td>
              {monthDefs.map((m) => (
                <td key={m.key}>
                  {getStudentMonthPayment(stu.rowId, m.key).amount || "-"}
                </td>
              ))}
              {F_KEYS.map((f) => (
                <td key={f}>
                  {getStudentFPayment(stu.rowId, f).amount || "-"}
                </td>
              ))}
              <td>{calculateDebt(stu)}</td>
              <td>{getTotalPaid(stu)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
