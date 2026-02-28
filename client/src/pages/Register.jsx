import { Link } from 'react-router-dom';

function Register() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="card max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        <p className="text-gray-400 text-center text-sm mb-8">Join PeerFlow and simplify your expenses</p>

        {/* Form will be wired up in Part 2 (Auth Module) */}
        <form className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input id="reg-name" type="text" placeholder="Jane Doe" className="input-field" />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input id="reg-email" type="email" placeholder="you@example.com" className="input-field" />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input id="reg-password" type="password" placeholder="••••••••" className="input-field" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
