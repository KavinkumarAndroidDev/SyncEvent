import { useState } from 'react';

export default function FiltersSidebar({ categories, venues, filters, onFilterChange, onClear }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Extract unique cities from venues
  const cities = [...new Set(venues.map(v => v.city))].filter(Boolean);

  const handleCategoryChange = (catId) => {
    onFilterChange({ categoryId: filters.categoryId === String(catId) ? '' : String(catId) });
  };

  const handleCityChange = (city) => {
    onFilterChange({ city: filters.city === city ? '' : city });
  };

  const handleSortChange = (sort) => {
    onFilterChange({ sort });
  };

  const handlePriceChange = (name, value) => {
    onFilterChange({ [name]: value });
  };

  const sectionLabelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--neutral-900)',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  };

  const scrollBoxStyle = {
    maxHeight: '180px',
    overflowY: 'auto',
    paddingRight: '8px',
    marginRight: '-8px'
  };

  return (
    <div>
      <button 
        className="filter-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
        </svg>
        {isOpen ? 'Hide Filters' : 'Show Filters'}
      </button>

      <div className={`filter-sidebar-content ${isOpen ? 'is-open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Filters</h3>
          <button onClick={onClear} className="btn-link" style={{ padding: 0, fontSize: '13px', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer' }}>Clear All</button>
        </div>

      {/* Sort */}
      <div className="filter-section" style={{ marginBottom: '24px' }}>
        <span style={sectionLabelStyle}>Sort By</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input 
              type="radio" 
              name="sort" 
              checked={filters.sort === 'startTime,asc'} 
              onChange={() => handleSortChange('startTime,asc')} 
            /> Date (Soonest)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input 
              type="radio" 
              name="sort" 
              checked={filters.sort === 'price,asc'} 
              onChange={() => handleSortChange('price,asc')} 
            /> Price (Low to High)
          </label>
           <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input 
              type="radio" 
              name="sort" 
              checked={filters.sort === 'price,desc'} 
              onChange={() => handleSortChange('price,desc')} 
            /> Price (High to Low)
          </label>
        </div>
      </div>

      <div className="filter-section" style={{ marginBottom: '24px' }}>
        <span style={sectionLabelStyle}>Price Range</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input
            className="form-input"
            type="number"
            min="0"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => handlePriceChange('minPrice', e.target.value)}
          />
          <input
            className="form-input"
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
          />
        </div>
      </div>

      {/* City */}
      <div className="filter-section" style={{ marginBottom: '24px' }}>
        <span style={sectionLabelStyle}>City</span>
        <div style={scrollBoxStyle}>
          {cities.length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>No cities available</p>}
          {cities.map(city => (
            <label key={city} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px', fontSize: '14px' }}>
              <input 
                type="checkbox" 
                style={{ width: '16px', height: '16px' }}
                checked={filters.city === city}
                onChange={() => handleCityChange(city)}
              /> {city}
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="filter-section" style={{ marginBottom: '32px' }}>
        <span style={sectionLabelStyle}>Categories</span>
        <div style={scrollBoxStyle}>
          {categories.length === 0 && <p style={{ fontSize: '12px', color: '#999', padding: '10px 0' }}>Loading...</p>}
          {categories.map(cat => (
            <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px', fontSize: '14px' }}>
              <input 
                type="checkbox" 
                style={{ width: '16px', height: '16px' }}
                checked={String(filters.categoryId) === String(cat.id)}
                onChange={() => handleCategoryChange(cat.id)}
              /> {cat.name}
            </label>
          ))}
        </div>
      </div>

      <button 
        className="btn-primary" 
        style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 600 }} 
        onClick={() => onFilterChange({})}
      >
        Apply Filters
      </button>
      </div>
    </div>
  );
}
