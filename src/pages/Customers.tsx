import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import FormattedDateTime from '../components/FormattedDateTime';
import { Filter } from '../components/FilterDropdown'; 

import { useAuth } from '../contexts/AuthContext';
import { customerService, Customer } from '../services/customerService';

const Customers: React.FC = () => {
    const { token, user } = useAuth();
    const isAdmin = user?.type === 'ADMIN';
    const navigate = useNavigate();

  
    const [masterItems, setMasterItems] = useState<Customer[]>([]);
    
    const [items, setItems] = useState<Customer[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [targetId, setTargetId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

   
    const [appliedFilters, setAppliedFilters] = useState<Filter[]>([]);

    
    useEffect(() => {
        if (!token) return;

        const controller = new AbortController();
        const signal = controller.signal;

        const loadAllCustomers = async () => {
            setLoading(true);
            setError(null);
            try {
                
                const res = await customerService.list(token, [], signal);
                if (!signal.aborted) {
                    setMasterItems(res.customers);
                   
                    setItems(res.customers);
                }
            } catch (e: any) {
                if (!signal.aborted) {
                    setError(e?.data?.message || 'Failed to load customers');
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadAllCustomers();

        return () => controller.abort();
    }, [token]);

    useEffect(() => {
        let filtered = [...masterItems];

        appliedFilters.forEach(filter => {
            if (filter.values.length > 0) {
                filtered = filtered.filter(item => {
                    const key = filter.type.toLowerCase();
                    const itemValue = key === 'salesman' ? item.salesman?.name : (item as any)[key];
                    return itemValue && filter.values.includes(itemValue);
                });
            }
        });

        setItems(filtered);
    }, [appliedFilters, masterItems]);


    const filterOptions = useMemo(() => ({
        Industry: [...new Set(masterItems.map(item => item.industry).filter(Boolean))],
        Category: [...new Set(masterItems.map(item => item.category).filter(Boolean))],
        ...(isAdmin && { Salesman: [...new Set(masterItems.map(item => item.salesman?.name).filter(Boolean))] }),
    }), [masterItems, isAdmin]);

   
    const askDelete = (id: string) => { setTargetId(id); setConfirmOpen(true); };
    const onCancelDelete = () => { setConfirmOpen(false); setTargetId(null); };

    const onConfirmDelete = async () => {
        if (!targetId || !token) return;
        setDeleting(true);
        try {
            await customerService.remove(targetId, token);
            
            setMasterItems(prev => prev.filter(c => c.id !== targetId));
            setItems(prev => prev.filter(c => c.id !== targetId));
        } catch (e: any) {
            console.error(e?.data?.message || 'Failed to delete customer');
        } finally {
            setDeleting(false);
            setConfirmOpen(false);
            setTargetId(null);
        }
    };

    return (
        <div className="flex min-h-screen z-10 transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 overflow-y-auto h-screen">
                <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                  
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-ivory-200">Customers</h1>
                            <p className="text-gray-600 dark:text-midnight-400">Manage your customers and contacts.</p>
                        </div>
                        <Button
                            className="flex items-center px-4 py-2 bg-sky-500/80 text-white hover:bg-sky-600 shadow-lg rounded-xl transition"
                            onClick={() => navigate('/customers/create')}
                        >
                            Create Customer
                        </Button>
                    </div>

                    {loading && <div className="text-center py-4 text-midnight-700 dark:text-ivory-300">Loading...</div>}
                    {error && <div className="text-center py-4 text-red-600">{error}</div>}

                    {!loading && !error && (
                        <DataTable
                            rows={items} 
                            columns={[
                                { key: 'companyName', header: 'Company' },
                                { key: 'industry', header: 'Industry' },
                                { key: 'category', header: 'Category' },
                                { key: 'email', header: 'Email' },
                                { key: 'salesman.name', header: 'Salesman' },
                                { key: 'createdAt', header: 'Created', render: (row) => <FormattedDateTime isoString={row.createdAt} /> },
                                {
                                    key: 'action',
                                    header: 'Actions',
                                    sortable: false,
                                    render: (r) => (
                                        <div className="flex justify-center gap-2">
                                              <button 
                                                onClick={() => navigate(`/customers/${r.id}`)} 
                                                className="p-2 rounded-full hover:bg-cloud-200 dark:hover:bg-midnight-700 transition" 
                                                title="View Customer Details"
                                            >
                                                <Eye className="w-5 h-5 text-green-500" />
                                            </button>
                                            <button onClick={() => navigate(`/customers/${r.id}/edit`)} className="p-2 rounded-full hover:bg-cloud-200 dark:hover:bg-midnight-700 transition" title="Edit Customer">
                                                <Pencil className="w-5 h-5 text-sky-500" />
                                            </button>
                                            {/* <button onClick={() => askDelete(r.id)} className="p-2 rounded-full hover:bg-cloud-200 dark:hover:bg-midnight-700 transition" title="Delete Customer">
                                                <Trash2 className="w-5 h-5 text-red-500" />
                                            </button> */}
                                        </div>
                                    ),
                                },
                            ]}
                            initialSort={{ key: 'createdAt', dir: 'DESC' }}
                            filterKeys={['companyName', 'email', 'vatNo', 'address', 'salesman.name']}
                            searchPlaceholder="Search customers..."
                            filterOptions={filterOptions}
                            appliedFilters={appliedFilters}
                            onApplyFilters={setAppliedFilters}
                        />
                    )}
                </main>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action cannot be undone."
                confirmText={deleting ? 'Deleting...' : 'Yes, Delete'}
                onConfirm={onConfirmDelete}
                onCancel={onCancelDelete}
            />
        </div>
    );
};

export default Customers;
