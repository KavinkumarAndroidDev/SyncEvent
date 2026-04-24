import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../lib/axios';
import Profile from '../../attendee/pages/Profile';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/common/Spinner';

export default function OrganizerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await axiosInstance.get('/organizer/profile');
        setProfile(data);
        setEditData(data);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await axiosInstance.put('/organizer/profile', editData);
      const { data } = await axiosInstance.get('/organizer/profile');
      setProfile(data);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update organization profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner label="Syncing profile..." /></div>;

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Top section: Shared Profile Component for Personal Info & Security */}
      <Profile />

      {/* Bottom section: Organizer-Specific Organization Profile */}
      <div className="view-container" style={{ maxWidth: '800px', margin: '40px auto 0 auto' }}>
        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Organization Profile</h3>
              <p style={{ color: 'var(--neutral-400)', fontSize: 13, marginTop: 4 }}>This information represents your organization to attendees.</p>
            </div>
            {!isEditing && (
              <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit Organization</Button>
            )}
          </div>

          {isEditing ? (
            <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <label className="form-label">Organization Name</label>
                  <input className="form-input" value={editData.organizationName || ''} onChange={e => setEditData({...editData, organizationName: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Official Website</label>
                  <input className="form-input" placeholder="https://example.com" value={editData.website || ''} onChange={e => setEditData({...editData, website: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <label className="form-label">Instagram Handle</label>
                  <input className="form-input" placeholder="@organization" value={editData.instagram || ''} onChange={e => setEditData({...editData, instagram: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">LinkedIn Page</label>
                  <input className="form-input" placeholder="linkedin.com/company/..." value={editData.linkedin || ''} onChange={e => setEditData({...editData, linkedin: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">About the Organization</label>
                <textarea className="form-input" rows={5} placeholder="Tell attendees about your organization..." value={editData.bio || editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value, bio: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleUpdate}>Save Organization Profile</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization</label>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: 'var(--neutral-800)' }}>{profile.organizationName || 'Not Set'}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</label>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: 'var(--primary)' }}>{profile.website || 'Not Set'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</label>
                <div style={{ fontSize: 14, color: 'var(--neutral-600)', marginTop: 8, lineHeight: 1.6 }}>{profile.description || profile.bio || 'No biography provided yet.'}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Social Links</label>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  {profile.instagram && <span style={{ fontSize: 13, color: 'var(--neutral-600)' }}>Instagram: <strong>{profile.instagram}</strong></span>}
                  {profile.linkedin && <span style={{ fontSize: 13, color: 'var(--neutral-600)' }}>LinkedIn: <strong>{profile.linkedin}</strong></span>}
                  {!profile.instagram && !profile.linkedin && <span style={{ fontSize: 13, color: 'var(--neutral-400)' }}>No social links added.</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}