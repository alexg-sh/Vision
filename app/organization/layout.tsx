import React from 'react'
import DashboardHeader from '@/components/dashboard-header'

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  )
}
