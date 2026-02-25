import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TiptapToolbar } from './TiptapToolbar';
import type { Editor } from '@tiptap/react';

function createMockEditor(overrides: Partial<Editor> = {}): Editor {
  return {
    isActive: vi.fn().mockReturnValue(false),
    can: vi.fn().mockReturnValue({
      chain: vi.fn().mockReturnValue({
        focus: vi.fn().mockReturnValue({
          toggleBold: vi.fn().mockReturnValue({ run: vi.fn() }),
          toggleItalic: vi.fn().mockReturnValue({ run: vi.fn() }),
          toggleHeading: vi.fn().mockReturnValue({ run: vi.fn() }),
          toggleBulletList: vi.fn().mockReturnValue({ run: vi.fn() }),
          toggleOrderedList: vi.fn().mockReturnValue({ run: vi.fn() }),
          setLink: vi.fn().mockReturnValue({ run: vi.fn() }),
          unsetLink: vi.fn().mockReturnValue({ run: vi.fn() }),
        }),
      }),
    }),
    chain: vi.fn().mockReturnValue({
      focus: vi.fn().mockReturnValue({
        toggleBold: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleItalic: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleHeading: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleBulletList: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleOrderedList: vi.fn().mockReturnValue({ run: vi.fn() }),
        setLink: vi.fn().mockReturnValue({ run: vi.fn() }),
        unsetLink: vi.fn().mockReturnValue({ run: vi.fn() }),
      }),
    }),
    ...overrides,
  } as unknown as Editor;
}

describe('TiptapToolbar', () => {
  it('renders all formatting buttons', () => {
    const editor = createMockEditor();
    render(<TiptapToolbar editor={editor} />);

    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Heading 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Heading 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Heading 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet List')).toBeInTheDocument();
    expect(screen.getByLabelText('Ordered List')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
  });

  it('returns null when editor is null', () => {
    const { container } = render(<TiptapToolbar editor={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls editor chain on bold button click', async () => {
    const user = userEvent.setup();
    const mockRun = vi.fn();
    const editor = createMockEditor();
    (editor.chain as ReturnType<typeof vi.fn>).mockReturnValue({
      focus: vi.fn().mockReturnValue({
        toggleBold: vi.fn().mockReturnValue({ run: mockRun }),
        toggleItalic: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleHeading: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleBulletList: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleOrderedList: vi.fn().mockReturnValue({ run: vi.fn() }),
        setLink: vi.fn().mockReturnValue({ run: vi.fn() }),
        unsetLink: vi.fn().mockReturnValue({ run: vi.fn() }),
      }),
    });

    render(<TiptapToolbar editor={editor} />);
    await user.click(screen.getByLabelText('Bold'));
    expect(mockRun).toHaveBeenCalled();
  });

  it('shows active state for active formats', () => {
    const editor = createMockEditor();
    (editor.isActive as ReturnType<typeof vi.fn>).mockImplementation(
      (type: string) => type === 'bold',
    );

    render(<TiptapToolbar editor={editor} />);
    const boldButton = screen.getByLabelText('Bold');
    expect(boldButton).toHaveAttribute('data-state', 'on');
  });

  it('does not show image button when onImageUpload is not provided', () => {
    const editor = createMockEditor();
    render(<TiptapToolbar editor={editor} />);
    expect(screen.queryByLabelText('Insert Image')).not.toBeInTheDocument();
  });

  it('shows image button when onImageUpload is provided', () => {
    const editor = createMockEditor();
    render(<TiptapToolbar editor={editor} onImageUpload={vi.fn()} />);
    expect(screen.getByLabelText('Insert Image')).toBeInTheDocument();
  });

  it('opens file picker when image button is clicked', async () => {
    const user = userEvent.setup();
    const editor = createMockEditor();
    render(<TiptapToolbar editor={editor} onImageUpload={vi.fn()} />);

    const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    await user.click(screen.getByLabelText('Insert Image'));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('calls onImageUpload when a file is selected', async () => {
    const user = userEvent.setup();
    const onImageUpload = vi.fn().mockResolvedValue(undefined);
    const editor = createMockEditor();
    render(<TiptapToolbar editor={editor} onImageUpload={onImageUpload} />);

    const fileInput = screen.getByTestId('image-file-input');
    const file = new File(['img'], 'test.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    expect(onImageUpload).toHaveBeenCalledWith(file);
  });

  it('does not show template buttons when callbacks are not provided', () => {
    const editor = createMockEditor();
    render(<TiptapToolbar editor={editor} />);
    expect(screen.queryByLabelText('Insert Template')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Save as Template')).not.toBeInTheDocument();
  });

  it('shows Insert Template button when onInsertTemplate is provided', () => {
    const editor = createMockEditor();
    render(
      <TiptapToolbar editor={editor} onInsertTemplate={vi.fn()} />,
    );
    expect(screen.getByLabelText('Insert Template')).toBeInTheDocument();
  });

  it('calls onInsertTemplate when Insert Template button is clicked', async () => {
    const user = userEvent.setup();
    const onInsertTemplate = vi.fn();
    const editor = createMockEditor();
    render(
      <TiptapToolbar editor={editor} onInsertTemplate={onInsertTemplate} />,
    );

    await user.click(screen.getByLabelText('Insert Template'));
    expect(onInsertTemplate).toHaveBeenCalled();
  });

  it('shows Save as Template button when onSaveAsTemplate is provided', () => {
    const editor = createMockEditor();
    render(
      <TiptapToolbar editor={editor} onSaveAsTemplate={vi.fn()} />,
    );
    expect(screen.getByLabelText('Save as Template')).toBeInTheDocument();
  });

  it('calls onSaveAsTemplate when Save as Template button is clicked', async () => {
    const user = userEvent.setup();
    const onSaveAsTemplate = vi.fn();
    const editor = createMockEditor();
    render(
      <TiptapToolbar editor={editor} onSaveAsTemplate={onSaveAsTemplate} />,
    );

    await user.click(screen.getByLabelText('Save as Template'));
    expect(onSaveAsTemplate).toHaveBeenCalled();
  });
});
