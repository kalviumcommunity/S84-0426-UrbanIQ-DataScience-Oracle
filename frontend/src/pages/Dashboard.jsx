import Card from '../components/ui/Card.jsx'
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
import './dashboard.css'

const summaryCards = [
  {
    label: 'Total Complaints',
    value: '1,284',
    note: '+12% from last month',
    type: 'complaints',
  },
  {
    label: 'Resolved',
    value: '847',
    note: '66% resolution rate',
    type: 'resolved',
  },
  {
    label: 'Pending',
    value: '312',
    note: '24% of total',
    type: 'pending',
  },
  {
    label: 'Avg. Resolution Time',
    value: '3.2 days',
    note: '-0.5 days improvement',
    type: 'time',
  },
]

const lineData = [
  { month: 'Jan', value: 65 },
  { month: 'Feb', value: 78 },
  { month: 'Mar', value: 120 },
  { month: 'Apr', value: 95 },
  { month: 'May', value: 110 },
  { month: 'Jun', value: 140 },
  { month: 'Jul', value: 132 },
  { month: 'Aug', value: 158 },
  { month: 'Sep', value: 126 },
  { month: 'Oct', value: 108 },
  { month: 'Nov', value: 99 },
  { month: 'Dec', value: 162 },
]

const pieData = [
  { name: 'Water Supply', value: 25, fill: '#2ca8a1' },
  { name: 'Garbage', value: 22, fill: '#2d9bd0' },
  { name: 'Road Damage', value: 18, fill: '#f2ac24' },
  { name: 'Drainage', value: 14, fill: '#30b27a' },
  { name: 'Street Lights', value: 11, fill: '#7a5ac8' },
  { name: 'Others', value: 10, fill: '#9ca3af' },
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

function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page__container">
      <div className="dashboard-page__header">
        <h1>Dashboard</h1>
        <p>Overview of municipal grievance analytics</p>
      </div>

      <section className="dashboard-page__stats-grid">
        {summaryCards.map((card) => (
          <Card key={card.label} className="dashboard-card dashboard-card--stat">
            <div className={`dashboard-card__icon dashboard-card__icon--${card.type}`}>
              <StatIcon type={card.type} />
            </div>
            <p className="dashboard-label">{card.label}</p>
            <h2 className="dashboard-value">{card.value}</h2>
            <p className="dashboard-note">{card.note}</p>
          </Card>
        ))}
      </section>

      <div className="dashboard-page__charts-grid">
        <Card className="dashboard-card dashboard-card--section">
          <div className="dashboard-section-header">
            <h2>Complaints Over Time</h2>
            <p>Monthly complaint trends for the current year</p>
          </div>
          <div className="dashboard-chart-wrap dashboard-chart-wrap--line">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 10, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 170]} />
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
            <p>Distribution by category</p>
          </div>
          <div className="dashboard-chart-wrap dashboard-chart-wrap--pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
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
      </div>
    </div>
  )
}

export default Dashboard