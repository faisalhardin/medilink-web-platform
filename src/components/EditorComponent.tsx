import EditorJS, { BlockToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import EditorjsList from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import { useEffect, useRef } from 'react'

interface EditorComponentProps {
  id: string; // Unique ID for the editor instance
  data?: any; // Optional: Preloaded data
  placeHolder?: string; // Placeholder text for the editor
  readOnly?: boolean
  onChange?: (data: any) => void; // Custom change function
  className?: string
}

export const EditorComponent = ({ id,  data, readOnly=true, placeHolder, onChange, className }: EditorComponentProps) => {
  const editorInstance = useRef<EditorJS | null>(null);
  
  useEffect(() => {
    const initEditor = async (editorData?: any) => {
      if (!editorInstance.current) {
        editorInstance.current = new EditorJS({
          holder: id,
          tools: {
            header: Header,
            list: EditorjsList,
            paragraph: {
              class: Paragraph as BlockToolConstructable,
              inlineToolbar: true,
              config: {
                preserveBlank: true,
              },
            },
          },
          placeholder: placeHolder,
          minHeight: 14,
          readOnly,
          data: editorData || { blocks: []},
          onReady: () => {
            console.log("Editor.js is ready!");
          },
          onChange: async () => {
            if (onChange) {
              const savedData = await editorInstance.current?.save();
              onChange(savedData);
            }
          },
        });
      }
    };

    const initialize = async () => {
      if (data && data.notes) {
        await initEditor(data.notes);
      } else {
        await initEditor();
      }
    };


    initialize();

    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === "function") {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [id, readOnly, data]);
      
  return (
    <div >
      <div id={id} className={className}/>
    </div>
  )
}