import Card from '../components/ui/Card.jsx'
import './dashboard.css'

const summaryCards = [
  { label: 'Total Complaints', value: '1,245' },
  { label: 'Resolved Complaints', value: '980' },
  { label: 'Pending Complaints', value: '265' },
]

const recentComplaints = [
  { title: 'Water leakage near main road', category: 'Water', area: 'Zone A', status: 'Open' },
  { title: 'Broken streetlight on Elm Street', category: 'Lighting', area: 'Zone C', status: 'Pending' },
  { title: 'Garbage not collected', category: 'Waste', area: 'Zone B', status: 'Resolved' },
  { title: 'Damaged road patch', category: 'Roads', area: 'Zone D', status: 'Open' },
]

function ChartPlaceholder() {
  return (
    <div className="dashboard-placeholder">
      Chart will appear here
    </div>
  )
}

function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page__container">
      <section className="dashboard-page__stats-grid">
        {summaryCards.map((card) => (
          <Card key={card.label} className="dashboard-card dashboard-card--stat">
            <p className="dashboard-label">{card.label}</p>
            <h2 className="dashboard-value">{card.value}</h2>
          </Card>
        ))}
      </section>

      <Card className="dashboard-card dashboard-card--section">
        <div className="dashboard-section-header">
          <h2>Analytics Overview</h2>
          <p>Dashboard insights and trends.</p>
        </div>

        <div className="dashboard-page__charts-grid">
          <div className="dashboard-chart-card">
            <h3>Complaints over time</h3>
            <ChartPlaceholder />
          </div>

          <div className="dashboard-chart-card">
            <h3>Complaint categories</h3>
            <ChartPlaceholder />
          </div>
        </div>
      </Card>

      <Card className="dashboard-card dashboard-card--section">
        <div className="dashboard-section-header">
          <h2>Recent Complaints</h2>
          <p>Latest records across the city network.</p>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Area</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentComplaints.map((complaint) => {
                const statusClass =
                  complaint.status === 'Resolved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : complaint.status === 'Pending'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-sky-50 text-sky-700'

                return (
                  <tr key={complaint.title}>
                    <td>{complaint.title}</td>
                    <td>{complaint.category}</td>
                    <td>{complaint.area}</td>
                    <td>
                      <span className={`dashboard-status ${statusClass}`}>{complaint.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  )
}

export default Dashboard