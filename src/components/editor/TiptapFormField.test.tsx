import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TiptapFormField } from './TiptapFormField';

const testSchema = z.object({
  content: z.string().optional(),
});

type TestForm = z.infer<typeof testSchema>;

function TestWrapper({
  defaultValues = { content: '' },
  maxLength,
  placeholder,
}: {
  defaultValues?: TestForm;
  maxLength?: number;
  placeholder?: string;
}) {
  const form = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <TiptapFormField
        name="content"
        label="Content"
        maxLength={maxLength}
        placeholder={placeholder}
      />
    </FormProvider>
  );
}

describe('TiptapFormField', () => {
  it('renders with label', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders editor area', () => {
    render(<TestWrapper />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<TestWrapper placeholder="Enter content..." />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('passes maxLength to editor', () => {
    render(<TestWrapper maxLength={200} />);
    expect(screen.getByText(/\/ 200/)).toBeInTheDocument();
  });

  it('initializes with default plain text value', () => {
    render(<TestWrapper defaultValues={{ content: 'Hello world' }} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
