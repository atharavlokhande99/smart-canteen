import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useCart, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { ShoppingCart, LogOut, User, Clock, ChefHat, ClipboardList, Plus } from "lucide-react";

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { user, logout } = useAuth();
  const { addToCart, cartCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/menu`, { withCredentials: true });
      setMenuItems(response.data.items);
    } catch (error) {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header border-b border-[#E5E0D8]/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#264653] tracking-tight">Smart Canteen</h1>
          
          <nav className="flex items-center gap-4">
            {user?.role === 'student' && (
              <>
                <button
                  data-testid="my-orders-btn"
                  onClick={() => navigate('/my-orders')}
                  className="flex items-center gap-2 px-4 py-2 text-[#5C7582] hover:text-[#264653] transition-colors"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span className="hidden sm:inline">My Orders</span>
                </button>
                <button
                  data-testid="cart-btn"
                  onClick={() => navigate('/cart')}
                  className="relative flex items-center gap-2 px-4 py-2 bg-[#D95D39] text-white rounded-full hover:bg-[#C84C2A] transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="hidden sm:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#D95D39] text-xs font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}
            
            {(user?.role === 'staff' || user?.role === 'admin') && (
              <button
                data-testid="staff-dashboard-btn"
                onClick={() => navigate(user.role === 'admin' ? '/admin' : '/staff')}
                className="flex items-center gap-2 px-4 py-2 text-[#5C7582] hover:text-[#264653] transition-colors"
              >
                <ChefHat className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#81B29A] flex items-center justify-center">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-[#264653]">{user?.name}</span>
              </div>
              <button
                data-testid="logout-btn"
                onClick={handleLogout}
                className="p-2 text-[#5C7582] hover:text-[#E63946] transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-[#264653] tracking-tight">Today's Menu</h2>
          <p className="text-[#5C7582] mt-1">Pre-order your favorite meals and skip the queue</p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map(category => (
            <button
              key={category}
              data-testid={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-[#D95D39] text-white"
                  : "bg-white border border-[#E5E0D8] text-[#5C7582] hover:border-[#D95D39] hover:text-[#D95D39]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E5E0D8] overflow-hidden animate-pulse">
                <div className="h-48 bg-[#E5E0D8]"></div>
                <div className="p-5">
                  <div className="h-5 bg-[#E5E0D8] rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-[#E5E0D8] rounded w-full mb-4"></div>
                  <div className="h-10 bg-[#E5E0D8] rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
            {filteredItems.map(item => (
              <div 
                key={item.item_id}
                data-testid={`menu-item-${item.item_id}`}
                className="bg-white rounded-2xl border border-[#E5E0D8] overflow-hidden card-hover"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover img-hover"
                  />
                  <Badge className="absolute top-3 left-3 bg-[#264653]/80 text-white border-0 rounded-full">
                    {item.category}
                  </Badge>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#264653] mb-1">{item.name}</h3>
                  <p className="text-sm text-[#5C7582] mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 text-sm text-[#5C7582] mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{item.preparation_time} mins</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#D95D39]">${item.price.toFixed(2)}</span>
                    {user?.role === 'student' && (
                      <Button
                        data-testid={`add-to-cart-${item.item_id}`}
                        onClick={() => addToCart(item)}
                        className="bg-[#D95D39] hover:bg-[#C84C2A] text-white rounded-full px-4"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#5C7582] text-lg">No items available in this category</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MenuPage;
