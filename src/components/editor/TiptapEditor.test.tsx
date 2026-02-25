import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TiptapEditor } from './TiptapEditor';

describe('TiptapEditor', () => {
  it('renders the editor area', () => {
    render(<TiptapEditor onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder text', () => {
    render(
      <TiptapEditor
        onChange={vi.fn()}
        placeholder="Type here..."
      />,
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the toolbar', () => {
    render(<TiptapEditor onChange={vi.fn()} />);
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
  });

  it('shows character count when maxLength is set', () => {
    render(
      <TiptapEditor
        onChange={vi.fn()}
        maxLength={500}
      />,
    );
    expect(screen.getByText(/\/ 500/)).toBeInTheDocument();
  });

  it('does not show character count when maxLength is not set', () => {
    render(<TiptapEditor onChange={vi.fn()} />);
    expect(screen.queryByText(/\/ \d+/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TiptapEditor onChange={vi.fn()} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows image button in toolbar when onImageUpload is provided', () => {
    const mockUpload = vi.fn().mockResolvedValue('https://example.com/img.png');
    render(<TiptapEditor onChange={vi.fn()} onImageUpload={mockUpload} />);
    expect(screen.getByLabelText('Insert Image')).toBeInTheDocument();
  });

  it('does not show image button when onImageUpload is not provided', () => {
    render(<TiptapEditor onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Insert Image')).not.toBeInTheDocument();
  });

  it('does not show upload overlay initially', () => {
    render(<TiptapEditor onChange={vi.fn()} onImageUpload={vi.fn()} />);
    expect(screen.queryByTestId('upload-overlay')).not.toBeInTheDocument();
  });
});
