import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-2">
        Welcome, {user?.name} 👋
      </h1>
      <p className="text-gray-400 mb-8">Your groups and expenses at a glance.</p>

      {/* Placeholder cards — will be populated in later modules */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {['My Groups', 'Recent Expenses', 'Pending Settlements'].map((title) => (
          <div key={title} className="card flex flex-col items-center justify-center min-h-[200px]">
            <span className="text-gray-600 text-4xl mb-3">📦</span>
            <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">Coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;