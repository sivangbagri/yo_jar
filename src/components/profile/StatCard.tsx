export function StatCard({ label, value, accent = false }: { label: string; value: string | null; accent?: boolean }) {
    return (
        <div className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
            <p className="stat-label">{label}</p>
            {value === null ? (
                <div className="stat-skeleton" />
            ) : (
                <p className="stat-value">{value}</p>
            )}
        </div>
    )
}