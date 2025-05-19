'use client'

import Editor from "@/components/editor/editor";
import Loading from "@/components/loading/loading";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectPage() {
    interface ProjectData {
        content: string;
        prompt: string;
        id: string;
    }

    const [data, setData] = useState<ProjectData | undefined>();
    const [html, setHtml] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const { id } = useParams(); // Returns { id: string | string[] | undefined }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Ensure id is a string
                if (typeof id !== "string") {
                    throw new Error("Invalid project ID");
                }

                const response = await fetch(`/api/projects`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ id }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setData(data);
                setHtml(data.content);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    if (loading) {
        return <Loading text="Fetching" />;
    }

    return (
        <div className="w-screen h-screen">
            {data && <Editor initialHtml={html} setHtml={setHtml} id={data.id} />}
        </div>
    );
}