import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
})

const STORAGE_KEY = 'urbaniq-complaints'

const seedComplaints = [
  {
    id: 'cmp-1001',
    title: 'Broken water pipe on MG Road',
    category: 'Water Supply',
    area: 'Ward 12',
    details: 'Water is leaking from the main pipe near the bus stop and flooding the lane.',
    submittedBy: 'Aarav Sharma',
    createdAt: '2026-04-08T08:15:00.000Z',
    status: 'in-progress',
  },
  {
    id: 'cmp-1002',
    title: 'Garbage not collected for 3 days',
    category: 'Garbage',
    area: 'Ward 5',
    details: 'Household waste has been piling up and the street now smells bad.',
    submittedBy: 'Neha Verma',
    createdAt: '2026-04-07T11:40:00.000Z',
    status: 'pending',
  },
  {
    id: 'cmp-1003',
    title: 'Large pothole near City Mall',
    category: 'Road Damage',
    area: 'Ward 8',
    details: 'The pothole is causing traffic slowdowns and is unsafe for two-wheelers.',
    submittedBy: 'Rohit Patel',
    createdAt: '2026-04-06T09:05:00.000Z',
    status: 'pending',
  },
  {
    id: 'cmp-1004',
    title: 'Street light not working',
    category: 'Street Lights',
    area: 'Ward 3',
    details: 'The lamp post near the park has been dark for almost a week.',
    submittedBy: 'Isha Khan',
    createdAt: '2026-04-05T18:20:00.000Z',
    status: 'resolved',
    resolvedAt: '2026-04-09T07:30:00.000Z',
  },
  {
    id: 'cmp-1005',
    title: 'Drainage overflow in market area',
    category: 'Drainage',
    area: 'Ward 15',
    details: 'Water overflow is blocking foot traffic near the vegetable market.',
    submittedBy: 'Kavya Singh',
    createdAt: '2026-04-04T13:55:00.000Z',
    status: 'pending',
  },
  {
    id: 'cmp-1006',
    title: 'Water supply disruption',
    category: 'Water Supply',
    area: 'Ward 7',
    details: 'Morning water supply has stopped for the last two days.',
    submittedBy: 'Farhan Ali',
    createdAt: '2026-04-03T07:10:00.000Z',
    status: 'resolved',
    resolvedAt: '2026-04-07T16:40:00.000Z',
  },
  {
    id: 'cmp-1007',
    title: 'Illegal dumping near school',
    category: 'Garbage',
    area: 'Ward 2',
    details: 'Construction debris is being dumped beside the school compound wall.',
    submittedBy: 'Meera Joshi',
    createdAt: '2026-04-02T15:30:00.000Z',
    status: 'in-progress',
  },
]

function cloneSeed() {
  return seedComplaints.map((complaint) => ({ ...complaint }))
}

function ensureLocalStore() {
  if (typeof window === 'undefined') {
    return cloneSeed()
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)

  if (!storedValue) {
    const initialValue = JSON.stringify(cloneSeed())
    window.localStorage.setItem(STORAGE_KEY, initialValue)
    return cloneSeed()
  }

  try {
    const parsedValue = JSON.parse(storedValue)
    return Array.isArray(parsedValue) ? parsedValue : cloneSeed()
  } catch {
    const resetValue = cloneSeed()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resetValue))
    return resetValue
  }
}

function persistComplaints(complaints) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints))
  }
}

function normalizeComplaint(complaint) {
  return {
    id: complaint.id,
    title: complaint.title,
    category: complaint.category,
    area: complaint.area,
    details: complaint.details,
    submittedBy: complaint.submittedBy,
    createdAt: complaint.createdAt,
    resolvedAt: complaint.resolvedAt ?? null,
    status: complaint.status ?? 'pending',
  }
}

function getComplaintMetrics(complaints) {
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

function groupByMonth(complaints) {
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

function groupByCategory(complaints) {
  const categoryMap = new Map()

  complaints.forEach((complaint) => {
    const currentCount = categoryMap.get(complaint.category) ?? 0
    categoryMap.set(complaint.category, currentCount + 1)
  })

  const categoryPalette = ['#2ca8a1', '#2d9bd0', '#f2ac24', '#30b27a', '#7a5ac8', '#9ca3af']

  return Array.from(categoryMap.entries()).map(([name, value], index) => ({
    name,
    value,
    fill: categoryPalette[index % categoryPalette.length],
  }))
}

export function fetchDashboardData() {
  const complaints = ensureLocalStore().map(normalizeComplaint)
  const metrics = getComplaintMetrics(complaints)

  return Promise.resolve({
    data: {
      metrics,
      monthlyTrend: groupByMonth(complaints),
      categoryBreakdown: groupByCategory(complaints),
      allComplaints: complaints,
      recentComplaints: complaints.slice(0, 6),
    },
  })
}

export function fetchComplaintsList() {
  const complaints = ensureLocalStore().map(normalizeComplaint)
  return Promise.resolve({ data: complaints })
}

export function createComplaint(payload) {
  const complaints = ensureLocalStore()
  const complaint = normalizeComplaint({
    id: `cmp-${Date.now()}`,
    title: payload.title.trim(),
    category: payload.category.trim(),
    area: payload.area.trim(),
    details: payload.details.trim(),
    submittedBy: payload.submittedBy.trim(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  })

  const nextComplaints = [complaint, ...complaints]
  persistComplaints(nextComplaints)

  return Promise.resolve({ data: complaint })
}

export function resolveComplaint(complaintId) {
  const complaints = ensureLocalStore()
  const nextComplaints = complaints.map((complaint) =>
    complaint.id === complaintId
      ? {
          ...complaint,
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
        }
      : complaint,
  )

  persistComplaints(nextComplaints)

  return Promise.resolve({
    data: nextComplaints.find((complaint) => complaint.id === complaintId) ?? null,
  })
}

export function fetchComplaintStore() {
  return Promise.resolve({ data: ensureLocalStore().map(normalizeComplaint) })
}

export default api