type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  if (total <= pageSize) {
    return (
      <p className="text-xs text-slate-500">
        {total === 0 ? 'No results' : `Showing ${total} result${total === 1 ? '' : 's'}`}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="min-h-9 rounded-lg px-3 text-sm border border-white/10 text-slate-300 disabled:opacity-40"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </button>
        <span className="text-xs text-slate-500 tabular-nums">
          Page {safePage} / {pageCount}
        </span>
        <button
          type="button"
          className="min-h-9 rounded-lg px-3 text-sm border border-white/10 text-slate-300 disabled:opacity-40"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export const DEFAULT_PAGE_SIZE = 25;
