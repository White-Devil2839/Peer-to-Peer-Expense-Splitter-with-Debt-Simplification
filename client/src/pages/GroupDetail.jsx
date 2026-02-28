import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { formatCurrency } from '../utils/money';
import { useAuth } from '../context/AuthContext';
import * as d3 from 'd3';

// ─────────────── D3 Debt Graph Component ───────────────
function DebtGraph({ edges, members, title, colorClass }) {
  const svgRef = useRef(null);

  const draw = useCallback(() => {
    if (!svgRef.current || !members || members.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 500;
    const height = 320;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (edges.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6b7280')
        .attr('font-size', '14px')
        .text('No debts');
      return;
    }

    // Build node set from edges
    const nodeIds = new Set();
    edges.forEach((e) => { nodeIds.add(e.from); nodeIds.add(e.to); });

    const nodes = Array.from(nodeIds).map((id) => {
      const m = members.find((mem) => mem._id === id || mem.userId === id);
      return { id, name: m?.name || m?.fromName || id.slice(-4) };
    });

    const links = edges.map((e) => ({
      source: e.from,
      target: e.to,
      amount: e.amount,
    }));

    // Force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Arrow marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', `arrow-${title.replace(/\s/g, '')}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', colorClass === 'green' ? '#22c55e' : '#f97316');

    // Links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', colorClass === 'green' ? '#22c55e44' : '#f9731644')
      .attr('stroke-width', 2)
      .attr('marker-end', `url(#arrow-${title.replace(/\s/g, '')})`);

    // Link labels
    const linkLabel = svg
      .append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', '10px')
      .attr('fill', colorClass === 'green' ? '#4ade80' : '#fb923c')
      .attr('text-anchor', 'middle')
      .text((d) => formatCurrency(d.amount));

    // Nodes
    const node = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append('circle')
      .attr('r', 22)
      .attr('fill', '#1f2937')
      .attr('stroke', colorClass === 'green' ? '#22c55e' : '#f97316')
      .attr('stroke-width', 2);

    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '10px')
      .text((d) => d.name.split(' ')[0]);

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      linkLabel
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2 - 8);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [edges, members, title, colorClass]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-gray-200 mb-3">{title}</h3>
      <p className="text-xs text-gray-500 mb-2">
        {edges.length} transaction{edges.length !== 1 ? 's' : ''}
      </p>
      <svg ref={svgRef} className="w-full" style={{ height: 320 }} />
    </div>
  );
}

// ─────────────── Main GroupDetail Page ───────────────
function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [rawGraph, setRawGraph] = useState([]);
  const [simplifiedGraph, setSimplifiedGraph] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'balances'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, expensesRes, balancesRes] = await Promise.all([
          api.get('/groups'),
          api.get(`/groups/${groupId}/expenses`),
          api.get(`/groups/${groupId}/balances`),
        ]);
        const found = groupsRes.data.data.groups.find((g) => g._id === groupId);
        setGroup(found || null);
        setExpenses(expensesRes.data.data.expenses);
        setBalances(balancesRes.data.data.balances);
        setRawGraph(balancesRes.data.data.rawGraph);
        setSimplifiedGraph(balancesRes.data.data.simplifiedGraph);
      } catch (err) {
        console.error('Failed to load group data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-red-400">Group not found.</p>
        <Link to="/dashboard" className="text-primary-400 text-sm mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm mb-2 inline-block transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
            <span>👥 {group.members?.length} members</span>
            <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-xs">{group.joinCode}</span>
            {group.settlementThreshold > 0 && (
              <span>⚖️ Threshold: {formatCurrency(group.settlementThreshold)}</span>
            )}
          </div>
        </div>
        <Link
          to={`/groups/${groupId}/add-expense`}
          className="btn-primary text-sm mt-4 sm:mt-0"
        >
          + Add Expense
        </Link>
      </div>

      {/* Members */}
      <section className="mb-6">
        <div className="flex flex-wrap gap-2">
          {group.members?.map((m) => (
            <span
              key={m._id}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                m._id === user?._id
                  ? 'bg-primary-600/20 border-primary-500/30 text-primary-300'
                  : 'bg-gray-800 border-gray-700 text-gray-300'
              }`}
            >
              {m.name}{m._id === user?._id ? ' (You)' : ''}
            </span>
          ))}
        </div>
      </section>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        {['expenses', 'balances'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab === 'expenses' ? '💰 Expenses' : '📊 Balances & Settlements'}
          </button>
        ))}
      </div>

      {/* ───── EXPENSES TAB ───── */}
      {activeTab === 'expenses' && (
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">
            Expenses ({expenses.length})
          </h2>

          {expenses.length === 0 ? (
            <div className="card text-center py-10">
              <span className="text-4xl mb-3 block">💰</span>
              <h3 className="text-base font-semibold text-gray-300 mb-2">No expenses yet</h3>
              <p className="text-sm text-gray-500 mb-4">Add your first expense to start tracking.</p>
              <Link to={`/groups/${groupId}/add-expense`} className="btn-primary text-sm">
                + Add Expense
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => (
                <div key={exp._id} className="card !p-4 hover:border-primary-500/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100">{exp.description}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        Paid by <span className="text-primary-300">{exp.paidBy?.name}</span>
                        {exp.isRecurring && (
                          <span className="ml-2 text-xs bg-accent-600/20 text-accent-300 px-2 py-0.5 rounded-full">
                            🔄 {exp.recurrence?.frequency}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-accent-400">
                      {formatCurrency(exp.totalAmount)}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {exp.splits?.map((s) => (
                        <div
                          key={s._id}
                          className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-1.5 text-xs"
                        >
                          <span className="text-gray-300 truncate mr-2">{s.user?.name}</span>
                          <span className="text-gray-400 font-mono">{formatCurrency(s.shareAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {new Date(exp.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ───── BALANCES TAB ───── */}
      {activeTab === 'balances' && (
        <div className="space-y-8">
          {/* Net Balance Table */}
          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-3">Net Balances</h2>
            {balances.length === 0 || balances.every((b) => b.net === 0) ? (
              <div className="card text-center py-8">
                <span className="text-3xl mb-2 block">✅</span>
                <p className="text-gray-400">All settled! No outstanding balances.</p>
              </div>
            ) : (
              <div className="card !p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-800/60">
                      <th className="text-left px-4 py-3 font-medium text-gray-400">Member</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-400">Net Balance</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {balances
                      .slice()
                      .sort((a, b) => b.net - a.net)
                      .map((b) => (
                        <tr key={b.userId} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3 text-gray-200">{b.name}</td>
                          <td className={`px-4 py-3 text-right font-mono font-semibold ${
                            b.net > 0 ? 'text-green-400' : b.net < 0 ? 'text-red-400' : 'text-gray-500'
                          }`}>
                            {b.net > 0 ? '+' : ''}{formatCurrency(Math.abs(b.net))}
                            {b.net < 0 ? ' owed' : ''}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              b.net > 0
                                ? 'bg-green-500/10 text-green-400'
                                : b.net < 0
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-gray-700 text-gray-400'
                            }`}>
                              {b.net > 0 ? 'Gets back' : b.net < 0 ? 'Owes' : 'Settled'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Debt Graphs */}
          <div className="grid md:grid-cols-2 gap-6">
            <DebtGraph
              edges={rawGraph}
              members={group.members}
              title="Before Simplification"
              colorClass="orange"
            />
            <DebtGraph
              edges={simplifiedGraph}
              members={group.members}
              title="After Simplification (Min Cash Flow)"
              colorClass="green"
            />
          </div>

          {/* Simplified Settlements List */}
          {simplifiedGraph.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-200 mb-3">
                Simplified Settlements ({simplifiedGraph.length} transaction{simplifiedGraph.length !== 1 ? 's' : ''})
              </h2>
              <div className="space-y-2">
                {simplifiedGraph.map((edge, i) => (
                  <div key={i} className="card !p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-400 font-medium">{edge.fromName}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-green-400 font-medium">{edge.toName}</span>
                    </div>
                    <span className="font-mono font-semibold text-primary-300">
                      {formatCurrency(edge.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default GroupDetail;