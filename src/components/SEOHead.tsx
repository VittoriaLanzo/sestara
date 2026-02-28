import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}

const defaults = {
  title: "Sestara — AI-Powered Learning Platform",
  description: "Master any subject with personalized AI roadmaps. Track progress, take quizzes, and achieve your goals with Sestara.",
  image: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8606d189-b1e2-4958-b410-9a7fe5a04967/id-preview-a3e78198--50c937c8-d9b1-4513-97b1-fa9661857e50.lovable.app-1772201832050.png",
  baseUrl: "https://sestara.lovable.app",
};

export const SEOHead = ({ title, description, path = "/", image }: SEOHeadProps) => {
  const fullTitle = title ? `${title} | Sestara` : defaults.title;
  const desc = description || defaults.description;
  const url = `${defaults.baseUrl}${path}`;
  const img = image || defaults.image;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
};
