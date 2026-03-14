'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, ChevronDown, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { AddUserModal } from '@/components/shared/AddUserModal';
import { StaggerContainer } from '@/components/shared/FadeInOnScroll';
import { employeeApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function EmployeeDirectoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeApi.getAll,
  });

  const departments = [...new Set(employees.map((e: any) => e.department))].filter(Boolean);

  let filtered = [...employees].filter((e: any) => {
    const nameMatch = e.name?.toLowerCase().includes(search.toLowerCase());
    const roleMatch = e.role?.toLowerCase().includes(search.toLowerCase());
    const matchesSearch = nameMatch || roleMatch;
    const matchesDept = deptFilter === 'all' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === 'risk') {
    const order: Record<string, number> = { critical: 0, concern: 1, watch: 2, stable: 3 };
    filtered.sort((a, b) => (order[a.riskTier || 'stable'] ?? 3) - (order[b.riskTier || 'stable'] ?? 3));
  } else if (sortBy === 'interaction') {
    filtered.sort((a, b) => new Date(a.lastInteraction || 0).getTime() - new Date(b.lastInteraction || 0).getTime());
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Employee Directory</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage and organize your organization's workforce.</p>
        </div>
        <button onClick={() => setIsAddEmployeeOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or role..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all cursor-pointer"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all cursor-pointer"
        >
          <option value="name">Sort: A–Z</option>
          <option value="risk">Sort: Risk</option>
          <option value="interaction">Sort: Last Interaction</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <StaggerContainer
            direction="up"
            staggerMs={60}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filtered.map((emp: any) => (
              <div key={emp.id}>
                <EmployeeCard
                  employee={{...emp, joiningDate: emp.joinDate, manager: emp.reportingManager}} // Map fields to match what EmployeeCard expects if needed
                  onClick={() => router.push(`/hro/employees/${emp.id}`)}
                />
              </div>
            ))}
          </StaggerContainer>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <p className="text-sm">No employees found matching your search.</p>
            </div>
          )}
        </>
      )}

      {/* Add Employee Modal */}
      <AddUserModal 
        isOpen={isAddEmployeeOpen} 
        onClose={() => {
          setIsAddEmployeeOpen(false);
          refetch(); // Refetch list after adding
        }} 
        title="Add Employee" 
        defaultRole="Employee" 
      />
    </div>
  );
}
