import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Layers,
  PlusCircle,
  History,
  BarChart3,
} from 'lucide-react';

export function BottomNavigation() {
  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/home" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home className="nav-item-icon" />
        <span>Home</span>
      </NavLink>

      <NavLink to="/items" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Layers className="nav-item-icon" />
        <span>Library</span>
      </NavLink>

      <NavLink
        to="/activities/new"
        className="nav-item"
        style={{
          color: 'var(--accent-green)',
          transform: 'translateY(-6px)',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--accent-green)',
            color: 'var(--text-inverse)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-green)',
          }}
        >
          <PlusCircle size={24} />
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Log</span>
      </NavLink>

      <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <History className="nav-item-icon" />
        <span>History</span>
      </NavLink>

      <NavLink to="/insights" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <BarChart3 className="nav-item-icon" />
        <span>Insights</span>
      </NavLink>
    </nav>
  );
}
