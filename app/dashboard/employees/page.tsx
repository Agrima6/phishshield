'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  UploadCloud, 
  Search, 
  SlidersHorizontal, 
  ShieldAlert, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search / Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  
  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  // CSV Import States
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // New Employee Form
  const [newEmp, setNewEmp] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    manager: ''
  });

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.employees.list();
      setEmployees(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.email) {
      toast.error('Name and email are required fields.');
      return;
    }

    try {
      await api.employees.create({
        name: newEmp.name,
        email: newEmp.email,
        department: newEmp.department,
        manager: newEmp.manager || 'N/A',
        riskRating: 'low'
      });

      toast.success(`Employee ${newEmp.name} added successfully.`);
      setAddModalOpen(false);
      setNewEmp({ name: '', email: '', department: 'Engineering', manager: '' });
      loadEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add employee.');
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployeeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      await api.employees.delete(employeeToDelete);
      toast.success('Employee deleted successfully.');
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      loadEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete employee.');
    }
  };

  const handleImportCSV = async () => {
    if (!fileToImport) {
      toast.error('Please select a CSV file first.');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', fileToImport);
      const res = await api.employees.import(formData);
      setImportResult(res);
      toast.success(`Import complete: ${res.success_count} success, ${res.duplicate_count} duplicates skipped.`);
      loadEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to import CSV file.');
    } finally {
      setImporting(false);
    }
  };

  // Filter Logic
  const filteredEmployees = employees.filter((emp) => {
    const nameVal = emp.name || '';
    const emailVal = emp.email || '';
    const riskVal = emp.risk_rating || emp.riskRating || 'low';

    const matchesSearch = nameVal.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emailVal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' ? true : riskVal === filterRisk;
    
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage administrative directories and track individual click-through metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)} className="flex items-center gap-1.5">
            <UploadCloud className="h-4 w-4" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setAddModalOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by employee name or corporate email..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">Risk rating:</span>
              <Select 
                value={filterRisk} 
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-32"
              >
                <option value="all">All levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead className="hidden sm:table-cell">Corporate Email</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead>Risk Profile</TableHead>
                <TableHead>Failures/Runs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Fetching directory list...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.map((emp) => {
                const idVal = emp._id || emp.id;
                const riskVal = emp.risk_rating || emp.riskRating || 'low';
                const hitsVal = emp.hits_count !== undefined ? emp.hits_count : emp.hitsCount || 0;
                const totalVal = emp.total_simulations !== undefined ? emp.total_simulations : emp.totalSimulations || 0;

                return (
                  <TableRow key={idVal}>
                    <TableCell className="font-semibold text-slate-900">{emp.name}</TableCell>
                    <TableCell className="text-slate-600 hidden sm:table-cell">{emp.email}</TableCell>
                    <TableCell className="text-slate-500 hidden md:table-cell">{emp.department}</TableCell>
                    <TableCell>
                      <Badge variant={riskVal === 'high' ? 'danger' : riskVal === 'medium' ? 'warning' : 'success'}>
                        {riskVal} risk
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={hitsVal > 0 ? 'text-destructive font-bold' : 'text-slate-700'}>
                        {hitsVal}
                      </span>
                      <span className="text-slate-400">/{totalVal}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button 
                        onClick={() => handleDeleteEmployee(idVal)}
                        className="text-slate-400 hover:text-destructive p-1 rounded-sm cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    No employees matching current filter options.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Employee Profile</DialogTitle>
            <DialogDescription>Create a single recipient profile for phishing simulations.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddEmployee} className="space-y-4 py-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">Full Name</label>
              <Input 
                required
                placeholder="Jane Doe" 
                value={newEmp.name}
                onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Corporate Email Address</label>
              <Input 
                required
                type="email"
                placeholder="jane.doe@company.com" 
                value={newEmp.email}
                onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 mb-1">Department</label>
                <Select
                  value={newEmp.department}
                  onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Sales">Sales & BD</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                </Select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Direct Manager</label>
                <Input 
                  placeholder="Manager name" 
                  value={newEmp.manager}
                  onChange={(e) => setNewEmp({ ...newEmp, manager: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Add Recipient
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={importModalOpen} onOpenChange={(open) => {
        setImportModalOpen(open);
        if (!open) {
          setFileToImport(null);
          setImportResult(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Directory CSV Import</DialogTitle>
            <DialogDescription>Upload a CSV file containing your employee directory.</DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <div className="space-y-4 py-4 text-xs font-semibold">
              <div 
                className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors relative"
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <input 
                  type="file" 
                  id="csv-file-input" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFileToImport(file);
                  }}
                />
                <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                <span className="text-xs font-semibold text-slate-700">
                  {fileToImport ? fileToImport.name : 'Click to select CSV Directory Sheet'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Accepts headers: name, email, department, manager</span>
              </div>
              
              <DialogFooter>
                <Button variant="ghost" size="sm" onClick={() => setImportModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleImportCSV} disabled={importing || !fileToImport}>
                  {importing ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin mr-1.5" />
                      Importing...
                    </>
                  ) : 'Upload and Import'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4 text-xs font-semibold">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-bold text-slate-500">
                <div className="p-2 bg-green-50 rounded-lg text-green-700">
                  <div className="text-lg font-bold">{importResult.success_count}</div>
                  Success
                </div>
                <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                  <div className="text-lg font-bold">{importResult.duplicate_count}</div>
                  Duplicates
                </div>
                <div className="p-2 bg-red-50 rounded-lg text-red-700">
                  <div className="text-lg font-bold">{importResult.error_count}</div>
                  Errors
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validation Errors</span>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1 font-mono text-[10px] text-red-600">
                    {importResult.errors.map((err: string, i: number) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setImportModalOpen(false);
                    setFileToImport(null);
                    setImportResult(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Remove Employee
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this employee from the directory? This action will remove their historical click-through tracking metrics as well.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteEmployee}>
              Remove Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
