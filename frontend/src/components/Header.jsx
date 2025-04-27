import { Link, useNavigate } from 'react-router-dom';

import { Button } from './ui/button';

import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className='bg-white shadow'>
      <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
        <Link to='/' className='font-bold text-xl text-primary'>
          Research Paper Explainer
        </Link>

        <nav className='flex items-center gap-4'>
          {user ? (
            <>
              <Link
                to='/dashboard'
                className='text-sm font-medium text-gray-700 hover:text-primary transition-colors'
              >
                Dashboard
              </Link>
              <Link
                to='/upload'
                className='text-sm font-medium text-gray-700 hover:text-primary transition-colors'
              >
                Upload
              </Link>
              <Button variant='destructive' size='sm' onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link
                to='/login'
                className='text-sm font-medium text-gray-700 hover:text-primary transition-colors'
              >
                Sign In
              </Link>
              <Button asChild>
                <Link to='/register'>Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
