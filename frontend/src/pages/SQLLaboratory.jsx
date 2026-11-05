import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Clock,
  Database,
  Code2,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';

const SQLLaboratory = () => {
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [customSql, setCustomSql] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const res = await api.get('/sql-lab/queries');
      if (res.data?.success && res.data.queries.length > 0) {
        setQueries(res.data.queries);
        selectQuery(res.data.queries[0]);
      }
    } catch (err) {
      console.error('Failed to load SQL queries:', err);
    }
  };

  const selectQuery = (q) => {
    setSelectedQuery(q);
    setCustomSql(q.sql);
    setError(null);
    setResults(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/sql-lab/execute', {
        queryId: selectedQuery?.id,
        sql: customSql,
      });

      if (res.data?.success) {
        setResults(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Execution error');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = ['ALL', 'WINDOW FUNCTIONS', 'COMMON TABLE EXPRESSION (CTE)', 'INDEXING & EXECUTION PLANS', 'JOIN OPERATIONS', 'AGGREGATE FUNCTIONS & HAVING', 'NESTED SUBQUERIES', 'ACID TRANSACTIONS & ROW LOCKING'];

  const filteredQueries = activeCategory === 'ALL'
    ? queries
    : queries.filter((q) => q.category.toUpperCase().includes(activeCategory));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Terminal className="w-7 h-7 text-indigo-600" />
            <span>Advanced SQL Laboratory & Workbench</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live query execution workbench demonstrating all 9 mandatory advanced DBMS concepts (Window functions, CTEs, Views, Indexes, Joins, Aggregates, Subqueries, and ACID Transactions).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
            MySQL 8.0 Engine
          </span>
        </div>
      </div>

      {/* Main Grid: Query Navigator + SQL Execution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Query Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Approved Capstone Queries</span>
            <span className="text-xs text-slate-400 font-mono">{filteredQueries.length} available</span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {queries.map((q) => {
              const isSelected = selectedQuery?.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => selectQuery(q)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-indigo-700 font-mono">{q.number}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold truncate max-w-[140px]">
                      {q.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-1">{q.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {q.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer, Execution Button & Structured Results */}
        <div className="lg:col-span-8 space-y-5">
          {/* Query Header & Pedagogical Note */}
          {selectedQuery && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-mono font-bold text-xs">
                    {selectedQuery.number}
                  </span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                    {selectedQuery.category}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedQuery.title}</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedQuery.description}</p>
              </div>

              {/* SQL Syntax Block */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                  <span>SQL Command (MySQL 8.0 Dialect)</span>
                  <span className="text-emerald-400">Read-Only Laboratory Mode</span>
                </div>
                <textarea
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  rows="9"
                  className="w-full p-4 font-mono text-xs bg-slate-950 text-emerald-400 selection:bg-indigo-500 selection:text-white focus:outline-none resize-y leading-relaxed"
                  spellCheck="false"
                />
              </div>

              {/* Run Query Bar */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>Destructive commands (DROP, TRUNCATE) are automatically rejected by sandbox security.</span>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-700 hover:to-brand-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Executing Query...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Query</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Execution Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">SQL Execution Interrupted</p>
                <p className="text-rose-800 mt-0.5 font-mono">{error}</p>
              </div>
            </div>
          )}

          {/* Execution Results Structured Table */}
          {results && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
              {/* Results Metadata Bar */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">Query Output Dataset</span>
                  <span className="font-mono text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    {results.rowCount} row(s) returned
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Execution Duration: <strong className="text-slate-800">{results.executionTimeMs} ms</strong></span>
                </div>
              </div>

              {/* Data Table */}
              {results.rows.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic text-xs">
                  Query executed successfully but returned zero matching records.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-mono font-bold text-[11px]">
                        {results.columns.map((col) => (
                          <th key={col} className="py-2.5 px-4 whitespace-nowrap bg-slate-100">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          {results.columns.map((col) => {
                            const val = row[col];
                            return (
                              <td key={col} className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-800">
                                {val === null || val === undefined ? (
                                  <span className="text-slate-400 italic">NULL</span>
                                ) : typeof val === 'boolean' ? (
                                  <span className={val ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                    {val ? 'TRUE' : 'FALSE'}
                                  </span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SQLLaboratory;

