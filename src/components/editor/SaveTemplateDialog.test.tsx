import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveTemplateDialog } from './SaveTemplateDialog';

describe('SaveTemplateDialog', () => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const contentJson = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with form fields when open', () => {
    render(
      <SaveTemplateDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        contentJson={contentJson}
      />,
    );

    expect(screen.getByText('Save as Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Template Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <SaveTemplateDialog
        open={false}
        onClose={onClose}
        onSave={onSave}
        contentJson={contentJson}
      />,
    );

    expect(screen.queryByText('Save as Template')).not.toBeInTheDocument();
  });

  it('calls onSave with form values when submitted', async () => {
    const user = userEvent.setup();
    render(
      <SaveTemplateDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        contentJson={contentJson}
      />,
    );

    await user.type(screen.getByLabelText('Template Name'), 'My New Template');
    await user.type(screen.getByLabelText('Description'), 'A great template');
    await user.click(screen.getByRole('button', { name: /save template/i }));

    expect(onSave).toHaveBeenCalledWith({
      name: 'My New Template',
      description: 'A great template',
      content_json: contentJson,
      category: undefined,
    });
  });

  it('requires a template name', async () => {
    const user = userEvent.setup();
    render(
      <SaveTemplateDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        contentJson={contentJson}
      />,
    );

    await user.click(screen.getByRole('button', { name: /save template/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Template name is required')).toBeInTheDocument();
  });

  it('shows saving state', () => {
    render(
      <SaveTemplateDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        contentJson={contentJson}
        isSaving={true}
      />,
    );

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
