import { useAuth } from '../../context/AuthContext.jsx';
import { LeaderboardView } from '../user/Leaderboard.jsx';

export default function AdminLeaderboard() {
  const { session } = useAuth();
  return <div className="card"><LeaderboardView actor={session} /></div>;
}
