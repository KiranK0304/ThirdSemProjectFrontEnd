import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import styles from './Landing.module.css'

export default function Landing() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(search.trim())}`)
    } else {
      navigate('/jobs')
    }
  }

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1>Find work that matters</h1>
        <p>Discover opportunities that align with your skills and passions.</p>
        
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <div className={styles.searchInput}>
            <Input 
              placeholder="Search by job title or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="primary" type="submit">Search Jobs</Button>
        </form>
      </section>

      <section className={styles.valueProps}>
        <div className={styles.valueProp}>
          <h3>Browse open positions</h3>
          <p>Explore a curated list of jobs from top companies around the world.</p>
        </div>
        <div className={styles.valueProp}>
          <h3>Apply with one click</h3>
          <p>Upload your resume once and apply to multiple jobs effortlessly.</p>
        </div>
        <div className={styles.valueProp}>
          <h3>Track your progress</h3>
          <p>Monitor your application status and stay informed every step of the way.</p>
        </div>
      </section>
    </div>
  )
}
