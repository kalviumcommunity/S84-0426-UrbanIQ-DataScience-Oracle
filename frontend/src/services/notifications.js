const NOTIFICATION_READ_KEY = 'urbaniq-notification-read-state'

function readJson(key, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  const value = window.localStorage.getItem(key)

  if (!value) {
    return fallbackValue
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallbackValue
  }
}

function writeJson(key, value) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

function toTimestamp(value) {
  const date = new Date(value)
  const time = date.getTime()
  return Number.isNaN(time) ? 0 : time
}

function getStageMessage(stage, complaint, role) {
  const title = complaint.title || 'Complaint update'

  if (stage === 'submitted') {
    if (role === 'admin') {
      return `New complaint reported: ${title}`
    }

    return `Your complaint has been submitted: ${title}`
  }

  if (stage === 'under-review') {
    if (role === 'admin') {
      return `Complaint moved to review: ${title}`
    }

    return `Your complaint is under review: ${title}`
  }

  if (stage === 'in-progress') {
    return `Work has started on complaint: ${title}`
  }

  if (stage === 'resolved') {
    return `Complaint resolved: ${title}`
  }

  return `Update on complaint: ${title}`
}

function getStageLabel(stage) {
  if (stage === 'submitted') {
    return 'Submitted'
  }

  if (stage === 'under-review') {
    return 'Under Review'
  }

  if (stage === 'in-progress') {
    return 'In Progress'
  }

  if (stage === 'resolved') {
    return 'Resolved'
  }

  return 'Updated'
}

function getDefaultHistory(complaint) {
  const history = [
    { stage: 'submitted', at: complaint.createdAt },
    { stage: 'under-review', at: complaint.createdAt },
  ]

  if (complaint.status === 'in-progress' || complaint.status === 'resolved') {
    history.push({ stage: 'in-progress', at: complaint.createdAt })
  }

  if (complaint.status === 'resolved') {
    history.push({ stage: 'resolved', at: complaint.resolvedAt || complaint.createdAt })
  }

  return history
}

function getHistory(complaint) {
  if (Array.isArray(complaint.statusHistory) && complaint.statusHistory.length) {
    return complaint.statusHistory
  }

  return getDefaultHistory(complaint)
}

export function getNotificationUserKey(user) {
  if (user?.email) {
    return String(user.email).toLowerCase()
  }

  if (user?.role) {
    return `role:${user.role}`
  }

  return 'guest'
}

export function getReadNotificationIds(user) {
  const allReadState = readJson(NOTIFICATION_READ_KEY, {})
  const userKey = getNotificationUserKey(user)
  const userState = allReadState?.[userKey]

  return Array.isArray(userState) ? userState : []
}

export function markNotificationRead(user, notificationId) {
  const userKey = getNotificationUserKey(user)
  const allReadState = readJson(NOTIFICATION_READ_KEY, {})
  const current = Array.isArray(allReadState?.[userKey]) ? allReadState[userKey] : []

  if (current.includes(notificationId)) {
    return current
  }

  const next = [...current, notificationId]
  writeJson(NOTIFICATION_READ_KEY, {
    ...allReadState,
    [userKey]: next,
  })

  return next
}

export function markNotificationsRead(user, notificationIds) {
  const userKey = getNotificationUserKey(user)
  const allReadState = readJson(NOTIFICATION_READ_KEY, {})
  const current = Array.isArray(allReadState?.[userKey]) ? allReadState[userKey] : []
  const next = Array.from(new Set([...current, ...notificationIds]))

  writeJson(NOTIFICATION_READ_KEY, {
    ...allReadState,
    [userKey]: next,
  })

  return next
}

export function buildNotificationsFromComplaints({ complaints, role }) {
  const notifications = []

  complaints.forEach((complaint) => {
    const history = getHistory(complaint)

    history.forEach((entry) => {
      if (!entry?.stage) {
        return
      }

      const timestamp = entry.at || complaint.createdAt
      notifications.push({
        id: `${complaint.id}-${entry.stage}`,
        complaintId: complaint.id,
        title: getStageLabel(entry.stage),
        message: getStageMessage(entry.stage, complaint, role),
        timestamp,
        area: complaint.area || 'Unknown area',
        category: complaint.category || 'Other',
        stage: entry.stage,
      })
    })
  })

  const byId = new Map()
  notifications.forEach((notification) => {
    byId.set(notification.id, notification)
  })

  return Array.from(byId.values()).sort((a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp))
}

export function getUnreadCount(notifications, readIds) {
  const readSet = new Set(readIds)
  return notifications.filter((item) => !readSet.has(item.id)).length
}
