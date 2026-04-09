import './ui.css'

function Loader() {
  return (
    <div className="ui-loader" role="status" aria-label="Loading">
      <span className="ui-loader__spinner" />
    </div>
  )
}

export default Loader