import Image from "next/image";
import { signIn } from "next-auth/react";
import { Google } from "./icons/google";
import { Github } from "./icons/github";
import { motion } from "framer-motion";

export function SignIn({setOpenDialog}:{setOpenDialog: (open:boolean)=>void}) {
    return(
        <div 
        onClick={()=>{setOpenDialog(false)}}
        className="absolute w-full h-full bg-white/20 backdrop-blur z-100 flex flex-col items-center justify-center">
            <motion.div
            initial={{ opacity: 0 , y: 30 }}
            animate={{ opacity: 1 , y: 0 }}
            exit={{ opacity: 0, scale: 0.8 , y: 50 }}
            transition={{ duration: 0.38, ease: "easeInOut" }}
            
            onClick={(e) => e.stopPropagation()}
             className="border border-white/30 backdrop-blur flex flex-col p-20 bg-neutral-950/80 rounded-4xl">
              <div 
              className="flex flex-col items-center mb-18">
                <Image
                  src={"/logo-3.png"}
                  width={100}
                  height={100}
                  alt="logo"/>
                  <h2 className="font-sans text-xl font-semibold text-[#e4e2dd]">Welcome to Buildbit</h2>
              </div>
              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }} 
              onClick={()=>{signIn("google");}}
              className="border-1 border-[#e4e2dd] px-2 py-1 mb-4 text-[#e4e2dd] rounded-lg font-semibold font-sans flex items-center gap-2" 
              >SignIn with Google<span className="text-[#e4e2dd]"><Google/></span></motion.button>
              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={()=>{signIn("github");}}
              className="border-1 border-[#e4e2dd] px-2 py-1 text-[#e4e2dd] rounded-lg font-semibold font-sans flex items-center gap-2" 
              >SignIn with Github<span className="text-[#e4e2dd]"><Github/></span></motion.button>
            </motion.div>
        </div>
    )
}