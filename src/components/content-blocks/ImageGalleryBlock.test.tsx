import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageGalleryBlock } from './ImageGalleryBlock';

describe('ImageGalleryBlock', () => {
  const defaultContent = {
    images: [
      { url: 'https://example.com/img1.jpg', alt: 'Image 1', caption: 'First image' },
      { url: 'https://example.com/img2.jpg', alt: 'Image 2' },
    ],
  };

  it('renders images', () => {
    render(
      <ImageGalleryBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('alt', 'Image 1');
    expect(images[1]).toHaveAttribute('alt', 'Image 2');
  });

  it('renders captions when provided', () => {
    render(
      <ImageGalleryBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('First image')).toBeInTheDocument();
  });

  it('renders delete button', () => {
    render(
      <ImageGalleryBlock
        content={defaultContent}
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
      <ImageGalleryBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByLabelText('Delete block'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders add image button in edit mode', () => {
    render(
      <ImageGalleryBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Add Image')).toBeInTheDocument();
  });

  it('does not render add image button or delete in readOnly mode', () => {
    render(
      <ImageGalleryBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        readOnly
      />,
    );

    expect(screen.queryByText('Add Image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete block')).not.toBeInTheDocument();
  });

  it('renders remove buttons for individual images in edit mode', () => {
    render(
      <ImageGalleryBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const removeButtons = screen.getAllByLabelText('Remove image');
    expect(removeButtons).toHaveLength(2);
  });

  it('removes individual image when remove button clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageGalleryBlock
        content={defaultContent}
        onChange={onChange}
        onDelete={vi.fn()}
      />,
    );

    const removeButtons = screen.getAllByLabelText('Remove image');
    await user.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith({
      images: [{ url: 'https://example.com/img2.jpg', alt: 'Image 2' }],
    });
  });
});
