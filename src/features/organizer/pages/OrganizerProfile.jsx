import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../../../lib/axios';
import SharedProfilePage from '../../../components/shared/SharedProfilePage';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/common/Spinner';
import Modal from '../../../components/ui/Modal';

const FIELD_LABEL = {
  fontSize: 11, fontWeight: 700, color: 'var(--neutral-400)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block',
};

const CARD = {
  background: 'white', border: '1px solid var(--neutral-100)',
  borderRadius: 20, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
};

export default function OrganizerProfile() {
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(`/users/${user.id}/organizer-profile`)
      .then(({ data }) => { setProfile(data); setEditData(data); })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      const { data } = await axiosInstance.put(`/users/${user.id}/organizer-profile`, {
        ...editData,
        currentPassword: confirmPassword,
      });
      setProfile(data);
      setEditData(data);
      setIsEditing(false);
      setShowConfirm(false);
      setConfirmPassword('');
      showToast('Organization profile saved.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save. Check your password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const OrgSection = (
    <div className="profile-card-box" style={CARD}>
      <div className="profile-card-head" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--neutral-50)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Organization Profile</h3>
          <p style={{ fontSize: 13, color: 'var(--neutral-400)', marginTop: 3 }}>
            Public details visible to attendees on your events
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="secondary"
            onClick={() => { setIsEditing(true); if (!editData && profile) setEditData(profile); }}
            style={{ marginLeft: 'auto' }}
          >
            Edit
          </Button>
        )}
      </div>

      {toast.msg && (
        <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {toast.msg}
        </div>
      )}

      {profileLoading ? (
        <Spinner label="Loading organization..." />
      ) : isEditing ? (
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="org-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={FIELD_LABEL}>Organization Name</label>
              <input className="form-input" value={editData.organizationName || ''} onChange={e => setEditData(p => ({ ...p, organizationName: e.target.value }))} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Official Website</label>
              <input className="form-input" placeholder="https://example.com" value={editData.website || ''} onChange={e => setEditData(p => ({ ...p, website: e.target.value }))} />
            </div>
          </div>
          <div className="org-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={FIELD_LABEL}>Instagram Handle</label>
              <input className="form-input" placeholder="@yourorg" value={editData.instagram || ''} onChange={e => setEditData(p => ({ ...p, instagram: e.target.value }))} />
            </div>
            <div>
              <label style={FIELD_LABEL}>LinkedIn Page</label>
              <input className="form-input" placeholder="linkedin.com/company/..." value={editData.linkedin || ''} onChange={e => setEditData(p => ({ ...p, linkedin: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={FIELD_LABEL}>About the Organization</label>
            <textarea
              className="form-input" rows={4}
              placeholder="Tell attendees about your organization..."
              value={editData.bio || editData.description || ''}
              onChange={e => setEditData(p => ({ ...p, description: e.target.value, bio: e.target.value }))}
            />
          </div>
          <div className="profile-action-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="secondary" onClick={() => { setIsEditing(false); setEditData(profile || {}); }}>Cancel</Button>
            <Button onClick={() => setShowConfirm(true)}>Save Changes</Button>
          </div>
        </div>
      ) : profile ? (
        <div className="org-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { label: 'Organization', value: profile.organizationName },
            { label: 'Website', value: profile.website, isLink: true },
          ].map(f => (
            <div key={f.label}>
              <label style={FIELD_LABEL}>{f.label}</label>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--neutral-800)' }}>
                {f.value
                  ? (f.isLink
                    ? <a href={f.value} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', wordBreak: 'break-all' }}>{f.value}</a>
                    : f.value)
                  : <span style={{ color: 'var(--neutral-300)' }}>—</span>}
              </div>
            </div>
          ))}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={FIELD_LABEL}>About</label>
            <div style={{ fontSize: 14, color: 'var(--neutral-600)', lineHeight: 1.7 }}>
              {profile.description || profile.bio || <span style={{ color: 'var(--neutral-300)' }}>No description yet.</span>}
            </div>
          </div>
          <div>
            <label style={FIELD_LABEL}>Social Links</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {profile.instagram && (
                <span style={{ fontSize: 13, color: 'var(--neutral-600)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  {profile.instagram}
                </span>
              )}
              {profile.linkedin && (
                <span style={{ fontSize: 13, color: 'var(--neutral-600)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  {profile.linkedin}
                </span>
              )}
              {!profile.instagram && !profile.linkedin && <span style={{ fontSize: 13, color: 'var(--neutral-300)' }}>No social links added.</span>}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px 0', color: 'var(--neutral-400)', fontSize: 14 }}>
          Organization profile not set up yet.{' '}
          <button onClick={() => setIsEditing(true)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Set it up
          </button>
        </div>
      )}

      <Modal
        isOpen={showConfirm}
        title="Confirm with Password"
        onClose={() => { setShowConfirm(false); setConfirmPassword(''); }}
        actions={
          <>
            <Button variant="secondary" onClick={() => { setShowConfirm(false); setConfirmPassword(''); }}>Cancel</Button>
            <Button loading={saving} disabled={!confirmPassword} onClick={handleSave}>Confirm & Save</Button>
          </>
        }
      >
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--neutral-600)', lineHeight: 1.6 }}>
          Enter your current account password to save changes to your organization profile.
        </p>
        <input
          className="form-input"
          type="password"
          placeholder="Your current password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && confirmPassword) handleSave(); }}
          autoFocus
        />
      </Modal>
    </div>
  );

  return <SharedProfilePage>{OrgSection}</SharedProfilePage>;
}
