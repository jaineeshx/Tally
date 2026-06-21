// ============================================================
// BottomNav.tsx — Primary navigation landmark
//
// Accessibility:
//  • Wrapped in <nav aria-label="Primary"> (WCAG landmark)
//  • Each NavLink uses aria-current="page" when active
//  • Icon nodes are aria-hidden; visible text provides the label
//  • Focus ring inherited from global :focus-visible rule
// ============================================================
import React from 'react';
import { NavLink } from 'react-router-dom';
import { PlusCircle, BarChart3, Trophy, User } from 'lucide-react';

/** Navigation item definition — drives the tab bar rendering. */
interface NavItem {
  to: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  id: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',            label: 'Log',     Icon: PlusCircle, id: 'nav-log'         },
  { to: '/dashboard',   label: 'Stats',   Icon: BarChart3,  id: 'nav-dashboard'   },
  { to: '/leaderboard', label: 'Ranks',   Icon: Trophy,     id: 'nav-leaderboard' },
  { to: '/profile',     label: 'Profile', Icon: User,       id: 'nav-profile'     },
];

/** Fixed bottom navigation bar. Implements WCAG 2.4.1 landmark navigation. */
export default function BottomNav() {
  return (
    <nav aria-label="Primary" className="bottom-nav">
      <div className="max-w-md mx-auto px-6 py-2 flex justify-between items-center">
        {NAV_ITEMS.map(({ to, label, Icon, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-gold-500 font-bold'
                  : 'text-charcoal-400 hover:text-charcoal-600'
              }`
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} aria-hidden={true} />
                <span
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
