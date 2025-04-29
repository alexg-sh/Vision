import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge component', () => {
  it('renders its children', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })
})