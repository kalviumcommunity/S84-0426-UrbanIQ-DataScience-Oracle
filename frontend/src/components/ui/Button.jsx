import './ui.css'

function Button({ children, className = '', type = 'button', ...props }) {
  return (
    <button className={`ui-button ${className}`.trim()} type={type} {...props}>
      {children}
    </button>
  )
}

export default Button