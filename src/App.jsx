import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ui.jsx';
import { DEMO_MODE } from './config/env.js';
import Login from './pages/Login.jsx';
import UserLayout from './pages/user/UserLayout.jsx';
import Overview from './pages/user/Overview.jsx';
import Gallery from './pages/user/Gallery.jsx';
import History from './pages/user/History.jsx';
import Rewards from './pages/user/Rewards.jsx';
import Leaderboard from './pages/user/Leaderboard.jsx';
import Rules from './pages/user/Rules.jsx';
import Notifications from './pages/user/Notifications.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import TodaySession from './pages/admin/TodaySession.jsx';
import MakeupCheckin from './pages/admin/MakeupCheckin.jsx';
import Kids from './pages/admin/Kids.jsx';
import KidDetail from './pages/admin/KidDetail.jsx';
import Requests from './pages/admin/Requests.jsx';
import AdminRewards from './pages/admin/AdminRewards.jsx';
import AdminLeaderboard from './pages/admin/AdminLeaderboard.jsx';

function RequireRole({ role, children }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={session.role === 'admin' ? '/admin' : '/app'} replace />;
  return children;
}

function Home() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={session.role === 'admin' ? '/admin' : '/app'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        {DEMO_MODE && <div className="demo-strip" role="note">Bản demo · dữ liệu mẫu, chỉ lưu trên trình duyệt này</div>}
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<RequireRole role="parent"><UserLayout /></RequireRole>}>
              <Route index element={<Overview />} />
              <Route path="tranh" element={<Gallery />} />
              <Route path="lich-su" element={<History />} />
              <Route path="uu-dai" element={<Rewards />} />
              <Route path="xep-hang" element={<Leaderboard />} />
              <Route path="quy-tac" element={<Rules />} />
              <Route path="thong-bao" element={<Notifications />} />
            </Route>
            <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
              <Route index element={<AdminOverview />} />
              <Route path="buoi-hoc" element={<TodaySession />} />
              <Route path="checkin-bu" element={<MakeupCheckin />} />
              <Route path="be" element={<Kids />} />
              <Route path="be/:kidId" element={<KidDetail />} />
              <Route path="yeu-cau" element={<Requests />} />
              <Route path="uu-dai" element={<AdminRewards />} />
              <Route path="xep-hang" element={<AdminLeaderboard />} />
            </Route>
            <Route path="*" element={<Home />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
