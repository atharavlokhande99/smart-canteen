import { useEffect, useRef, useState, createContext, useContext, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import MenuPage from "@/pages/MenuPage";
import CartPage from "@/pages/CartPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import StaffDashboard from "@/pages/StaffDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Cart Context
const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("canteen_cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("canteen_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_id === item.item_id);
      if (existing) {
        return prev.map(i => 
          i.item_id === item.item_id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.item_id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i => 
      i.item_id === itemId ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("canteen_cart");
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, {
      withCredentials: true
    });
    setUser(response.data);
    localStorage.setItem("auth_token", response.data.token);
    return response.data;
  };

  const register = async (name, email, password, role) => {
    const response = await axios.post(`${API}/auth/register`, { name, email, password, role }, {
      withCredentials: true
    });
    setUser(response.data);
    localStorage.setItem("auth_token", response.data.token);
    return response.data;
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      // ignore
    }
    setUser(null);
    localStorage.removeItem("auth_token");
  };

  const setUserFromCallback = (userData) => {
    setUser(userData);
    if (userData.token) {
      localStorage.setItem("auth_token", userData.token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin, setUserFromCallback, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUserFromCallback } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = window.location.hash;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];

      if (!sessionId) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post(`${API}/auth/session`, { session_id: sessionId }, {
          withCredentials: true
        });
        setUserFromCallback(response.data);
        
        // Redirect based on role
        const role = response.data.role;
        if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (role === 'staff') {
          navigate('/staff', { replace: true });
        } else {
          navigate('/menu', { replace: true });
        }
      } catch (error) {
        toast.error("Authentication failed");
        navigate('/login');
      }
    };

    processSession();
  }, [navigate, setUserFromCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#D95D39] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#5C7582]">Authenticating...</p>
      </div>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
        <div className="w-12 h-12 border-4 border-[#D95D39] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'staff') {
      return <Navigate to="/staff" replace />;
    } else {
      return <Navigate to="/menu" replace />;
    }
  }

  return children;
};

// Landing Page
const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'staff') {
        navigate('/staff');
      } else {
        navigate('/menu');
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/8296c33c-55b7-4bb3-a2d5-e8320264c968/images/326c47e58e45964036646fd66cfe9ca783934788955c01f6b811b15e70174bbf.png"
            alt="Canteen"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl lg:text-7xl font-black text-[#264653] tracking-tighter mb-6 animate-slide-up">
              Smart Canteen
            </h1>
            <p className="text-xl text-[#5C7582] mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Pre-order your meals, skip the queue, and pick up at your scheduled time. 
              Streamlined food ordering for busy students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button 
                data-testid="get-started-btn"
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-[#D95D39] text-white font-semibold rounded-full hover:bg-[#C84C2A] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
              <button 
                data-testid="login-btn"
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-[#264653] font-semibold rounded-full border border-[#E5E0D8] hover:border-[#D95D39] transition-all duration-300"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#264653] text-center mb-16">
            Why Smart Canteen?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            <div className="p-8 rounded-2xl border border-[#E5E0D8] card-hover">
              <div className="w-14 h-14 rounded-xl bg-[#D95D39]/10 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#D95D39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#264653] mb-3">Save 60% Time</h3>
              <p className="text-[#5C7582]">No more waiting in long queues. Pre-order and pick up at your scheduled time slot.</p>
            </div>
            <div className="p-8 rounded-2xl border border-[#E5E0D8] card-hover">
              <div className="w-14 h-14 rounded-xl bg-[#81B29A]/10 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#81B29A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#264653] mb-3">Zero Order Errors</h3>
              <p className="text-[#5C7582]">Digital ordering means no miscommunication. Get exactly what you ordered, every time.</p>
            </div>
            <div className="p-8 rounded-2xl border border-[#E5E0D8] card-hover">
              <div className="w-14 h-14 rounded-xl bg-[#2A9D8F]/10 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#2A9D8F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#264653] mb-3">Real-time Tracking</h3>
              <p className="text-[#5C7582]">Track your order status from preparation to ready. Get notified when it's time to pick up.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// App Router
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  // Check pathname for auth callback route
  if (location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/menu" element={
        <ProtectedRoute allowedRoles={['student', 'staff', 'admin']}>
          <MenuPage />
        </ProtectedRoute>
      } />
      <Route path="/cart" element={
        <ProtectedRoute allowedRoles={['student']}>
          <CartPage />
        </ProtectedRoute>
      } />
      <Route path="/order-success" element={
        <ProtectedRoute allowedRoles={['student']}>
          <OrderSuccessPage />
        </ProtectedRoute>
      } />
      <Route path="/my-orders" element={
        <ProtectedRoute allowedRoles={['student']}>
          <MyOrdersPage />
        </ProtectedRoute>
      } />
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles={['staff', 'admin']}>
          <StaffDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" richColors />
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
