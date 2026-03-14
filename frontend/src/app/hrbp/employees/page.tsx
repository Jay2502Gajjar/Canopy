'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { AddUserModal } from '@/components/shared/AddUserModal';
import { mockEmployees } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';

export default function HRBPEmployeeDirectoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const assignedDepts = ['Engineering', 'Product'];
  const deptEmployees = mockEmployees.filter((e) => assignedDepts.includes(e.department));
  const departments = [...new Set(deptEmployees.map((e) => e.department))];

  let filtered = deptEmployees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === 'risk') {
    const order = { critical: 0, concern: 1, watch: 2, stable: 3 };
    filtered.sort((a, b) => order[a.riskTier] - order[b.riskTier]);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Employees</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage and view your assigned workforce.</p>
        </div>
        <button onClick={() => setIsAddEmployeeOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
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
          <option value="all">All My Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all cursor-pointer">
          <option value="name">Sort: A–Z</option>
          <option value="risk">Sort: Risk</option>
        </select>
      </div>

      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp) => (
          <motion.div key={emp.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <EmployeeCard employee={emp} onClick={() => router.push(`/hrbp/employees/${emp.id}`)} />
          </motion.div>
        ))}
      </motion.div>
      {filtered.length === 0 && <div className="text-center py-12 text-text-muted"><p className="text-sm">No employees found.</p></div>}

      {/* Add Employee Modal */}
      <AddUserModal isOpen={isAddEmployeeOpen} onClose={() => setIsAddEmployeeOpen(false)} title="Add Employee" defaultRole="Employee" />
    </div>
  );
}
