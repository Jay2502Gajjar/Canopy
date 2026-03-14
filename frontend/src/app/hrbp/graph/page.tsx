'use client';
import { OrgGraphContent } from '@/components/shared/OrgGraph';
export default function HRBPGraphPage() {
  return <OrgGraphContent title="Department Graph" filterDepts={['Engineering', 'Product']} />;
}
