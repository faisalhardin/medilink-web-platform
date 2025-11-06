import EditorJS, { BlockToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import EditorjsList from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import DentitionTool from './editorjs-plugins/DentitionTool';
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
        try {
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
              odontogram: {
                class: DentitionTool,
                config: {
                  readOnly: readOnly,
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
              try {
                const savedData = await editorInstance.current?.save();
                // Migrate old "dentition" blocks to "odontogram" for backward compatibility
                if (savedData?.blocks) {
                  savedData.blocks = savedData.blocks.map((block: any) => {
                    if (block.type === 'dentition') {
                      return { ...block, type: 'odontogram' };
                    }
                    return block;
                  });
                }
                // Add a small delay to ensure EditorJS state is fully updated
                await new Promise(resolve => setTimeout(resolve, 0));
                onChange(savedData);
              } catch (error) {
                console.error('Error saving editor data:', error);
              }
            }
          },
        });
        } catch (error) {
          console.error('EditorJS initialization error:', error);
        }
      }
    };

    const initialize = async () => {
      if (data) {
        // Migrate old "dentition" blocks to "odontogram" when loading data
        const migratedData = {
          ...data,
          blocks: data.blocks?.map((block: any) => {
            if (block.type === 'dentition') {
              return { ...block, type: 'odontogram' };
            }
            return block;
          }) || []
        };
        await initEditor(migratedData);
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
  }, [id, readOnly]);
      
  return (
    <div >
      <div id={id} className={className}/>
    </div>
  )
}