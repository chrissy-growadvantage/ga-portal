import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineDescriptionEditor } from './InlineDescriptionEditor';

describe('InlineDescriptionEditor', () => {
  it('renders collapsed by default when no value', () => {
    render(<InlineDescriptionEditor onChange={vi.fn()} />);
    expect(screen.getByText('Add description')).toBeInTheDocument();
  });

  it('expands when "Add description" button is clicked', async () => {
    const user = userEvent.setup();
    render(<InlineDescriptionEditor onChange={vi.fn()} />);
    await user.click(screen.getByText('Add description'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders expanded when value is provided', () => {
    render(
      <InlineDescriptionEditor
        value="Existing description"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows compact toolbar with Bold, Italic, Bullet List, Ordered List', async () => {
    const user = userEvent.setup();
    render(<InlineDescriptionEditor onChange={vi.fn()} />);
    await user.click(screen.getByText('Add description'));

    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet List')).toBeInTheDocument();
    expect(screen.getByLabelText('Ordered List')).toBeInTheDocument();
  });

  it('has collapse button when expanded', async () => {
    const user = userEvent.setup();
    render(<InlineDescriptionEditor onChange={vi.fn()} />);
    await user.click(screen.getByText('Add description'));
    expect(screen.getByLabelText('Collapse description')).toBeInTheDocument();
  });

  it('collapses when collapse button is clicked', async () => {
    const user = userEvent.setup();
    render(<InlineDescriptionEditor onChange={vi.fn()} />);
    await user.click(screen.getByText('Add description'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Collapse description'));
    expect(screen.getByText('Add description')).toBeInTheDocument();
  });

  it('renders expanded with JSON value', () => {
    const jsonValue = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Rich description' }],
        },
      ],
    };
    render(
      <InlineDescriptionEditor
        value={jsonValue}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
