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
    <div className="dashboard__chart-placeholder">
      Loading chart...
    </div>
  )
}

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
            <h1>Analytics Overview</h1>
            <p>Dashboard insights and trends.</p>
          </div>
          <div className="dashboard__charts">
            <div className="dashboard__chart-card">
              <h2>Complaints over time</h2>
              <ChartPlaceholder />
            </div>

            <div className="dashboard__chart-card">
              <h2>Complaint categories</h2>
              <ChartPlaceholder />
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
                {recentComplaints.map((complaint) => (
                  <tr key={complaint.title}>
                    <td>{complaint.title}</td>
                    <td>{complaint.category}</td>
                    <td>{complaint.area}</td>
                    <td>
                      <span className={`dashboard__status dashboard__status--${complaint.status.toLowerCase()}`}>
                        {complaint.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard