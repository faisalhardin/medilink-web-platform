import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import EditorjsList from '@editorjs/list';
import { UpsertPatientVisitDetailRequest } from '@requests/patient';
import React, { useEffect, useRef, useState } from 'react'

interface EditorComponentProps {
  id: string; // Unique ID for the editor instance
  data?: any; // Optional: Preloaded data
  placeHolder?: string; // Placeholder text for the editor
  readOnly?: boolean
  onSave?: (data: any) => void; // Custom save function
  fetchData?: (id: string) => Promise<any>; // Custom fetch function
}

export const EditorComponent = ({ id,  data, readOnly=true, placeHolder, onSave, fetchData }: EditorComponentProps) => {
  const editorInstance = useRef<EditorJS | null>(null);
  
  useEffect(() => {
    const initEditor = async (editorData: any) => {
      if (!editorInstance.current) {
        editorInstance.current = new EditorJS({
          holder: id,
          tools: {
            header: Header,
            list: EditorjsList,
          },
          placeholder: placeHolder,
          minHeight : 14,
          readOnly,
          data: editorData || { blocks: []},
          onReady: () => {
            console.log("Editor.js is ready!");
          },
        });
      }
    };

    const initialize = async () => {
      let initialData = data;
      if (fetchData) {
        try {
          const fetchedData = await fetchData(id);
          initialData = fetchedData;
        } catch (error) {
          console.error('Fetching data failed:', error);
        }
      }
      await initEditor(initialData);
    };


    initialize();

    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === "function") {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [id, readOnly, data, fetchData]);

  const saveEditorContent = async () => {
    if (!editorInstance.current) return;
    try {
      const outputData = await editorInstance.current.save();
      
      if (onSave) {
        onSave(outputData); // Call the custom save function if provided
      }
    } catch (error) {
      console.error("Saving failed:", error);
    }
  };
      
  return (
    <div >
      <div id={id}/>
      {!readOnly && (
        <button
          onClick={saveEditorContent}
          className="text-white bg-primary-7 hover:bg-primary-5 px-4 py-2 mt-2 rounded"
        >
          Save
        </button>
      )}
    </div>
  )
}
