import { clsx } from "clsx";

export default function StatusBadge({ status }: { status: string }) {
    const styles = {
        confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900",
        pending_reschedule: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900",
        completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    }

    const label = status.replace('_', ' ');
    const className = styles[status as keyof typeof styles] || styles.completed;

    return (
        <span className={clsx("px-3 py-1 rounded-full text-xs font-bold border capitalize", className)}>
            {label}
        </span>
    );
}
