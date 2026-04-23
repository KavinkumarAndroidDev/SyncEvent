import { useEffect, useState } from 'react';

export default function SearchBar({ onSearch, value = '' }) {
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(input.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        className="search-input"
        type="text"
        placeholder="Search events..."
        value={input}
        onChange={(e) => {
          const nextValue = e.target.value;
          setInput(nextValue);
          if (!nextValue.trim()) {
            onSearch('');
          }
        }}
      />
      <button type="submit" className="search-btn">
        Search
      </button>
    </form>
  );
}
