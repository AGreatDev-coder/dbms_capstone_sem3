import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Terminal,
  Database,
  GitMerge,
  Layers,
  Network,
  Cpu,
  ShieldAlert,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Table,
  Eye,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Lock,
  Boxes,
  HelpCircle
} from 'lucide-react';

const DBMSLearningLab = () => {
  const [activeTab, setActiveTab] = useState('operations');

  // Tab 1: SQL Operations State
  const [collegeData, setCollegeData] = useState({ students: [], courses: [], exams: [], faculty: [] });
  const [opResult, setOpResult] = useState(null);
  const [opLoading, setOpLoading] = useState(false);

  // Tab 2: Join Visualizer State
  const [joinType, setJoinType] = useState('inner');
  const [joinResult, setJoinResult] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);

  // Tab 3: Database Models Explorer State
  const [modelType, setModelType] = useState('hierarchical');
  const [modelData, setModelData] = useState(null);

  // Tab 4: Schema Explorer State
  const [schemaData, setSchemaData] = useState(null);
  const [selectedTable, setSelectedTable] = useState('Patient');

  // Tab 5: Normalization Laboratory State
  const [normStage, setNormStage] = useState('1nf');

  // Tab 6: SQL Playground State
  const [playgroundSql, setPlaygroundSql] = useState(
    "SELECT pt.patient_id, CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.blood_group, h.hospital_name, pt.medical_status FROM Patient pt JOIN Person p ON pt.person_id = p.person_id JOIN Hospital h ON pt.hospital_id = h.hospital_id ORDER BY pt.patient_id DESC LIMIT 10;"
  );
  const [playgroundResult, setPlaygroundResult] = useState(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  // Tab 7: Transactions Laboratory State
  const [txResult, setTxResult] = useState(null);
  const [txLoading, setTxLoading] = useState(false);

  // Tab 8: Indexing and Optimization State
  const [indexData, setIndexData] = useState(null);
  const [indexLoading, setIndexLoading] = useState(false);

  // Tab 9: Constraints State
  const [constraintResult, setConstraintResult] = useState(null);

  // Tab 10: Advanced SQL Concepts State
  const [advancedCategory, setAdvancedCategory] = useState('cte');
  const [advancedResult, setAdvancedResult] = useState(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'operations') fetchCollegeData();
    if (activeTab === 'joins') fetchJoinData(joinType);
    if (activeTab === 'models') fetchModelData();
    if (activeTab === 'schema') fetchSchemaData();
    if (activeTab === 'indexing') fetchIndexData('explain');
  }, [activeTab]);

  // Tab 1 Fetchers & Handlers
  const fetchCollegeData = async () => {
    try {
      const res = await api.get('/dbms-lab/operations/college-data');
      if (res.data?.success) setCollegeData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecuteOperation = async (op) => {
    try {
      setOpLoading(true);
      const res = await api.post('/dbms-lab/operations/execute', { operationType: op });
      setOpResult(res.data);
      fetchCollegeData();
    } catch (e) {
      setOpResult({ success: false, message: e.response?.data?.message || e.message });
    } finally {
      setOpLoading(false);
    }
  };

  // Tab 2 Fetchers
  const fetchJoinData = async (type) => {
    try {
      setJoinLoading(true);
      const res = await api.get(`/dbms-lab/joins/execute?joinType=${type}`);
      setJoinResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setJoinLoading(false);
    }
  };

  // Tab 3 Fetchers
  const fetchModelData = async () => {
    try {
      const res = await api.get('/dbms-lab/models/data');
      setModelData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Tab 4 Fetchers
  const fetchSchemaData = async () => {
    try {
      const res = await api.get('/dbms-lab/schema-explorer');
      setSchemaData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Tab 6 Playground Runner
  const handleRunPlayground = async (sqlToRun = playgroundSql) => {
    try {
      setPlaygroundLoading(true);
      setPlaygroundResult(null);
      const res = await api.post('/sql-lab/run', { sql: sqlToRun });
      setPlaygroundResult(res.data);
    } catch (e) {
      setPlaygroundResult({ success: false, message: e.response?.data?.message || e.message });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  // Tab 7 Transactions Runner
  const handleRunTxScenario = async (scenario) => {
    try {
      setTxLoading(true);
      const res = await api.post('/dbms-lab/transactions/simulate', { scenario });
      setTxResult(res.data);
    } catch (e) {
      setTxResult({ success: false, message: e.response?.data?.message || e.message });
    } finally {
      setTxLoading(false);
    }
  };

  // Tab 8 Indexing Runner
  const fetchIndexData = async (action) => {
    try {
      setIndexLoading(true);
      const res = await api.post('/dbms-lab/indexing/explain', { action });
      setIndexData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIndexLoading(false);
    }
  };

  // Tab 9 Constraints Runner
  const handleTestConstraint = async (testCase) => {
    try {
      const res = await api.post('/dbms-lab/constraints/test-violation', { testCase });
      setConstraintResult(res.data);
    } catch (e) {
      setConstraintResult({ success: false, message: e.response?.data?.message || e.message });
    }
  };

  // Tab 10 Advanced SQL Runner
  const handleRunAdvanced = async (cat) => {
    setAdvancedCategory(cat);
    const catalog = {
      aggregate: "SELECT h.hospital_name, COUNT(bu.unit_id) AS total_units, MIN(bu.expiry_date) AS earliest_expiry, MAX(bu.expiry_date) AS latest_expiry FROM Hospital h LEFT JOIN BloodUnit bu ON h.hospital_id = bu.hospital_id GROUP BY h.hospital_id, h.hospital_name;",
      having: "SELECT blood_group, COUNT(*) AS available_units FROM BloodUnit WHERE storage_status = 'AVAILABLE' GROUP BY blood_group HAVING COUNT(*) >= 2 ORDER BY available_units DESC;",
      scalar: "SELECT unit_id, blood_group, component_type, expiry_date, (SELECT hospital_name FROM Hospital WHERE hospital_id = bu.hospital_id) AS hospital_name FROM BloodUnit bu LIMIT 8;",
      in_exists: "SELECT hospital_name, city FROM Hospital h WHERE EXISTS (SELECT 1 FROM Patient pt WHERE pt.hospital_id = h.hospital_id AND pt.medical_status = 'CRITICAL');",
      correlated: "SELECT p.first_name, p.last_name, bd.quantity_ml, bd.donation_date FROM BloodDonation bd JOIN Donor d ON bd.donor_id = d.donor_id JOIN Person p ON d.person_id = p.person_id WHERE bd.quantity_ml >= (SELECT AVG(quantity_ml) FROM BloodDonation);",
      cte: "WITH ExpiringUnits AS (SELECT bu.unit_id, bu.blood_group, bu.component_type, DATEDIFF(bu.expiry_date, CURDATE()) AS days_left FROM BloodUnit bu WHERE bu.storage_status = 'AVAILABLE' AND bu.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) SELECT * FROM ExpiringUnits ORDER BY days_left ASC;",
      window: "SELECT request_id, blood_group, urgency_level, request_date, DENSE_RANK() OVER (ORDER BY CASE urgency_level WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END ASC, request_date ASC) AS priority_rank FROM BloodRequest WHERE request_status IN ('PENDING', 'PARTIALLY_FULFILLED');",
      view: "SELECT * FROM vw_public_donor_directory LIMIT 10;",
    };

    const sql = catalog[cat] || catalog.cte;
    try {
      setAdvancedLoading(true);
      const res = await api.post('/sql-lab/run', { sql });
      setAdvancedResult({ cat, sql, ...res.data });
    } catch (e) {
      setAdvancedResult({ cat, sql, success: false, message: e.response?.data?.message || e.message });
    } finally {
      setAdvancedLoading(false);
    }
  };

  const tabs = [
    { id: 'operations', label: '1. SQL Operations', icon: Play },
    { id: 'joins', label: '2. Join Visualizer', icon: GitMerge },
    { id: 'models', label: '3. DB Models Explorer', icon: Layers },
    { id: 'schema', label: '4. Relational Schema', icon: Table },
    { id: 'normalization', label: '5. Normalization Lab', icon: Boxes },
    { id: 'playground', label: '6. SQL Playground', icon: Terminal },
    { id: 'transactions', label: '7. Transactions & ACID', icon: Lock },
    { id: 'indexing', label: '8. Indexing & Optimization', icon: Zap },
    { id: 'constraints', label: '9. Constraints & Integrity', icon: ShieldAlert },
    { id: 'advanced', label: '10. Advanced SQL Concepts', icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interactive Academic Workbench
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            DBMS Learning Laboratory & Concept Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live evaluation environment demonstrating relational algebra, joins, normalization, ACID transactions, and query optimization against MySQL 8.0.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 p-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* MODULE 1: SQL OPERATIONS */}
      {/* ==================================================================== */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  SQL INSERT, UPDATE & DELETE Demonstrations
                </h2>
                <p className="text-xs text-slate-500">
                  Operates on an isolated College Record Management demo schema (Student, Course, Exam, Faculty) without mutating healthcare records.
                </p>
              </div>
              <button
                onClick={() => handleExecuteOperation('reset-college')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo Records</span>
              </button>
            </div>

            {/* Operation Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
              <button
                onClick={() => handleExecuteOperation('insert-rohan')}
                disabled={opLoading}
                className="p-3 text-left border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-xs"
              >
                <span className="font-bold text-slate-900 block">1. Insert Rohan (Exam #312)</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Student: 108, Course: 204, Marks: 72</span>
                <span className="mt-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold inline-block">
                  EXECUTE INSERT
                </span>
              </button>

              <button
                onClick={() => handleExecuteOperation('insert-aman')}
                disabled={opLoading}
                className="p-3 text-left border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-xs"
              >
                <span className="font-bold text-slate-900 block">2. Insert Aman (Exam #313)</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Student: 106, Course: 204, Marks: 68</span>
                <span className="mt-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold inline-block">
                  EXECUTE INSERT
                </span>
              </button>

              <button
                onClick={() => handleExecuteOperation('update-kabir')}
                disabled={opLoading}
                className="p-3 text-left border rounded-xl hover:border-amber-500 hover:bg-amber-50/40 transition-all text-xs"
              >
                <span className="font-bold text-slate-900 block">3. Update Kabir's Marks</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Student: 103, Course: 203, Set: 75</span>
                <span className="mt-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold inline-block">
                  EXECUTE UPDATE
                </span>
              </button>

              <button
                onClick={() => handleExecuteOperation('delete-meera')}
                disabled={opLoading}
                className="p-3 text-left border rounded-xl hover:border-rose-500 hover:bg-rose-50/40 transition-all text-xs"
              >
                <span className="font-bold text-slate-900 block">4. Delete Meera's Exam #307</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Incorrect exam record removal</span>
                <span className="mt-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold inline-block">
                  EXECUTE DELETE
                </span>
              </button>
            </div>

            {/* SQL Execution Feedback */}
            {opResult && (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs space-y-2 mb-4 font-mono">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>Executed SQL Query:</span>
                  <span className="text-emerald-400 font-bold">{opResult.resultMessage}</span>
                </div>
                <pre className="text-amber-300 font-bold overflow-x-auto">{opResult.executedSql}</pre>
              </div>
            )}

            {/* Current Table State */}
            <div className="mt-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Live State: demo_college_exam Table (MySQL 8.0)
              </h3>
              <div className="border rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Exam ID</th>
                      <th className="py-2.5 px-3">Student Name (ID)</th>
                      <th className="py-2.5 px-3">Course Name (ID)</th>
                      <th className="py-2.5 px-3">Marks</th>
                      <th className="py-2.5 px-3">Exam Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collegeData.exams.map((ex) => (
                      <tr key={ex.exam_id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">#{ex.exam_id}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{ex.student_name} ({ex.student_id})</td>
                        <td className="py-2 px-3 text-slate-700">{ex.course_name} ({ex.course_id})</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${ex.marks >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {ex.marks} / 100
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{ex.exam_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 2: JOIN VISUALIZER */}
      {/* ==================================================================== */}
      {activeTab === 'joins' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Interactive Relational Join Visualizer</h2>
                <p className="text-xs text-slate-500">Live execution of INNER, LEFT, RIGHT, and SELF joins on MySQL InnoDB tables.</p>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                {[
                  { id: 'inner', label: 'INNER JOIN (Patient + Hosp)' },
                  { id: 'left', label: 'LEFT JOIN (Hospital Count)' },
                  { id: 'right', label: 'RIGHT JOIN (Blood Units)' },
                  { id: 'self-staff', label: 'SELF JOIN (Staff Hierarchy)' },
                  { id: 'self-faculty', label: 'SELF JOIN (Faculty Tree)' },
                ].map((j) => (
                  <button
                    key={j.id}
                    onClick={() => {
                      setJoinType(j.id);
                      fetchJoinData(j.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      joinType === j.id
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                    }`}
                  >
                    {j.label}
                  </button>
                ))}
              </div>
            </div>

            {joinResult && (
              <div className="space-y-4">
                {/* Visual Venn / Concept Card */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-indigo-950">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Relational Algebra & Join Mechanism:</span>
                  </div>
                  <p className="text-indigo-900 leading-relaxed">{joinResult.explanation}</p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      Matched Rows: {joinResult.matchedCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      Unmatched Preserved Rows: {joinResult.unmatchedCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                      Total Result Rows: {joinResult.rowCount}
                    </span>
                  </div>
                </div>

                {/* SQL Statement Display */}
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto">
                  <div className="text-[11px] text-slate-400 mb-1">Executed MySQL Query:</div>
                  <pre className="text-brand-300 font-semibold">{joinResult.query}</pre>
                </div>

                {/* Results Table */}
                <div className="border rounded-xl overflow-hidden overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b sticky top-0">
                      <tr>
                        {joinResult.columns?.map((col) => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {joinResult.rows?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {joinResult.columns?.map((col) => (
                            <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-800">
                              {row[col] !== null ? String(row[col]) : <span className="text-slate-400 italic">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 3: DATABASE MODELS EXPLORER */}
      {/* ==================================================================== */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Database Models Comparative Explorer</h2>
                <p className="text-xs text-slate-500">Examines Hierarchical, Network, Relational, and Object-Oriented models with Healthcare & Library examples.</p>
              </div>

              <div className="flex gap-1.5 text-xs font-semibold">
                {['hierarchical', 'network', 'relational', 'object-oriented'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModelType(m)}
                    className={`px-3 py-1.5 rounded-lg border capitalize transition-all ${
                      modelType === m
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Hierarchical Model */}
            {modelType === 'hierarchical' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-2">
                  <h3 className="font-bold text-amber-950">Hierarchical Tree Structure (1:N Parent-Child Only)</h3>
                  <p className="text-amber-900 leading-relaxed">
                    Data is organized into an inverted tree. Each child record has exactly ONE parent.
                  </p>
                  <p className="text-amber-900 font-semibold">
                    Structural Limitation: When a book is reserved by multiple members, or when a patient needs records across multiple hospital networks, a single-parent hierarchy forces duplicate record trees or breaks normalization.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl bg-slate-50 text-xs">
                    <span className="font-bold text-slate-900 block mb-2">Healthcare Tree Hierarchy:</span>
                    <div className="font-mono text-slate-700 space-y-1.5 pl-2 border-l-2 border-brand-500">
                      <div>🏥 Hospital (Root Node)</div>
                      <div className="pl-4">↳ 🛏️ Ward (Child Node)</div>
                      <div className="pl-8">↳ 👤 Patient (Sub-Child Node)</div>
                      <div className="pl-12">↳ 🩸 Blood Request (Leaf Node)</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl bg-slate-50 text-xs">
                    <span className="font-bold text-slate-900 block mb-2">Assignment Library Tree Hierarchy:</span>
                    <div className="font-mono text-slate-700 space-y-1.5 pl-2 border-l-2 border-indigo-500">
                      <div>📚 Library Central (Root)</div>
                      <div className="pl-4">↳ 👨‍💼 Staff Librarian</div>
                      <div className="pl-8">↳ 🎫 Member Account</div>
                      <div className="pl-12">↳ 📖 Book Loan Record</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Network Model */}
            {modelType === 'network' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-2">
                  <h3 className="font-bold text-purple-950">Network Model (CODASYL Owner-Member Sets)</h3>
                  <p className="text-purple-900 leading-relaxed">
                    Overcomes hierarchical limitations by allowing child records (members) to have MULTIPLE owner records, directly modeling many-to-many relationships without data duplication.
                  </p>
                </div>

                <div className="p-4 border rounded-xl bg-slate-50 text-xs">
                  <span className="font-bold text-slate-900 block mb-2">Network Set Relations in LIFE-LINK:</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                    <div className="p-3 bg-white border rounded-lg">
                      <span className="font-bold text-slate-900 block">Set 1: Donor & Donations</span>
                      <p className="text-slate-600 mt-1">Owner: Donor</p>
                      <p className="text-slate-600">Member: BloodDonation</p>
                    </div>
                    <div className="p-3 bg-white border rounded-lg">
                      <span className="font-bold text-slate-900 block">Set 2: Donation & Units</span>
                      <p className="text-slate-600 mt-1">Owner: BloodDonation</p>
                      <p className="text-slate-600">Member: BloodUnit</p>
                    </div>
                    <div className="p-3 bg-white border rounded-lg">
                      <span className="font-bold text-slate-900 block">Set 3: Allocation Junction</span>
                      <p className="text-slate-600 mt-1">Owners: Unit & Request</p>
                      <p className="text-slate-600">Member: BloodAllocation</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Relational Model */}
            {modelType === 'relational' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <h3 className="font-bold text-emerald-950">Relational Model (Codd's Relational Algebra)</h3>
                  <p className="text-emerald-900">
                    Data represented in two-dimensional normalized relations (tables). Relationships maintained strictly through Primary Keys and Foreign Keys, eliminating physical pointer chains.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {['Person', 'Patient', 'Donor', 'Staff', 'Hospital', 'Ward', 'BloodDonation', 'BloodUnit', 'BloodRequest', 'BloodAllocation', 'OrganDonation', 'OrganRequest', 'OrganMatch'].map((tbl) => (
                    <div key={tbl} className="p-2.5 border rounded-lg bg-slate-50 font-mono text-[11px] font-bold text-slate-800">
                      📄 {tbl}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Object-Oriented Model */}
            {modelType === 'object-oriented' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <h3 className="font-bold text-blue-950">Object-Oriented UML Representation</h3>
                  <p className="text-blue-900">
                    Encapsulates both attributes and behavior (methods). Features class inheritance where Patient, Donor, and Staff subclass the superclass Person.
                  </p>
                </div>

                <div className="p-4 border rounded-xl bg-slate-50">
                  <div className="max-w-md mx-auto p-4 bg-white border-2 border-indigo-600 rounded-xl font-mono text-xs shadow-sm">
                    <div className="font-bold text-center border-b pb-1 text-indigo-900">«Class» Person (Superclass)</div>
                    <div className="py-2 text-[11px] text-slate-700 border-b space-y-0.5">
                      <div>- person_id: int [PK]</div>
                      <div>- first_name, last_name: string</div>
                      <div>- blood_group: enum</div>
                      <div>- phone, email: string</div>
                    </div>
                    <div className="pt-2 text-[11px] text-slate-600">
                      <div>+ getFullName(): string</div>
                      <div>+ verifyIdentity(): bool</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mt-4 font-mono text-[11px]">
                    <div className="p-3 bg-white border-2 border-emerald-600 rounded-lg text-center">
                      <span className="font-bold block text-emerald-900">Patient</span>
                      <span className="text-[10px] text-slate-500">extends Person</span>
                      <div className="mt-1 text-left text-[10px] text-slate-600 border-t pt-1">
                        <div>+ medical_status</div>
                        <div>+ admitToWard()</div>
                      </div>
                    </div>

                    <div className="p-3 bg-white border-2 border-rose-600 rounded-lg text-center">
                      <span className="font-bold block text-rose-900">Donor</span>
                      <span className="text-[10px] text-slate-500">extends Person</span>
                      <div className="mt-1 text-left text-[10px] text-slate-600 border-t pt-1">
                        <div>+ donor_type</div>
                        <div>+ checkEligibility()</div>
                      </div>
                    </div>

                    <div className="p-3 bg-white border-2 border-amber-600 rounded-lg text-center">
                      <span className="font-bold block text-amber-900">Staff</span>
                      <span className="text-[10px] text-slate-500">extends Person</span>
                      <div className="mt-1 text-left text-[10px] text-slate-600 border-t pt-1">
                        <div>+ job_title</div>
                        <div>+ assignSupervisor()</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 4: RELATIONAL SCHEMA EXPLORER */}
      {/* ==================================================================== */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">Live MySQL Relational Schema Inspector</h2>
              <p className="text-xs text-slate-500">Directly queries MySQL 8.0 information_schema for metadata, columns, and constraints.</p>
            </div>

            {schemaData && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Tables List */}
                <div className="border rounded-xl p-3 bg-slate-50 text-xs space-y-1 h-96 overflow-y-auto">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] mb-2">Tables & Views:</span>
                  {schemaData.tables?.map((t) => (
                    <button
                      key={t.TABLE_NAME}
                      onClick={() => setSelectedTable(t.TABLE_NAME)}
                      className={`w-full text-left px-3 py-2 rounded-lg font-mono text-[11px] font-semibold transition-all ${
                        selectedTable.toLowerCase() === t.TABLE_NAME.toLowerCase()
                          ? 'bg-brand-600 text-white font-bold'
                          : 'bg-white hover:bg-slate-200/60 text-slate-800 border'
                      }`}
                    >
                      {t.TABLE_NAME}
                    </button>
                  ))}
                </div>

                {/* Selected Table Columns & Constraints */}
                <div className="lg:col-span-3 border rounded-xl p-4 bg-white text-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold font-mono text-slate-900 text-sm">Table: {selectedTable}</h3>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-700 text-xs mb-2">Column Definitions:</h4>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                          <tr>
                            <th className="py-2 px-3">Column</th>
                            <th className="py-2 px-3">Data Type</th>
                            <th className="py-2 px-3">Nullable</th>
                            <th className="py-2 px-3">Key Type</th>
                            <th className="py-2 px-3">Extra</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {schemaData.columns
                            ?.filter((c) => c.TABLE_NAME.toLowerCase() === selectedTable.toLowerCase())
                            .map((col) => (
                              <tr key={col.COLUMN_NAME} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-bold text-slate-900">{col.COLUMN_NAME}</td>
                                <td className="py-2 px-3 text-indigo-700">{col.COLUMN_TYPE}</td>
                                <td className="py-2 px-3 text-slate-600">{col.IS_NULLABLE}</td>
                                <td className="py-2 px-3">
                                  {col.COLUMN_KEY === 'PRI' && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">PRIMARY KEY</span>}
                                  {col.COLUMN_KEY === 'UNI' && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">UNIQUE</span>}
                                  {col.COLUMN_KEY === 'MUL' && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">FOREIGN KEY</span>}
                                </td>
                                <td className="py-2 px-3 text-slate-500">{col.EXTRA || '-'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 5: NORMALIZATION LABORATORY */}
      {/* ==================================================================== */}
      {activeTab === 'normalization' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Interactive Normalization Laboratory (1NF → 2NF → 3NF)</h2>
                <p className="text-xs text-slate-500">Decomposes healthcare relations step-by-step, removing multi-valued attributes, partial dependencies, and transitive dependencies.</p>
              </div>

              <div className="flex gap-1.5 text-xs font-semibold">
                {['1nf', '2nf', '3nf'].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setNormStage(stage)}
                    className={`px-3 py-1.5 rounded-lg border uppercase transition-all ${
                      normStage === stage
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            {/* 1NF Stage */}
            {normStage === '1nf' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-rose-950 block">First Normal Form (1NF) Anomaly Demonstration:</span>
                  <p className="text-rose-900">
                    Problem: Unnormalized table stores repeating groups and non-atomic comma-separated values (e.g. phone numbers and multiple allergic reactions in a single cell).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-xl p-3 bg-slate-50">
                    <span className="font-bold text-rose-700 block mb-2">❌ Before 1NF (Non-Atomic Values):</span>
                    <pre className="p-3 bg-white border rounded text-[11px] font-mono text-slate-700">
patient_id | name        | phone_numbers
101        | Rahul Mehta | +91-9811002233, +91-9822334455
102        | Priya Nair  | +91-9833445566, +91-9844556677
                    </pre>
                  </div>

                  <div className="border rounded-xl p-3 bg-slate-50">
                    <span className="font-bold text-emerald-700 block mb-2">✅ After 1NF (Atomic Attributes):</span>
                    <pre className="p-3 bg-white border rounded text-[11px] font-mono text-slate-700">
patient_id | name        | phone
101        | Rahul Mehta | +91-9811002233
101        | Rahul Mehta | +91-9822334455
102        | Priya Nair  | +91-9833445566
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* 2NF Stage */}
            {normStage === '2nf' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-amber-950 block">Second Normal Form (2NF) Partial Dependency Removal:</span>
                  <p className="text-amber-900">
                    Problem: In relation with composite primary key (patient_id, hospital_id), hospital_address depends only on hospital_id (partial dependency).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-xl p-3 bg-slate-50">
                    <span className="font-bold text-rose-700 block mb-2">❌ Before 2NF (Partial Dependency):</span>
                    <pre className="p-3 bg-white border rounded text-[11px] font-mono text-slate-700">
Composite PK: (patient_id, hospital_id)
hospital_name depends ONLY on hospital_id!
Causing Update Anomaly if hospital relocates.
                    </pre>
                  </div>

                  <div className="border rounded-xl p-3 bg-slate-50">
                    <span className="font-bold text-emerald-700 block mb-2">✅ After 2NF (Decomposed Relations):</span>
                    <pre className="p-3 bg-white border rounded text-[11px] font-mono text-slate-700">
Table 1: Hospital (hospital_id [PK], hospital_name, address)
Table 2: PatientStay (patient_id, hospital_id, admission_date)
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* 3NF Stage */}
            {normStage === '3nf' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-indigo-950 block">Third Normal Form (3NF) Transitive Dependency Removal:</span>
                  <p className="text-indigo-900">
                    Problem: In Patient table, attending_doctor_id depends on patient_id, but doctor_department and doctor_phone depend on attending_doctor_id (X → Y → Z transitive dependency).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-xl p-3 bg-slate-50">
                    <span className="font-bold text-rose-700 block mb-2">❌ Before 3NF (Transitive Dependency):</span>
                    <pre className="p-3 bg-white border rounded text-[11px] font-mono text-slate-700">
patient_id → attending_doctor_id → doctor_department
If all patients of a doctor are discharged, 
the doctor's departmental data is deleted (Deletion Anomaly).
                    </pre>
                  </div>

                  <div className="border rounded-xl p-3 bg-slate-50">
                    <span className="font-bold text-emerald-700 block mb-2">✅ After 3NF (Decomposed into Staff Entity):</span>
                    <pre className="p-3 bg-white border rounded text-[11px] font-mono text-slate-700">
Table 1: Patient (patient_id, attending_doctor_id, admission_date)
Table 2: Staff (staff_id [PK], department, job_title)
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 6: SQL QUERY PLAYGROUND */}
      {/* ==================================================================== */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Live SQL Workbench & Query Runner</h2>
                <p className="text-xs text-slate-500">Execute custom SELECT statements directly against MySQL 8.0 InnoDB engine.</p>
              </div>

              <button
                onClick={() => handleRunPlayground()}
                disabled={playgroundLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute Query</span>
              </button>
            </div>

            {/* SQL Editor */}
            <div className="space-y-2">
              <textarea
                rows="4"
                value={playgroundSql}
                onChange={(e) => setPlaygroundSql(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-xl focus:outline-none border border-slate-800"
              />
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap gap-1.5 my-3 text-xs">
              <span className="text-slate-500 font-semibold self-center mr-1">Templates:</span>
              {[
                { label: 'Patient Hospital Join', sql: 'SELECT pt.patient_id, p.first_name, p.last_name, h.hospital_name, pt.medical_status FROM Patient pt JOIN Person p ON pt.person_id = p.person_id JOIN Hospital h ON pt.hospital_id = h.hospital_id LIMIT 10;' },
                { label: 'Blood Group Counts', sql: 'SELECT blood_group, COUNT(*) as units FROM BloodUnit WHERE storage_status = "AVAILABLE" GROUP BY blood_group;' },
                { label: 'Staff Supervisors', sql: 'SELECT s.staff_id, s.job_title, sup.job_title as supervisor FROM Staff s LEFT JOIN Staff sup ON s.supervisor_staff_id = sup.staff_id;' },
              ].map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => {
                    setPlaygroundSql(tpl.sql);
                    handleRunPlayground(tpl.sql);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Results Grid */}
            {playgroundResult && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Returned {playgroundResult.rowCount || 0} rows in {playgroundResult.executionTimeMs || 1}ms</span>
                </div>

                {playgroundResult.success ? (
                  <div className="border rounded-xl overflow-hidden overflow-x-auto max-h-80">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                        <tr>
                          {playgroundResult.columns?.map((c) => (
                            <th key={c} className="py-2.5 px-3 whitespace-nowrap">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {playgroundResult.rows?.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            {playgroundResult.columns?.map((c) => (
                              <td key={c} className="py-2 px-3 whitespace-nowrap">{String(r[c])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-mono">
                    MySQL Error: {playgroundResult.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 7: TRANSACTIONS & ACID LABORATORY */}
      {/* ==================================================================== */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">ACID Transactions & Row-Level Locking Laboratory</h2>
              <p className="text-xs text-slate-500">Live demonstration of Atomicity, Consistency, Isolation, and Durability in MySQL InnoDB.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
              <button
                onClick={() => handleRunTxScenario('rollback-test')}
                disabled={txLoading}
                className="p-4 border rounded-xl hover:border-brand-500 hover:bg-brand-50/40 text-left transition-all"
              >
                <span className="font-bold text-slate-900 block mb-1">1. Test Atomicity & Rollback</span>
                <span className="text-slate-600 block text-[11px]">Starts transaction, inserts simulated request, simulates validation error, executes ROLLBACK. Verifies zero orphan records remain.</span>
              </button>

              <button
                onClick={() => handleRunTxScenario('savepoint-test')}
                disabled={txLoading}
                className="p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all"
              >
                <span className="font-bold text-slate-900 block mb-1">2. Test Savepoints & Partial Rollback</span>
                <span className="text-slate-600 block text-[11px]">Establishes milestone SAVEPOINT sp_after_step1, rolls back to savepoint without aborting the parent transaction.</span>
              </button>
            </div>

            {txResult && (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold">{txResult.guarantee}</span>
                  <span className="text-slate-400">Scenario: {txResult.scenario}</span>
                </div>
                <div className="space-y-1.5">
                  {txResult.timeline?.map((step) => (
                    <div key={step.step} className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">[{step.step}]</span>
                      <span className="text-slate-200">{step.action}</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-sans">{step.status}</span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-300 text-[11px] pt-2 border-t border-slate-800 font-sans">{txResult.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 8: INDEXING AND OPTIMIZATION */}
      {/* ==================================================================== */}
      {activeTab === 'indexing' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Query Plan Optimization & EXPLAIN Analyzer</h2>
                <p className="text-xs text-slate-500">Evaluates performance before and after B-Tree index creation on the 400-patient dataset.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fetchIndexData('create-index')}
                  disabled={indexLoading || indexData?.hasIndex}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-40"
                >
                  Create Index on Person(city)
                </button>
                <button
                  onClick={() => fetchIndexData('drop-index')}
                  disabled={indexLoading || !indexData?.hasIndex}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 disabled:opacity-40"
                >
                  Drop Index
                </button>
              </div>
            </div>

            {indexData && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Index Status: {indexData.hasIndex ? '✅ B-Tree Index Active (idx_person_city_demo)' : '❌ Full Table Scan (No Index)'}
                    </span>
                    <span className="font-mono text-emerald-700 font-bold">Execution Time: {indexData.executionTimeMs} ms</span>
                  </div>
                  <p className="text-slate-600 font-mono text-[11px]">{indexData.query}</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 mb-2">MySQL EXPLAIN Execution Plan:</h3>
                  <div className="border rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                        <tr>
                          <th className="py-2 px-3">id</th>
                          <th className="py-2 px-3">select_type</th>
                          <th className="py-2 px-3">table</th>
                          <th className="py-2 px-3">type</th>
                          <th className="py-2 px-3">possible_keys</th>
                          <th className="py-2 px-3">key</th>
                          <th className="py-2 px-3">rows</th>
                          <th className="py-2 px-3">Extra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {indexData.explain?.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3">{row.id}</td>
                            <td className="py-2 px-3">{row.select_type}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{row.table}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded font-bold ${row.type === 'ALL' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="py-2 px-3">{row.possible_keys || 'NULL'}</td>
                            <td className="py-2 px-3 text-indigo-700 font-bold">{row.key || 'NULL'}</td>
                            <td className="py-2 px-3 font-bold">{row.rows}</td>
                            <td className="py-2 px-3 text-slate-500">{row.Extra || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 9: CONSTRAINTS & INTEGRITY */}
      {/* ==================================================================== */}
      {activeTab === 'constraints' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">Referential Integrity & Constraint Violations</h2>
              <p className="text-xs text-slate-500">Tests how MySQL enforces CHECK constraints, FK RESTRICT, UNIQUE, and Trigger signals when corrupt data is submitted.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-4">
              <button
                onClick={() => handleTestConstraint('check-occupied-beds')}
                className="p-3 border rounded-xl hover:border-rose-500 hover:bg-rose-50/40 text-left transition-all"
              >
                <span className="font-bold text-slate-900 block">1. CHECK chk_ward_beds</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Tries to insert Ward with occupied_beds (15) &gt; total_beds (10).</span>
              </button>

              <button
                onClick={() => handleTestConstraint('fk-restrict-hospital')}
                className="p-3 border rounded-xl hover:border-rose-500 hover:bg-rose-50/40 text-left transition-all"
              >
                <span className="font-bold text-slate-900 block">2. FK RESTRICT Check</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Tries to delete Hospital #1 with attached child wards.</span>
              </button>

              <button
                onClick={() => handleTestConstraint('unique-email')}
                className="p-3 border rounded-xl hover:border-rose-500 hover:bg-rose-50/40 text-left transition-all"
              >
                <span className="font-bold text-slate-900 block">3. UNIQUE Key Check</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Tries to insert Person with existing duplicate email.</span>
              </button>

              <button
                onClick={() => handleTestConstraint('not-null')}
                className="p-3 border rounded-xl hover:border-rose-500 hover:bg-rose-50/40 text-left transition-all"
              >
                <span className="font-bold text-slate-900 block">4. NOT NULL Check</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Tries to insert Hospital with mandatory columns as NULL.</span>
              </button>
            </div>

            {constraintResult && (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold">
                    {constraintResult.blockedByDatabase ? '🛡️ Integrity Enforced: Corrupt Data Blocked' : 'Result'}
                  </span>
                  <span className="text-amber-400">Error Code: {constraintResult.errorCode}</span>
                </div>
                <p className="text-rose-300 font-semibold">{constraintResult.databaseMessage}</p>
                <p className="text-slate-400 text-[11px] font-sans pt-1 border-t border-slate-800">{constraintResult.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 10: ADVANCED SQL CONCEPTS */}
      {/* ==================================================================== */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">17 Advanced SQL Concept Demonstrations</h2>
              <p className="text-xs text-slate-500">Live execution of Aggregates, HAVING, CTEs, Window Functions, Subqueries, and Views.</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 text-xs font-semibold">
              {[
                { id: 'aggregate', label: 'COUNT / SUM / MIN / MAX' },
                { id: 'having', label: 'GROUP BY with HAVING' },
                { id: 'scalar', label: 'Scalar Subquery' },
                { id: 'in_exists', label: 'EXISTS Predicate' },
                { id: 'correlated', label: 'Correlated Subquery' },
                { id: 'cte', label: 'Common Table Expression (WITH)' },
                { id: 'window', label: 'Window Function (DENSE_RANK)' },
                { id: 'view', label: 'Materialized View Query' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleRunAdvanced(c.id)}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    advancedCategory === c.id
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {advancedResult && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
                  <pre className="font-semibold">{advancedResult.sql}</pre>
                </div>

                <div className="border rounded-xl overflow-hidden overflow-x-auto max-h-80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                      <tr>
                        {advancedResult.columns?.map((col) => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {advancedResult.rows?.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {advancedResult.columns?.map((col) => (
                            <td key={col} className="py-2 px-3 whitespace-nowrap">{String(row[col])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DBMSLearningLab;
