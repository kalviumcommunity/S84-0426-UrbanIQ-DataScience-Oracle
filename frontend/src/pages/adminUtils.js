export const timelineStages = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under-review', label: 'Under Review' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
]

export function getRelativeDate(dateValue) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function getStatusLabel(status) {
  if (status === 'resolved') {
    return '🟢 Resolved'
  }

  if (status === 'in-progress') {
    return '🔵 In Progress'
  }

  return '🟡 Pending'
}

export function getPriorityLabel(priority) {
  if (priority === 'high') {
    return 'High'
  }

  if (priority === 'low') {
    return 'Low'
  }

  return 'Medium'
}

export function getStartOfWeek(dateValue) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const normalized = new Date(date)
  const day = (normalized.getDay() + 6) % 7
  normalized.setHours(0, 0, 0, 0)
  normalized.setDate(normalized.getDate() - day)
  return normalized
}

export function getTimelineData(complaint) {
  const history = new Map((complaint.statusHistory ?? []).map((entry) => [entry.stage, entry.at]))
  const currentStage = complaint.status === 'resolved' ? 'resolved' : complaint.status === 'in-progress' ? 'in-progress' : 'under-review'
  const currentIndex = timelineStages.findIndex((stage) => stage.key === currentStage)

  return timelineStages.map((stage, index) => ({
    ...stage,
    completed: index < currentIndex,
    active: index === currentIndex,
    at: history.get(stage.key) ?? null,
  }))
}

export function getDateThreshold(range) {
  if (range === 'all') {
    return null
  }

  const now = new Date()
  const threshold = new Date(now)

  if (range === '7d') {
    threshold.setDate(now.getDate() - 7)
    return threshold
  }

  if (range === '30d') {
    threshold.setDate(now.getDate() - 30)
    return threshold
  }

  return null
}

export function filterByRange(complaints, range) {
  const threshold = getDateThreshold(range)

  if (!threshold) {
    return complaints
  }

  return complaints.filter((complaint) => {
    const createdAt = new Date(complaint.createdAt)
    return createdAt >= threshold
  })
}

export function getMetrics(complaints) {
  const total = complaints.length
  const resolved = complaints.filter((complaint) => complaint.status === 'resolved').length
  const pending = complaints.filter((complaint) => complaint.status === 'pending').length
  const inProgress = complaints.filter((complaint) => complaint.status === 'in-progress').length
  const averageResolutionTime = resolved
    ? `${(
        complaints.reduce((accumulator, complaint) => {
          if (!complaint.resolvedAt) {
            return accumulator
          }

          const openedAt = new Date(complaint.createdAt).getTime()
          const closedAt = new Date(complaint.resolvedAt).getTime()
          return accumulator + Math.max(closedAt - openedAt, 0)
        }, 0) / resolved / (1000 * 60 * 60 * 24)
      ).toFixed(1)} days`
    : '0.0 days'

  return {
    total,
    resolved,
    pending,
    inProgress,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    averageResolutionTime,
  }
}

export function groupByMonth(complaints) {
  const counts = Array.from({ length: 12 }, (_, index) => ({
    month: new Date(2026, index, 1).toLocaleString('en-US', { month: 'short' }),
    value: 0,
  }))

  complaints.forEach((complaint) => {
    const createdAt = new Date(complaint.createdAt)

    if (!Number.isNaN(createdAt.getTime())) {
      counts[createdAt.getMonth()].value += 1
    }
  })

  return counts
}

export function groupByCategory(complaints) {
  const categoryMap = new Map()

  complaints.forEach((complaint) => {
    categoryMap.set(complaint.category, (categoryMap.get(complaint.category) ?? 0) + 1)
  })

  const categoryPalette = ['#2ca8a1', '#2d9bd0', '#f2ac24', '#30b27a', '#7a5ac8', '#9ca3af']

  return Array.from(categoryMap.entries()).map(([name, value], index) => ({
    name,
    value,
    fill: categoryPalette[index % categoryPalette.length],
  }))
}

export function getTopAreas(complaints, limit = 5) {
  const areaMap = new Map()

  complaints.forEach((complaint) => {
    areaMap.set(complaint.area, (areaMap.get(complaint.area) ?? 0) + 1)
  })

  return Array.from(areaMap.entries())
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function getWeeklyPerformance(complaints) {
  const weekStart = getStartOfWeek(new Date())
  const prevWeekStart = weekStart ? new Date(weekStart) : null

  if (prevWeekStart) {
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  }

  const resolvedThisWeek = complaints.filter((complaint) => {
    const resolvedAt = complaint.resolvedAt ? new Date(complaint.resolvedAt) : null
    return resolvedAt && weekStart && resolvedAt >= weekStart
  }).length

  const resolvedPrevWeek = complaints.filter((complaint) => {
    const resolvedAt = complaint.resolvedAt ? new Date(complaint.resolvedAt) : null
    return resolvedAt && weekStart && prevWeekStart && resolvedAt >= prevWeekStart && resolvedAt < weekStart
  }).length

  const pendingThisWeek = complaints.filter((complaint) => complaint.status === 'pending').length
  const pendingPrevWeek = complaints.filter((complaint) => {
    const createdAt = new Date(complaint.createdAt)
    return complaint.status === 'pending' && weekStart && prevWeekStart && createdAt >= prevWeekStart && createdAt < weekStart
  }).length

  const resolvedDelta = resolvedPrevWeek
    ? Math.round(((resolvedThisWeek - resolvedPrevWeek) / resolvedPrevWeek) * 100)
    : resolvedThisWeek > 0
      ? 100
      : 0
  const pendingDelta = pendingPrevWeek
    ? Math.round(((pendingThisWeek - pendingPrevWeek) / pendingPrevWeek) * 100)
    : pendingThisWeek > 0
      ? 100
      : 0

  return {
    resolvedDelta,
    pendingDelta,
  }
}

export function getAlertInsights(complaints) {
  const weekStart = getStartOfWeek(new Date())
  const prevWeekStart = weekStart ? new Date(weekStart) : null

  if (prevWeekStart) {
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  }

  const garbageThisWeek = complaints.filter((complaint) => {
    const createdAt = new Date(complaint.createdAt)
    return complaint.category === 'Garbage' && weekStart && createdAt >= weekStart
  }).length

  const garbagePrevWeek = complaints.filter((complaint) => {
    const createdAt = new Date(complaint.createdAt)
    return complaint.category === 'Garbage' && weekStart && prevWeekStart && createdAt >= prevWeekStart && createdAt < weekStart
  }).length

  const garbageGrowth = garbagePrevWeek
    ? Math.round(((garbageThisWeek - garbagePrevWeek) / garbagePrevWeek) * 100)
    : garbageThisWeek > 0
      ? 100
      : 0

  const pendingByArea = new Map()
  complaints.forEach((complaint) => {
    if (complaint.status !== 'pending') {
      return
    }
    pendingByArea.set(complaint.area, (pendingByArea.get(complaint.area) ?? 0) + 1)
  })

  const highestPendingArea = Array.from(pendingByArea.entries()).sort((a, b) => b[1] - a[1])[0]

  return [
    {
      id: 'garbage-growth',
      tone: garbageGrowth > 0 ? 'warning' : 'good',
      text: `${garbageGrowth > 0 ? 'Garbage complaints increased' : 'Garbage complaints stabilized'} by ${Math.abs(garbageGrowth)}% this week`,
    },
    {
      id: 'pending-cluster',
      tone: highestPendingArea ? 'warning' : 'good',
      text: highestPendingArea
        ? `${highestPendingArea[0]} has highest pending issues (${highestPendingArea[1]})`
        : 'No pending concentration detected',
    },
  ]
}

export function getTrendInsight(chartData, categoryData) {
  const nonZero = chartData.filter((item) => item.value > 0)

  if (!nonZero.length) {
    return {
      peak: 'No significant complaint peaks yet',
      trend: 'Trend will appear once more records are submitted',
      context: 'Context appears once enough historical data is available',
    }
  }

  const peak = nonZero.reduce((max, current) => (current.value > max.value ? current : max), nonZero[0])
  const latest = nonZero[nonZero.length - 1]
  const previous = nonZero.length > 1 ? nonZero[nonZero.length - 2] : latest
  const isDeclining = latest.value < previous.value
  const topCategory = categoryData[0]?.name ?? 'public service'

  return {
    peak: `Peak complaints in ${peak.month} (${peak.value})`,
    trend: isDeclining ? 'Declining trend after previous month' : 'Volume still rising month over month',
    context: `Peak in ${peak.month} due to ${topCategory.toLowerCase()} issues`,
  }
}

export function getChangePct(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }

  return Math.round(((current - previous) / previous) * 100)
 }
