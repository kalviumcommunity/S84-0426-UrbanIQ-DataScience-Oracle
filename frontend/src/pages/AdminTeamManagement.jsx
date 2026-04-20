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

const filterTabs = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'unassigned', label: 'Unassigned', icon: '⚪' },
  { id: 'in-progress', label: 'In Progress', icon: '🔵' },
  { id: 'urgent', label: 'Urgent', icon: '🚨' },
]

const statusMeta = {
  pending: { icon: '🟡', label: 'Pending' },
  'in-progress': { icon: '🔵', label: 'In Progress' },
  resolved: { icon: '🟢', label: 'Resolved' },
}

function AdminTeamManagement() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [globalRange, setGlobalRange] = useState('all')
  const [assigningId, setAssigningId] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [selectedTeamFilter, setSelectedTeamFilter] = useState(null)
  const [viewMode, setViewMode] = useState('table')
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [bulkAssignTeam, setBulkAssignTeam] = useState('')
  const [openDropdown, setOpenDropdown] = useState(null)

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
      setOpenDropdown(null)
    } finally {
      setAssigningId('')
    }
  }

  async function handleBulkAssign() {
    if (selectedRows.size === 0 || !bulkAssignTeam) return

    try {
      setAssigningId('bulk')
      for (const complaintId of selectedRows) {
        await assignComplaint(complaintId, bulkAssignTeam)
      }
      await refresh()
      setActionMessage(`Assigned ${selectedRows.size} complaint${selectedRows.size > 1 ? 's' : ''} to ${bulkAssignTeam}.`)
      setSelectedRows(new Set())
      setBulkAssignTeam('')
    } finally {
      setAssigningId('')
    }
  }

  function toggleRowSelection(complaintId) {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(complaintId)) {
      newSelected.delete(complaintId)
    } else {
      newSelected.add(complaintId)
    }
    setSelectedRows(newSelected)
  }

  function toggleAllRows(complaints) {
    if (selectedRows.size === complaints.length && complaints.length > 0) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(complaints.map((c) => c.id)))
    }
  }

  const complaints = useMemo(() => dashboard?.allComplaints ?? [], [dashboard])
  const scopedComplaints = useMemo(() => filterByRange(complaints, globalRange), [complaints, globalRange])

  // Apply tab filter
  const tabFilteredComplaints = useMemo(() => {
    return scopedComplaints.filter((complaint) => {
      switch (filterTab) {
        case 'unassigned':
          return !complaint.assignedTo
        case 'in-progress':
          return complaint.status === 'in-progress'
        case 'urgent':
          return complaint.priority === 'high' || complaint.category === 'Uncovered manhole'
        default:
          return true
      }
    })
  }, [scopedComplaints, filterTab])

  // Apply team filter
  const teamFilteredComplaints = useMemo(() => {
    if (!selectedTeamFilter) return tabFilteredComplaints
    return tabFilteredComplaints.filter((c) => c.assignedTo === selectedTeamFilter)
  }, [tabFilteredComplaints, selectedTeamFilter])

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
          <div className="dashboard-page__header-actions">
            <button
              type="button"
              className={`dashboard-view-toggle${viewMode === 'table' ? ' is-active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              📋 Table
            </button>
            <button
              type="button"
              className={`dashboard-view-toggle${viewMode === 'map' ? ' is-active' : ''}`}
              onClick={() => setViewMode('map')}
              title="Map view"
            >
              🗺️ Map
            </button>
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
          {teamSummary.map((team) => {
            const progress = team.total > 0 ? (team.resolved / team.total) * 100 : 0
            const isActive = selectedTeamFilter === team.team

            return (
              <Card
                key={team.team}
                className={`dashboard-card dashboard-card--insight${isActive ? ' dashboard-card--insight-active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedTeamFilter(isActive ? null : team.team)}
              >
                <div className="dashboard-section-header">
                  <h2>{team.team}</h2>
                  {isActive && <span className="dashboard-filter-badge">🔍 Filtered</span>}
                </div>
                <div className="dashboard-performance-grid">
                  <p>
                    Total assigned: <strong>{team.total}</strong>
                  </p>
                  <p>
                    Pending/In progress: <strong>{team.pending}</strong>
                  </p>
                  <p>
                    Resolved: <strong>{team.resolved}</strong>
                  </p>
                </div>
                <div className="dashboard-progress-bar">
                  <div className="dashboard-progress-bar__fill" style={{ width: `${progress}%` }} />
                </div>
              </Card>
            )
          })}
        </section>

        {viewMode === 'table' ? (
          <Card className="dashboard-card dashboard-card--table">
            <div className="dashboard-section-header dashboard-section-header--row">
              <div>
                <h2>Team Work Queue</h2>
                <p>Assign each complaint to the right team member.</p>
                {selectedTeamFilter && <span className="dashboard-filter-hint">Showing {teamFilteredComplaints.length} items assigned to {selectedTeamFilter}</span>}
              </div>
              <span className="dashboard-queue-count">{teamFilteredComplaints.length} items</span>
            </div>

            {/* Filter Tabs */}
            <div className="dashboard-filter-tabs">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`dashboard-filter-tab${filterTab === tab.id ? ' is-active' : ''}`}
                  onClick={() => setFilterTab(tab.id)}
                >
                  <span className="dashboard-filter-tab__icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Bulk Actions */}
            {selectedRows.size > 0 && (
              <div className="dashboard-bulk-actions">
                <span className="dashboard-bulk-actions__count">{selectedRows.size} selected</span>
                <select
                  value={bulkAssignTeam}
                  onChange={(e) => setBulkAssignTeam(e.target.value)}
                  className="dashboard-bulk-actions__select"
                >
                  <option value="">Assign to...</option>
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleBulkAssign}
                  disabled={!bulkAssignTeam || assigningId === 'bulk'}
                  className="dashboard-bulk-actions__btn"
                >
                  Bulk Assign
                </Button>
                <button
                  type="button"
                  className="dashboard-bulk-actions__clear"
                  onClick={() => setSelectedRows(new Set())}
                >
                  Clear
                </button>
              </div>
            )}

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th className="dashboard-table__checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRows.size > 0 && selectedRows.size === teamFilteredComplaints.length}
                        onChange={() => toggleAllRows(teamFilteredComplaints)}
                        aria-label="Select all"
                      />
                    </th>
                    <th>Title</th>
                    <th className="dashboard-table__status-col">Status</th>
                    <th>Area</th>
                    <th>Assigned To</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamFilteredComplaints.length > 0 ? (
                    teamFilteredComplaints.map((complaint) => (
                      <tr
                        key={complaint.id}
                        className={selectedRows.has(complaint.id) ? 'dashboard-table__row--selected' : ''}
                      >
                        <td className="dashboard-table__checkbox">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(complaint.id)}
                            onChange={() => toggleRowSelection(complaint.id)}
                            aria-label={`Select ${complaint.title}`}
                          />
                        </td>
                        <td>
                          <strong>{complaint.title}</strong>
                        </td>
                        <td className="dashboard-table__status-col">
                          <span
                            className={`dashboard-status dashboard-status--${complaint.status}`}
                            title={statusMeta[complaint.status]?.label ?? getStatusLabel(complaint.status)}
                          >
                            <span className="dashboard-status__icon" aria-hidden="true">
                              {statusMeta[complaint.status]?.icon ?? '🟡'}
                            </span>
                            <span className="dashboard-status__text">
                              {statusMeta[complaint.status]?.label ?? getStatusLabel(complaint.status)}
                            </span>
                          </span>
                        </td>
                        <td>{complaint.area}</td>
                        <td>{complaint.assignedTo ?? <em>Unassigned</em>}</td>
                        <td>
                          <div className="dashboard-row-actions-dropdown">
                            <button
                              type="button"
                              className="dashboard-row-actions-dropdown__trigger"
                              onClick={() => setOpenDropdown(openDropdown === complaint.id ? null : complaint.id)}
                              disabled={assigningId === complaint.id}
                            >
                              {complaint.assignedTo ? complaint.assignedTo.slice(0, 1) : '+'}
                            </button>
                            {openDropdown === complaint.id && (
                              <div className="dashboard-row-actions-dropdown__menu">
                                {teamOptions.map((team) => (
                                  <button
                                    key={`${complaint.id}-${team}`}
                                    type="button"
                                    className={`dashboard-row-actions-dropdown__item${complaint.assignedTo === team ? ' is-selected' : ''}`}
                                    onClick={() => handleAssign(complaint.id, team)}
                                    disabled={assigningId === complaint.id}
                                  >
                                    {team}
                                    {complaint.assignedTo === team && ' ✓'}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="dashboard-table__empty">
                        <p>No complaints found for the selected filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          // Map View
          <Card className="dashboard-card dashboard-card--map">
            <div className="dashboard-section-header">
              <h2>Complaint Locations Map</h2>
              <p>Click on a location cluster to filter and assign complaints in that area.</p>
            </div>
            <div className="dashboard-map-container">
              <div className="dashboard-map-grid">
                {teamFilteredComplaints.length > 0 ? (
                  [...new Set(teamFilteredComplaints.map((c) => c.area))].map((area) => {
                    const areaComplaints = teamFilteredComplaints.filter((c) => c.area === area)
                    const unassignedCount = areaComplaints.filter((c) => !c.assignedTo).length

                    return (
                      <div
                        key={area}
                        className={`dashboard-location-pin${unassignedCount > 0 ? ' dashboard-location-pin--urgent' : ''}`}
                      >
                        <div className="dashboard-location-pin__header">
                          <strong>{area}</strong>
                          <span className="dashboard-location-pin__count">{areaComplaints.length}</span>
                        </div>
                        <p className="dashboard-location-pin__details">
                          {unassignedCount > 0 && (
                            <>
                              <span className="dashboard-location-pin__unassigned">{unassignedCount} unassigned</span>
                              {areaComplaints.length - unassignedCount > 0 && <br />}
                            </>
                          )}
                          {areaComplaints.length - unassignedCount > 0 && (
                            <span className="dashboard-location-pin__assigned">
                              {areaComplaints.length - unassignedCount} assigned
                            </span>
                          )}
                        </p>
                        <div className="dashboard-location-pin__teams">
                          {[...new Set(areaComplaints.filter((c) => c.assignedTo).map((c) => c.assignedTo))].map((team) => (
                            <span key={team} className="dashboard-location-pin__team-badge">
                              {team.slice(0, 1)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="dashboard-map-empty">
                    <p>No complaints found for the selected filters.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AdminTeamManagement