import React from 'react';
import { NavLink } from 'react-router-dom';
import { PlusCircle, BarChart3, Trophy, User } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="max-w-md mx-auto px-6 py-2 flex justify-between items-center">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              isActive ? 'text-gold-500 font-bold' : 'text-charcoal-400 hover:text-charcoal-600'
            }`
          }
        >
          <PlusCircle size={20} />
          <span className="text-[10px] uppercase tracking-wider font-semibold">Log</span>
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              isActive ? 'text-gold-500 font-bold' : 'text-charcoal-400 hover:text-charcoal-600'
            }`
          }
        >
          <BarChart3 size={20} />
          <span className="text-[10px] uppercase tracking-wider font-semibold">Stats</span>
        </NavLink>

        <NavLink
          to="/leaderboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              isActive ? 'text-gold-500 font-bold' : 'text-charcoal-400 hover:text-charcoal-600'
            }`
          }
        >
          <Trophy size={20} />
          <span className="text-[10px] uppercase tracking-wider font-semibold">Ranks</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              isActive ? 'text-gold-500 font-bold' : 'text-charcoal-400 hover:text-charcoal-600'
            }`
          }
        >
          <User size={20} />
          <span className="text-[10px] uppercase tracking-wider font-semibold">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
