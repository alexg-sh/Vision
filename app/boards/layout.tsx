import React from 'react'
import DashboardHeader from '@/components/dashboard-header'

export default function BoardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  )
}
