import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Loader from '../components/ui/Loader.jsx'
import { fetchComplaintsList } from '../services/api.js'
import { useEffect, useMemo, useState } from 'react'
import './complaints.css'

function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
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

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesTitle = complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
      const matchesCategory =
        categoryFilter === 'all' || complaint.category?.toLowerCase() === categoryFilter
      const matchesStatus =
        statusFilter === 'all' || complaint.status?.toLowerCase() === statusFilter

      return matchesTitle && matchesCategory && matchesStatus
    })
  }, [complaints, searchQuery, categoryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, statusFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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
        <p>Complaints data with search and filters powered by the API.</p>
      </div>

      <Card className="complaints-page__filters-card">
        <div className="complaints-page__filters">
          <label className="complaints-page__field">
            <span>Search by title</span>
            <input
              type="search"
              placeholder="Search complaints"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <label className="complaints-page__field">
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              <option value="water">Water</option>
              <option value="lighting">Lighting</option>
              <option value="waste">Waste</option>
              <option value="roads">Roads</option>
            </select>
          </label>
          <label className="complaints-page__field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
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
            {paginatedComplaints.length > 0 ? (
              paginatedComplaints.map((complaint) => (
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
              ))
            ) : (
              <tr>
                <td colSpan="4">No complaints match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="complaints-page__pagination">
        <p className="complaints-page__pagination-info">
          Showing {filteredComplaints.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(startIndex + itemsPerPage, filteredComplaints.length)} of {filteredComplaints.length} complaints
        </p>
        <div className="complaints-page__pagination-actions">
          <Button disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
            Previous
          </Button>
          <span className="complaints-page__page-count">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {error ? <div className="complaints-page__error">{error}</div> : null}
    </div>
  )
}

export default Complaints