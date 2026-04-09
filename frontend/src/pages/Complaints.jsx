import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import { fetchComplaintsList } from '../services/api.js'
import { useEffect, useMemo, useState } from 'react'
import './complaints.css'

const fallbackComplaints = [
  { title: 'Broken water pipe on MG Road', category: 'Water Supply', area: 'Ward 12', status: 'Open' },
  { title: 'Garbage not collected for 3 days', category: 'Garbage', area: 'Ward 5', status: 'Pending' },
  { title: 'Large pothole near City Mall', category: 'Road Damage', area: 'Ward 8', status: 'Open' },
  { title: 'Street light not working', category: 'Street Lights', area: 'Ward 3', status: 'Resolved' },
  { title: 'Drainage overflow in market area', category: 'Drainage', area: 'Ward 15', status: 'Pending' },
  { title: 'Water supply disruption', category: 'Water Supply', area: 'Ward 7', status: 'Resolved' },
  { title: 'Illegal dumping near school', category: 'Garbage', area: 'Ward 2', status: 'Open' },
]

function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadComplaints() {
      try {
        setIsLoading(true)
        const response = await fetchComplaintsList()

        if (isMounted) {
          setComplaints(response.data ?? [])
          setError('')
        }
      } catch {
        if (isMounted) {
          setError('Unable to load complaints.')
          setComplaints([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadComplaints()

    return () => {
      isMounted = false
    }
  }, [])

  const displayComplaints = useMemo(() => {
    if (complaints.length > 0) {
      return complaints.slice(0, 7)
    }

    return fallbackComplaints
  }, [complaints])

  if (isLoading) {
    return (
      <div className="complaints-page complaints-page__state">
        <Loader />
      </div>
    )
  }

  return (
    <div className="complaints-page">
      <div className="complaints-page__header">
        <h1>Complaints</h1>
        <p>All citizen grievances and their current status</p>
      </div>

      <Card className="complaints-page__table-card">
        <div className="complaints-page__table-header">
          <div>
            <h2>Recent Complaints</h2>
            <p>Latest citizen grievances</p>
          </div>
          <a href="#" className="complaints-page__view-all">
            View all
          </a>
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
              {displayComplaints.map((complaint) => (
                <tr key={complaint.id ?? complaint.title}>
                  <td>{complaint.title ?? '-'}</td>
                  <td>{complaint.category ?? '-'}</td>
                  <td>{complaint.area ?? '-'}</td>
                  <td>
                    <span
                      className={`complaints-page__status complaints-page__status--${
                        complaint.status?.toLowerCase() ?? 'open'
                      }`}
                    >
                      {complaint.status ?? '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {error ? <div className="complaints-page__error">{error}</div> : null}
    </div>
  )
}

export default Complaints