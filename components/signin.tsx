import Image from "next/image";
import { signIn } from "next-auth/react";
import { Google } from "./icons/google";
import { Github } from "./icons/github";

export function SignIn({setOpenDialog}:{setOpenDialog: (open:boolean)=>void}) {
    return(
        <div 
        onClick={()=>{setOpenDialog(false)}}
        className="absolute w-full h-full bg-white/20 backdrop-blur z-100 flex flex-col items-center justify-center">
            <div
            onClick={(e) => e.stopPropagation()}
             className="border border-white/30 backdrop-blur flex flex-col p-20 bg-neutral-950/80 rounded-4xl">
              <div className="flex flex-col items-center mb-18">
                <Image
                  src={"/logo-3.png"}
                  width={100}
                  height={100}
                  alt="logo"/>
                  <h2 className="font-sans text-xl font-semibold text-[#e4e2dd]">Welcome to Buildbit</h2>
              </div>
              <button 
              onClick={()=>{signIn("google");}}
              className="border-1 border-[#e4e2dd] px-2 py-1 mb-4 text-[#e4e2dd] rounded-lg font-semibold font-sans flex items-center gap-2" 
              >SignIn with Google<span className="text-[#e4e2dd]"><Google/></span></button>
              <button 
              onClick={()=>{signIn("github");}}
              className="border-1 border-[#e4e2dd] px-2 py-1 text-[#e4e2dd] rounded-lg font-semibold font-sans flex items-center gap-2" 
              >SignIn with Github<span className="text-[#e4e2dd]"><Github/></span></button>
            </div>
        </div>
    )
}