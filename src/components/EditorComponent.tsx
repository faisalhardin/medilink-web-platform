import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import EditorjsList from '@editorjs/list';
import { UpsertPatientVisitDetailRequest } from '@requests/patient';
import React, { useEffect, useRef } from 'react'

export const EditorComponent: React.FC = () => {
  const editorInstance = useRef<EditorJS | null>(null);

  useEffect(() => {
    const initEditor = async () => {
      if (!editorInstance.current) {
        editorInstance.current = new EditorJS({
          holder: "editorjs",
          tools: {
            header: Header,
            list: EditorjsList,
          },
          placeholder: "Jot here...",
          minHeight : 14,
          onReady: () => {
            console.log("Editor.js is ready!");
          },
        });
      }
    };

    initEditor();

    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === "function") {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, []);

  const saveEditorContent = async () => {
    editorInstance.current?.save().then((outputData) => {
      console.log('Article data: ', outputData)
      
      try {
        const resp = UpsertPatientVisitDetailRequest({
          id_mst_journey_point: 66,
          name_mst_journey_point: "Doctor's Room",
          notes: outputData,
          id_trx_patient_visit: 1,
          touchpoint_name: "",
        });
        return resp;
      } catch(error) {
        return
      }
    }).catch((error) => {
      console.log('Saving failed: ', error)
    })
  }

      
  return (
    <div >
      <div id='editorjs'/>
      <button onClick={saveEditorContent} className='text-white bg-primary-7 hover:bg-primary-5 m-auto'>Save</button>
    </div>
  )
}
