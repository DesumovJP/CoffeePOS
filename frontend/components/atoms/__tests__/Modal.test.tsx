import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../Modal/Modal';

describe('Modal', () => {
  const defaultProps = {
    onClose: vi.fn(),
  };

  it('renders children when isOpen is true', () => {
    render(
      <Modal {...defaultProps} isOpen={true}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders children when open is true', () => {
    render(
      <Modal {...defaultProps} open={true}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal {...defaultProps} isOpen={false}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('does not render when neither open nor isOpen is provided', () => {
    render(
      <Modal {...defaultProps}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Modal {...defaultProps} isOpen={true} title="Test Title">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('has role="dialog"', () => {
    render(
      <Modal {...defaultProps} isOpen={true}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    render(
      <Modal {...defaultProps} isOpen={true}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} isOpen={true}>
        <p>Content</p>
      </Modal>
    );

    // The backdrop is the element with role="presentation"
    const backdrop = screen.getByRole('presentation');
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} isOpen={true}>
        <p>Content</p>
      </Modal>
    );

    await user.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose on backdrop click when closeOnBackdrop is false', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} isOpen={true} closeOnBackdrop={false}>
        <p>Content</p>
      </Modal>
    );

    const backdrop = screen.getByRole('presentation');
    await user.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders close button by default', () => {
    render(
      <Modal {...defaultProps} isOpen={true}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByLabelText('Закрити')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} isOpen={true} title="Title">
        <p>Content</p>
      </Modal>
    );

    await user.click(screen.getByLabelText('Закрити'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Modal {...defaultProps} isOpen={true} footer={<button>Save</button>}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});
