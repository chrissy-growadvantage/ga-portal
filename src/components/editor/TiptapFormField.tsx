import { Controller, useFormContext } from 'react-hook-form';
import type { JSONContent, Editor } from '@tiptap/react';
import { TiptapEditor } from './TiptapEditor';
import {
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { plainTextToJSON } from '@/lib/tiptap-extensions';

type TiptapFormFieldProps = {
  name: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  onImageUpload?: (file: File) => Promise<string>;
  onInsertTemplate?: () => void;
  onSaveAsTemplate?: () => void;
  editorRef?: (editor: Editor | null) => void;
};

export function TiptapFormField({
  name,
  label,
  placeholder,
  maxLength,
  onImageUpload,
  onInsertTemplate,
  onSaveAsTemplate,
  editorRef,
}: TiptapFormFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const resolvedValue: JSONContent | string =
          typeof field.value === 'object' && field.value?.type === 'doc'
            ? field.value
            : typeof field.value === 'string' && field.value
              ? plainTextToJSON(field.value)
              : plainTextToJSON('');

        return (
          <FormItem>
            {label && <FormLabel>{label}</FormLabel>}
            <TiptapEditor
              value={resolvedValue}
              onChange={(json, text) => {
                field.onChange(json);
                // Store plain text as summary for backward compatibility
                (field as unknown as { _textValue: string })._textValue = text;
              }}
              onBlur={field.onBlur}
              maxLength={maxLength}
              placeholder={placeholder}
              onImageUpload={onImageUpload}
              onInsertTemplate={onInsertTemplate}
              onSaveAsTemplate={onSaveAsTemplate}
              editorRef={editorRef}
            />
            {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
          </FormItem>
        );
      }}
    />
  );
}
