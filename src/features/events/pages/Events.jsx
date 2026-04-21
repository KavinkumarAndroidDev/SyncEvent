import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchEvents } from '../slices/eventsSlice';

import FiltersSidebar from '../components/FiltersSidebar';
import SearchBar from '../components/SearchBar';
import EventsGrid from '../components/EventsGrid';
import Pagination from '../../../components/ui/Pagination';

export default function Events() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { list, totalPages, loading, error } = useSelector((s) => s.events);
  const { categories, venues } = useSelector((s) => s.metadata);
  const queryCategoryId = searchParams.get('categoryId') || '';

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    categoryId: queryCategoryId,
    city: searchParams.get('city') || '',
    venueId: '',
    sort: 'startTime,asc'
  });

  useEffect(() => {
    const params = {
      page,
      size: 12,
      search: search || undefined,
      categoryId: (filters.categoryId || queryCategoryId) || undefined,
      venueId: filters.venueId || undefined,
      city: filters.city || undefined,
      sort: filters.sort
    };
    dispatch(fetchEvents(params));
  }, [dispatch, page, search, filters, queryCategoryId]);

  return (
    <main>
      <div className="events-page-header">
        <div className="events-page-container">
          <h1 className="events-page-title">All Events</h1>
          <SearchBar onSearch={(val) => {
            setPage(0);
            setSearch(val);
          }} defaultValue={search} />
        </div>
      </div>

      <section className="events-section" style={{ padding: '48px 0' }}>
        <div className="events-page-container">
          <div className="events-layout">
            <div className="events-sidebar-wrap">
              <FiltersSidebar 
                categories={categories} 
                venues={venues}
                filters={{ ...filters, categoryId: filters.categoryId || queryCategoryId }}
                onFilterChange={(newFilters) => {
                  setPage(0);
                  setFilters(prev => ({ ...prev, ...newFilters }));
                }}
                onClear={() => {
                  setPage(0);
                  setFilters({ categoryId: '', city: '', venueId: '', sort: 'startTime,asc' });
                  setSearchParams({});
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              {loading && <p className="events-status">Loading events...</p>}

              {error && (
                <div className="events-status">
                  <p>Could not load events.</p>
                  <button onClick={() => dispatch(fetchEvents({ page }))} className="retry-btn">
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && list.length === 0 && (
                <p className="events-status">No events found matching your criteria.</p>
              )}

              {!loading && list.length > 0 && (
                <>
                  <EventsGrid events={list} />
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
