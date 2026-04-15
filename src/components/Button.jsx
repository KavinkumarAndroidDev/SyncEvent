export default function Button({ children, loading, variant = 'primary', className = '', ...props }) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-outline-sm',
    danger: 'btn-submit-danger',
    table: 'btn-table'
  }[variant] || 'btn-primary';

  return (
    <button 
      className={`${variantClass} ${className}`} 
      disabled={loading || props.disabled} 
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}