const tickerItems = [
  'Ward 3: Street Light Fixed 10m ago',
  'Ward 12: Water Pipe Leak Resolved 24m ago',
  'Ward 5: Garbage Pickup Completed 40m ago',
  'Ward 8: Pothole Filled 1h ago',
]

function LiveTicker() {
  return (
    <div className="live-ticker" role="status" aria-live="polite">
      <span className="live-ticker__pulse" aria-hidden="true" />
      <span className="live-ticker__label">Live ticker</span>
      <div className="live-ticker__viewport" aria-hidden="true">
        <div className="live-ticker__track">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`} className="live-ticker__item">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LiveTicker
