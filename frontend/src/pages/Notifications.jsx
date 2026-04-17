import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import { fetchComplaintsList } from '../services/api.js'
import { getSession } from '../services/auth.js'
import {
  buildNotificationsFromComplaints,
  getReadNotificationIds,
  markNotificationRead,
  markNotificationsRead,
} from '../services/notifications.js'
import './notifications.css'

const filterTabs = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

function formatTimestamp(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function Notifications() {
  const session = getSession()
  const user = session?.user ?? null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadNotifications() {
      try {
        setLoading(true)
        const response = await fetchComplaintsList()
        const list = buildNotificationsFromComplaints({
          complaints: response.data ?? [],
          role: user?.role,
        })

        if (isMounted) {
          setNotifications(list)
          setReadIds(getReadNotificationIds(user))
          setError('')
        }
      } catch {
        if (isMounted) {
          setNotifications([])
          setError('Unable to load notifications right now.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadNotifications()

    return () => {
      isMounted = false
    }
  }, [user?.role, user?.email])

  const summary = useMemo(() => {
    const readSet = new Set(readIds)
    const total = notifications.length
    const unread = notifications.filter((item) => !readSet.has(item.id)).length
    const read = total - unread

    return { total, unread, read }
  }, [notifications, readIds])

  const filteredNotifications = useMemo(() => {
    const readSet = new Set(readIds)

    if (activeFilter === 'unread') {
      return notifications.filter((item) => !readSet.has(item.id))
    }

    if (activeFilter === 'read') {
      return notifications.filter((item) => readSet.has(item.id))
    }

    return notifications
  }, [activeFilter, notifications, readIds])

  function handleMarkAsRead(notificationId) {
    const nextReadIds = markNotificationRead(user, notificationId)
    setReadIds(nextReadIds)
    setMessage('Notification marked as read.')
  }

  function handleMarkAllAsRead() {
    const unreadIds = filteredNotifications
      .filter((item) => !readIds.includes(item.id))
      .map((item) => item.id)

    if (!unreadIds.length) {
      setMessage('No unread notifications in this view.')
      return
    }

    const nextReadIds = markNotificationsRead(user, unreadIds)
    setReadIds(nextReadIds)
    setMessage(`${unreadIds.length} notifications marked as read.`)
  }

  if (loading) {
    return (
      <div className="notifications-page notifications-page__state">
        <Loader />
      </div>
    )
  }

  if (error) {
    return <div className="notifications-page__error">{error}</div>
  }

  return (
    <div className="notifications-page">
      <header className="notifications-page__header">
        <div>
          <p className="notifications-page__eyebrow">Updates</p>
          <h1>Notification Center</h1>
          <p>Track complaint activity and stay up to date on workflow changes.</p>
        </div>
        <Button className="notifications-page__mark-all" onClick={handleMarkAllAsRead}>Mark all as read</Button>
      </header>

      <section className="notifications-page__stats-grid">
        <Card className="notifications-page__stat-card">
          <p className="notifications-page__stat-label">Total</p>
          <p className="notifications-page__stat-value">{summary.total}</p>
        </Card>
        <Card className="notifications-page__stat-card">
          <p className="notifications-page__stat-label">Unread</p>
          <p className="notifications-page__stat-value">{summary.unread}</p>
        </Card>
        <Card className="notifications-page__stat-card">
          <p className="notifications-page__stat-label">Read</p>
          <p className="notifications-page__stat-value">{summary.read}</p>
        </Card>
      </section>

      <section className="notifications-page__filter-bar" aria-label="Notification filters">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`notifications-page__filter-btn${activeFilter === tab.value ? ' is-active' : ''}`}
            onClick={() => setActiveFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {message ? <p className="notifications-page__message">{message}</p> : null}

      <Card className="notifications-page__feed-card">
        {filteredNotifications.length ? (
          <ul className="notifications-page__feed" role="list">
            {filteredNotifications.map((item) => {
              const isRead = readIds.includes(item.id)

              return (
                <li key={item.id} className={`notifications-page__item${isRead ? ' is-read' : ' is-unread'}`}>
                  <div className="notifications-page__item-main">
                    <div className="notifications-page__item-top">
                      <span className="notifications-page__item-title">{item.title}</span>
                      <span className={`notifications-page__pill notifications-page__pill--${item.stage}`}>{item.stage.replace('-', ' ')}</span>
                    </div>
                    <p className="notifications-page__item-message">{item.message}</p>
                    <p className="notifications-page__item-meta">
                      {item.area} • {item.category} • {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                  {!isRead ? (
                    <Button className="notifications-page__item-action" onClick={() => handleMarkAsRead(item.id)}>
                      Mark read
                    </Button>
                  ) : (
                    <span className="notifications-page__read-label">Read</span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="notifications-page__empty-state">
            <h2>No notifications in this filter</h2>
            <p>Try a different filter or check back after new complaint activity.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Notifications
