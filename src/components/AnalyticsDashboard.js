import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import moment from 'moment';
import apiClient from '../services/apiClient';
import {
    FaShoppingCart, FaUsers, FaBox, FaMoneyBillWave,
    FaCalendarDay,
    FaExclamationTriangle, FaDownload, FaMapMarkerAlt
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [salesTrend, setSalesTrend] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [franchiseLoading, setFranchiseLoading] = useState(false);

    // Filters for the graph
    const [filterType, setFilterType] = useState('month');
    const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
    const [selectedYear, setSelectedYear] = useState(moment().year());

    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [customRange, setCustomRange] = useState({
        start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
    });

    // Local filters and data for Category and Order sections
    const [catFilter, setCatFilter] = useState({ type: 'month', month: moment().month() + 1, year: moment().year(), date: moment().format('YYYY-MM-DD') });
    const [catData, setCatData] = useState(null);
    const [catLoading, setCatLoading] = useState(false);

    const [ordFilter, setOrdFilter] = useState({ type: 'month', month: moment().month() + 1, year: moment().year(), date: moment().format('YYYY-MM-DD') });
    const [ordData, setOrdData] = useState(null);
    const [ordLoading, setOrdLoading] = useState(false);

    // Franchise Specific Filters
    const [franchiseFilter, setFranchiseFilter] = useState({
        type: 'month',
        month: moment().month() + 1,
        year: moment().year(),
        date: moment().format('YYYY-MM-DD'),
        customStart: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        customEnd: moment().format('YYYY-MM-DD')
    });
    const [franchiseSearch, setFranchiseSearch] = useState('');
    const [locSalesFilter, setLocSalesFilter] = useState({ type: 'month', month: moment().month() + 1, year: moment().year(), date: moment().format('YYYY-MM-DD') });
    const [locSalesData, setLocSalesData] = useState([]);
    const [locSalesLoading, setLocSalesLoading] = useState(false);

    const [locOrderFilter, setLocOrderFilter] = useState({ type: 'month', month: moment().month() + 1, year: moment().year(), date: moment().format('YYYY-MM-DD') });
    const [locOrderData, setLocOrderData] = useState([]);
    const [locOrderLoading, setLocOrderLoading] = useState(false);

    const [healthFilter, setHealthFilter] = useState({ type: 'month', month: moment().month() + 1, year: moment().year(), date: moment().format('YYYY-MM-DD') });

    const [searchBy, setSearchBy] = useState('both'); // 'location', 'pincode', 'both'

    const renderLocalFilter = (filter, setFilter) => (
        <div className="flex items-center gap-3">
            <div className="flex bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                {[{ id: 'date', label: 'Daily' }, { id: 'month', label: 'Monthly' }, { id: 'year', label: 'Yearly' }].map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setFilter({ ...filter, type: p.id })}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${filter.type === p.id
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm">
                <FaCalendarDay className="text-gray-400 text-[10px]" />
                {filter.type === 'month' && (
                    <div className="flex gap-1">
                        <select
                            value={filter.month}
                            onChange={(e) => setFilter({ ...filter, month: Number(e.target.value) })}
                            className="bg-transparent border-none text-[10px] font-black p-0 focus:ring-0 text-gray-700 uppercase"
                        >
                            {moment.months().map((m, i) => <option key={i} value={i + 1}>{m.substring(0, 3)}</option>)}
                        </select>
                        <select
                            value={filter.year}
                            onChange={(e) => setFilter({ ...filter, year: Number(e.target.value) })}
                            className="bg-transparent border-none text-[10px] font-black p-0 focus:ring-0 text-gray-700"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                )}
                {filter.type === 'year' && (
                    <select
                        value={filter.year}
                        onChange={(e) => setFilter({ ...filter, year: Number(e.target.value) })}
                        className="bg-transparent border-none text-[10px] font-black p-0 focus:ring-0 text-gray-700"
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                )}
                {filter.type === 'date' && (
                    <input
                        type="date"
                        value={filter.date}
                        onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                        className="bg-transparent border-none text-[11px] font-black p-0 focus:ring-0 text-gray-700 w-[100px]"
                    />
                )}
            </div>
        </div>
    );

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/analytics/overview');
            setData(response.data);

            // Fetch all products for franchise analytics
            setFranchiseLoading(true);
            const productsRes = await apiClient.get('/products');
            setAllProducts(productsRes.data);
            setFranchiseLoading(false);

            // Initial sales trend fetch
            const trendRes = await apiClient.get(`/analytics/daily?month=${selectedMonth}&year=${selectedYear}`);
            setSalesTrend(trendRes.data.data);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
            setFranchiseLoading(false);
        }
    };

    const fetchSalesTrend = async () => {
        setChartLoading(true);
        try {
            let query = '';
            if (filterType === 'month') query = `?month=${selectedMonth}&year=${selectedYear}`;
            else if (filterType === 'year') query = `?year=${selectedYear}`;
            else if (filterType === 'date') query = `?date=${selectedDate}`;
            else if (filterType === 'custom') query = `?startDate=${customRange.start}&endDate=${customRange.end}`;

            const response = await apiClient.get(`/analytics/daily${query}`);
            setSalesTrend(response.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setChartLoading(false);
        }
    };

    const fetchCategoryData = async () => {
        setCatLoading(true);
        try {
            let query = '';
            if (catFilter.type === 'month') query = `?month=${catFilter.month}&year=${catFilter.year}`;
            else if (catFilter.type === 'year') query = `?year=${catFilter.year}`;
            else if (catFilter.type === 'date') query = `?date=${catFilter.date}`;

            const response = await apiClient.get(`/analytics/overview${query}`);
            setCatData(response.data.productAnalytics.categorySales);
        } catch (err) {
            console.error(err);
        } finally {
            setCatLoading(false);
        }
    };

    const fetchOrderData = async () => {
        setOrdLoading(true);
        try {
            let query = '';
            if (ordFilter.type === 'month') query = `?month=${ordFilter.month}&year=${ordFilter.year}`;
            else if (ordFilter.type === 'year') query = `?year=${ordFilter.year}`;
            else if (ordFilter.type === 'date') query = `?date=${ordFilter.date}`;

            const response = await apiClient.get(`/analytics/overview${query}`);
            setOrdData(response.data.overview);
        } catch (err) {
            console.error(err);
        } finally {
            setOrdLoading(false);
        }
    };

    const fetchLocSalesData = async () => {
        setLocSalesLoading(true);
        try {
            let query = '';
            if (locSalesFilter.type === 'month') query = `?month=${locSalesFilter.month}&year=${locSalesFilter.year}`;
            else if (locSalesFilter.type === 'year') query = `?year=${locSalesFilter.year}`;
            else if (locSalesFilter.type === 'date') query = `?date=${locSalesFilter.date}`;

            const response = await apiClient.get(`/analytics/overview${query}`);
            setLocSalesData(response.data.locationAnalytics || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLocSalesLoading(false);
        }
    };

    const fetchLocOrderData = async () => {
        setLocOrderLoading(true);
        try {
            let query = '';
            if (locOrderFilter.type === 'month') query = `?month=${locOrderFilter.month}&year=${locOrderFilter.year}`;
            else if (locOrderFilter.type === 'year') query = `?year=${locOrderFilter.year}`;
            else if (locOrderFilter.type === 'date') query = `?date=${locOrderFilter.date}`;

            const response = await apiClient.get(`/analytics/overview${query}`);
            setLocOrderData(response.data.locationAnalytics || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLocOrderLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!loading) fetchSalesTrend();
    }, [filterType, selectedMonth, selectedYear, selectedDate, customRange]);

    useEffect(() => {
        fetchCategoryData();
    }, [catFilter]);

    useEffect(() => {
        fetchOrderData();
    }, [ordFilter]);

    useEffect(() => {
        fetchLocSalesData();
    }, [locSalesFilter]);

    useEffect(() => {
        fetchLocOrderData();
    }, [locOrderFilter]);

    const exportToExcel = () => {
        if (!data) return;

        const wb = XLSX.utils.book_new();

        // Overview Sheet
        const overviewData = [
            ["Metric", "Value"],
            ["Total Revenue", data.overview.totalRevenue],
            ["Today Sales", data.overview.todaySales],
            ["Weekly Sales", data.overview.weeklySales],
            ["Monthly Sales", data.overview.monthlySales],
            ["Total Orders", data.overview.totalOrders],
            ["Total Customers", data.overview.totalCustomers],
            ["Total Products", data.overview.totalProducts],
            ["Pending Orders", data.overview.pendingOrders],
            ["Delivered Orders", data.overview.deliveredOrders],
            ["Cancelled Orders", data.overview.cancelledOrders]
        ];
        const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

        // Top Selling Sheet
        const topSellingData = [
            ["Product Name", "Units Sold", "Revenue"],
            ...data.productAnalytics.topSelling.map(p => [p.name || 'Unknown', p.totalSold, p.revenue])
        ];
        const wsTopSelling = XLSX.utils.aoa_to_sheet(topSellingData);
        XLSX.utils.book_append_sheet(wb, wsTopSelling, "Top Selling");

        // Low Stock Sheet
        const lowStockData = [
            ["Product Name", "Available Stock"],
            ...data.inventory.lowStockProducts.map(p => [p.name, p.variants.reduce((acc, v) => acc + v.countInStock, 0)])
        ];
        const wsLowStock = XLSX.utils.aoa_to_sheet(lowStockData);
        XLSX.utils.book_append_sheet(wb, wsLowStock, "Low Stock Alert");

        // Franchise Inventory Sheet
        const franchiseInvData = [
            ["Product Name", "Location/Pincode", "Stock Level"],
            ...allProducts.flatMap(p =>
                (p.pincodePricing || []).map(pr => [p.name, pr.location || pr.pincode, pr.inventory])
            )
        ];
        const wsFranchise = XLSX.utils.aoa_to_sheet(franchiseInvData);
        XLSX.utils.book_append_sheet(wb, wsFranchise, "Franchise Inventory");

        XLSX.writeFile(wb, `Analytics_Report_${moment().format('YYYY-MM-DD')}.xlsx`);
    };

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

    const summaryCards = [
        { title: "Total Revenue", value: `₹${data.overview.totalRevenue.toLocaleString()}`, icon: <FaMoneyBillWave />, color: "bg-blue-600", trend: "+12%" },
        { title: "Today's Sales", value: `₹${data.overview.todaySales.toLocaleString()}`, icon: <FaCalendarDay />, color: "bg-green-600", trend: "+5%" },
        { title: "Active Customers", value: data.overview.totalCustomers, icon: <FaUsers />, color: "bg-purple-600" },
        { title: "Total Orders", value: data.overview.totalOrders, icon: <FaShoppingCart />, color: "bg-orange-600" },
        { title: "Total Products", value: data.overview.totalProducts, icon: <FaBox />, color: "bg-indigo-600" },
        { title: "Delivered", value: data.overview.deliveredOrders, icon: <FaBox />, color: "bg-emerald-600" },
        { title: "Cancelled", value: data.overview.cancelledOrders, icon: <FaExclamationTriangle />, color: "bg-red-600" },
        { title: "Low Stock", value: data.overview.lowStockCount, icon: <FaExclamationTriangle />, color: "bg-yellow-600" },
    ];

    // Filtered data based on search term
    const filterBySearch = (list) => {
        if (!searchTerm) return list || [];
        return (list || []).filter(item =>
            (item.name || item._id || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const filteredTopSelling = filterBySearch(data.productAnalytics.topSelling);
    const filteredMostReturned = filterBySearch(data.productAnalytics.mostReturned);
    const filteredLowStock = filterBySearch(data.inventory.lowStockProducts);
    const filteredOutOfStock = filterBySearch(data.productAnalytics.outOfStock);
    const filteredCategorySales = filterBySearch(catData || data.productAnalytics.categorySales);

    const currentOrderData = ordData || data.overview;

    const salesTrendData = {
        labels: salesTrend.map(d => d._id.day ? `${d._id.day}/${d._id.month}` : moment.monthsShort(d._id.month - 1)),
        datasets: [{
            label: 'Sales Revenue',
            data: salesTrend.map(d => d.totalSales),
            backgroundColor: [
                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
            ],
            borderRadius: 0,
            borderWidth: 0,
            barThickness: 24,
        }]
    };

    const orderStatusData = {
        labels: ['Delivered', 'Pending', 'Cancelled'],
        datasets: [{
            data: [
                currentOrderData.deliveredOrders || 0,
                currentOrderData.pendingOrders || 0,
                currentOrderData.cancelledOrders || 0
            ],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <button className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg bg-white shadow-sm mb-3 transition-all">
                        Back
                    </button>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">Analytics Dashboard</h1>
                    <p className="text-gray-500 font-medium text-xs md:text-sm lg:text-lg">Understand store growth, product trends, and real-time performance.</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all active:scale-95 whitespace-nowrap w-full md:w-auto"
                >
                    <FaDownload className="text-sm md:text-base" /> EXPORT REPORT
                </button>
            </div>

            {/* Global Search and Filter Bar - Styled like the image */}
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm mb-8">
                <div className="flex flex-col lg:flex-row items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-grow w-full">
                        <span className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm md:text-base font-bold">Search</span>
                        <input
                            type="text"
                            placeholder="Search by product name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 md:pl-20 pr-4 md:pr-6 py-3 md:py-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* Filter Actions */}
                    <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 overflow-x-auto no-scrollbar scrollbar-hide">
                            {['month', 'year', 'date', 'custom'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${filterType === type
                                        ? 'bg-white text-green-600 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 md:px-4 py-2 md:py-3.5 rounded-xl md:rounded-2xl shadow-sm flex-grow md:flex-grow-0">
                            <FaCalendarDay className="text-green-600 text-xs md:text-base" />
                            <div className="flex items-center gap-2">
                                {filterType === 'month' && (
                                    <>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                            className="bg-transparent border-none text-[11px] font-black p-0 focus:ring-0 cursor-pointer text-gray-700"
                                        >
                                            {moment.months().map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                        </select>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            className="bg-transparent border-none text-[11px] font-black p-0 focus:ring-0 cursor-pointer text-gray-700"
                                        >
                                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </>
                                )}

                                {filterType === 'year' && (
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="bg-transparent border-none text-[11px] font-black p-0 focus:ring-0 cursor-pointer text-gray-700"
                                    >
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                )}

                                {filterType === 'date' && (
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="bg-transparent border-none text-[11px] font-black p-0 focus:ring-0 cursor-pointer text-gray-700"
                                    />
                                )}

                                {filterType === 'custom' && (
                                    <div className="flex items-center gap-2 text-[11px] font-black text-gray-700">
                                        <input
                                            type="date"
                                            value={customRange.start}
                                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                            className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-[11px] font-black w-[100px]"
                                        />
                                        <span className="text-gray-300">to</span>
                                        <input
                                            type="date"
                                            value={customRange.end}
                                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                            className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-[11px] font-black w-[100px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-[10px] font-bold text-gray-400">
                    Showing analytics for <span className="text-green-600">{filterType} filter</span> with {salesTrend.length} data points.
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                {summaryCards.map((card, i) => (
                    <div key={i} className="bg-white p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                            <div className={`${card.color} p-2 md:p-2.5 rounded-xl text-white text-base md:text-lg shadow-md ring-4 ring-offset-1 ring-transparent`}>
                                {card.icon}
                            </div>
                            {card.trend && (
                                <span className={`text-[8px] md:text-[9px] font-black px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-wider ${card.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {card.trend}
                                </span>
                            )}
                        </div>
                        <h3 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{card.title}</h3>
                        <p className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Sales Trend Chart */}
                <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                    <div className="mb-4 md:mb-8">
                        <h2 className="text-lg md:text-xl font-black text-gray-900">Sales Trends</h2>
                        <p className="text-xs md:text-sm text-gray-500">Visualizing revenue performance</p>
                    </div>
                    <div className="h-[400px] relative">
                        {chartLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600"></div>
                            </div>
                        )}
                        <Bar
                            data={salesTrendData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: '#1f2937',
                                        padding: 12,
                                        titleFont: { size: 14, weight: 'bold' },
                                        bodyFont: { size: 13 },
                                        displayColors: false
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: '#f3f4f6', drawBorder: false },
                                        ticks: {
                                            font: { weight: 'black', size: 12 },
                                            padding: 10,
                                            callback: (value) => {
                                                if (value >= 1000) {
                                                    return '₹' + (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
                                                }
                                                return '₹' + value;
                                            }
                                        }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: {
                                            font: { weight: 'black', size: 12 },
                                            padding: 10
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex flex-col relative min-h-[450px]">
                    {catLoading && (
                        <div className="absolute inset-0 bg-white/30 z-20 flex items-center justify-center rounded-2xl md:rounded-3xl transition-all duration-300">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600"></div>
                        </div>
                    )}
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-gray-900 leading-tight">Category Sales</h2>
                            <div className="flex gap-4 mt-3">
                                {[
                                    { id: 'date', label: 'Daily' },
                                    { id: 'month', label: 'Monthly' },
                                    { id: 'year', label: 'Yearly' }
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setCatFilter({ ...catFilter, type: p.id })}
                                        className={`text-[10px] uppercase font-black tracking-widest pb-1 transition-all ${catFilter.type === p.id
                                            ? 'text-green-600 border-b-2 border-green-600'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 shadow-inner">
                            <FaCalendarDay className="text-gray-400 text-xs" />
                            {catFilter.type === 'month' && (
                                <div className="flex gap-1">
                                    <select
                                        value={catFilter.month}
                                        onChange={(e) => setCatFilter({ ...catFilter, month: Number(e.target.value) })}
                                        className="bg-transparent border-none text-[9px] font-black p-0 focus:ring-0 text-gray-700 uppercase"
                                    >
                                        {moment.months().map((m, i) => <option key={i} value={i + 1}>{m.substring(0, 3)}</option>)}
                                    </select>
                                    <select
                                        value={catFilter.year}
                                        onChange={(e) => setCatFilter({ ...catFilter, year: Number(e.target.value) })}
                                        className="bg-transparent border-none text-[9px] font-black p-0 focus:ring-0 text-gray-700"
                                    >
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            )}
                            {catFilter.type === 'year' && (
                                <select
                                    value={catFilter.year}
                                    onChange={(e) => setCatFilter({ ...catFilter, year: Number(e.target.value) })}
                                    className="bg-transparent border-none text-[9px] font-black p-0 focus:ring-0 text-gray-700"
                                >
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            )}
                            {catFilter.type === 'date' && (
                                <input
                                    type="date"
                                    value={catFilter.date}
                                    onChange={(e) => setCatFilter({ ...catFilter, date: e.target.value })}
                                    className="bg-transparent border-none text-[11px] font-black p-0 focus:ring-0 text-gray-700 w-[100px]"
                                />
                            )}
                        </div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 mb-6 -mt-2">Revenue share by category</p>
                    <div className="h-[300px] flex items-center justify-center">
                        <Pie
                            data={{
                                labels: filteredCategorySales.map(c => c._id),
                                datasets: [{
                                    data: filteredCategorySales.map(c => c.totalSales),
                                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],
                                    borderWidth: 2,
                                    borderColor: '#ffffff'
                                }]
                            }}
                            options={{
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            usePointStyle: true,
                                            padding: 20,
                                            font: { weight: 'bold', size: 10 }
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: '#1f2937',
                                        padding: 12,
                                        titleFont: { weight: 'bold' }
                                    }
                                }
                            }}
                        />
                    </div>
                    <div className="mt-8 space-y-3 overflow-y-auto max-h-[150px] pr-2 custom-scrollbar">
                        {filteredCategorySales.map((cat, i) => (
                            <div key={i} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl">
                                <span className="text-xs font-bold text-gray-600">{cat._id}</span>
                                <span className="text-xs font-black text-gray-900">₹{cat.totalSales.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Status Breakdown */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative min-h-[450px]">
                    {ordLoading && (
                        <div className="absolute inset-0 bg-white/30 z-20 flex items-center justify-center rounded-2xl md:rounded-3xl transition-all duration-300">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600"></div>
                        </div>
                    )}
                    <div className="p-4 md:p-6 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg md:text-xl font-black text-gray-900 leading-tight">Order Analytics</h2>
                                <div className="flex gap-4 mt-3">
                                    {[
                                        { id: 'date', label: 'Daily' },
                                        { id: 'month', label: 'Monthly' },
                                        { id: 'year', label: 'Yearly' }
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setOrdFilter({ ...ordFilter, type: p.id })}
                                            className={`text-[10px] uppercase font-black tracking-widest pb-1 transition-all ${ordFilter.type === p.id
                                                ? 'text-green-600 border-b-2 border-green-600'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                <FaCalendarDay className="text-gray-400 text-xs" />
                                {ordFilter.type === 'month' && (
                                    <div className="flex gap-1">
                                        <select
                                            value={ordFilter.month}
                                            onChange={(e) => setOrdFilter({ ...ordFilter, month: Number(e.target.value) })}
                                            className="bg-transparent border-none text-[9px] font-black p-0 focus:ring-0 text-gray-700 uppercase"
                                        >
                                            {moment.months().map((m, i) => <option key={i} value={i + 1}>{m.substring(0, 3)}</option>)}
                                        </select>
                                        <select
                                            value={ordFilter.year}
                                            onChange={(e) => setOrdFilter({ ...ordFilter, year: Number(e.target.value) })}
                                            className="bg-transparent border-none text-[9px] font-black p-0 focus:ring-0 text-gray-700"
                                        >
                                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                )}
                                {ordFilter.type === 'year' && (
                                    <select
                                        value={ordFilter.year}
                                        onChange={(e) => setOrdFilter({ ...ordFilter, year: Number(e.target.value) })}
                                        className="bg-transparent border-none text-[9px] font-black p-0 focus:ring-0 text-gray-700"
                                    >
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                )}
                                {ordFilter.type === 'date' && (
                                    <input
                                        type="date"
                                        value={ordFilter.date}
                                        onChange={(e) => setOrdFilter({ ...ordFilter, date: e.target.value })}
                                        className="bg-transparent border-none text-[11px] font-black p-0 focus:ring-0 text-gray-700 w-[100px]"
                                    />
                                )}
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-2">Breakdown of order status</p>
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                        <div className="h-[250px] relative mb-8">
                            <Doughnut
                                data={orderStatusData}
                                options={{
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: '#1f2937',
                                            padding: 12,
                                            titleFont: { weight: 'bold' }
                                        }
                                    },
                                    cutout: '75%',
                                    maintainAspectRatio: false
                                }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-gray-900">{currentOrderData.totalOrders}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orders</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Delivered', value: currentOrderData.deliveredOrders, color: 'bg-green-500' },
                                { label: 'Pending', value: currentOrderData.pendingOrders, color: 'bg-orange-500' },
                                { label: 'Cancelled', value: currentOrderData.cancelledOrders, color: 'bg-red-500' }
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100/50 hover:bg-white hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${s.color}`}></div>
                                        <span className="text-xs font-bold text-gray-600">{s.label}</span>
                                    </div>
                                    <span className="text-xs font-black text-gray-900">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top/Least Selling Products */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-50 bg-gray-50/30">
                        <h2 className="text-lg md:text-xl font-black text-gray-900">Product Performance</h2>
                        <p className="text-xs md:text-sm text-gray-500">Highest and lowest performing items</p>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xs font-black text-green-600 uppercase tracking-widest mb-4">🏆 Top Selling</h3>
                        <div className="space-y-3 mb-8">
                            {filteredTopSelling.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-2xl">
                                    <span className="text-sm font-bold text-gray-700">{p.name}</span>
                                    <span className="text-sm font-black text-green-700">{p.totalSold} sold</span>
                                </div>
                            ))}
                        </div>
                        <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4">📉 Most Returned</h3>
                        <div className="space-y-3">
                            {filteredMostReturned.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-2xl">
                                    <span className="text-sm font-bold text-gray-700">{p.name}</span>
                                    <span className="text-sm font-black text-red-700">{p.count} returns</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Inventory & Alerts */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-50 bg-gray-50/30">
                        <h2 className="text-lg md:text-xl font-black text-gray-900">Inventory Monitoring</h2>
                        <p className="text-xs md:text-sm text-gray-500">Stock levels and critical alerts</p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest">⚠️ Low Stock Alerts</h3>
                            <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Check Soon</span>
                        </div>
                        <div className="space-y-4 mb-8">
                            {filteredLowStock.length > 0 ? filteredLowStock.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex flex-col gap-1 border-b border-gray-50 pb-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-800">{p.name}</span>
                                        <span className="text-xs font-black text-red-600">
                                            {p.variants.reduce((acc, v) => acc + v.countInStock, 0)} items left
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 rounded-full"
                                            style={{ width: `${Math.min(100, (p.variants.reduce((acc, v) => acc + v.countInStock, 0) / 20) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-gray-400">All stock levels are healthy</p>}
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-red-600 uppercase tracking-widest">🚫 Out of Stock</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredOutOfStock.length > 0 ? filteredOutOfStock.slice(0, 10).map((p, i) => (
                                <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-500">
                                    {p.name}
                                </div>
                            )) : <p className="text-sm text-gray-400">No items out of stock</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Franchise Analytics Section */}
            <div className="mt-16 mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="bg-red-600 p-2.5 md:p-3 rounded-xl md:rounded-2xl text-white shadow-lg shadow-red-600/20">
                            <FaMapMarkerAlt className="text-xl md:text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">Franchise Analytics</h2>
                            <p className="text-gray-500 font-medium text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis">Location-wise inventory & performance</p>
                        </div>
                    </div>
                </div>

                {/* Franchise Dedicated Search & Filter Bar */}
                <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm mb-8 transition-all hover:shadow-md">
                    <div className="flex flex-col lg:flex-row items-center gap-4">
                        {/* Search Option Toggles */}
                        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full lg:w-auto shrink-0 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'both', label: 'ALL IN ONE', icon: '🌐' },
                                { id: 'location', label: 'AREA NAME', icon: '📍' },
                                { id: 'pincode', label: 'PINCODE', icon: '🔢' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSearchBy(opt.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all shrink-0 ${searchBy === opt.id
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                                        }`}
                                >
                                    <span>{opt.icon}</span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-grow w-full">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                            <input
                                type="text"
                                placeholder={`Search by ${searchBy === 'both' ? 'area name or pincode' : searchBy === 'location' ? 'area name (e.g. Rohtak)' : 'pincode (e.g. 124001)'}...`}
                                value={franchiseSearch}
                                onChange={(e) => setFranchiseSearch(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>

                        {/* Calendar Filters */}
                        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                {['month', 'year', 'date'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFranchiseFilter(prev => ({ ...prev, type }))}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${franchiseFilter.type === type
                                            ? 'bg-white text-red-600 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-sm">
                                <FaCalendarDay className="text-red-600" />
                                <div className="flex items-center gap-2">
                                    {franchiseFilter.type === 'month' && (
                                        <>
                                            <select
                                                value={franchiseFilter.month}
                                                onChange={(e) => setFranchiseFilter(prev => ({ ...prev, month: Number(e.target.value) }))}
                                                className="bg-transparent border-none text-[10px] font-black p-0 focus:ring-0 cursor-pointer text-gray-700 uppercase"
                                            >
                                                {moment.months().map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                            </select>
                                            <select
                                                value={franchiseFilter.year}
                                                onChange={(e) => setFranchiseFilter(prev => ({ ...prev, year: Number(e.target.value) }))}
                                                className="bg-transparent border-none text-[10px] font-black p-0 focus:ring-0 cursor-pointer text-gray-700"
                                            >
                                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </>
                                    )}
                                    {franchiseFilter.type === 'year' && (
                                        <select
                                            value={franchiseFilter.year}
                                            onChange={(e) => setFranchiseFilter(prev => ({ ...prev, year: Number(e.target.value) }))}
                                            className="bg-transparent border-none text-[10px] font-black p-0 focus:ring-0 cursor-pointer text-gray-700"
                                        >
                                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    )}
                                    {franchiseFilter.type === 'date' && (
                                        <input
                                            type="date"
                                            value={franchiseFilter.date}
                                            onChange={(e) => setFranchiseFilter(prev => ({ ...prev, date: e.target.value }))}
                                            className="bg-transparent border-none text-[11px] font-black p-0 focus:ring-0 cursor-pointer text-gray-700 w-[100px]"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {franchiseLoading ? (
                    <div className="flex h-48 items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {(() => {
                            const locations = {};
                            allProducts.forEach(product => {
                                if (product.pincodePricing && product.pincodePricing.length > 0) {
                                    product.pincodePricing.forEach(pricing => {
                                        const locKey = pricing.location || pricing.pincode || 'Unknown Location';

                                        // Apply Filtering Logic
                                        const matchesType =
                                            searchBy === 'both' ? true :
                                                searchBy === 'location' ? (pricing.location ? true : false) :
                                                    (pricing.pincode ? true : false);

                                        const matchesSearch =
                                            franchiseSearch === '' ? true :
                                                (searchBy === 'location' && pricing.location?.toLowerCase().includes(franchiseSearch.toLowerCase())) ||
                                                (searchBy === 'pincode' && pricing.pincode?.toString().includes(franchiseSearch)) ||
                                                (searchBy === 'both' && (
                                                    pricing.location?.toLowerCase().includes(franchiseSearch.toLowerCase()) ||
                                                    pricing.pincode?.toString().includes(franchiseSearch)
                                                ));

                                        if (!matchesType || !matchesSearch) return;

                                        if (!locations[locKey]) {
                                            locations[locKey] = {
                                                name: locKey,
                                                pincodes: new Set(),
                                                totalStock: 0,
                                                healthy: 0,
                                                critical: 0,
                                                empty: 0,
                                                products: []
                                            };
                                        }
                                        locations[locKey].pincodes.add(pricing.pincode);
                                        const stock = pricing.inventory || 0;
                                        locations[locKey].totalStock += stock;

                                        if (stock > 10) locations[locKey].healthy++;
                                        else if (stock > 0) locations[locKey].critical++;
                                        else locations[locKey].empty++;

                                        locations[locKey].products.push({
                                            name: product.name,
                                            stock: stock,
                                            pincode: pricing.pincode,
                                            location: locKey
                                        });
                                    });
                                }
                            });

                            const allLocData = Object.values(locations);
                            const filtered = allLocData;

                            if (filtered.length === 0) return (
                                <div className="bg-white p-20 text-center rounded-[3rem] border border-gray-100 shadow-sm">
                                    <div className="text-6xl mb-4">📍</div>
                                    <h3 className="text-2xl font-black text-gray-900">No Search Results</h3>
                                    <p className="text-gray-500 font-medium whitespace-pre-wrap">
                                        We couldn't find any locations matching "{franchiseSearch}"
                                        {searchBy !== 'both' && ` in ${searchBy} mode`}.
                                    </p>
                                </div>
                            );

                            // 2. Calculations for Charts & Summary
                            const totalFilteredStock = filtered.reduce((acc, loc) => acc + loc.totalStock, 0);

                            // Filter locSalesData based on franchiseSearch
                            const filteredLocSales = (locSalesData.length > 0 ? locSalesData : (data.locationAnalytics || [])).filter(loc => {
                                const matchesSearch = franchiseSearch === '' ? true :
                                    (searchBy === 'location' && loc.city?.toLowerCase().includes(franchiseSearch.toLowerCase())) ||
                                    (searchBy === 'pincode' && loc.pincode?.toString().includes(franchiseSearch)) ||
                                    (searchBy === 'both' && (
                                        loc.city?.toLowerCase().includes(franchiseSearch.toLowerCase()) ||
                                        loc.pincode?.toString().includes(franchiseSearch)
                                    ));
                                return matchesSearch;
                            });

                            // Filter locOrderData based on franchiseSearch
                            const filteredLocOrders = (locOrderData.length > 0 ? locOrderData : (data.locationAnalytics || [])).filter(loc => {
                                const matchesSearch = franchiseSearch === '' ? true :
                                    (searchBy === 'location' && loc.city?.toLowerCase().includes(franchiseSearch.toLowerCase())) ||
                                    (searchBy === 'pincode' && loc.pincode?.toString().includes(franchiseSearch)) ||
                                    (searchBy === 'both' && (
                                        loc.city?.toLowerCase().includes(franchiseSearch.toLowerCase()) ||
                                        loc.pincode?.toString().includes(franchiseSearch)
                                    ));
                                return matchesSearch;
                            });

                            let barLabels, barValues, barLabelText;
                            if (filtered.length === 1) {
                                const loc = filtered[0];
                                barLabels = loc.products.slice(0, 15).map(p => p.name);
                                barValues = loc.products.slice(0, 15).map(p => p.stock);
                                barLabelText = `Stock in ${loc.name}`;
                            } else {
                                barLabels = filtered.length > 15 ? filtered.slice(0, 15).map(l => l.name) : filtered.map(l => l.name);
                                barValues = filtered.length > 15 ? filtered.slice(0, 15).map(l => l.totalStock) : filtered.map(l => l.totalStock);
                                barLabelText = "Location Comparison";
                            }

                            const healthStats = filtered.reduce((acc, l) => {
                                acc.healthy += l.healthy;
                                acc.critical += l.critical;
                                acc.empty += l.empty;
                                return acc;
                            }, { healthy: 0, critical: 0, empty: 0 });

                            const chartColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

                            // 3. Final Render
                            return (
                                <div className="space-y-10">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <h3 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:mb-2">Locations Found</h3>
                                            <p className="text-2xl md:text-4xl font-black text-gray-900">{filtered.length}</p>
                                            <div className="mt-2 md:mt-4 flex items-center gap-2 text-red-600 font-bold text-[10px] uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                                Active Search
                                            </div>
                                        </div>
                                        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <h3 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:mb-2">Filtered Stock</h3>
                                            <p className="text-2xl md:text-4xl font-black text-gray-900">{totalFilteredStock.toLocaleString()}</p>
                                            <div className="mt-2 md:mt-4 text-gray-400 font-bold text-[10px] uppercase tracking-wider">Units in selection</div>
                                        </div>
                                        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <h3 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:mb-2">Consistency</h3>
                                            <p className="text-2xl md:text-4xl font-black text-blue-600">Stable</p>
                                            <div className="mt-2 md:mt-4 text-gray-400 font-bold text-[10px] uppercase tracking-wider">Inventory Health</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Stock Level Bar Chart */}
                                        <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 md:mb-8">
                                                <div>
                                                    <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{barLabelText}</h3>
                                                    <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider">Inventory counts</p>
                                                </div>
                                                <div className="bg-gray-50 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    {filtered.length === 1 ? 'Showing Products' : `Showing ${filtered.length} Areas`}
                                                </div>
                                            </div>
                                            <div className="h-[350px] max-w-2xl mx-auto">
                                                <Bar
                                                    data={{
                                                        labels: barLabels,
                                                        datasets: [{
                                                            label: 'Units',
                                                            data: barValues,
                                                            backgroundColor: chartColors,
                                                            borderRadius: 12,
                                                            barThickness: 20,
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false } },
                                                        scales: {
                                                            y: { grid: { display: false }, ticks: { font: { weight: 'bold' } } },
                                                            x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stock Health Doughnut */}
                                        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="mb-6 md:mb-8">
                                                <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Inventory Health</h3>
                                                <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider mb-4 md:mb-5">Stock status distribution</p>
                                                {renderLocalFilter(healthFilter, setHealthFilter)}
                                            </div>
                                            <div className="h-[250px] relative">
                                                <Doughnut
                                                    data={{
                                                        labels: ['Healthy (>10)', 'Critical (<10)', 'Out of Stock'],
                                                        datasets: [{
                                                            data: [healthStats.healthy, healthStats.critical, healthStats.empty],
                                                            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                                                            borderWidth: 0,
                                                            cutout: '75%'
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false } }
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-2xl md:text-4xl font-black text-gray-900">{healthStats.healthy + healthStats.critical + healthStats.empty}</span>
                                                    <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Items</span>
                                                </div>
                                            </div>
                                            <div className="mt-8 space-y-3">
                                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-2xl">
                                                    <span className="text-xs font-black text-green-700">Healthy</span>
                                                    <span className="text-sm font-black text-green-700">{healthStats.healthy}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-2xl">
                                                    <span className="text-xs font-black text-orange-700">Critical</span>
                                                    <span className="text-sm font-black text-orange-700">{healthStats.critical}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-2xl">
                                                    <span className="text-xs font-black text-red-700">Out of Stock</span>
                                                    <span className="text-sm font-black text-red-700">{healthStats.empty}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Specific Insights */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                                        {/* Horizontal Sales by Location */}
                                        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="mb-6 md:mb-8">
                                                <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Location Sales</h3>
                                                <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider mb-4 md:mb-5">Revenue by geography</p>
                                                {renderLocalFilter(locSalesFilter, setLocSalesFilter)}
                                            </div>
                                            <div className="h-[350px]">
                                                {locSalesLoading ? (
                                                    <div className="h-full flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                                    </div>
                                                ) : (
                                                    <Bar
                                                        data={{
                                                            labels: filteredLocSales.map(l => l.city || l.pincode),
                                                            datasets: [{
                                                                label: 'Revenue',
                                                                data: filteredLocSales.map(l => l.sales),
                                                                backgroundColor: chartColors, // Multi-colored strips
                                                                borderRadius: 12,
                                                                barThickness: 20,
                                                            }]
                                                        }}
                                                        options={{
                                                            indexAxis: 'y', // Horizontal Bar Graph
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: { legend: { display: false } },
                                                            scales: {
                                                                x: { grid: { borderDash: [5, 5] }, ticks: { font: { weight: 'bold' } } },
                                                                y: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Order Status Pie Chart */}
                                        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="mb-6 md:mb-8">
                                                <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Order Matrices</h3>
                                                <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider mb-4 md:mb-5">Status distribution</p>
                                                {renderLocalFilter(locOrderFilter, setLocOrderFilter)}
                                            </div>
                                            <div className="h-[450px] flex items-center justify-center">
                                                {locOrderLoading ? (
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                                ) : (
                                                    <div className="w-full max-w-[400px] h-full">
                                                        <Pie
                                                            data={{
                                                                labels: ['Delivered', 'Returns', 'Cancelled'],
                                                                datasets: [{
                                                                    data: [
                                                                        filteredLocOrders.reduce((acc, l) => acc + l.delivered, 0),
                                                                        filteredLocOrders.reduce((acc, l) => acc + l.returns, 0),
                                                                        filteredLocOrders.reduce((acc, l) => acc + l.cancelled, 0)
                                                                    ],
                                                                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                                                                    borderWidth: 0,
                                                                    hoverOffset: 15,
                                                                    radius: 150,
                                                                }]
                                                            }}
                                                            options={{
                                                                responsive: true,
                                                                maintainAspectRatio: false,
                                                                plugins: {
                                                                    legend: {
                                                                        display: true,
                                                                        position: 'bottom',
                                                                        labels: { font: { weight: 'bold', size: 12 }, padding: 20 }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;

