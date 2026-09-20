import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Input, TextArea, Button, Tag } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useUpdateProfile } from '@/hooks/queries/useAuthQueries';
import { extractApiError } from '@/api/utils';
import { FiExternalLink } from 'react-icons/fi';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    tagline: '',
    website: '',
    description: '',
    company_size: '',
    headquarters: '',
    founded_year: '',
    perksInput: '',
    social_linkedin: '',
    social_twitter: '',
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const ep = user.employer_profile;
      setFormData({
        name: user.name || '',
        company_name: ep?.company_name || '',
        tagline: ep?.tagline || '',
        website: ep?.website || '',
        description: ep?.description || '',
        company_size: ep?.company_size || '',
        headquarters: ep?.headquarters || '',
        founded_year: ep?.founded_year != null ? String(ep.founded_year) : '',
        perksInput: Array.isArray(ep?.perks) ? ep.perks.join(', ') : '',
        social_linkedin: ep?.social_linkedin || '',
        social_twitter: ep?.social_twitter || '',
      });
    }
  }, [user]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    const parsedPerks = formData.perksInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      await updateProfile.mutateAsync({
        name: formData.name,
        employer_profile: {
          company_name: formData.company_name,
          tagline: formData.tagline,
          website: formData.website,
          description: formData.description,
          company_size: formData.company_size,
          headquarters: formData.headquarters,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          perks: parsedPerks,
          social_linkedin: formData.social_linkedin,
          social_twitter: formData.social_twitter,
        },
      });
      setSuccessMessage('Company profile updated successfully.');
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  const verificationStatus = user?.employer_profile?.verification_status || 'PENDING';
  const statusVariant =
    verificationStatus === 'APPROVED' ? 'success' : verificationStatus === 'REJECTED' ? 'danger' : 'warning';
  const employerId = user?.employer_profile?.id;

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className={styles.title}>Company Profile & Branding</h1>
        {employerId && (
          <Link
            to={`/companies/${employerId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--color-accent)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <span>View Public Showcase</span>
            <FiExternalLink size={13} />
          </Link>
        )}
      </div>

      <div className={styles.statusNotice}>
        <span>Verification Status:</span>
        <Tag variant={statusVariant}>{verificationStatus}</Tag>
      </div>

      <Card className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          {apiError && <div className={styles.errorMessage}>{apiError}</div>}
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className={styles.field}>
              <Input
                label="Account Contact Name *"
                required
                value={formData.name}
                onChange={handleChange('name')}
              />
            </div>

            <div className={styles.field}>
              <Input
                label="Company Name *"
                required
                value={formData.company_name}
                onChange={handleChange('company_name')}
              />
            </div>
          </div>

          <div className={styles.field} style={{ marginBottom: 16 }}>
            <Input
              label="Company Tagline"
              placeholder="e.g. Next-generation platform for distributed developer tooling"
              value={formData.tagline}
              onChange={handleChange('tagline')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className={styles.field}>
              <Input
                label="Headquarters"
                placeholder="e.g. San Francisco, CA"
                value={formData.headquarters}
                onChange={handleChange('headquarters')}
              />
            </div>

            <div className={styles.field}>
              <Input
                label="Company Size"
                placeholder="e.g. 50-200"
                value={formData.company_size}
                onChange={handleChange('company_size')}
              />
            </div>

            <div className={styles.field}>
              <Input
                label="Founded Year"
                type="number"
                placeholder="e.g. 2021"
                value={formData.founded_year}
                onChange={handleChange('founded_year')}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className={styles.field}>
              <Input
                label="Website URL"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleChange('website')}
              />
            </div>

            <div className={styles.field}>
              <Input
                label="LinkedIn Profile URL"
                type="url"
                placeholder="https://linkedin.com/company/..."
                value={formData.social_linkedin}
                onChange={handleChange('social_linkedin')}
              />
            </div>

            <div className={styles.field}>
              <Input
                label="Twitter / X Profile URL"
                type="url"
                placeholder="https://x.com/..."
                value={formData.social_twitter}
                onChange={handleChange('social_twitter')}
              />
            </div>
          </div>

          <div className={styles.field} style={{ marginBottom: 16 }}>
            <Input
              label="Culture & Employee Perks (comma-separated)"
              placeholder="e.g. Remote-first policy, Comprehensive Health Insurance, $2k Learning Stipend, Equity packages"
              value={formData.perksInput}
              onChange={handleChange('perksInput')}
            />
          </div>

          <div className={styles.field} style={{ marginBottom: 20 }}>
            <TextArea
              label="Company About / Mission"
              rows={4}
              placeholder="Describe your company culture, technology stack, and engineering mission..."
              value={formData.description}
              onChange={handleChange('description')}
            />
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={updateProfile.isPending}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
