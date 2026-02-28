import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent-600/10 rounded-full blur-[100px]" />
      </div>

      <section className="max-w-5xl mx-auto px-4 py-24 sm:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
          </span>
          Graph-Optimized Settlements
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
          Split Expenses,{' '}
          <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-accent-400 bg-clip-text text-transparent">
            Not Friendships
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10 leading-relaxed">
          PeerFlow uses graph algorithms to minimize settlement transactions.
          No more payment chaos — just clean, optimized debts.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Get Started Free
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">
            Sign In →
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid sm:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: '⚡',
              title: 'Minimize Transactions',
              desc: 'Our algorithm reduces the number of payments needed to settle all debts.',
            },
            {
              icon: '📊',
              title: 'Visual Debt Graphs',
              desc: 'See before & after simplification with interactive debt visualizations.',
            },
            {
              icon: '🔄',
              title: 'Recurring & Partial',
              desc: 'Handle recurring expenses and partial payments with ease.',
            },
          ].map((f) => (
            <div key={f.title} className="card hover:border-primary-500/30 transition-colors group">
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
