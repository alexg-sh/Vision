import React from 'react'
import DashboardHeader from '@/components/dashboard-header'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  )
}