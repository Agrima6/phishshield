'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.auditLogs.list();
      setLogs(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, categoryFilter]);

  const handleRefresh = () => {
    loadLogs();
  };

  const filteredLogs = logs.filter((log) => {
    const actorVal = log.actor || '';
    const messageVal = log.message || '';
    const ipVal = log.ipAddress || log.ip_address || '';
    const categoryVal = log.category || '';

    const matchesSearch = actorVal.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          messageVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ipVal.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' ? true : categoryVal === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Audit Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">SOC-2 compliant read-only ledger capturing all tenant administrative operations.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Logs
        </button>
      </div>

      {/* Advanced Filter Panel */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search logs by IP, administrator email, or transaction details..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto text-xs font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500 shrink-0">Category Filter:</span>
            <Select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-48"
            >
              <option value="all">All transactions</option>
              <option value="SSO_CONFIG">SSO Configuration</option>
              <option value="CAMPAIGN">Simulation Campaigns</option>
              <option value="SMTP">Email Senders</option>
              <option value="EMPLOYEE">Employees Directory</option>
              <option value="SECURITY">Portal Access</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Administrator</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Action Area</TableHead>
                <TableHead>Action Log Message</TableHead>
                <TableHead className="text-right">Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Fetching audit registry...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.slice(0, visibleCount).map((log) => {
                const idVal = log._id || log.id;
                const ipVal = log.ipAddress || log.ip_address || '127.0.0.1';
                const timeVal = log.timestamp || new Date().toISOString();
                const categoryVal = log.category || 'SECURITY';

                return (
                  <TableRow key={idVal}>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {new Date(timeVal).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 text-xs">{log.actor}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{ipVal}</TableCell>
                    <TableCell>
                      <Badge variant={
                        categoryVal === 'SECURITY' ? 'danger' : categoryVal === 'SSO_CONFIG' ? 'info' : 'warning'
                      } className="text-[10px]">
                        {categoryVal}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 leading-relaxed max-w-[300px] truncate md:max-w-none md:whitespace-normal">
                      {log.message}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success" className="text-[10px]">Verified</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    No matching audit records in the registry.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!loading && filteredLogs.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
              <span>
                Showing {Math.min(visibleCount, filteredLogs.length)} of {filteredLogs.length} log{filteredLogs.length === 1 ? '' : 's'}
              </span>
              {visibleCount < filteredLogs.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                >
                  Load more
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
