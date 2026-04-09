import Card from '../components/ui/Card.jsx'
import './dashboard.css'

const summaryCards = [
  { label: 'Total complaints', value: '1,240' },
  { label: 'Resolved complaints', value: '980' },
  { label: 'Pending complaints', value: '260' },
]

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
            <p>Placeholder area for future chart components.</p>
          </div>
          <div className="dashboard__placeholder">Chart section coming soon</div>
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