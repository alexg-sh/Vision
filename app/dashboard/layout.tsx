import React from 'react'
import DashboardHeader from '@/components/dashboard-header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  )
}
