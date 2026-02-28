import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { formatCurrency } from '../utils/money';
import { useAuth } from '../context/AuthContext';

function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, expensesRes] = await Promise.all([
          api.get('/groups'),
          api.get(`/groups/${groupId}/expenses`),
        ]);
        const found = groupsRes.data.data.groups.find((g) => g._id === groupId);
        setGroup(found || null);
        setExpenses(expensesRes.data.data.expenses);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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

      {/* Members List */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-200 mb-3">Members</h2>
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

      {/* Expenses */}
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

                {/* Splits */}
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
    </div>
  );
}

export default GroupDetail;
