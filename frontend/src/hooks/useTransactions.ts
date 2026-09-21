import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Transaction, Stats } from '../types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ status?: string; type?: string; search?: string }>({});

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const [txData, statsData] = await Promise.all([
        api.transactions({ page, ...filters }),
        api.stats(),
      ]);
      setTransactions(txData.transactions);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, stats, loading, page, setPage, filters, setFilters, refresh: fetchTransactions };
}
