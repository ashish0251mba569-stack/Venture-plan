import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { FINANCIAL_PRODUCTS, ProductCategory } from '../data/financialProducts';

type FilterValue = 'all' | ProductCategory;

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'All Options' },
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Balanced & Tax' },
  { value: 'high', label: 'Long-Term Growth' },
  { value: 'protection', label: 'Protection' },
];

export function CompareProductsPanel() {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FINANCIAL_PRODUCTS.filter((item) => {
      const matchesFilter = filter === 'all' || item.category === filter;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.bestFor.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [filter, searchQuery]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Simple Financial Product Comparison
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Compare beginner-friendly options in India without confusing financial jargon.
          </p>
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FD, SIP, PPF..."
            aria-label="Search financial products"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filter === opt.value
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-12 text-center border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700">No matching products found.</p>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Option</th>
                <th className="py-3 px-4">Plain-English Meaning</th>
                <th className="py-3 px-4 whitespace-nowrap">Start With</th>
                <th className="py-3 px-4 whitespace-nowrap">Risk Level</th>
                <th className="py-3 px-4">Liquidity &amp; Lock-in</th>
                <th className="py-3 px-4 whitespace-nowrap">Typical Return*</th>
                <th className="py-3 px-4">Best For &amp; Watch Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/70 transition-colors align-top">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 min-w-[160px]">
                    <div>{product.name}</div>
                    <div className="text-xs font-normal text-slate-500 mt-0.5">
                      {product.categoryLabel}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 min-w-[210px] leading-relaxed">
                    {product.meaning}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-slate-900 whitespace-nowrap">
                    {product.minimumStart}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold ${
                        product.category === 'low'
                          ? 'text-emerald-700'
                          : product.category === 'high'
                            ? 'text-amber-700'
                            : 'text-blue-700'
                      }`}
                    >
                      {product.riskLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 min-w-[170px]">{product.liquidity}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                    {product.illustrativeReturn}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 min-w-[230px]">
                    <p className="text-slate-800">{product.bestFor}</p>
                    <p className="text-xs text-slate-500 mt-1">Watch out: {product.watchOut}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4">
        *Illustrative ranges reflect historical Indian market averages, not guaranteed future returns.
        FinGuide AI does not execute trades or sell financial products.
      </p>
    </div>
  );
}
