import { CreateComponent } from "@/components/create";
import Loading from "@/components/loading/loading";
import { Suspense } from "react";

export default function Create(){

    return <div>
        <Suspense fallback={<Loading text="Loading..." />}>
        <CreateComponent/>
        </Suspense>
    </div>
}
