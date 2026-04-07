import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { 
  LogOut, Shield, Users, Package, DollarSign, 
  TrendingUp, User, RefreshCw, ChefHat, UtensilsCrossed
} from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/analytics`, { withCredentials: true });
      setAnalytics(response.data);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/users`, { withCredentials: true });
      setUsers(response.data.users);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/role`, { role: newRole }, { withCredentials: true });
      toast.success("User role updated");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#5C7582] mb-1">{title}</p>
          <p className="text-3xl font-bold text-[#264653]">{value}</p>
          {subtitle && <p className="text-sm text-[#5C7582] mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header border-b border-[#E5E0D8]/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#D95D39]" />
            <h1 className="text-xl font-bold text-[#264653]">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              data-testid="staff-dashboard-btn"
              onClick={() => navigate('/staff')}
              className="flex items-center gap-2 px-4 py-2 text-[#5C7582] hover:text-[#264653] transition-colors"
            >
              <ChefHat className="w-5 h-5" />
              <span className="hidden sm:inline">Staff View</span>
            </button>
            <button
              data-testid="view-menu-btn"
              onClick={() => navigate('/menu')}
              className="flex items-center gap-2 px-4 py-2 text-[#5C7582] hover:text-[#264653] transition-colors"
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span className="hidden sm:inline">Menu</span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#D95D39] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
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
            data-testid="analytics-tab"
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "analytics"
                ? "bg-[#D95D39] text-white"
                : "bg-white border border-[#E5E0D8] text-[#5C7582] hover:border-[#D95D39]"
            }`}
          >
            <TrendingUp className="w-5 h-5 inline-block mr-2" />
            Analytics
          </button>
          <button
            data-testid="users-tab"
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "users"
                ? "bg-[#D95D39] text-white"
                : "bg-white border border-[#E5E0D8] text-[#5C7582] hover:border-[#D95D39]"
            }`}
          >
            <Users className="w-5 h-5 inline-block mr-2" />
            Users
          </button>
          <button
            data-testid="refresh-btn"
            onClick={() => activeTab === "analytics" ? fetchAnalytics() : fetchUsers()}
            className="ml-auto p-3 text-[#5C7582] hover:text-[#264653] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div>
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E5E0D8] p-6 animate-pulse">
                    <div className="h-4 bg-[#E5E0D8] rounded w-1/2 mb-3"></div>
                    <div className="h-8 bg-[#E5E0D8] rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : analytics && (
              <>
                {/* Stats Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-children">
                  <StatCard 
                    title="Total Users" 
                    value={analytics.total_users} 
                    icon={Users} 
                    color="bg-[#81B29A]"
                  />
                  <StatCard 
                    title="Total Orders" 
                    value={analytics.total_orders} 
                    icon={Package} 
                    color="bg-[#264653]"
                  />
                  <StatCard 
                    title="Paid Orders" 
                    value={analytics.paid_orders} 
                    icon={TrendingUp} 
                    color="bg-[#2A9D8F]"
                  />
                  <StatCard 
                    title="Total Revenue" 
                    value={`$${analytics.total_revenue?.toFixed(2) || '0.00'}`} 
                    icon={DollarSign} 
                    color="bg-[#D95D39]"
                  />
                </div>

                {/* Breakdowns */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Orders by Status */}
                  <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6">
                    <h3 className="font-bold text-[#264653] mb-4">Orders by Status</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.orders_by_status || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="capitalize text-[#5C7582]">{status}</span>
                          <span className="font-bold text-[#264653]">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Users by Role */}
                  <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6">
                    <h3 className="font-bold text-[#264653] mb-4">Users by Role</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.users_by_role || {}).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="capitalize text-[#5C7582]">{role}</span>
                          <span className="font-bold text-[#264653]">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-2xl font-bold text-[#264653] mb-6">
              User Management ({users.length} users)
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E5E0D8] p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#E5E0D8]"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-[#E5E0D8] rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-[#E5E0D8] rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E5E0D8] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E0D8] bg-[#F9F6F0]">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#264653]">User</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#264653]">Email</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#264653]">Role</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#264653]">Created</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#264653]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, idx) => (
                        <tr 
                          key={u.user_id}
                          data-testid={`user-row-${u.user_id}`}
                          className={`border-b border-[#E5E0D8] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F9F6F0]/50'}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#81B29A] flex items-center justify-center">
                                {u.picture ? (
                                  <img src={u.picture} alt={u.name} className="w-10 h-10 rounded-full" />
                                ) : (
                                  <User className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <span className="font-medium text-[#264653]">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#5C7582]">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                              u.role === 'admin' 
                                ? 'bg-[#D95D39]/10 text-[#D95D39]' 
                                : u.role === 'staff' 
                                ? 'bg-[#81B29A]/10 text-[#81B29A]' 
                                : 'bg-[#264653]/10 text-[#264653]'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#5C7582] text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {u.user_id !== user?.user_id && (
                              <Select
                                value={u.role}
                                onValueChange={(value) => updateUserRole(u.user_id, value)}
                              >
                                <SelectTrigger 
                                  data-testid={`role-select-${u.user_id}`}
                                  className="w-32 h-9 rounded-lg border-[#E5E0D8]"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
