import { Link } from 'react-router-dom';

function Login() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="card max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        <p className="text-gray-400 text-center text-sm mb-8">Sign in to your PeerFlow account</p>

        {/* Form will be wired up in Part 2 (Auth Module) */}
        <form className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input id="login-email" type="email" placeholder="you@example.com" className="input-field" />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input id="login-password" type="password" placeholder="••••••••" className="input-field" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
