import { render, screen, fireEvent } from '@testing-library/react'
import { Button, buttonVariants, ButtonProps } from './button' // Import ButtonProps
import { Slot } from '@radix-ui/react-slot'

describe('Button component', () => {
  it('renders its children', () => {
    render(<Button>Test Button</Button>)
    expect(screen.getByText('Test Button')).toBeInTheDocument()
  })

  // Test different variants
  // Define the variants explicitly with the correct type
  const variants: NonNullable<ButtonProps['variant']>[] = [
    'default',
    'destructive',
    'outline',
    'secondary',
    'ghost',
    'link',
  ]
  variants.forEach((variant) => {
    it(`renders correctly with variant: ${variant}`, () => {
      render(<Button variant={variant}>Variant Button</Button>)
      const button = screen.getByText('Variant Button')
      expect(button).toBeInTheDocument()
      // You could add more specific class checks here if needed
      // Example: expect(button).toHaveClass(buttonVariants({ variant }))
    })
  })

  // Test different sizes
  // Define the sizes explicitly with the correct type
  const sizes: NonNullable<ButtonProps['size']>[] = [
    'default',
    'sm',
    'lg',
    'icon',
  ]
  sizes.forEach((size) => {
    it(`renders correctly with size: ${size}`, () => {
      render(<Button size={size}>{size === 'icon' ? 'i' : 'Size Button'}</Button>)
      const button = screen.getByText(size === 'icon' ? 'i' : 'Size Button')
      expect(button).toBeInTheDocument()
      // Example: expect(button).toHaveClass(buttonVariants({ size }))
    })
  })

  it('handles onClick event', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click Me</Button>)
    const button = screen.getByText('Click Me')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders as a different element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/">Link Button</a>
      </Button>
    )
    const linkButton = screen.getByText('Link Button')
    expect(linkButton.tagName).toBe('A')
    expect(linkButton).toHaveAttribute('href', '/')
  })

  it('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>)
    const button = screen.getByText('Disabled Button')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })
})