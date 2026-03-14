'use client';

import { Search, Filter, Plus, ChevronDown, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { AddUserModal } from '@/components/shared/AddUserModal';
import { mockEmployees } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { useState } from 'react'; // Keep useState import

export default function CHROEmployeeDirectoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [filterOpen, setFilterOpen] = useState(false); // Added
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false); // Added
  const departments = [...new Set(mockEmployees.map((e) => e.department))];

  let filtered = mockEmployees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === 'risk') {
    const order: Record<string, number> = { critical: 0, concern: 1, watch: 2, stable: 3 };
    filtered.sort((a, b) => order[a.riskTier] - order[b.riskTier]);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div> {/* Added div */}
          <h1 className="text-2xl font-bold font-heading">Employee Directory</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage and organize your organization's workforce.</p> {/* Added p */}
        </div> {/* Added div */}
        <button onClick={() => setIsAddEmployeeOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm"> {/* Modified button */}
          <Plus size={15} /> Add Employee
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or role..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all cursor-pointer">
          <option value="all">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all cursor-pointer">
          <option value="name">Sort: A–Z</option>
          <option value="risk">Sort: Risk</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp) => (
          <EmployeeCard key={emp.id} employee={emp} onClick={() => router.push(`/chro/employees/${emp.id}`)} />
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-text-muted"><p className="text-sm">No employees found.</p></div>}
      {/* The instruction had a redundant closing div and an extra conditional rendering for filteredEmployees.
          I'm keeping the original conditional rendering for filtered.length === 0 for consistency and correctness. */}

      {/* Add Employee Modal (#1) */}
      <AddUserModal isOpen={isAddEmployeeOpen} onClose={() => setIsAddEmployeeOpen(false)} title="Add Employee" defaultRole="Employee" />
    </div>
  );
}
