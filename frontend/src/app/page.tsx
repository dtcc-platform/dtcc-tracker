import fs from 'fs'
import path from 'path'
import InfoPage from '@/components/Info';

export default async function HomePage(props: { searchParams?: Promise<any> }) {
  const searchParams = await props.searchParams;
  const paperIndex = searchParams?.paperIndex;
  const projectIndex = searchParams?.projectIndex

  let papers = [];
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'papers.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    papers = JSON.parse(data);
  } catch (error) {
    console.error('Error reading papers.json:', error);
  }

  let selectedPaper = null;
  if (paperIndex !== undefined) {
    const idx = parseInt(paperIndex, 10);
    if (!isNaN(idx) && idx >= 0 && idx < papers.length) {
      selectedPaper = papers[idx];
    }
  }

  return (
    <InfoPage paperIndex={paperIndex} projectIndex={projectIndex}></InfoPage>
  );
}

const infoContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  marginTop: '20px',
};

const infoColumnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as 'column', // Explicitly set as 'column'
  gap: '10px',
};

const pageContainerStyle: React.CSSProperties = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
};

const formContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
};

const formBoxStyle: React.CSSProperties = {
  width: '80%',
  backgroundColor: '#f9f9f9',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};


