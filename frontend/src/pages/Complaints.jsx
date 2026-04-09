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