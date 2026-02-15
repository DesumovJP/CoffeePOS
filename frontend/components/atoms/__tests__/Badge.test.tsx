import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../Badge/Badge';

describe('Badge', () => {
  it('renders with text content', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('variant-default');
  });

  it('applies primary variant class', () => {
    const { container } = render(<Badge variant="primary">Primary</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('variant-primary');
  });

  it('applies success variant class', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('variant-success');
  });

  it('applies warning variant class', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('variant-warning');
  });

  it('applies error variant class', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('variant-error');
  });

  it('applies info variant class', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('variant-info');
  });

  it('shows as dot when dot prop is true', () => {
    const { container } = render(<Badge dot />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('dot');
  });

  it('does not show children when dot is true', () => {
    const { container } = render(<Badge dot>Hidden text</Badge>);
    expect(container.textContent).toBe('');
  });

  it('applies size class', () => {
    const { container } = render(<Badge size="lg">Large</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('size-lg');
  });

  it('applies pill class', () => {
    const { container } = render(<Badge pill>Pill</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('pill');
  });

  it('applies outline class', () => {
    const { container } = render(<Badge outline>Outline</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('outline');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Custom</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('custom-class');
  });
});
