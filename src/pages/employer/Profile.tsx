import React, { useState, useEffect } from 'react';
import { Card, Input, TextArea, Button, Tag } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useUpdateProfile } from '@/hooks/queries/useAuthQueries';
import { extractApiError } from '@/api/utils';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    website: '',
    description: ''
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        company_name: user.employer_profile?.company_name || '',
        website: user.employer_profile?.website || '',
        description: user.employer_profile?.description || ''
      });
    }
  }, [user]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    try {
      await updateProfile.mutateAsync({
        name: formData.name,
        employer_profile: {
          company_name: formData.company_name,
          website: formData.website,
          description: formData.description
        }
      });
      setSuccessMessage('Profile updated successfully.');
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  const verificationStatus = user?.employer_profile?.verification_status || 'PENDING';
  const statusVariant = verificationStatus === 'APPROVED' ? 'success' : verificationStatus === 'REJECTED' ? 'danger' : 'warning';

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Company Profile</h1>
      
      <div className={styles.statusNotice}>
        <span>Verification Status:</span>
        <Tag variant={statusVariant}>{verificationStatus}</Tag>
      </div>

      <Card className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          {apiError && <div className={styles.errorMessage}>{apiError}</div>}
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

          <div className={styles.field}>
            <Input 
              label="Your Name" 
              required 
              value={formData.name} 
              onChange={handleChange('name')} 
            />
          </div>

          <div className={styles.field}>
            <Input 
              label="Company Name" 
              required 
              value={formData.company_name} 
              onChange={handleChange('company_name')} 
            />
          </div>

          <div className={styles.field}>
            <Input 
              label="Website" 
              type="url"
              value={formData.website} 
              onChange={handleChange('website')} 
            />
          </div>

          <div className={styles.field}>
            <TextArea 
              label="Company Description" 
              rows={4} 
              value={formData.description} 
              onChange={handleChange('description')} 
            />
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={updateProfile.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
