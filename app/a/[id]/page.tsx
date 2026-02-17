import MainApp from "@/app/MainApp";

type PageProps = {
  params: { id: string };
};

export default function ActivityDeepLinkPage({ params }: PageProps) {
  return <MainApp initialSelectedActivityId={params.id} />;
}






