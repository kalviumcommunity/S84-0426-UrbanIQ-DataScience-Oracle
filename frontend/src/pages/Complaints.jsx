import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import { createComplaint, fetchComplaintsList } from '../services/api.js'
import './complaints.css'

const initialForm = {
  title: '',
  category: 'Water Supply',
  area: '',
  location: '',
  details: '',
  submittedBy: '',
  priority: 'medium',
  imageUrl: null,
  imageName: '',
}

const categoryOptions = ['Water Supply', 'Garbage', 'Road Damage', 'Drainage', 'Street Lights', 'Other']
const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]
const locationOptions = [
  { value: 'MG Road Circle', area: 'Ward 12', coords: '18.5204, 73.8567' },
  { value: 'City Mall Junction', area: 'Ward 8', coords: '18.5270, 73.8720' },
  { value: 'Lakeview Bus Stop', area: 'Ward 5', coords: '18.5342, 73.8475' },
  { value: 'Oakwood School Gate', area: 'Ward 2', coords: '18.5455, 73.8622' },
  { value: 'Central Market Lane', area: 'Ward 15', coords: '18.5131, 73.8798' },
]
const timelineStages = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under-review', label: 'Under Review' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
]

function getStatusLabel(status) {
  if (status === 'resolved') {
    return '🟢 Resolved'
  }

  if (status === 'in-progress') {
    return '🔵 In Progress'
  }

  return '🟡 Pending'
}

function getStatusClass(status) {
  if (status === 'resolved') {
    return 'resolved'
  }

  if (status === 'in-progress') {
    return 'progress'
  }

  return 'open'
}

function getPriorityClass(priority) {
  if (priority === 'high') {
    return 'high'
  }

  if (priority === 'low') {
    return 'low'
  }

  return 'medium'
}

function getPriorityLabel(priority) {
  if (priority === 'high') {
    return 'High'
  }

  if (priority === 'low') {
    return 'Low'
  }

  return 'Medium'
}

function getRelativeDate(dateValue) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getStartOfWeek(dateValue) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const normalized = new Date(date)
  const day = (normalized.getDay() + 6) % 7
  normalized.setHours(0, 0, 0, 0)
  normalized.setDate(normalized.getDate() - day)
  return normalized
}

function getTimelineData(complaint) {
  const history = new Map(
    (complaint.statusHistory ?? []).map((entry) => [entry.stage, entry.at]),
  )
  const currentStage = complaint.status === 'resolved' ? 'resolved' : complaint.status === 'in-progress' ? 'in-progress' : 'under-review'
  const currentIndex = timelineStages.findIndex((stage) => stage.key === currentStage)

  return timelineStages.map((stage, index) => ({
    ...stage,
    completed: index < currentIndex,
    active: index === currentIndex,
    at: history.get(stage.key) ?? null,
  }))
}

function Complaints() {
  const outletContext = useOutletContext() ?? {}
  const searchQuery = outletContext.searchQuery ?? ''
  const [complaints, setComplaints] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedComplaintId, setSelectedComplaintId] = useState('')
  const [showAllUpdates, setShowAllUpdates] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const loadComplaints = async () => {
    try {
      setIsLoading(true)
      const response = await fetchComplaintsList()
      setComplaints(response.data ?? [])
      setError('')
    } catch {
      setError('Unable to load complaints.')
      setComplaints([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  useEffect(() => {
    if (!complaints.length) {
      setSelectedComplaintId('')
      setShowTimeline(false)
      return
    }

    setSelectedComplaintId((current) => {
      if (current && complaints.some((complaint) => complaint.id === current)) {
        return current
      }

      return complaints[0].id
    })
  }, [complaints])

  useEffect(() => {
    setShowTimeline(false)
  }, [selectedComplaintId])

  function handleChange(event) {
    const { name, value } = event.target

    if (name === 'location') {
      const selectedLocation = locationOptions.find((option) => option.value === value)

      setFormData((currentValue) => ({
        ...currentValue,
        location: value,
        area: currentValue.area || selectedLocation?.area || '',
      }))
      return
    }

    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value,
    }))
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      setFormData((currentValue) => ({
        ...currentValue,
        imageUrl: null,
        imageName: '',
      }))
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be under 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFormData((currentValue) => ({
        ...currentValue,
        imageUrl: String(reader.result ?? ''),
        imageName: file.name,
      }))
      setError('')
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setSuccessMessage('')
      setError('')
      await createComplaint(formData)
      setFormData(initialForm)
      await loadComplaints()
      setSuccessMessage('Your complaint has been submitted and is visible to both users and admins.')
      setShowAdvanced(false)
    } catch {
      setError('Unable to submit your complaint right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryFilterOptions = useMemo(() => {
    const allCategories = new Set([...categoryOptions, ...complaints.map((complaint) => complaint.category)])
    return Array.from(allCategories)
  }, [complaints])

  const filteredComplaints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return complaints.filter((complaint) => {
      const statusPass = statusFilter === 'all' || complaint.status === statusFilter
      const categoryPass = categoryFilter === 'all' || complaint.category === categoryFilter
      const searchPass =
        !query ||
        `${complaint.title} ${complaint.details} ${complaint.area} ${complaint.location ?? ''}`.toLowerCase().includes(query)

      return statusPass && categoryPass && searchPass
    })
  }, [categoryFilter, complaints, searchQuery, statusFilter])

  const displayComplaints = useMemo(() => filteredComplaints.slice(0, 8), [filteredComplaints])
  const selectedComplaint = useMemo(
    () => filteredComplaints.find((complaint) => complaint.id === selectedComplaintId) ?? null,
    [filteredComplaints, selectedComplaintId],
  )

  const userSummary = useMemo(() => {
    const total = complaints.length
    const resolved = complaints.filter((complaint) => complaint.status === 'resolved').length
    const open = total - resolved

    const now = new Date()
    const currentWeekStart = getStartOfWeek(now)
    const previousWeekStart = currentWeekStart ? new Date(currentWeekStart) : null
    if (previousWeekStart) {
      previousWeekStart.setDate(previousWeekStart.getDate() - 7)
    }

    const currentWeekReports = complaints.filter((complaint) => {
      if (!currentWeekStart) {
        return false
      }

      const createdAt = new Date(complaint.createdAt)
      return createdAt >= currentWeekStart
    })

    const previousWeekReports = complaints.filter((complaint) => {
      if (!currentWeekStart || !previousWeekStart) {
        return false
      }

      const createdAt = new Date(complaint.createdAt)
      return createdAt >= previousWeekStart && createdAt < currentWeekStart
    })

    const reportDelta = currentWeekReports.length - previousWeekReports.length
    const currentRate = currentWeekReports.length
      ? Math.round((currentWeekReports.filter((complaint) => complaint.status === 'resolved').length / currentWeekReports.length) * 100)
      : 0
    const previousRate = previousWeekReports.length
      ? Math.round((previousWeekReports.filter((complaint) => complaint.status === 'resolved').length / previousWeekReports.length) * 100)
      : 0
    const rateDelta = currentRate - previousRate

    const trendNote = `${reportDelta >= 0 ? '+' : ''}${reportDelta} complaints this week`
    const resolutionTrend =
      rateDelta >= 0 ? `Resolution rate improved by ${rateDelta}%` : `Resolution rate dropped by ${Math.abs(rateDelta)}%`

    return [
      { label: 'My reports', value: total.toLocaleString(), note: 'Visible to the city team', trend: trendNote },
      { label: 'Resolved', value: resolved.toLocaleString(), note: 'Closed issues', trend: resolutionTrend },
      { label: 'Still open', value: open.toLocaleString(), note: 'In queue or in progress', trend: `${open} complaints need follow-up` },
    ]
  }, [complaints])

  const smartSuggestions = useMemo(() => {
    const query = `${formData.title} ${formData.details}`.toLowerCase().trim()

    if (query.length < 6) {
      return []
    }

    const tokens = Array.from(
      new Set(
        query
          .split(/\s+/)
          .map((value) => value.trim())
          .filter((value) => value.length >= 4),
      ),
    )

    return complaints
      .map((complaint) => {
        const haystack = `${complaint.title} ${complaint.details}`.toLowerCase()
        const tokenScore = tokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0)
        const categoryScore = complaint.category === formData.category ? 2 : 0
        const areaScore = formData.area && complaint.area === formData.area ? 2 : 0
        return { complaint, score: tokenScore + categoryScore + areaScore }
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.complaint)
  }, [complaints, formData.area, formData.category, formData.details, formData.title])

  const allNotifications = useMemo(() => {
    const ordered = [...complaints].sort((a, b) => {
      const aTime = new Date(a.resolvedAt ?? a.createdAt).getTime()
      const bTime = new Date(b.resolvedAt ?? b.createdAt).getTime()
      return bTime - aTime
    })

    return ordered.map((complaint) => {
      if (complaint.status === 'resolved') {
        return {
          id: `resolved-${complaint.id}`,
          text: `Your complaint "${complaint.title}" was resolved in ${complaint.area}.`,
          when: complaint.resolvedAt ?? complaint.createdAt,
        }
      }

      if (complaint.status === 'in-progress') {
        return {
          id: `progress-${complaint.id}`,
          text: `Your complaint "${complaint.title}" moved to In Progress.`,
          when: complaint.createdAt,
        }
      }

      return {
        id: `review-${complaint.id}`,
        text: `Your complaint "${complaint.title}" is under review.`,
        when: complaint.createdAt,
      }
    })
  }, [complaints])

  const notifications = useMemo(
    () => (showAllUpdates ? allNotifications : allNotifications.slice(0, 3)),
    [allNotifications, showAllUpdates],
  )

  const selectedLocation = locationOptions.find((option) => option.value === formData.location)

  if (isLoading) {
    return (
      <div className="complaints-page complaints-page__state">
        <Loader />
      </div>
    )
  }

  return (
    <div className="complaints-page">
      <div className="complaints-page__header complaints-page__header--compact">
        <div>
          <p className="complaints-page__eyebrow">Citizen portal</p>
          <h1>Dashboard</h1>
          <p>Track your complaints and open a new report only when needed.</p>
        </div>
        <Button className="complaints-page__primary-action" onClick={() => setIsReportModalOpen(true)}>
          + Report New Issue
        </Button>
      </div>

      <section className="complaints-page__stats-grid">
        {userSummary.map((card) => (
          <Card key={card.label} className="complaints-page__stat-card">
            <p className="complaints-page__stat-label">{card.label}</p>
            <h2 className="complaints-page__stat-value">{card.value}</h2>
            <p className="complaints-page__stat-note">{card.note}</p>
            <p className="complaints-page__trend-note">{card.trend}</p>
          </Card>
        ))}
      </section>

      <Card className="complaints-page__notifications-card complaints-page__section-break">
        <div className="complaints-page__section-header">
          <div>
            <h2>Latest Updates (3)</h2>
            <p>Most recent status notifications for your submitted complaints.</p>
          </div>
          {allNotifications.length > 3 ? (
            <Button className="complaints-page__link-button" onClick={() => setShowAllUpdates((value) => !value)}>
              {showAllUpdates ? 'Show less updates' : 'View all updates →'}
            </Button>
          ) : null}
        </div>

        {notifications.length ? (
          <ul className="complaints-page__notifications-list">
            {notifications.map((item) => (
              <li key={item.id}>
                <span>{item.text}</span>
                <small>{getRelativeDate(item.when)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="complaints-page__empty-state">No updates yet. Submit your first complaint to start tracking updates.</p>
        )}
      </Card>

      <Card className="complaints-page__table-card complaints-page__section-break">
        <div className="complaints-page__table-header">
          <div>
            <h2>Submitted complaints</h2>
            <p>Latest complaints visible to the public and admins.</p>
          </div>
        </div>

        <div className="complaints-page__filters">
          <div className="complaints-page__search-hint">Search is now in the top bar</div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {categoryFilterOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="complaints-page__table-wrap">
          {displayComplaints.length ? (
            <table className="complaints-page__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Area</th>
                </tr>
              </thead>
              <tbody>
                {displayComplaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className={selectedComplaintId === complaint.id ? 'complaints-page__row--selected' : ''}
                    onClick={() => setSelectedComplaintId(complaint.id)}
                  >
                    <td>
                      <strong>{complaint.title ?? '-'}</strong>
                      <small>{getRelativeDate(complaint.createdAt)}</small>
                    </td>
                    <td>
                      <span className={`complaints-page__status complaints-page__status--${getStatusClass(complaint.status)}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                    </td>
                    <td>{complaint.area ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="complaints-page__empty-state">
              No complaints yet. Start by reporting your first issue.
            </div>
          )}
        </div>
      </Card>

      <Card className="complaints-page__details-card complaints-page__section-break">
        <div className="complaints-page__section-header">
          <div>
            <h2>Complaint details</h2>
            <p>Select a complaint row to view complete details.</p>
          </div>
        </div>

        {selectedComplaint ? (
          <div className="complaints-page__details-content">
            <div className="complaints-page__details-grid">
              <div>
                <p className="complaints-page__detail-label">Title</p>
                <h3>{selectedComplaint.title}</h3>
              </div>
              <div>
                <p className="complaints-page__detail-label">Status</p>
                <span className={`complaints-page__status complaints-page__status--${getStatusClass(selectedComplaint.status)}`}>
                  {getStatusLabel(selectedComplaint.status)}
                </span>
              </div>
              <div>
                <p className="complaints-page__detail-label">Category</p>
                <p>{selectedComplaint.category}</p>
              </div>
              <div>
                <p className="complaints-page__detail-label">Priority</p>
                <span className={`complaints-page__priority complaints-page__priority--${getPriorityClass(selectedComplaint.priority)}`}>
                  {getPriorityLabel(selectedComplaint.priority)}
                </span>
              </div>
              <div>
                <p className="complaints-page__detail-label">Area</p>
                <p>{selectedComplaint.area}</p>
              </div>
              <div>
                <p className="complaints-page__detail-label">Location</p>
                <p>{selectedComplaint.location ?? selectedComplaint.area}</p>
              </div>
            </div>

            <div className="complaints-page__detail-block">
              <p className="complaints-page__detail-label">Description</p>
              <p>{selectedComplaint.details || '-'}</p>
            </div>

            {selectedComplaint.imageUrl ? (
              <div className="complaints-page__detail-block">
                <p className="complaints-page__detail-label">Attached image</p>
                <div className="complaints-page__details-image">
                  <img src={selectedComplaint.imageUrl} alt={`Attachment for ${selectedComplaint.title}`} />
                </div>
              </div>
            ) : null}

            <div className="complaints-page__timeline-cta">
              <Button className="complaints-page__secondary-button" onClick={() => setShowTimeline((value) => !value)}>
                {showTimeline ? 'Hide timeline' : 'View timeline →'}
              </Button>
            </div>

            {showTimeline ? (
              <div className="complaints-page__timeline-wrap">
                <ol className="complaints-page__timeline">
                  {getTimelineData(selectedComplaint).map((stage) => (
                    <li
                      key={`${selectedComplaint.id}-${stage.key}`}
                      className={[
                        stage.completed ? 'is-complete' : '',
                        stage.active ? 'is-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span>{stage.label}</span>
                      <small>{stage.at ? getRelativeDate(stage.at) : '-'}</small>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="complaints-page__empty-state">
            No complaint selected yet. Click any row in the table to open details.
          </div>
        )}
      </Card>

      {isReportModalOpen ? (
        <div className="complaints-page__modal-backdrop" role="presentation" onClick={() => setIsReportModalOpen(false)}>
          <div className="complaints-page__modal" role="dialog" aria-modal="true" aria-labelledby="report-new-issue-title" onClick={(event) => event.stopPropagation()}>
            <div className="complaints-page__modal-header">
              <div>
                <p className="complaints-page__eyebrow">Citizen portal</p>
                <h2 id="report-new-issue-title">Report New Issue</h2>
                <p>Submit a complaint without cluttering the main dashboard.</p>
              </div>
              <button className="complaints-page__modal-close" type="button" onClick={() => setIsReportModalOpen(false)} aria-label="Close report form">
                ✕
              </button>
            </div>

            <form className="complaints-page__form complaints-page__modal-form" onSubmit={handleSubmit}>
              <div className="complaints-page__subsection complaints-page__form-field--full">
                <h3>Basic info</h3>
              </div>

              <label>
                Issue title
                <input name="title" value={formData.title} onChange={handleChange} placeholder="Pothole near main gate" required />
              </label>

              <label>
                Category
                <select name="category" value={formData.category} onChange={handleChange}>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Area / Ward
                <input name="area" value={formData.area} onChange={handleChange} placeholder="Ward 8" required />
              </label>

              <label>
                Your name
                <input name="submittedBy" value={formData.submittedBy} onChange={handleChange} placeholder="Citizen name" required />
              </label>

              <label className="complaints-page__form-field--full">
                Details
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  placeholder="Describe what happened and any landmarks near the problem."
                  rows="5"
                  required
                />
              </label>

              {smartSuggestions.length ? (
                <div className="complaints-page__suggestions complaints-page__form-field--full">
                  <p>Similar issues reported nearby:</p>
                  <ul>
                    {smartSuggestions.map((complaint) => (
                      <li key={complaint.id}>
                        <strong>{complaint.title}</strong>
                        <span>{complaint.area} - {getStatusLabel(complaint.status)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="complaints-page__form-field--full complaints-page__advanced-toggle-wrap">
                <Button className="complaints-page__secondary-button" onClick={() => setShowAdvanced((value) => !value)}>
                  {showAdvanced ? 'Hide Advanced (optional)' : 'Show Advanced (optional)'}
                </Button>
              </div>

              {showAdvanced ? (
                <>
                  <div className="complaints-page__subsection complaints-page__form-field--full">
                    <h3>Advanced (optional)</h3>
                  </div>

                  <label>
                    Location point
                    <select name="location" value={formData.location} onChange={handleChange}>
                      <option value="">Select a landmark (optional)</option>
                      {locationOptions.map((location) => (
                        <option key={location.value} value={location.value}>
                          {location.value} ({location.area})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Priority
                    <select name="priority" value={formData.priority} onChange={handleChange}>
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="complaints-page__form-field--full">
                    Upload issue image
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </label>

                  {formData.imageUrl ? (
                    <div className="complaints-page__image-preview complaints-page__form-field--full">
                      <img src={formData.imageUrl} alt="Issue preview" />
                      <p>{formData.imageName || 'Image attached'}</p>
                    </div>
                  ) : null}

                  {selectedLocation ? (
                    <div className="complaints-page__map-preview complaints-page__form-field--full">
                      <p>Location preview</p>
                      <strong>{selectedLocation.value}</strong>
                      <span>{selectedLocation.area} | {selectedLocation.coords}</span>
                    </div>
                  ) : null}
                </>
              ) : null}

              <div className="complaints-page__form-actions">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit complaint'}
                </Button>
              </div>
            </form>

            {successMessage ? <div className="complaints-page__success">{successMessage}</div> : null}
            {error ? <div className="complaints-page__error">{error}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Complaints