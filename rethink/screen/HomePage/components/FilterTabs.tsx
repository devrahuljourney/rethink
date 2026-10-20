import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Segmented } from '../../../ui/kit';

export type FilterRange = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface FilterTabsProps {
    activeRange: FilterRange;
    onRangeChange: (range: FilterRange) => void;
    style?: StyleProp<ViewStyle>;
}

const OPTIONS: { value: FilterRange; label: string }[] = [
    { value: 'DAILY', label: 'Today' },
    { value: 'WEEKLY', label: 'Week' },
    { value: 'MONTHLY', label: 'Month' },
];

const FilterTabs: React.FC<FilterTabsProps> = ({ activeRange, onRangeChange, style }) => (
    <Segmented options={OPTIONS} value={activeRange} onChange={onRangeChange} style={style} />
);

export default FilterTabs;
