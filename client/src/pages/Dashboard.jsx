import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups');
        setGroups(res.data.data.groups);
      } catch (err) {
        console.error('Failed to fetch groups:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome, {user?.name} 👋</h1>
          <p className="text-gray-400">Your groups and expenses at a glance.</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Link to="/groups/create" className="btn-primary text-sm">
            + Create Group
          </Link>
          <Link to="/groups/join" className="btn-secondary text-sm">
            Join Group
          </Link>
        </div>
      </div>

      {/* Groups Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-200">My Groups</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-4xl mb-3 block">👥</span>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No groups yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create a group or join one with a code to get started.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/groups/create" className="btn-primary text-sm">
                Create Group
              </Link>
              <Link to="/groups/join" className="btn-secondary text-sm">
                Join Group
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group) => (
              <div
                key={group._id}
                className="card hover:border-primary-500/30 transition-colors group/card"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-100 group-hover/card:text-primary-300 transition-colors">
                    {group.name}
                  </h3>
                  <span className="text-xs font-mono bg-gray-800 text-gray-400 px-2 py-1 rounded-md">
                    {group.joinCode}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>👥</span>
                    <span>
                      {group.members?.length || 0} member{(group.members?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>⚖️</span>
                    <span>
                      Threshold:{' '}
                      {group.settlementThreshold > 0
                        ? `${(group.settlementThreshold / 100).toFixed(2)}`
                        : 'None'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <span>📅</span>
                    <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Placeholder sections for future modules */}
      <div className="grid sm:grid-cols-2 gap-6 mt-10">
        {['Recent Expenses', 'Pending Settlements'].map((title) => (
          <div key={title} className="card flex flex-col items-center justify-center min-h-[160px] opacity-60">
            <span className="text-gray-600 text-3xl mb-2">📦</span>
            <h3 className="text-base font-semibold text-gray-400">{title}</h3>
            <p className="text-xs text-gray-600 mt-1">Coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;