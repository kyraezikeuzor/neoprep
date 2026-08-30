import { notFound } from "next/navigation";
import { getPracticeTest } from "@/app/actions";
import PracticeTestPlayer from "@/components/PracticeTestPlayer";
export default async function PracticeTestPage({ params }: { params: { id: string } }) { const test=await getPracticeTest(params.id); if(!test) notFound(); return <PracticeTestPlayer test={test}/>; }
