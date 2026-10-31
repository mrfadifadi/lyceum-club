import { DetailLayout } from "@/components/shared/DetailLayout";
import { useAsync } from "@/hooks/useAsync";
import { getArticle, getConvention, getEvent } from "@/services/api";
import { getSlug, routes } from "@/lib/routes";

export function EventDetail() { const slug = getSlug(); const { data, loading } = useAsync(() => getEvent(slug), [slug]); return <DetailLayout backTo={routes.events} backLabel="All events" loading={loading} item={data} />; }
export function ArticleDetail() { const slug = getSlug(); const { data, loading } = useAsync(() => getArticle(slug), [slug]); return <DetailLayout backTo={routes.news} backLabel="All news" loading={loading} item={data} />; }
export function ConventionDetail() { const slug = getSlug(); const { data, loading } = useAsync(() => getConvention(slug), [slug]); return <DetailLayout backTo={routes.conventions} backLabel="All conventions" loading={loading} item={data} />; }
