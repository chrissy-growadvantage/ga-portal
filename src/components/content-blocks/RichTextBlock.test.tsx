import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextBlock } from './RichTextBlock';

// Mock TiptapEditor since it uses browser APIs
vi.mock('@/components/editor/TiptapEditor', () => ({
  TiptapEditor: ({ value, onChange, placeholder }: {
    value?: unknown;
    onChange: (json: unknown, text: string) => void;
    placeholder?: string;
  }) => (
    <div data-testid="tiptap-editor" data-placeholder={placeholder}>
      <textarea
        data-testid="tiptap-textarea"
        onChange={(e) => onChange({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: e.target.value }] }] }, e.target.value)}
        defaultValue=""
      />
    </div>
  ),
}));

describe('RichTextBlock', () => {
  const defaultContent = {
    doc: { type: 'doc' as const, content: [{ type: 'paragraph' as const }] },
  };

  it('renders the editor', () => {
    render(
      <RichTextBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();
  });

  it('renders delete button', () => {
    render(
      <RichTextBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Delete block')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <RichTextBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByLabelText('Delete block'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onChange when editor content changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RichTextBlock
        content={defaultContent}
        onChange={onChange}
        onDelete={vi.fn()}
      />,
    );

    await user.type(screen.getByTestId('tiptap-textarea'), 'Hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('does not render delete button in readOnly mode', () => {
    render(
      <RichTextBlock
        content={defaultContent}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        readOnly
      />,
    );

    expect(screen.queryByLabelText('Delete block')).not.toBeInTheDocument();
  });
});
