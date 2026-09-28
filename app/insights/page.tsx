import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Insights from "../../components/insights";
import { InsightsPreview } from "../../components/landing-page";
import { dateKey, emptyData } from "../../lib/health";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Health history | PMOS insights",
  description: "Explore recorded health patterns and prepare a descriptive visit summary.",
};

export default async function InsightsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <InsightsPreview />;
  }

  const end = dateKey();
  return <Insights data={emptyData()} end={end} />;
}
