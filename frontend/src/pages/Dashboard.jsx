import Card from '../components/ui/Card.jsx'
import './dashboard.css'
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

const summaryCards = [
  { label: 'Total complaints', value: '1,240' },
  { label: 'Resolved complaints', value: '980' },
  { label: 'Pending complaints', value: '260' },
]

const complaintsTrend = [
  { month: 'Jan', complaints: 120 },
  { month: 'Feb', complaints: 180 },
  { month: 'Mar', complaints: 155 },
  { month: 'Apr', complaints: 210 },
  { month: 'May', complaints: 190 },
  { month: 'Jun', complaints: 230 },
]

const complaintCategories = [
  { name: 'Roads', value: 35 },
  { name: 'Water', value: 25 },
  { name: 'Waste', value: 20 },
  { name: 'Lighting', value: 20 },
]

const pieColors = ['#0B2E33', '#4F7C82', '#7FA7AC', '#B8E3E9']

function Dashboard() {
  return (
    <div className="dashboard">
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
                <tr>
                  <td colSpan="4">No complaint data yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard