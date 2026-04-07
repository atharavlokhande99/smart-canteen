import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { ArrowLeft, Clock, Calendar, Package, RefreshCw } from "lucide-react";

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders/my`, { withCredentials: true });
      setOrders(response.data.orders);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "badge-pending",
      paid: "badge-paid",
      preparing: "badge-preparing",
      ready: "badge-ready",
      completed: "badge-completed",
      cancelled: "badge-cancelled"
    };
    const labels = {
      pending: "Pending Payment",
      paid: "Order Placed",
      preparing: "Being Prepared",
      ready: "Ready for Pickup",
      completed: "Completed",
      cancelled: "Cancelled"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header border-b border-[#E5E0D8]/40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            data-testid="back-to-menu-btn"
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 text-[#5C7582] hover:text-[#264653] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>
          <button
            data-testid="refresh-orders-btn"
            onClick={fetchOrders}
            className="p-2 text-[#5C7582] hover:text-[#264653] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-extrabold text-[#264653] tracking-tight mb-8">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#E5E0D8] p-6 animate-pulse">
                <div className="h-6 bg-[#E5E0D8] rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-[#E5E0D8] rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-[#E5E0D8] rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-[#E5E0D8] flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-[#5C7582]" />
            </div>
            <h2 className="text-xl font-bold text-[#264653] mb-2">No orders yet</h2>
            <p className="text-[#5C7582] mb-6">Start ordering from our delicious menu</p>
            <Button
              data-testid="start-ordering-btn"
              onClick={() => navigate('/menu')}
              className="bg-[#D95D39] hover:bg-[#C84C2A] text-white rounded-full px-8"
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {orders.map(order => (
              <div 
                key={order.order_id}
                data-testid={`order-${order.order_id}`}
                className="bg-white rounded-2xl border border-[#E5E0D8] p-6 card-hover"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-[#264653]">Order #{order.order_id.slice(-8)}</h3>
                    <p className="text-sm text-[#5C7582]">{formatDateTime(order.created_at)}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="flex items-center gap-4 text-sm text-[#5C7582] mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{order.slot_time}</span>
                  </div>
                </div>

                <div className="border-t border-[#E5E0D8] pt-4">
                  <h4 className="text-sm font-medium text-[#264653] mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-[#5C7582]">{item.quantity}x {item.name}</span>
                        <span className="text-[#264653]">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-[#264653] mt-3 pt-3 border-t border-[#E5E0D8]">
                    <span>Total</span>
                    <span className="text-[#D95D39]">${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {order.status === 'ready' && (
                  <div className="mt-4 p-3 bg-[#2A9D8F]/10 rounded-xl text-center">
                    <p className="text-[#2A9D8F] font-medium">Your order is ready for pickup!</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrdersPage;
