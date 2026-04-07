import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useCart, API } from "@/App";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { ArrowLeft, Minus, Plus, Trash2, Clock, Calendar, CreditCard } from "lucide-react";

const CartPage = () => {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await axios.get(`${API}/slots`, { withCredentials: true });
      setSlots(response.data.slots);
    } catch (error) {
      toast.error("Failed to load time slots");
    } finally {
      setSlotsLoading(false);
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!selectedSlot) {
      toast.error("Please select a pickup time slot");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/orders`, {
        items: cart.map(item => ({ item_id: item.item_id, quantity: item.quantity })),
        slot_id: selectedSlot,
        origin_url: window.location.origin
      }, { withCredentials: true });

      clearCart();
      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create order");
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center">
        <div className="text-center animate-slide-up">
          <div className="w-24 h-24 rounded-full bg-[#E5E0D8] flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-[#5C7582]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#264653] mb-2">Your cart is empty</h2>
          <p className="text-[#5C7582] mb-6">Add some delicious items from our menu</p>
          <Button
            data-testid="browse-menu-btn"
            onClick={() => navigate('/menu')}
            className="bg-[#D95D39] hover:bg-[#C84C2A] text-white rounded-full px-8"
          >
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header border-b border-[#E5E0D8]/40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center">
          <button
            data-testid="back-to-menu-btn"
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 text-[#5C7582] hover:text-[#264653] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>
          <h1 className="text-xl font-bold text-[#264653] ml-auto">Your Cart</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-xl font-bold text-[#264653] mb-4">Order Items ({cart.length})</h2>
            
            {cart.map(item => (
              <div 
                key={item.item_id}
                data-testid={`cart-item-${item.item_id}`}
                className="bg-white rounded-2xl border border-[#E5E0D8] p-4 flex gap-4 animate-fade-in"
              >
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-[#264653]">{item.name}</h3>
                  <p className="text-sm text-[#5C7582]">${item.price.toFixed(2)} each</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <button
                        data-testid={`decrease-qty-${item.item_id}`}
                        onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-[#E5E0D8] flex items-center justify-center hover:border-[#D95D39] transition-colors"
                      >
                        <Minus className="w-4 h-4 text-[#5C7582]" />
                      </button>
                      <span className="font-bold text-[#264653] w-8 text-center">{item.quantity}</span>
                      <button
                        data-testid={`increase-qty-${item.item_id}`}
                        onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-[#E5E0D8] flex items-center justify-center hover:border-[#D95D39] transition-colors"
                      >
                        <Plus className="w-4 h-4 text-[#5C7582]" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[#D95D39]">${(item.price * item.quantity).toFixed(2)}</span>
                      <button
                        data-testid={`remove-item-${item.item_id}`}
                        onClick={() => removeFromCart(item.item_id)}
                        className="p-2 text-[#E63946] hover:bg-[#E63946]/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sticky top-24">
              {/* Time Slot Selection */}
              <div className="mb-6">
                <h3 className="font-bold text-[#264653] mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#D95D39]" />
                  Select Pickup Time
                </h3>
                
                {slotsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-[#E5E0D8] rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : Object.keys(slotsByDate).length === 0 ? (
                  <p className="text-[#5C7582] text-sm">No time slots available</p>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                      <div key={date}>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-[#5C7582]" />
                          <span className="text-sm font-medium text-[#264653]">{formatDate(date)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {dateSlots.map(slot => (
                            <button
                              key={slot.slot_id}
                              data-testid={`slot-${slot.slot_id}`}
                              onClick={() => setSelectedSlot(slot.slot_id)}
                              disabled={slot.current_orders >= slot.max_orders}
                              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                                selectedSlot === slot.slot_id
                                  ? "bg-[#D95D39] text-white"
                                  : slot.current_orders >= slot.max_orders
                                  ? "bg-[#E5E0D8] text-[#5C7582] cursor-not-allowed"
                                  : "border border-[#E5E0D8] text-[#264653] hover:border-[#D95D39]"
                              }`}
                            >
                              {slot.start_time} - {slot.end_time}
                              {slot.current_orders >= slot.max_orders && (
                                <span className="block text-xs opacity-70">Full</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="border-t border-[#E5E0D8] pt-4 mb-6">
                <div className="flex justify-between text-[#5C7582] mb-2">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5C7582] mb-2">
                  <span>Service fee</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#264653] pt-2 border-t border-[#E5E0D8]">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                data-testid="checkout-btn"
                onClick={handleCheckout}
                disabled={loading || !selectedSlot || cart.length === 0}
                className="w-full h-12 bg-[#D95D39] hover:bg-[#C84C2A] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Pay ${cartTotal.toFixed(2)}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartPage;
