'use client'

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from 'next/navigation';
import Editor from "@/components/editor/editor";
import Loading from "@/components/loading/loading";

export default function Create(){
    const searchParams = useSearchParams();
    const prompt = searchParams.get('prompt');
    const [html, setHtml] = useState('');
    const [id, setId] = useState('');
    const [loading, setLoading] = useState(true);
    const hasFetched = useRef(false);

    useEffect(()=> {
        if (hasFetched.current) return; // Skip if already fetched
        hasFetched.current = true;
        const fetchData = async () => { // Encapsulate the fetch logic
            setLoading(true);
            try {
                const response = await fetch("/api/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ prompt: prompt })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const htmlContent = await response.json();
                setHtml(htmlContent.content);
                setId(htmlContent.id);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                //  Handle error appropriately, maybe set an error state
                setHtml("<div>Error loading content. Please try again.</div>");
            } finally {
                setLoading(false);
            }
        };

        fetchData(); // Call the function
    }, [prompt]); // Dependency array: only re-run if 'prompt' changes

    if (loading) {
        return <Loading text={"Creating"}/>
    }

    return <div>
        <Editor initialHtml={html} setHtml={setHtml} id={id}/>
    </div>
}
