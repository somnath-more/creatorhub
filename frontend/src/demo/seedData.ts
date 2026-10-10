import { draftSchema, type Draft } from '../features/content/draftSchema';
import type { Purchase } from '../features/dashboard/dashboardModel';

export const seedTitles = ['Lighting essentials', 'Editing for beginners', 'Build your creator brand', 'Camera confidence', 'Podcast audio basics', 'Travel storytelling', 'Studio on a budget', 'Color grading workshop', 'Mobile filmmaking', 'Creative planning', 'Short-form storytelling', 'Audience research'];

export function seedContent(now = new Date()): Draft[] {
  return seedTitles.map((title, index) => {
    const status = (['PUBLISHED', 'DRAFT', 'SCHEDULED'] as const)[index % 3];
    return draftSchema.parse({
      id: `sample-content-${index + 1}`, title,
      description: `Synthetic CreatorHub demonstration: ${title.toLowerCase()}. No real customer or media data.`,
      priceCents: [1299, 2499, 899, 1999][index % 4], currency: 'USD', status,
      mediaStatus: status === 'DRAFT' ? 'NOT_READY' : 'READY',
      createdAt: new Date(now.getTime() - (index + 1) * 86400000).toISOString(), updatedAt: now.toISOString(),
      ...(status === 'PUBLISHED' ? { publishedAt: new Date(now.getTime() - 86400000).toISOString() } : {}),
      ...(status === 'SCHEDULED' ? { scheduledAt: new Date(now.getTime() + (index + 1) * 86400000).toISOString() } : {}),
      thumbnail: { name: `synthetic-thumbnail-${index + 1}.png`, size: 1024, type: 'image/png' },
      video: { name: `synthetic-video-${index + 1}.mp4`, size: 1048576, type: 'video/mp4' },
    });
  });
}

export function seedPurchases(now = new Date()): Purchase[] {
  const countries = ['India', 'United States', 'United Kingdom', 'Germany', 'Canada', 'Japan'];
  return Array.from({ length: 30 }, (_, index) => ({
    id: `demo-purchase-${index + 1}`,
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(index * 1.5), 12).toISOString(),
    content: seedTitles[(index % 4) * 3],
    amountCents: [1299, 1999, 899, 2499][index % 4],
    country: countries[index % countries.length],
    status: index % 11 === 10 ? 'Failed' : index % 7 === 6 ? 'Pending' : 'Completed',
  }));
}
