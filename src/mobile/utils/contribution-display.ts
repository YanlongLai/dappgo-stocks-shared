/**
 * Axis label constants for ContributionBarsCard.
 * TW uses 籌碼, US uses 機構.
 */

export interface AxisLabels {
  trend: string;
  momentum: string;
  volume: string;
  chip?: string;
  ownership?: string;
}

export const TW_AXIS_LABELS: AxisLabels = {
  trend: '趨勢',
  momentum: '動能',
  volume: '量能',
  chip: '籌碼',
};

export const US_AXIS_LABELS: AxisLabels = {
  trend: '趨勢',
  momentum: '動能',
  volume: '量能',
  ownership: '機構',
};
