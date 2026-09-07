import { useState } from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadNotificationCount } from '@/hooks/queries/useNotificationQueries'
import { Button, Avatar, ConfirmModal } from '@/components/ui'
import styles from './Layout.module.css'

import { 
  FiGrid, FiSearch, FiFileText, FiMessageSquare, 
  FiBriefcase, FiEdit, 
  FiLogIn, FiUserPlus, FiLogOut, FiMenu, FiBell,
  FiShield, FiBookmark, FiCpu
} from 'react-icons/fi'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { data: notifications = [] } = useNotifications(!!user)
  const { data: unreadCount = 0 } = useUnreadNotificationCount(!!user)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await logout()
    navigate('/login')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const handleNotificationClick = (id: number, relatedUrl: string) => {
    markRead.mutate(id)
    setNotificationsOpen(false)
    if (relatedUrl) navigate(relatedUrl)
  }

  const navLinks = [
    // Admin links (for staff/superuser)
    ...(user?.is_staff ? [
      { to: '/admin/dashboard', label: 'Admin Dashboard', icon: <FiShield /> },
      { to: '/jobs', label: 'Browse Jobs', icon: <FiSearch /> },
    ] : []),
    ...(user?.account_type === 'SEEKER' ? [
      { to: '/seeker/dashboard', label: 'Dashboard', icon: <FiGrid /> },
      { to: '/jobs', label: 'Find Jobs', icon: <FiSearch /> },
      { to: '/seeker/saved-jobs', label: 'Saved Jobs', icon: <FiBookmark /> },
      { to: '/seeker/applications', label: 'My Applications', icon: <FiFileText /> },
    ] : []),
    ...(user?.account_type === 'EMPLOYER' ? [
      { to: '/employer/dashboard', label: 'Dashboard', icon: <FiGrid /> },
      { to: '/employer/jobs', label: 'My Jobs', icon: <FiBriefcase /> },
      { to: '/employer/shortlist', label: 'AI Shortlist', icon: <FiCpu /> },
      { to: '/employer/jobs/new', label: 'Post a Job', icon: <FiEdit /> },
    ] : []),
    ...(!user ? [
      { to: '/jobs', label: 'Find Jobs', icon: <FiSearch /> },
      { to: '/login', label: 'Sign In', icon: <FiLogIn /> },
      { to: '/register', label: 'Register', icon: <FiUserPlus /> },
    ] : []),
  ]

  const profilePath = user?.account_type === 'SEEKER' ? '/seeker/profile' : '/employer/profile'

  return (
    <div className={styles.appLayout}>
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoContainer}>
          <Link to="/" className={styles.logoText} onClick={closeMobileMenu}>
            Hirely<span className={styles.logoDot}></span>
          </Link>
        </div>

        <nav className={styles.navLinks}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={closeMobileMenu}
            >
              <span className={styles.navIcon}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div 
            className={styles.userInfo} 
            onClick={() => setShowLogoutConfirm(true)} 
            title="Click to sign out"
            role="button"
            tabIndex={0}
          >
            <Avatar 
              name={user.name || user.email || 'User'} 
              size={32}
              round
            />
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.name || 'User'}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
            <span className={styles.chevron}><FiLogOut /></span>
          </div>
        )}
      </aside>

      {mobileMenuOpen && (
        <div className={styles.mobileBackdrop} onClick={closeMobileMenu} />
      )}

      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.hamburger} onClick={toggleMobileMenu} aria-label="Toggle menu">
              <FiMenu size={24} />
            </button>
          </div>

          <div className={styles.headerRight}>
            {user?.account_type === 'EMPLOYER' && (
              <Link to="/employer/jobs/new" className={styles.postJobBtn}>
                <Button variant="primary">Post a Job</Button>
              </Link>
            )}
            {user && (
              <>
                <button
                  className={styles.notificationBtn}
                  onClick={() => setNotificationsOpen((open) => !open)}
                  aria-label="Notifications"
                >
                  <FiBell size={20} />
                  {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notificationsOpen && (
                  <div className={styles.notificationPanel}>
                    <div className={styles.notificationHeader}>
                      <strong>Notifications</strong>
                      {unreadCount > 0 && (
                        <button className={styles.markAllButton} onClick={() => markAllRead.mutate()}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className={styles.emptyNotifications}>No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 8).map((notification) => (
                        <button
                          key={notification.id}
                          className={`${styles.notificationItem} ${!notification.is_read ? styles.unreadNotification : ''}`}
                          onClick={() => handleNotificationClick(notification.id, notification.related_url)}
                        >
                          <strong>{notification.title}</strong>
                          <span>{notification.message}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <Link to={profilePath} className={styles.headerAvatarLink} title="View Profile">
                  <Avatar 
                    name={user.name || user.email || 'User'} 
                    size={34}
                    round
                  />
                </Link>
              </>
            )}
            {!user && (
              <Link to="/login">
                <Button variant="primary">Sign In</Button>
              </Link>
            )}
          </div>
        </header>

        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        description="Are you sure you want to sign out of your Hirely account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export function GuestLayout() {
  return (
    <div className={styles.guestLayout}>
      <div className={`${styles.corner} ${styles.cornerTL}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerTR}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerBL}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerBR}`} aria-hidden="true" />

      <header className={styles.guestHeader}>
        <Link to="/" className={styles.guestBrandLogo} title="Return to Hirely home">
          Hirely<span className={styles.guestLogoDot}></span>
        </Link>
      </header>

      <main className={styles.guestMain}>
        <Outlet />
      </main>
    </div>
  )
}
