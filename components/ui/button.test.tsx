import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button component', () => {
  it('renders its children', () => {
    render(<Button>Test Button</Button>)
    expect(screen.getByText('Test Button')).toBeInTheDocument()
  })
})