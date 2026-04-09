import Card from '../components/ui/Card.jsx'
import './complaints.css'

const complaints = [
  { title: 'Water leakage near main road', category: 'Water', area: 'Zone A', status: 'Open' },
  { title: 'Broken streetlight on Elm Street', category: 'Lighting', area: 'Zone C', status: 'Pending' },
  { title: 'Garbage not collected', category: 'Waste', area: 'Zone B', status: 'Resolved' },
  { title: 'Damaged road patch', category: 'Roads', area: 'Zone D', status: 'Open' },
]

function Complaints() {
  return (
    <div className="complaints-page">
      <div className="complaints-page__header">
        <h1>Complaints</h1>
        <p>Static complaints table for the page layout.</p>
      </div>

      <Card className="complaints-page__filters-card">
        <div className="complaints-page__filters">
          <label className="complaints-page__field">
            <span>Search by title</span>
            <input type="search" placeholder="Search complaints" />
          </label>
          <label className="complaints-page__field">
            <span>Category</span>
            <select defaultValue="all">
              <option value="all">All categories</option>
              <option value="water">Water</option>
              <option value="lighting">Lighting</option>
              <option value="waste">Waste</option>
              <option value="roads">Roads</option>
            </select>
          </label>
          <label className="complaints-page__field">
            <span>Status</span>
            <select defaultValue="all">
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="complaints-page__table-wrap">
        <table className="complaints-page__table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Area</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint.title}>
                <td>{complaint.title}</td>
                <td>{complaint.category}</td>
                <td>{complaint.area}</td>
                <td>
                  <span className={`complaints-page__status complaints-page__status--${complaint.status.toLowerCase()}`}>
                    {complaint.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Complaints