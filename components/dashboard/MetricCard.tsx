import { LucideIcon } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    description?: string;
}

export const MetricCard = ({ title, value, icon: Icon, trend, description }: MetricCardProps) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                </div>
                {trend && (
                    <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
            </div>
        </div>
    );
};
