import Image from "next/image";
import { Close } from "./icons/close";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProject } from "@/app/actions/fetchProject";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  prompt: string;
}

export function Projects({ setShowProjects }: { setShowProjects: (show: boolean) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [entryLoading, setEntryLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const router = useRouter();

  const lastProjectRef = useCallback(
    (node: HTMLElement | null) => {
      if (entryLoading || !hasMore) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !entryLoading) {
            setPage((prevPage) => prevPage + 1);
          }
        },
        { threshold: 1.0 }
      );

      if (node) observer.current.observe(node);
    },
    [entryLoading, hasMore]
  );

  useEffect(() => {
    let isMounted = true;

    if (!hasMore || entryLoading) return;

    const fetchData = async () => {
      try {
        setEntryLoading(true);
        if (page === 1) {
          setLoading(true);
        }

        const response = await fetchProject(page);
        const data: { res: Project[]; hasMore?: boolean } = 
          response instanceof Response ? await response.json() : response;
        if (isMounted && 'res' in data && Array.isArray(data.res)) {
          // Ensure no duplicates by filtering out existing project IDs
          setProjects((prev) => {
            const existingIds = new Set(prev.map((p) => p.id)); // Assuming projects have an 'id' field
            const newProjects = (data.res || []).filter((p: Project) => !existingIds.has(p.id));
            return [...prev, ...newProjects];
          });
          setHasMore(data.hasMore ?? data.res.length >= 10);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setEntryLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (observer.current) observer.current.disconnect();
    };
  }, [page, hasMore]); // Added hasMore to dependencies

  return (
    <>
      <div
        onClick={() => setShowProjects(false)}
        className="absolute w-full h-full bg-white/10 backdrop-blur z-20"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute w-md h-screen top-0 right-0 bg-neutral-950/80 backdrop-blur z-50 border border-white/20"
      >
        <div className="flex flex-row items-center justify-between bg-white/5 backdrop-blur rounded-lg mt-2 mx-3">
          <div className="flex flex-row items-center gap-2 ml-2">
            <Image src="/logo-3.png" width={50} height={50} alt="logo" />
            <h2 className="font-sans text-xl font-semibold text-[#e4e2dd]">Buildbit</h2>
          </div>
          <div className="mr-4 flex justify-center items-center">
            <button onClick={() => setShowProjects(false)}>
              <Close className="text-[#e4e2dd] w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="mx-4 mt-6 overflow-y-auto h-[calc(100vh-100px)]">
          {loading && page === 1 ? (
            <div className="flex items-center justify-center w-full h-full text-lg text-gray-400 font-semibold font-sans">Loading...</div>
          ) : projects.length === 0 ? (
            <div>No projects found.</div>
          ) : (
            projects.map((project, index) => (
              <div
                onClick={() => {router.push(`/project/${project.id}`); setShowProjects(false)}}
                key={project.id || index} // Use unique project ID if available
                ref={index === projects.length - 1 ? lastProjectRef : null}
                className="border-b border-white/20 pl-2 mb-2"
              >
                <h2 className="text-neutral-400 font-mono text-md">{project.prompt}</h2>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}