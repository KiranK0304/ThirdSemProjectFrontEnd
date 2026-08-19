import { useState } from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadNotificationCount } from '@/hooks/queries/useNotificationQueries'
import { Button, Avatar } from '@/components/ui'
import styles from './Layout.module.css'

import { 
  FiGrid, FiSearch, FiFileText, FiMessageSquare, 
  FiUser, FiBriefcase, FiEdit, FiSettings, 
  FiLogIn, FiUserPlus, FiLogOut, FiMenu, FiBell 
} from 'react-icons/fi'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { data: notifications = [] } = useNotifications(!!user)
  const { data: unreadCount = 0 } = useUnreadNotificationCount(!!user)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const handleLogout = async () => {
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

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.substring(0, 2).toUpperCase()
    if (email) return email.substring(0, 2).toUpperCase()
    return 'U'
  }

  const navLinks = [
    ...(user?.account_type === 'SEEKER' ? [
      { to: '/seeker/dashboard', label: 'Dashboard', icon: <FiGrid /> },
      { to: '/jobs', label: 'Find Jobs', icon: <FiSearch /> },
      { to: '/seeker/applications', label: 'My Applications', icon: <FiFileText /> },
      { to: '/messages', label: 'Messages', icon: <FiMessageSquare /> },
      { to: '/seeker/profile', label: 'Profile', icon: <FiUser /> },
    ] : []),
    ...(user?.account_type === 'EMPLOYER' ? [
      { to: '/employer/dashboard', label: 'Dashboard', icon: <FiGrid /> },
      { to: '/employer/jobs', label: 'My Jobs', icon: <FiBriefcase /> },
      { to: '/employer/jobs/new', label: 'Post a Job', icon: <FiEdit /> },
      { to: '/messages', label: 'Messages', icon: <FiMessageSquare /> },
      { to: '/employer/profile', label: 'Company Profile', icon: <FiBriefcase /> },
    ] : []),
    ...(!user ? [
      { to: '/jobs', label: 'Find Jobs', icon: <FiSearch /> },
      { to: '/login', label: 'Sign In', icon: <FiLogIn /> },
      { to: '/register', label: 'Register', icon: <FiUserPlus /> },
    ] : []),
    { to: '/settings', label: 'Settings', icon: <FiSettings /> }
  ]

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
          <div className={styles.userInfo} onClick={handleLogout} title="Log out">
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
            <button className={styles.hamburger} onClick={toggleMobileMenu}>
              <FiMenu size={24} />
            </button>
            <div className={styles.searchContainer}>
              <span className={styles.searchIcon}><FiSearch /></span>
              <input 
                type="text" 
                placeholder="Search jobs, companies, skills..." 
                className={styles.searchInput}
              />
            </div>
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
                <div className={styles.headerAvatar}>
                  <Avatar 
                    name={user.name || user.email || 'User'} 
                    size={32}
                    round
                  />
                </div>
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
    </div>
  )
}

export function GuestLayout() {
  return (
    <div className={styles.guestLayout}>
      <div className={styles.guestCard}>
        <div className={styles.guestLogo}>
          Hirely<span className={styles.guestLogoDot}></span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
