import { useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";

const ProseMirrorEditor = () => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks,
    });

     // Parse existing content from an element with id "content"
     const contentElement = document.querySelector("#content");
     const doc = contentElement
       ? DOMParser.fromSchema(mySchema).parse(contentElement)
       : undefined; // Ensure we handle cases where #content doesn't exist

    // Set up the editor state
    const editorState = EditorState.create({
      doc, // Set parsed content as initial doc
      schema: mySchema,
      plugins: [
        // history(),
        keymap(baseKeymap),
        ...exampleSetup({ schema: mySchema }), // Adds standard ProseMirror plugins
      ],
    });

    // Create the editor view only once
    viewRef.current = new EditorView(editorRef.current, {
      state: editorState,
      // dispatchTransaction(transaction) {
      //   if (!viewRef.current) return;
      //   const newState = viewRef.current.state.apply(transaction);
      //   viewRef.current.updateState(newState);
      // },
    });

    // Cleanup function
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);


const handleSubmit = async (): Promise<void> => {
  if (!viewRef.current) return;

  const contentJSON = viewRef.current.state.doc.toJSON(); // Convert content to JSON
return;
  try {
    const response = await fetch("/api/saveContent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: contentJSON }),
    });

    if (response.ok) {
      console.log("Content saved successfully!");
    } else {
      console.error("Failed to save content");
    }
  } catch (error) {
    console.error("Error saving content:", error);
  }
};

  return (
    <>
     <div ref={editorRef} className="border p-2 min-h-[100px]" />
     <button
        onClick={handleSubmit}
        className="mt-2 px-4 py-2 bg-primary-7 text-white rounded hover:bg-primary-5"
      >
        Submit
      </button>
    </>

  )
  // <div ref={editorRef} className="border p-2 min-h-[100px]" />
  //   <button
  //       onClick={handleSubmit}
  //       className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  //     >
  //       Submit
  //     </button>}
}


export default ProseMirrorEditor;
