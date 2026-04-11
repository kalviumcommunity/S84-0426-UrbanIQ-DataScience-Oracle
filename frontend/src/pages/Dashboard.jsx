import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import {
  assignComplaint,
  fetchDashboardData,
  markAllPendingAsReviewed,
  removeComplaint,
  resolveComplaint,
} from '../services/api.js'
import {
  filterByRange,
  getPriorityLabel,
  getRelativeDate,
  getStatusLabel,
  getTimelineData,
} from './adminUtils.js'
import './dashboard.css'

const assigneeOptions = ['Unassigned', 'Team A', 'Team B', 'Worker 1', 'Worker 2']
const dateRanges = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]
const pageSize = 10

function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [resolvingId, setResolvingId] = useState('')
  const [removingId, setRemovingId] = useState('')
  const [assigningId, setAssigningId] = useState('')
  const [selectedComplaintId, setSelectedComplaintId] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedAssignee, setSelectedAssignee] = useState('Team A')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        setLoading(true)
        const response = await fetchDashboardData()

        if (isMounted) {
          setDashboard(response.data)
          setError('')
        }
      } catch {
        if (isMounted) {
          setError('Unable to load work queue data.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  async function refreshDashboard() {
    const response = await fetchDashboardData()
    setDashboard(response.data)
  }

  const complaints = useMemo(() => dashboard?.allComplaints ?? [], [dashboard])
  const scopedByDate = useMemo(() => filterByRange(complaints, dateFilter), [complaints, dateFilter])

  useEffect(() => {
    if (!complaints.length) {
      setSelectedComplaintId('')
      setDrawerOpen(false)
      return
    }

    setSelectedComplaintId((current) => {
      if (current && complaints.some((complaint) => complaint.id === current)) {
        return current
      }

      return complaints[0].id
    })
  }, [complaints])

  const categoryOptions = useMemo(
    () => ['all', ...Array.from(new Set(scopedByDate.map((complaint) => complaint.category)))],
    [scopedByDate],
  )

  const areaOptions = useMemo(
    () => ['all', ...Array.from(new Set(scopedByDate.map((complaint) => complaint.area)))],
    [scopedByDate],
  )

  const filteredComplaints = useMemo(() => {
    return scopedByDate.filter((complaint) => {
      const categoryPass = categoryFilter === 'all' || complaint.category === categoryFilter
      const areaPass = areaFilter === 'all' || complaint.area === areaFilter
      const statusPass = statusFilter === 'all' || complaint.status === statusFilter
      return categoryPass && areaPass && statusPass
    })
  }, [areaFilter, categoryFilter, scopedByDate, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / pageSize))

  useEffect(() => {
    setCurrentPage(1)
  }, [areaFilter, categoryFilter, dateFilter, statusFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredComplaints.slice(start, start + pageSize)
  }, [currentPage, filteredComplaints])

  const selectedComplaint = useMemo(
    () => complaints.find((complaint) => complaint.id === selectedComplaintId) ?? null,
    [complaints, selectedComplaintId],
  )

  async function handleResolve(complaintId) {
    try {
      setResolvingId(complaintId)
      await resolveComplaint(complaintId)
      await refreshDashboard()
      setActionMessage('Complaint marked as resolved.')
    } finally {
      setResolvingId('')
    }
  }

  async function handleRemove(complaintId) {
    if (!window.confirm('Are you sure you want to remove this complaint?')) {
      return
    }

    try {
      setRemovingId(complaintId)
      await removeComplaint(complaintId)
      await refreshDashboard()
      setActionMessage('Complaint removed from queue.')
      setDrawerOpen(false)
    } finally {
      setRemovingId('')
    }
  }

  async function handleAssign(complaintId, assignee) {
    try {
      setAssigningId(complaintId)
      await assignComplaint(complaintId, assignee)
      await refreshDashboard()
      setActionMessage(`Complaint assigned to ${assignee}.`)
    } finally {
      setAssigningId('')
    }
  }

  async function handleMarkAllReviewed() {
    const result = await markAllPendingAsReviewed()
    await refreshDashboard()
    setActionMessage(`${result.data.updatedCount} pending complaints moved to In Progress.`)
  }

  function handleExportReport() {
    const headers = ['ID', 'Title', 'Category', 'Area', 'Status', 'Priority', 'Assigned To', 'Created At']
    const rows = filteredComplaints.map((complaint) => [
      complaint.id,
      complaint.title,
      complaint.category,
      complaint.area,
      complaint.status,
      complaint.priority ?? 'medium',
      complaint.assignedTo ?? 'Unassigned',
      complaint.createdAt,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `work-queue-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setActionMessage('Report exported successfully.')
  }

  if (loading) {
    return (
      <div className="dashboard-page dashboard-page__state">
        <Loader />
      </div>
    )
  }

  if (error) {
    return <div className="dashboard-page__error">{error}</div>
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__container">
        <div className="dashboard-page__header">
          <div>
            <p className="dashboard-page__eyebrow">Work Queue</p>
            <h1>Complaint processing board</h1>
            <p>Use filters, table actions, and drawer controls to process complaints efficiently.</p>
          </div>
          <div className="dashboard-page__header-meta">
            <span>Queue</span>
            <span>{filteredComplaints.length} matching</span>
          </div>
        </div>

        <section className="dashboard-page__quick-actions">
          <Button className="dashboard-quick-button dashboard-quick-button--primary" onClick={handleMarkAllReviewed}>Mark all pending as reviewed</Button>
          <Button className="dashboard-quick-button dashboard-quick-button--outline" onClick={handleExportReport}>Export report</Button>
          <Button
            className="dashboard-quick-button dashboard-quick-button--outline"
            onClick={() => {
              if (!selectedComplaintId) {
                return
              }
              handleAssign(selectedComplaintId, 'Team A')
            }}
            disabled={!selectedComplaintId}
          >
            Assign to team
          </Button>
        </section>

        {actionMessage ? <p className="dashboard-page__action-message">{actionMessage}</p> : null}

        <Card className="dashboard-card dashboard-card--table dashboard-card--queue">
          <div className="dashboard-section-header dashboard-section-header--row">
            <div>
              <h2>Work Queue</h2>
              <p>Filter, paginate, and process complaints from a single operational table.</p>
            </div>
            <span className="dashboard-queue-count">{filteredComplaints.length} items</span>
          </div>

          {statusFilter === 'pending' && !filteredComplaints.length ? <div className="dashboard-empty-banner">🎉 All complaints resolved</div> : null}

          <div className="dashboard-filter-panel">
            <label>
              Category
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                {categoryOptions.map((value) => (
                  <option key={value} value={value}>{value === 'all' ? 'All categories' : value}</option>
                ))}
              </select>
            </label>

            <label>
              Area
              <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
                {areaOptions.map((value) => (
                  <option key={value} value={value}>{value === 'all' ? 'All areas' : value}</option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>

            <label>
              Date
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
                {dateRanges.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Area</th>
                  <th>Assigned To</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedComplaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className={selectedComplaintId === complaint.id ? 'dashboard-table__row--selected' : ''}
                    onClick={() => {
                      setSelectedComplaintId(complaint.id)
                      setDrawerOpen(true)
                      setSelectedAssignee(complaint.assignedTo ?? 'Team A')
                    }}
                  >
                    <td>
                      <strong>{complaint.title}</strong>
                    </td>
                    <td>
                      <span className={`dashboard-priority dashboard-priority--${complaint.priority ?? 'medium'}`}>
                        {getPriorityLabel(complaint.priority)}
                      </span>
                    </td>
                    <td>
                      <span className={`dashboard-status dashboard-status--${complaint.status}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                    </td>
                    <td>{complaint.area}</td>
                    <td>{complaint.assignedTo ?? 'Unassigned'}</td>
                    <td>{getRelativeDate(complaint.createdAt)}</td>
                    <td>
                      <div className="dashboard-row-actions" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="dashboard-row-actions__btn"
                          onClick={() => {
                            setSelectedComplaintId(complaint.id)
                            setDrawerOpen(true)
                          }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="dashboard-row-actions__btn"
                          onClick={() => handleAssign(complaint.id, 'Team A')}
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          className="dashboard-row-actions__btn dashboard-row-actions__btn--primary"
                          onClick={() => handleResolve(complaint.id)}
                          disabled={complaint.status === 'resolved'}
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!paginatedComplaints.length ? (
              <div className="dashboard-empty-state">
                {statusFilter === 'pending'
                  ? '🎉 All complaints resolved'
                  : 'No complaints found for current filters.'}
              </div>
            ) : null}
          </div>

          {filteredComplaints.length > pageSize ? (
            <div className="dashboard-pagination">
              <Button className="dashboard-row-actions__btn" onClick={() => setCurrentPage((value) => Math.max(value - 1, 1))} disabled={currentPage === 1}>
                Prev
              </Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button className="dashboard-row-actions__btn" onClick={() => setCurrentPage((value) => Math.min(value + 1, totalPages))} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          ) : null}
        </Card>

        <aside className={`dashboard-drawer ${drawerOpen && selectedComplaint ? 'is-open' : ''}`}>
          {selectedComplaint ? (
            <div className="dashboard-drawer__content">
              <div className="dashboard-drawer__header">
                <h2>Complaint Detail</h2>
                <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close detail drawer">✕</button>
              </div>

              <div className="dashboard-drawer__meta-grid">
                <div>
                  <p>Title</p>
                  <strong>{selectedComplaint.title}</strong>
                </div>
                <div>
                  <p>Status</p>
                  <span className={`dashboard-status dashboard-status--${selectedComplaint.status}`}>{getStatusLabel(selectedComplaint.status)}</span>
                </div>
                <div>
                  <p>Priority</p>
                  <span className={`dashboard-priority dashboard-priority--${selectedComplaint.priority ?? 'medium'}`}>
                    {getPriorityLabel(selectedComplaint.priority)}
                  </span>
                </div>
                <div>
                  <p>Area</p>
                  <strong>{selectedComplaint.area}</strong>
                </div>
              </div>

              <div className="dashboard-drawer__block">
                <p>Description</p>
                <span>{selectedComplaint.details}</span>
              </div>

              {selectedComplaint.imageUrl ? (
                <div className="dashboard-drawer__block">
                  <p>Image</p>
                  <img src={selectedComplaint.imageUrl} alt={`Attachment for ${selectedComplaint.title}`} />
                </div>
              ) : null}

              <div className="dashboard-drawer__block">
                <p>Timeline</p>
                <ol className="dashboard-timeline">
                  {getTimelineData(selectedComplaint).map((stage) => (
                    <li
                      key={`${selectedComplaint.id}-${stage.key}`}
                      className={`${stage.completed ? 'is-complete' : ''} ${stage.active ? 'is-active' : ''}`.trim()}
                    >
                      <span>{stage.label}</span>
                      <small>{stage.at ? getRelativeDate(stage.at) : '-'}</small>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="dashboard-drawer__block">
                <p>Assignment</p>
                <div className="dashboard-drawer__assignment-row">
                  <select value={selectedAssignee} onChange={(event) => setSelectedAssignee(event.target.value)}>
                    {assigneeOptions.map((assignee) => (
                      <option key={assignee} value={assignee}>{assignee}</option>
                    ))}
                  </select>
                  <Button
                    className="dashboard-resolve-button"
                    onClick={() => handleAssign(selectedComplaint.id, selectedAssignee)}
                    disabled={assigningId === selectedComplaint.id}
                  >
                    {assigningId === selectedComplaint.id ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </div>

              <div className="dashboard-drawer__actions">
                <Button
                  className="dashboard-resolve-button"
                  onClick={() => handleResolve(selectedComplaint.id)}
                  disabled={selectedComplaint.status === 'resolved' || resolvingId === selectedComplaint.id || removingId === selectedComplaint.id}
                >
                  {selectedComplaint.status === 'resolved' ? 'Resolved' : resolvingId === selectedComplaint.id ? 'Updating...' : 'Mark resolved'}
                </Button>
                <Button
                  className="dashboard-remove-button"
                  onClick={() => handleRemove(selectedComplaint.id)}
                  disabled={resolvingId === selectedComplaint.id || removingId === selectedComplaint.id}
                >
                  {removingId === selectedComplaint.id ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

export default Dashboard