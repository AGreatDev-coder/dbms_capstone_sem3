import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { Play, Copy, Check, Clock, Terminal, AlertCircle } from 'lucide-react';

const SQLLaboratory = () => {
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [customSql, setCustomSql] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['09 BENCH', 'SQL LABORATORY']}
        title="SQL Workbench & Execution Lab"
        description="Interactive evaluation environment for 9 mandatory advanced SQL concepts executed live on MySQL 8.0."
        action={
          <span className="font-mono text-xs px-2.5 py-1 border border-rule bg-surface text-ink">
            MySQL 8.0 Engine
          </span>
        }
      />

      {/* Main Grid: Query Navigator + SQL Execution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Query Selector List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between pb-1 text-xs font-mono">
            <span className="font-semibold text-ink uppercase tracking-wider">Approved Queries</span>
            <span className="text-muted">{queries.length} cataloged</span>
          </div>

          <div className="space-y-1.5 max-h-[720px] overflow-y-auto pr-1">
            {queries.map((q) => {
              const isSelected = selectedQuery?.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => selectQuery(q)}
                  className={`w-full text-left p-3 border transition-colors text-xs font-sans ${
                    isSelected
                      ? 'bg-surface border-ink border-l-4 border-l-blood'
                      : 'bg-paper/40 border-rule hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 font-mono text-[11px]">
                    <span className="font-bold text-blood">{q.number}</span>
                    <span className="text-[10px] uppercase text-muted truncate max-w-[150px]">
                      {q.category}
                    </span>
                  </div>
                  <h4 className="font-semibold text-ink line-clamp-1">{q.title}</h4>
                  <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-relaxed">
                    {q.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer, Execution Button & Structured Results */}
        <div className="lg:col-span-8 space-y-4">
          {selectedQuery && (
            <div className="border border-rule bg-surface p-4 space-y-3 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-rule">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 border border-rule bg-paper font-bold text-ink">
                    {selectedQuery.number}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                    {selectedQuery.category}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={copied ? Check : Copy}
                  onClick={handleCopy}
                >
                  {copied ? 'Copied' : 'Copy SQL'}
                </Button>
              </div>

              <div>
                <h2 className="font-serif text-base font-semibold text-ink">{selectedQuery.title}</h2>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{selectedQuery.description}</p>
              </div>

              {/* SQL Syntax Block */}
              <div className="border border-rule bg-paper">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-rule font-mono text-[11px] text-muted bg-paper/60">
                  <span>SQL Command (MySQL 8.0)</span>
                  <span className="text-moss">Sandbox Protected</span>
                </div>
                <textarea
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  rows={8}
                  className="w-full p-3 font-mono text-xs bg-paper text-ink selection:bg-blood-soft focus:outline-none resize-y leading-relaxed"
                  spellCheck="false"
                />
              </div>

              {/* Run Query Bar */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted font-sans">
                  Destructive DDL statements are blocked by the query parser.
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Play}
                  disabled={loading}
                  onClick={handleExecute}
                >
                  {loading ? 'Executing Query...' : 'Execute Query'}
                </Button>
              </div>
            </div>
          )}

          {/* Execution Error Banner */}
          {error && (
            <div className="p-3 border border-blood bg-blood-soft/20 text-xs text-ink flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-blood shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blood font-mono text-[11px] uppercase">Execution Halted</p>
                <p className="mt-0.5 font-mono text-[11px] text-ink">{error}</p>
              </div>
            </div>
          )}

          {/* Execution Results Structured Table */}
          {results && (
            <div className="border border-rule bg-surface overflow-hidden space-y-0">
              {/* Results Metadata Bar */}
              <div className="px-4 py-2.5 border-b border-rule bg-paper/60 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink uppercase tracking-wider text-[11px]">Output Dataset</span>
                  <span className="text-muted">({results.rowCount} rows)</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Duration: <strong className="text-ink font-semibold">{results.executionTimeMs} ms</strong></span>
                </div>
              </div>

              {/* Data Table */}
              {results.rows.length === 0 ? (
                <div className="p-6 text-center text-muted italic text-xs font-sans">
                  Query executed successfully with zero matching rows.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-rule bg-paper text-muted uppercase tracking-wider text-[10px]">
                        {results.columns.map((col) => (
                          <th key={col} className="py-2 px-3 whitespace-nowrap bg-paper font-semibold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule font-sans">
                      {results.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-paper/40 transition-colors h-8">
                          {results.columns.map((col) => {
                            const val = row[col];
                            return (
                              <td key={col} className="py-1.5 px-3 whitespace-nowrap font-mono text-[11px] text-ink">
                                {val === null || val === undefined ? (
                                  <span className="text-muted/60 italic">NULL</span>
                                ) : typeof val === 'boolean' ? (
                                  <span className={val ? 'text-moss font-bold' : 'text-blood font-bold'}>
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
