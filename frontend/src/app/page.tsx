import InfoPage from '@/components/Info';

type SearchParams = { [key: string]: string };

export default async function HomePage(props: { searchParams?: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const paperIndex = searchParams?.paperIndex;
  const projectIndex = searchParams?.projectIndex;

  return <InfoPage paperIndex={paperIndex} projectIndex={projectIndex} />;
}
