import {
  CartesianGrid,
  Cell,
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
import { useEffect, useState } from 'react'
import { fetchDashboardData } from '../services/api.js'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import './dashboard.css'

const pieColors = ['#0B2E33', '#4F7C82', '#7FA7AC', '#B8E3E9']

const emptyDashboard = {
  summaryCards: [],
  complaintsTrend: [],
  complaintCategories: [],
  recentComplaints: [],
}

function normalizeDashboardData(data) {
  return {
    summaryCards:
      data?.summaryCards ?? data?.summary ?? [
        { label: 'Total complaints', value: 0 },
        { label: 'Resolved complaints', value: 0 },
        { label: 'Pending complaints', value: 0 },
      ],
    complaintsTrend: data?.complaintsTrend ?? data?.trend ?? [],
    complaintCategories: data?.complaintCategories ?? data?.categories ?? [],
    recentComplaints: data?.recentComplaints ?? data?.complaints ?? [],
  }
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      try {
        setIsLoading(true)
        const response = await fetchDashboardData()

        if (isMounted) {
          setDashboardData(normalizeDashboardData(response.data))
          setError('')
        }
      } catch {
        if (isMounted) {
          setError('Unable to load dashboard data.')
          setDashboardData(emptyDashboard)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="dashboard dashboard__state">
        <Loader />
      </div>
    )
  }

  const summaryCards = dashboardData?.summaryCards ?? emptyDashboard.summaryCards
  const complaintsTrend = dashboardData?.complaintsTrend ?? emptyDashboard.complaintsTrend
  const complaintCategories = dashboardData?.complaintCategories ?? emptyDashboard.complaintCategories
  const recentComplaints = dashboardData?.recentComplaints ?? emptyDashboard.recentComplaints

  return (
    <div className="dashboard">
      {error ? <div className="dashboard__error">{error}</div> : null}

      <section className="dashboard__summary">
        {summaryCards.map((card) => (
          <Card key={card.label} className="dashboard__summary-card">
            <p className="dashboard__label">{card.label}</p>
            <div className="dashboard__value">{card.value}</div>
          </Card>
        ))}
      </section>

      <section className="dashboard__grid">
        <Card>
          <div className="dashboard__section-header">
            <h1>Charts</h1>
            <p>Static trend and category views using mock data.</p>
          </div>
          <div className="dashboard__charts">
            <div className="dashboard__chart-card">
              <h2>Complaints over time</h2>
              <div className="dashboard__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={complaintsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(11, 46, 51, 0.12)" />
                    <XAxis dataKey="month" stroke="#5d767a" />
                    <YAxis stroke="#5d767a" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="complaints"
                      stroke="#4F7C82"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0B2E33' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard__chart-card">
              <h2>Complaint categories</h2>
              <div className="dashboard__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complaintCategories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={44}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {complaintCategories.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="dashboard__section-header">
            <h1>Recent Complaints</h1>
            <p>Static table shell for the latest complaint entries.</p>
          </div>
          <div className="dashboard__table-shell">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Area</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.length > 0 ? (
                  recentComplaints.map((complaint) => (
                    <tr key={complaint.id ?? complaint.title}>
                      <td>{complaint.title ?? '-'}</td>
                      <td>{complaint.category ?? '-'}</td>
                      <td>{complaint.area ?? '-'}</td>
                      <td>{complaint.status ?? '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No complaint data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard