import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoEmbedBlock } from './VideoEmbedBlock';

describe('VideoEmbedBlock', () => {
  const youtubeContent = {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    caption: 'Demo video',
  };

  const vimeoContent = {
    url: 'https://vimeo.com/123456789',
  };

  it('renders YouTube video iframe', () => {
    render(
      <VideoEmbedBlock
        content={youtubeContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const iframe = screen.getByTitle('Video embed');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('renders Vimeo video iframe', () => {
    render(
      <VideoEmbedBlock
        content={vimeoContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const iframe = screen.getByTitle('Video embed');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toContain('player.vimeo.com/video/123456789');
  });

  it('renders caption when provided', () => {
    render(
      <VideoEmbedBlock
        content={youtubeContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Demo video')).toBeInTheDocument();
  });

  it('renders delete button', () => {
    render(
      <VideoEmbedBlock
        content={youtubeContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Delete block')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <VideoEmbedBlock
        content={youtubeContent}
        onChange={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByLabelText('Delete block'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders URL input in edit mode', () => {
    render(
      <VideoEmbedBlock
        content={youtubeContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText('Paste YouTube or Vimeo URL')).toBeInTheDocument();
  });

  it('does not render URL input or delete button in readOnly mode', () => {
    render(
      <VideoEmbedBlock
        content={youtubeContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        readOnly
      />,
    );

    expect(screen.queryByPlaceholderText('Paste YouTube or Vimeo URL')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete block')).not.toBeInTheDocument();
  });

  it('shows placeholder for unsupported URLs', () => {
    render(
      <VideoEmbedBlock
        content={{ url: 'https://example.com/video' }}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/Unsupported video URL/)).toBeInTheDocument();
  });
});
