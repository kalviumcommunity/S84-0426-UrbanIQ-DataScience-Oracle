import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import { createComplaint, fetchComplaintsList } from '../services/api.js'
import './complaints.css'

const initialForm = {
  title: '',
  category: 'Water Supply',
  area: '',
  details: '',
  submittedBy: '',
}

const categoryOptions = ['Water Supply', 'Garbage', 'Road Damage', 'Drainage', 'Street Lights', 'Other']

function getStatusLabel(status) {
  if (status === 'resolved') {
    return 'Resolved'
  }

  if (status === 'in-progress') {
    return 'In progress'
  }

  return 'Pending'
}

function getStatusClass(status) {
  if (status === 'resolved') {
    return 'resolved'
  }

  if (status === 'in-progress') {
    return 'pending'
  }

  return 'open'
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

function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setSuccessMessage('')
      await createComplaint(formData)
      setFormData(initialForm)
      await loadComplaints()
      setSuccessMessage('Your complaint has been submitted and is visible to both users and admins.')
    } catch {
      setError('Unable to submit your complaint right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayComplaints = useMemo(() => complaints.slice(0, 8), [complaints])

  const userSummary = useMemo(() => {
    const total = complaints.length
    const resolved = complaints.filter((complaint) => complaint.status === 'resolved').length
    const open = total - resolved

    return [
      { label: 'My reports', value: total.toLocaleString(), note: 'Visible to the city team' },
      { label: 'Resolved', value: resolved.toLocaleString(), note: 'Closed issues' },
      { label: 'Still open', value: open.toLocaleString(), note: 'In queue or in progress' },
    ]
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
        <div>
          <p className="complaints-page__eyebrow">Citizen portal</p>
          <h1>Report a new issue</h1>
          <p>Submit complaints from the public side and follow the live resolution status.</p>
        </div>
      </div>

      <section className="complaints-page__stats-grid">
        {userSummary.map((card) => (
          <Card key={card.label} className="complaints-page__stat-card">
            <p className="complaints-page__stat-label">{card.label}</p>
            <h2 className="complaints-page__stat-value">{card.value}</h2>
            <p className="complaints-page__stat-note">{card.note}</p>
          </Card>
        ))}
      </section>

      <div className="complaints-page__content-grid">
        <Card className="complaints-page__form-card">
          <div className="complaints-page__section-header">
            <div>
              <h2>Submit complaint</h2>
              <p>Add the issue details so the admin team can act on it.</p>
            </div>
          </div>

          <form className="complaints-page__form" onSubmit={handleSubmit}>
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

            <div className="complaints-page__form-actions">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit complaint'}
              </Button>
            </div>
          </form>

          {successMessage ? <div className="complaints-page__success">{successMessage}</div> : null}
          {error ? <div className="complaints-page__error">{error}</div> : null}
        </Card>

        <Card className="complaints-page__table-card">
          <div className="complaints-page__table-header">
            <div>
              <h2>Submitted complaints</h2>
              <p>Latest complaints visible to the public and admins.</p>
            </div>
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
                  <tr key={complaint.id}>
                    <td>
                      <strong>{complaint.title ?? '-'}</strong>
                      <p>{complaint.details ?? '-'}</p>
                    </td>
                    <td>{complaint.category ?? '-'}</td>
                    <td>{complaint.area ?? '-'}</td>
                    <td>
                      <span className={`complaints-page__status complaints-page__status--${getStatusClass(complaint.status)}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                      <span className="complaints-page__date">{getRelativeDate(complaint.createdAt)}</span>
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

export default Complaints