import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);

    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders primary variant by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('variant-primary');
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('variant-secondary');
  });

  it('renders danger variant', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('variant-danger');
  });

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('variant-ghost');
  });

  it('renders success variant', () => {
    render(<Button variant="success">Success</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('variant-success');
  });

  it('applies size class', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('size-lg');
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('fullWidth');
  });

  it('has type="button" by default', () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('allows overriding type', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
