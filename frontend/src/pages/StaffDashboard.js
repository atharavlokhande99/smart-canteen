import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { 
  LogOut, ChefHat, Clock, Calendar, Package, 
  Plus, Trash2, RefreshCw, User, Check, X,
  ToggleLeft, ToggleRight, UtensilsCrossed
} from "lucide-react";

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ date: "", start_time: "", end_time: "", max_orders: 10 });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else {
      fetchSlots();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/orders/pending`, { withCredentials: true });
      setOrders(response.data.orders);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/slots/all`, { withCredentials: true });
      setSlots(response.data.slots);
    } catch (error) {
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status }, { withCredentials: true });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const createSlot = async () => {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) {
      toast.error("Please fill all slot details");
      return;
    }
    try {
      await axios.post(`${API}/slots`, newSlot, { withCredentials: true });
      toast.success("Time slot created");
      setNewSlot({ date: "", start_time: "", end_time: "", max_orders: 10 });
      fetchSlots();
    } catch (error) {
      toast.error("Failed to create slot");
    }
  };

  const toggleSlot = async (slotId) => {
    try {
      await axios.put(`${API}/slots/${slotId}/toggle`, {}, { withCredentials: true });
      toast.success("Slot updated");
      fetchSlots();
    } catch (error) {
      toast.error("Failed to toggle slot");
    }
  };

  const deleteSlot = async (slotId) => {
    try {
      await axios.delete(`${API}/slots/${slotId}`, { withCredentials: true });
      toast.success("Slot deleted");
      fetchSlots();
    } catch (error) {
      toast.error("Failed to delete slot");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: "bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]",
      preparing: "bg-[#D95D39]/10 text-[#D95D39] border-[#D95D39]",
      ready: "bg-[#81B29A]/10 text-[#81B29A] border-[#81B29A]"
    };
    return colors[status] || "bg-gray-100 text-gray-600";
  };

  // Get today's date for default
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header border-b border-[#E5E0D8]/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-[#D95D39]" />
            <h1 className="text-xl font-bold text-[#264653]">Staff Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              data-testid="view-menu-btn"
              onClick={() => navigate('/menu')}
              className="flex items-center gap-2 px-4 py-2 text-[#5C7582] hover:text-[#264653] transition-colors"
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span className="hidden sm:inline">Menu</span>
            </button>
            
            {user?.role === 'admin' && (
              <button
                data-testid="admin-dashboard-btn"
                onClick={() => navigate('/admin')}
                className="px-4 py-2 text-[#5C7582] hover:text-[#264653] transition-colors"
              >
                Admin Panel
              </button>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#81B29A] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:inline text-sm font-medium text-[#264653]">{user?.name}</span>
              </div>
              <button
                data-testid="logout-btn"
                onClick={handleLogout}
                className="p-2 text-[#5C7582] hover:text-[#E63946] transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            data-testid="orders-tab"
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "orders"
                ? "bg-[#D95D39] text-white"
                : "bg-white border border-[#E5E0D8] text-[#5C7582] hover:border-[#D95D39]"
            }`}
          >
            <Package className="w-5 h-5 inline-block mr-2" />
            Active Orders
          </button>
          <button
            data-testid="slots-tab"
            onClick={() => setActiveTab("slots")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "slots"
                ? "bg-[#D95D39] text-white"
                : "bg-white border border-[#E5E0D8] text-[#5C7582] hover:border-[#D95D39]"
            }`}
          >
            <Clock className="w-5 h-5 inline-block mr-2" />
            Time Slots
          </button>
          <button
            data-testid="refresh-btn"
            onClick={() => activeTab === "orders" ? fetchOrders() : fetchSlots()}
            className="ml-auto p-3 text-[#5C7582] hover:text-[#264653] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            <h2 className="text-2xl font-bold text-[#264653] mb-6">
              Pending Orders ({orders.length})
            </h2>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E5E0D8] p-6 animate-pulse">
                    <div className="h-6 bg-[#E5E0D8] rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-[#E5E0D8] rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-[#E5E0D8] rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E0D8]">
                <Package className="w-16 h-16 text-[#E5E0D8] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#264653] mb-2">No pending orders</h3>
                <p className="text-[#5C7582]">New orders will appear here when students place them</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {orders.map(order => (
                  <div 
                    key={order.order_id}
                    data-testid={`staff-order-${order.order_id}`}
                    className="bg-white rounded-2xl border border-[#E5E0D8] p-6 card-hover"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-[#264653]">#{order.order_id.slice(-6)}</h3>
                        <p className="text-sm text-[#5C7582]">{order.user_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#5C7582] mb-4">
                      <Clock className="w-4 h-4" />
                      <span>{order.slot_time}</span>
                    </div>

                    <div className="border-t border-[#E5E0D8] pt-4 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className="text-[#264653]">{item.quantity}x {item.name}</span>
                          <span className="text-[#5C7582]">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-[#264653] pt-2 border-t border-[#E5E0D8] mt-2">
                        <span>Total</span>
                        <span className="text-[#D95D39]">${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'paid' && (
                        <Button
                          data-testid={`start-preparing-${order.order_id}`}
                          onClick={() => updateOrderStatus(order.order_id, 'preparing')}
                          className="flex-1 bg-[#D95D39] hover:bg-[#C84C2A] text-white rounded-xl"
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          data-testid={`mark-ready-${order.order_id}`}
                          onClick={() => updateOrderStatus(order.order_id, 'ready')}
                          className="flex-1 bg-[#2A9D8F] hover:bg-[#238B7B] text-white rounded-xl"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark Ready
                        </Button>
                      )}
                      {(order.status === 'paid' || order.status === 'preparing') && (
                        <Button
                          data-testid={`cancel-order-${order.order_id}`}
                          onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                          variant="outline"
                          className="border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10 rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Slots Tab */}
        {activeTab === "slots" && (
          <div>
            <h2 className="text-2xl font-bold text-[#264653] mb-6">Manage Time Slots</h2>

            {/* Create Slot Form */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 mb-8">
              <h3 className="font-bold text-[#264653] mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D95D39]" />
                Create New Slot
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#264653] block mb-2">Date</label>
                  <Input
                    data-testid="slot-date-input"
                    type="date"
                    min={today}
                    value={newSlot.date}
                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                    className="h-11 rounded-xl border-[#E5E0D8]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#264653] block mb-2">Start Time</label>
                  <Input
                    data-testid="slot-start-input"
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    className="h-11 rounded-xl border-[#E5E0D8]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#264653] block mb-2">End Time</label>
                  <Input
                    data-testid="slot-end-input"
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    className="h-11 rounded-xl border-[#E5E0D8]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#264653] block mb-2">Max Orders</label>
                  <Input
                    data-testid="slot-max-orders-input"
                    type="number"
                    min="1"
                    value={newSlot.max_orders}
                    onChange={(e) => setNewSlot({ ...newSlot, max_orders: parseInt(e.target.value) || 10 })}
                    className="h-11 rounded-xl border-[#E5E0D8]"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    data-testid="create-slot-btn"
                    onClick={createSlot}
                    className="w-full h-11 bg-[#D95D39] hover:bg-[#C84C2A] text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Slot
                  </Button>
                </div>
              </div>
            </div>

            {/* Slots List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E5E0D8] p-6 animate-pulse">
                    <div className="h-6 bg-[#E5E0D8] rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E0D8]">
                <Clock className="w-16 h-16 text-[#E5E0D8] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#264653] mb-2">No time slots</h3>
                <p className="text-[#5C7582]">Create time slots for students to book</p>
              </div>
            ) : (
              <div className="space-y-4 stagger-children">
                {slots.map(slot => (
                  <div 
                    key={slot.slot_id}
                    data-testid={`slot-${slot.slot_id}`}
                    className="bg-white rounded-2xl border border-[#E5E0D8] p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#5C7582]" />
                        <span className="font-medium text-[#264653]">{slot.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#5C7582]" />
                        <span className="text-[#264653]">{slot.start_time} - {slot.end_time}</span>
                      </div>
                      <div className="text-sm text-[#5C7582]">
                        {slot.current_orders}/{slot.max_orders} orders
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        data-testid={`toggle-slot-${slot.slot_id}`}
                        onClick={() => toggleSlot(slot.slot_id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                          slot.active 
                            ? "bg-[#2A9D8F]/10 text-[#2A9D8F]" 
                            : "bg-[#E5E0D8] text-[#5C7582]"
                        }`}
                      >
                        {slot.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        {slot.active ? "Active" : "Inactive"}
                      </button>
                      <button
                        data-testid={`delete-slot-${slot.slot_id}`}
                        onClick={() => deleteSlot(slot.slot_id)}
                        className="p-2 text-[#E63946] hover:bg-[#E63946]/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;
