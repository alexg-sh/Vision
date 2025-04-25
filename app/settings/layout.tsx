import React from 'react'
import DashboardHeader from '@/components/dashboard-header'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  )
}
