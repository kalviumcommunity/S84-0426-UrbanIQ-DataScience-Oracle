import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import { fetchDashboardData } from '../services/api.js'
import {
  filterByRange,
  getAlertInsights,
  getChangePct,
  getMetrics,
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

function AdminOverview() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [globalRange, setGlobalRange] = useState('all')
  const [activeTab, setActiveTab] = useState('insights')

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
          setError('Unable to load overview data.')
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
  const previousScopedComplaints = useMemo(() => {
    if (globalRange === 'all') {
      return complaints
    }

    const previousRange = globalRange === '7d' ? '30d' : 'all'
    return filterByRange(complaints, previousRange)
  }, [complaints, globalRange])

  const metrics = useMemo(() => getMetrics(scopedComplaints), [scopedComplaints])
  const previousMetrics = useMemo(() => getMetrics(previousScopedComplaints), [previousScopedComplaints])
  const chartData = useMemo(() => groupByMonth(scopedComplaints), [scopedComplaints])
  const categoryData = useMemo(() => groupByCategory(scopedComplaints), [scopedComplaints])
  const alerts = useMemo(() => getAlertInsights(scopedComplaints), [scopedComplaints])
  const topAreas = useMemo(() => getTopAreas(scopedComplaints, 4), [scopedComplaints])
  const weeklyPerformance = useMemo(() => getWeeklyPerformance(scopedComplaints), [scopedComplaints])
  const trendInsight = useMemo(() => getTrendInsight(chartData, categoryData), [categoryData, chartData])

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total Complaints',
        value: metrics.total,
        note: `${metrics.resolutionRate}% resolution rate`,
      },
      {
        label: 'Resolved',
        value: metrics.resolved,
        note: `${metrics.averageResolutionTime} avg response`,
        trend: getChangePct(metrics.resolved, previousMetrics.resolved),
      },
      {
        label: 'Pending',
        value: metrics.pending,
        note: metrics.pending ? `${metrics.inProgress} in progress` : 'All complaints resolved',
        trend: getChangePct(metrics.pending, previousMetrics.pending),
      },
      {
        label: 'Resolution Rate',
        value: `${metrics.resolutionRate}%`,
        note: 'Current operational efficiency',
      },
    ],
    [metrics, previousMetrics.pending, previousMetrics.resolved],
  )

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
            <p className="dashboard-page__eyebrow">Overview</p>
            <h1>Operations snapshot</h1>
            <p>KPI performance, complaint trend, and focused insights for quick decisions.</p>
          </div>
          <div className="dashboard-page__header-meta">
            <span>Scope</span>
            <span>{globalRanges.find((item) => item.value === globalRange)?.label}</span>
          </div>
        </div>

        <div className="dashboard-global-filter" role="group" aria-label="Overview time filter">
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

        <section className="dashboard-page__stats-grid dashboard-page__stats-grid--overview">
          {kpiCards.map((card) => {
            const trendTone = card.label === 'Pending' ? (card.trend <= 0 ? 'good' : 'bad') : card.trend >= 0 ? 'good' : 'bad'
            const trendArrow = card.label === 'Pending' ? (card.trend <= 0 ? '↓' : '↑') : card.trend >= 0 ? '↑' : '↓'

            return (
              <Card key={card.label} className="dashboard-card dashboard-card--stat">
                <p className="dashboard-label">{card.label}</p>
                <h2 className="dashboard-value">{card.value}</h2>
                <p className="dashboard-note">{card.note}</p>
                {typeof card.trend === 'number' ? (
                  <p className={`dashboard-kpi-trend dashboard-kpi-trend--${trendTone}`}>{trendArrow} {Math.abs(card.trend)}% this range</p>
                ) : null}
              </Card>
            )
          })}
        </section>

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
          <div className="dashboard-tab-header">
            <button
              type="button"
              className={`dashboard-tab${activeTab === 'insights' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </button>
            <button
              type="button"
              className={`dashboard-tab${activeTab === 'areas' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('areas')}
            >
              Areas
            </button>
            <button
              type="button"
              className={`dashboard-tab${activeTab === 'performance' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
          </div>

          {activeTab === 'insights' ? (
            <ul className="dashboard-alert-list">
              {alerts.map((alert) => (
                <li key={alert.id} className={`dashboard-alert-item dashboard-alert-item--${alert.tone}`}>
                  <span className="dashboard-alert-item__icon">{alert.tone === 'warning' ? '⚠️' : '✅'}</span>
                  <span>{alert.text}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {activeTab === 'areas' ? (
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
          ) : null}

          {activeTab === 'performance' ? (
            <div className="dashboard-performance-grid">
              <p>Resolved this week: <strong>{weeklyPerformance.resolvedDelta >= 0 ? '+' : ''}{weeklyPerformance.resolvedDelta}%</strong></p>
              <p>Pending delta: <strong>{weeklyPerformance.pendingDelta > 0 ? '+' : ''}{weeklyPerformance.pendingDelta}%</strong></p>
              <p>Average response time: <strong>{metrics.averageResolutionTime}</strong></p>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

export default AdminOverview