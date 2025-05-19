'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import GrapesJS, { Editor as GrapesEditor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import './editor.css'; // Make sure this CSS file exists and has your styles
import 'grapesjs-preset-webpage';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import parserPostCSS from 'grapesjs-parser-postcss';
import Image from 'next/image';
import Loading from '../loading/loading';

const Editor = ({ initialHtml, setHtml, id }: { initialHtml: string; id: string; setHtml: (html: string) => void }) => {
  const editorRef = useRef<GrapesEditor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true); // Initially true, assuming initialHtml is saved
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const [userResponded, setUserResponded] = useState(true);
  const [aiEditResponse, setAiEditResponse] = useState('');

  const debounce = (func: (...args: string[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: string[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Save to database function
  const saveToDatabase = useCallback(
    debounce(async (completeHtml: string) => {
      setIsSaving(true);
      setIsSaved(false); // Mark as unsaved when saving starts
      try {
        const response = await fetch('/api/projects', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ completeHtml, id }),
        });
        if (!response.ok) {
          console.error('Failed to save content to database');
          setIsSaved(false); // Keep as unsaved if save failed
        } else {
          console.log('Content saved successfully');
          setIsSaved(true); // Mark as saved
        }
      } catch (error) {
        console.error('Error saving to database:', error);
        setIsSaved(false); // Keep as unsaved if error occurred
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [id] // Include id in useCallback dependencies
  );




  const getFullHtml = useCallback(() => {
    if (!editorRef.current) return '';

    const editor = editorRef.current;
    const html = editor.getHtml();
    const css = editor.getCss();
    const scripts = editor.getComponents().filter((c: { is: (arg0: string) => string; }) => c.is('script')).map(c => c.get('content')).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Website</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    ${scripts}
  </script>
</body>
</html>`;
  }, []);

  const updateHtmlAndTriggerSave = useCallback(() => {
    const completeHtml = getFullHtml();
    setHtml(completeHtml); // Update local state
    setIsSaved(false); // Mark as unsaved immediately on change
    saveToDatabase(completeHtml); // Debounced save to DB
  }, [getFullHtml, setHtml, saveToDatabase]);

  

  useEffect(() => {
    if (!editorRef.current) { // Initialize editor only once
      const editor = GrapesJS.init({
        container: '#gjs',
        fromElement: true,
        storageManager: false,
        plugins: ['gjs-preset-webpage', parserPostCSS],
        allowScripts: 1, // Allow <script> tags in the canvas
        canvas: {
          styles: [],
          scripts: ['https://cdn.tailwindcss.com'], // Add external scripts here if needed
        },
      });

      editorRef.current = editor;

      // Set initial components
      editor.setComponents(initialHtml, { keepScripts: true });

      editor.on('component:update', updateHtmlAndTriggerSave);
      editor.on('style:change', updateHtmlAndTriggerSave);

      editor.on('update', () => {
        // This fires on many types of changes, not just clicks.
        // It might be too broad for just closing on a "canvas click".
        if (showAiDialog) {
          setShowAiDialog(false);
        }
      });

      // Explicit save command for the button
      editor.Commands.add('save-db', {
        run: () => {
          const completeHtml = getFullHtml();
          setHtml(completeHtml); // Update local state
          saveToDatabase(completeHtml); // Explicitly trigger save
        },
      });

      editor.Commands.add('download', {
        run: () => {
          handleExport();
        },
      });

      // Add the save button to the panel
      editor.Panels.addButton('options', {
        id: 'save',
        // className will be updated dynamically via render method
        command: 'save-db',
        attributes: { title: 'Save to Database' },
      });

      editor.Panels.addButton('options', {
        id: 'download',
        className: 'fa fa-download',
        command: 'download',
        attributes: { title: 'Download' },
      });

      // Custom render method for the save button to change its icon
      editor.on('panel:run:options:save', () => {
        const btn = editor.Panels.getButton('options', 'save');
        if (btn) {
          // This will be handled by React state and render loop, not directly here
          // The idea is to update the className based on isSaving/isSaved state
          // We'll manage this in the JSX, not directly in GrapesJS panel definition
        }
      });


      editor.on('load', () => {
        const canvasBody = editor.Canvas.getBody();

        const removeOutlines = () => {
          const elements = canvasBody.querySelectorAll(
            '*[data-gjs-highlightable], .gjs-dashed'
          );

          elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.outlineWidth !== '0px') {
              (el as HTMLElement).style.outline = 'none';
            }
          });
        };

        // Call it initially
        removeOutlines();

        const observer = new MutationObserver((mutationsList) => {
          for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              removeOutlines();
            } else if (mutation.type === 'childList') {
              removeOutlines();
            }
          }
        });

        observer.observe(canvasBody, { attributes: true, childList: true, subtree: true });

        

        // Cleanup function for useEffect
        return () => {
          editor.destroy();
          observer.disconnect();
          editorRef.current = null;
        };
      });
    } else {
      // If editor already initialized, only update components if initialHtml changes
      // This is less ideal, prefer to set initial content only once.
      // If you truly need to re-render the editor with new initialHtml, consider
      // adding a `key` to the Editor component to force remount.
      // For now, we'll assume initialHtml is truly *initial*.
      // editorRef.current.setComponents(initialHtml, { keepScripts: true });
    }
  }, []); // Empty dependency array to run once on mount

  // Effect to update the save button's icon based on state
  useEffect(() => {
    if (editorRef.current) {
      const saveButton = editorRef.current.Panels.getButton('options', 'save');
      if (saveButton) {
        if (isSaving) {
          saveButton.set('className', 'fa fa-spinner fa-spin'); // Loading icon
          saveButton.set('attributes', { title: 'Saving...' });
        } else if (isSaved) {
          saveButton.set('className', 'fa fa-save'); // Saved icon
          saveButton.set('attributes', { title: 'Saved' });
        } else {
          saveButton.set('className', 'fa fa-exclamation-triangle'); // Unsaved icon
          saveButton.set('attributes', { title: 'Unsaved Changes' });
        }
      }
    }
  }, [isSaving, isSaved]);


  const handleExport = async () => {
    if (!editorRef.current) return;

    const zip = new JSZip();
    zip.file('index.html', getFullHtml());// Include the CSS file

   
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `BuildBit-${Date.now()}.zip`);
   
  };

  const handleEdit = async () => {
    if (!editorRef.current) return;
    setEditing(true);
    const completeHtml = getFullHtml();
    const response = await fetch('/api/aiEdit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: editPrompt, html: completeHtml }),
    });
    if (!response.ok) {
      console.error('Failed to edit content');
      setEditing(false);
      return;
    }
    const data = await response.json();
    if (typeof data === 'string') {
      setUserResponded(false);
      setAiEditResponse(data);
      setEditing(false);
      setEditPrompt('');
    } else {
      setUserResponded(true);
      setEditing(false);
      console.error('Invalid response from AI edit:', data);
    }
  };

  const handleAccept = () => {
    if (!editorRef.current) return;
    setUserResponded(true);
    setShowAiDialog(false);
    setEditPrompt('');
    editorRef.current.setComponents(aiEditResponse, { keepScripts: true });
    setHtml(aiEditResponse);
    saveToDatabase(aiEditResponse);
  };
  const handleReject = () => {
    if (!editorRef.current) return;
    setUserResponded(true);
    setShowAiDialog(false);
    setEditPrompt('');
    editorRef.current.setComponents(initialHtml, { keepScripts: true });
    setHtml(initialHtml);
  };

  

  return (
    <div
     className="relative h-screen w-screen">
      { (editing) && <div className="absolute w-screen h-screen z-100">
        <div className="flex items-center justify-center h-full w-full overflow-hidden">
        <Loading text={"Editing"}/>
        </div>
        </div>}
      { (!userResponded) && <div className="absolute w-screen h-screen z-30 bg-neutral-950/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="flex items-center justify-between p-4 w-full">
          <button
          onClick={handleAccept}
           className="px-2 py-1 border border-[#e4e2dd] text-[#e4e2dd] text-lg font-sans font-semibold rounded-sm hover:bg-black hover:text-white">Accept</button>
          <button
          onClick={handleReject}
           className="px-2 py-1 border border-[#e4e2dd] text-[#e4e2dd] text-lg font-sans font-semibold rounded-sm hover:bg-black hover:text-white">Reject</button>
        </div>
        <iframe
          className="w-full h-full"
          srcDoc={aiEditResponse}
          title="AI Edit Preview"
          sandbox="allow-same-origin allow-scripts"/>
        </div>
        </div>}
      { (showAiDialog) ? <div
      onClick={() => { setShowAiDialog(false); }}
       className="absolute w-screen h-screen z-10 grid grid-cols-1 content-end justify-start">
        <div 
        onClick={(e) => { e.stopPropagation(); }}
        className="flex rounded-lg ml-4 mb-4">
          <textarea
          onChange={(e) => { setEditPrompt(e.target.value); }}
          value={editPrompt}
          placeholder="Describe the changes you want to make i.e. Change the theme to light, etc...."
          className="bg-neutral-950/30 backdrop-blur-sm shadow-xl border border-2 border-neutral-950/40 rounded-xl w-sm sm:w-lg max-h-[150px] min-h-[150px] h-[150px] text-white text-sm font-mono p-2"
          />
          <div className="grid content-end ml-2">
            <button
              disabled={(editPrompt.length < 1) ? true : false}
              className="bg-[#e4e2dd] text-neutral-950 font-sans text-md py-1 px-2 font-semibold border-1 border-neutral-950 rounded-lg"
              onClick={() => {
                handleEdit(); } } >
              Generate
            </button>
          </div>
        </div> 
      </div> : <div className="absolute bottom-5 left-5 z-20 group">
      <div
    onClick={()=>{setShowAiDialog(true);}}>
    <div className="bg-neutral-950 rounded-full p-2 group-hover:hidden">
    <i className="fa-solid fa-wand-magic-sparkles fa-shake fa-xl text-[#e4e2dd] block group-hover:hidden"></i>
    </div>
    <div className="hidden group-hover:block bg-neutral-950 rounded-lg ">
      <div className="flex gap-2 items-center justify-center m-1">
      <Image
      src={"/logo-3.png"}
      width={40}
      height={40}
      alt="logo"/>
      <h3 className="hidden group-hover:block text-[#e4e2dd] text-lg font-sans m-1">Edit with AI</h3>
      </div>
    </div>
    </div>
    </div>}
      <div id="gjs" className="static"></div>
      </div>
  );
};

export default Editor;