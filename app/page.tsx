'use client'
import { BackgroundBeams } from "@/components/background";
import { Window } from "@/components/icons/window";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SignIn } from "@/components/signin";
import { Projects } from "@/components/projects";

const suggestions = [
  "Create a developer's portfolio",
  "Create a bakery shop"
]

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === "authenticated") {
      setOpenDialog(false);
    }
  }, [session]);


  return (
   <div className="static min-w-screen min-h-screen w-full h-full">
    { showProjects && <Projects setShowProjects={setShowProjects}/>}
    { openDialog &&
      <SignIn setOpenDialog={setOpenDialog} />}
    <BackgroundBeams className="bg-neutral-950"/>
    <div className="relative w-full h-full">
      <div className="flex flex-row items-center justify-between p-2">
        <div className="flex flex-row items-center gap-3 mx-4">
          <Image
          src={"/logo-3.png"}
          width={50}
          height={50}
          alt="logo"/>
          <h2 className="font-sans text-xl font-semibold text-[#e4e2dd]">Buildbit</h2>
        </div>
        <div>

          {session.status === "authenticated" ? 
          <button
          onClick={()=>{setShowProjects(true)}}
          ><Window 
          className="text-[#e4e2dd] w-5 h-5"/>
          </button> : <button 
          onClick={()=>{setOpenDialog(true)}}
          className="text-[#e4e2dd] font-sans text-md py-1 px-2 font-semibold border-1 border-[#e4e2dd] rounded-lg">Sign In</button>
          }

        </div>
      </div>
      <motion.div
      initial={{opacity:0, y:20}}
      animate={{opacity:1, y:0}}
      transition={{duration:0.4, ease:"easeInOut"}}
       className="flex flex-col justify-center items-center h-[80vh]">
        <h2 className="text-[#e4e2dd] text-2xl sm:text-4xl mb-2 font-sans font-semibold">What do you want to create?</h2>
        <textarea
        value={prompt}
        onChange={(e)=>{setPrompt(e.target.value)}}
         placeholder="Describe what you want to create..."
         className="bg-white/5 backdrop-blur-sm shadow-xl shadow-white/5 border border-2 border-white/10 rounded-xl w-sm sm:w-lg max-h-[150px] min-h-[150px] h-[150px] text-neutral-300 text-sm font-mono p-2 hover:border-white/20"/> 
        <div className="flex gap-2 justify-end w-sm sm:w-lg m-2">
          {
            suggestions.map((v, i) => 
              <p key={i}
              onClick={()=>{setPrompt(v)}}
              className="text-xs text-neutral-500 bg-white/5 py-1 px-2 rounded-lg border border-white/5"
              >{v}</p>
            )
          }
        </div>
        <div className="flex w-sm sm:w-lg justify-end m-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={prompt.length === 0 && session.status === "authenticated"}
              className={"bg-[#e4e2dd] text-neutral-950 font-mono text-base py-1 px-2 rounded-lg hover:bg-white hover:text-black" + (prompt.length === 0 && session.status === "authenticated" ? " cursor-not-allowed" : "")}
              onClick={()=> {if (session.status !== "authenticated") {
              setOpenDialog(true)
            } else{
               router.push(`/create?prompt=${prompt}`)}
              }}
            >Create</motion.button>
        </div>
      </motion.div>
    </div>
   </div>
  );
}