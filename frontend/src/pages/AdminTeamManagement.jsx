import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import { assignComplaint, fetchDashboardData } from '../services/api.js'
import { filterByRange, getStatusLabel } from './adminUtils.js'
import './dashboard.css'

const globalRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
]

const teamOptions = ['Team A', 'Team B', 'Worker 1', 'Worker 2']

function AdminTeamManagement() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [globalRange, setGlobalRange] = useState('all')
  const [assigningId, setAssigningId] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const response = await fetchDashboardData()

        if (isMounted) {
          setDashboard(response.data)
          setError('')
        }
      } catch {
        if (isMounted) {
          setError('Unable to load team data.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  async function refresh() {
    const response = await fetchDashboardData()
    setDashboard(response.data)
  }

  async function handleAssign(complaintId, team) {
    try {
      setAssigningId(complaintId)
      await assignComplaint(complaintId, team)
      await refresh()
      setActionMessage(`Assigned complaint to ${team}.`)
    } finally {
      setAssigningId('')
    }
  }

  const complaints = useMemo(() => dashboard?.allComplaints ?? [], [dashboard])
  const scopedComplaints = useMemo(() => filterByRange(complaints, globalRange), [complaints, globalRange])

  const teamSummary = useMemo(() => {
    const summaryMap = new Map(teamOptions.map((team) => [team, { team, total: 0, pending: 0, resolved: 0 }]))

    scopedComplaints.forEach((complaint) => {
      const team = complaint.assignedTo && summaryMap.has(complaint.assignedTo) ? complaint.assignedTo : 'Team A'
      const summary = summaryMap.get(team)
      summary.total += 1

      if (complaint.status === 'resolved') {
        summary.resolved += 1
      } else {
        summary.pending += 1
      }
    })

    return Array.from(summaryMap.values())
  }, [scopedComplaints])

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
            <p className="dashboard-page__eyebrow">Team Management</p>
            <h1>Assignment control center</h1>
            <p>Distribute complaints across workers and monitor team-level workload.</p>
          </div>
        </div>

        <div className="dashboard-global-filter" role="group" aria-label="Team time filter">
          {globalRanges.map((range) => (
            <button
              key={range.value}
              type="button"
              className={`dashboard-global-filter__item${globalRange === range.value ? ' is-active' : ''}`}
              onClick={() => setGlobalRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>

        {actionMessage ? <p className="dashboard-page__action-message">{actionMessage}</p> : null}

        <section className="dashboard-page__insights-grid">
          {teamSummary.map((team) => (
            <Card key={team.team} className="dashboard-card dashboard-card--insight">
              <div className="dashboard-section-header">
                <h2>{team.team}</h2>
              </div>
              <div className="dashboard-performance-grid">
                <p>Total assigned: <strong>{team.total}</strong></p>
                <p>Pending/In progress: <strong>{team.pending}</strong></p>
                <p>Resolved: <strong>{team.resolved}</strong></p>
              </div>
            </Card>
          ))}
        </section>

        <Card className="dashboard-card dashboard-card--table">
          <div className="dashboard-section-header dashboard-section-header--row">
            <div>
              <h2>Team Work Queue</h2>
              <p>Assign each complaint to the right team member.</p>
            </div>
            <span className="dashboard-queue-count">{scopedComplaints.length} items</span>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Area</th>
                  <th>Assigned To</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {scopedComplaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td><strong>{complaint.title}</strong></td>
                    <td><span className={`dashboard-status dashboard-status--${complaint.status}`}>{getStatusLabel(complaint.status)}</span></td>
                    <td>{complaint.area}</td>
                    <td>{complaint.assignedTo ?? 'Unassigned'}</td>
                    <td>
                      <div className="dashboard-row-actions dashboard-row-actions--always">
                        {teamOptions.map((team) => (
                          <Button
                            key={`${complaint.id}-${team}`}
                            className={`dashboard-row-actions__btn${complaint.assignedTo === team ? ' dashboard-row-actions__btn--primary' : ''}`}
                            onClick={() => handleAssign(complaint.id, team)}
                            disabled={assigningId === complaint.id}
                          >
                            {team}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminTeamManagement