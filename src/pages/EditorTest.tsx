import { useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditorTest() {
  const [value, setValue] = useState<JSONContent>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Test the WYSIWYG editor here!' }],
      },
    ],
  });

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Tiptap Editor Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Editor:</h3>
            <TiptapEditor
              value={value}
              onChange={(json) => setValue(json)}
              placeholder="Type something here..."
              maxLength={5000}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">JSON Output:</h3>
            <pre className="p-4 bg-slate-100 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
