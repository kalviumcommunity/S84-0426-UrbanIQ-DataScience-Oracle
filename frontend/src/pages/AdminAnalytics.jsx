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
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import { fetchDashboardData } from '../services/api.js'
import {
  filterByRange,
  getAlertInsights,
  getTopAreas,
  getTrendInsight,
  getWeeklyPerformance,
  groupByCategory,
  groupByMonth,
} from './adminUtils.js'
import './dashboard.css'

const globalRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
]

function AdminAnalytics() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [globalRange, setGlobalRange] = useState('all')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const response = await fetchDashboardData()

        if (isMounted) {
          setDashboard(response.data)
          setError('')
        }
      } catch {
        if (isMounted) {
          setError('Unable to load analytics data.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const complaints = useMemo(() => dashboard?.allComplaints ?? [], [dashboard])
  const scopedComplaints = useMemo(() => filterByRange(complaints, globalRange), [complaints, globalRange])
  const chartData = useMemo(() => groupByMonth(scopedComplaints), [scopedComplaints])
  const categoryData = useMemo(() => groupByCategory(scopedComplaints), [scopedComplaints])
  const topAreas = useMemo(() => getTopAreas(scopedComplaints, 6), [scopedComplaints])
  const trendInsight = useMemo(() => getTrendInsight(chartData, categoryData), [categoryData, chartData])
  const weeklyPerformance = useMemo(() => getWeeklyPerformance(scopedComplaints), [scopedComplaints])
  const alerts = useMemo(() => getAlertInsights(scopedComplaints), [scopedComplaints])

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
            <p className="dashboard-page__eyebrow">Analytics</p>
            <h1>Deep complaint analytics</h1>
            <p>Review trends, distribution, hotspots, and operational insight in one place.</p>
          </div>
        </div>

        <div className="dashboard-global-filter" role="group" aria-label="Analytics time filter">
          {globalRanges.map((range) => (
            <button
              key={range.value}
              type="button"
              className={`dashboard-global-filter__item${globalRange === range.value ? ' is-active' : ''}`}
              onClick={() => setGlobalRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="dashboard-page__charts-grid">
          <Card className="dashboard-card dashboard-card--section">
            <div className="dashboard-section-header">
              <h2>Complaints Over Time</h2>
              <p>{trendInsight.peak}</p>
            </div>
            <div className="dashboard-chart-wrap dashboard-chart-wrap--line">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 6 }}>
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
            <p className="dashboard-chart-context">{trendInsight.context}</p>
          </Card>

          <Card className="dashboard-card dashboard-card--section">
            <div className="dashboard-section-header">
              <h2>Category Distribution</h2>
              <p>Current complaint spread by category.</p>
            </div>
            <div className="dashboard-chart-wrap dashboard-chart-wrap--pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
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

        <div className="dashboard-page__insights-grid">
          <Card className="dashboard-card dashboard-card--insight">
            <div className="dashboard-section-header">
              <h2>Top Areas</h2>
            </div>
            <ul className="dashboard-hotspot-list">
              {topAreas.map((item) => (
                <li key={item.area}>
                  <div className="dashboard-hotspot-list__meta">
                    <span>{item.area}</span>
                    <strong>{item.count} complaints</strong>
                  </div>
                  <div className="dashboard-hotspot-list__bar-track">
                    <div className="dashboard-hotspot-list__bar-fill" style={{ width: `${Math.max((item.count / (topAreas[0]?.count ?? 1)) * 100, 8)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="dashboard-card dashboard-card--insight">
            <div className="dashboard-section-header">
              <h2>Weekly Performance</h2>
            </div>
            <div className="dashboard-performance-grid">
              <p>Resolved this week: <strong>{weeklyPerformance.resolvedDelta >= 0 ? '+' : ''}{weeklyPerformance.resolvedDelta}%</strong></p>
              <p>Pending delta: <strong>{weeklyPerformance.pendingDelta > 0 ? '+' : ''}{weeklyPerformance.pendingDelta}%</strong></p>
            </div>
          </Card>

          <Card className="dashboard-card dashboard-card--insight">
            <div className="dashboard-section-header">
              <h2>Insights Text</h2>
            </div>
            <ul className="dashboard-alert-list">
              {alerts.map((alert) => (
                <li key={alert.id} className={`dashboard-alert-item dashboard-alert-item--${alert.tone}`}>
                  <span className="dashboard-alert-item__icon">{alert.tone === 'warning' ? '⚠️' : '✅'}</span>
                  <span>{alert.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics