import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Ask from "../../components/ask";
import { AskPreview } from "../../components/landing-page";

export const metadata: Metadata = {
  title: "Ask | PCOS health companion",
  description: "Explore your recorded health history and prepare questions for your care team.",
};

export default async function AskPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const { userId } = await auth();
  const sp = searchParams ? await searchParams : undefined;

  if (!userId) {
    return <AskPreview />;
  }

  return <Ask initialQuery={sp?.q} />;
}
