import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import { fetchDashboardData, resolveComplaint, removeComplaint } from '../services/api.js'
import './dashboard.css'

const statDefinitions = [
  {
    label: 'Total Complaints',
    type: 'complaints',
    resolveValue: (metrics) => metrics.total.toLocaleString(),
    resolveNote: (metrics) => `${metrics.resolutionRate}% of cases resolved`,
  },
  {
    label: 'Resolved',
    type: 'resolved',
    resolveValue: (metrics) => metrics.resolved.toLocaleString(),
    resolveNote: (metrics) => `${metrics.averageResolutionTime} average resolution time`,
  },
  {
    label: 'Pending',
    type: 'pending',
    resolveValue: (metrics) => metrics.pending.toLocaleString(),
    resolveNote: (metrics) => `${metrics.inProgress} in progress`,
  },
  {
    label: 'Resolution Rate',
    type: 'time',
    resolveValue: (metrics) => `${metrics.resolutionRate}%`,
    resolveNote: () => 'Shared complaint store',
  },
]

function StatIcon({ type }) {
  if (type === 'resolved') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 10.4l2.1 2.1L13 8.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'pending') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 6.6v3.8l2.4 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'time') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 13.7l3.3-3.4 2.5 2.1 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.8 5h-.1m0 0v3m0-3h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="10" height="14" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 7h4M8 10h4M8 13h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function getStatusLabel(status) {
  if (status === 'resolved') {
    return 'Resolved'
  }

  if (status === 'in-progress') {
    return 'In progress'
  }

  return 'Pending'
}

function getRelativeDate(dateValue) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resolvingId, setResolvingId] = useState('')
  const [removingId, setRemovingId] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        setLoading(true)
        const response = await fetchDashboardData()

        if (isMounted) {
          setDashboard(response.data)
          setError('')
        }
      } catch {
        if (isMounted) {
          setError('Unable to load dashboard data.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const complaints = useMemo(() => dashboard?.allComplaints ?? [], [dashboard])

  async function handleResolve(complaintId) {
    try {
      setResolvingId(complaintId)
      await resolveComplaint(complaintId)
      const response = await fetchDashboardData()
      setDashboard(response.data)
    } finally {
      setResolvingId('')
    }
  }

  async function handleRemove(complaintId) {
    if (!window.confirm('Are you sure you want to remove this complaint?')) {
      return
    }

    try {
      setRemovingId(complaintId)
      await removeComplaint(complaintId)
      const response = await fetchDashboardData()
      setDashboard(response.data)
    } finally {
      setRemovingId('')
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page dashboard-page__state">
        <Loader />
      </div>
    )
  }

  if (error) {
    return <div className="dashboard-page__error">{error}</div>
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__container">
        <div className="dashboard-page__header">
          <div>
            <p className="dashboard-page__eyebrow">Admin dashboard</p>
            <h1>Complaint operations center</h1>
            <p>Track unresolved issues and mark them resolved once the field work is complete.</p>
          </div>
          <div className="dashboard-page__header-meta">
            <span>Live complaint store</span>
            <span>{dashboard.metrics.total} records</span>
          </div>
        </div>

        <section className="dashboard-page__stats-grid">
          {statDefinitions.map((stat) => {
            const value = stat.resolveValue(dashboard.metrics)
            const note = stat.resolveNote(dashboard.metrics)

            return (
              <Card key={stat.label} className="dashboard-card dashboard-card--stat">
                <div className={`dashboard-card__icon dashboard-card__icon--${stat.type}`}>
                  <StatIcon type={stat.type} />
                </div>
                <p className="dashboard-label">{stat.label}</p>
                <h2 className="dashboard-value">{value}</h2>
                <p className="dashboard-note">{note}</p>
              </Card>
            )
          })}
        </section>

        <div className="dashboard-page__charts-grid">
          <Card className="dashboard-card dashboard-card--section">
            <div className="dashboard-section-header">
              <h2>Complaints Over Time</h2>
              <p>Monthly complaint intake from the shared complaint store.</p>
            </div>
            <div className="dashboard-chart-wrap dashboard-chart-wrap--line">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.monthlyTrend} margin={{ top: 8, right: 10, left: 0, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 1']} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb' }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2ca8a1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2ca8a1', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="dashboard-card dashboard-card--section">
            <div className="dashboard-section-header">
              <h2>Complaint Categories</h2>
              <p>Current distribution by service area.</p>
            </div>
            <div className="dashboard-chart-wrap dashboard-chart-wrap--pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard.categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={110}
                    paddingAngle={2}
                    cx="50%"
                    cy="44%"
                  />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="dashboard-card dashboard-card--table">
          <div className="dashboard-section-header dashboard-section-header--row">
            <div>
              <h2>Active Complaint Queue</h2>
              <p>Resolve items here once the field team confirms completion.</p>
            </div>
            <span className="dashboard-queue-count">{complaints.length} items</span>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Area</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>
                      <strong>{complaint.title}</strong>
                      <p>{complaint.details}</p>
                    </td>
                    <td>{complaint.area}</td>
                    <td>{getRelativeDate(complaint.createdAt)}</td>
                    <td>
                      <span className={`dashboard-status dashboard-status--${complaint.status}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                    </td>
                    <td>
                      <div className="dashboard-action-group">
                        <Button
                          className="dashboard-resolve-button"
                          onClick={() => handleResolve(complaint.id)}
                          disabled={complaint.status === 'resolved' || resolvingId === complaint.id || removingId === complaint.id}
                        >
                          {complaint.status === 'resolved'
                            ? 'Resolved'
                            : resolvingId === complaint.id
                              ? 'Updating...'
                              : 'Mark resolved'}
                        </Button>
                        <Button
                          className="dashboard-remove-button"
                          onClick={() => handleRemove(complaint.id)}
                          disabled={resolvingId === complaint.id || removingId === complaint.id}
                          aria-label={`Remove ${complaint.title}`}
                        >
                          {removingId === complaint.id
                            ? 'Removing...'
                            : 'Remove'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard