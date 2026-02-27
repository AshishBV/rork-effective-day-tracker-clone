import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { THEME } from '../../constants/theme';

interface DataPoint {
  x: number | string;
  y: number;
  color?: string;
  label?: string;
}

interface BarChartProps {
  data: DataPoint[];
  yLabel: string;
  yMin: number;
  yMax: number;
  yStep: number;
  goalLine?: number;
  barColor?: string;
  backgroundColor?: string;
  goalColor?: string;
  width?: number;
  height?: number;
  showValues?: boolean;
}

export default function BarChart({
  data,
  yLabel,
  yMin,
  yMax,
  yStep,
  goalLine,
  barColor = THEME.highlight,
  backgroundColor = THEME.cardBackground,
  goalColor = THEME.error,
  width = 320,
  height = 200,
  showValues = false,
}: BarChartProps) {
  const padding = { top: 25, right: 20, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const barWidth = Math.max(chartWidth / data.length - 8, 10);
  const barSpacing = (chartWidth - barWidth * data.length) / (data.length + 1);

  const yScale = (y: number) => {
    const clampedY = Math.min(Math.max(y, yMin), yMax);
    return padding.top + chartHeight - ((clampedY - yMin) / (yMax - yMin)) * chartHeight;
  };

  const yTicks: number[] = [];
  for (let i = yMin; i <= yMax; i += yStep) {
    yTicks.push(Math.round(i * 100) / 100);
  }

  const isLightBg = backgroundColor === THEME.cardBackground || backgroundColor === '#FFFFFF' || backgroundColor === '#FFF2CC' || backgroundColor === '#F7EBD0' || backgroundColor === '#EFF6E0';
  const textColor = isLightBg ? THEME.secondaryText : 'rgba(255,255,255,0.8)';
  const gridColor = isLightBg ? THEME.gridLine : 'rgba(255,255,255,0.15)';
  const valueTextColor = isLightBg ? THEME.primaryText : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={backgroundColor} rx={8} />
        
        {yTicks.map((tick) => (
          <G key={`y-${tick}`}>
            <Line
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke={gridColor}
              strokeWidth={1}
            />
            <SvgText
              x={padding.left - 8}
              y={yScale(tick) + 4}
              fontSize={10}
              fill={textColor}
              textAnchor="end"
            >
              {tick % 1 === 0 ? tick.toString() : tick.toFixed(1)}
            </SvgText>
          </G>
        ))}

        {goalLine !== undefined && (
          <Line
            x1={padding.left}
            y1={yScale(goalLine)}
            x2={width - padding.right}
            y2={yScale(goalLine)}
            stroke={goalColor}
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}

        {data.map((point, index) => {
          const x = padding.left + barSpacing + index * (barWidth + barSpacing);
          const barHeight = Math.max(((point.y - yMin) / (yMax - yMin)) * chartHeight, 0);
          const y = padding.top + chartHeight - barHeight;

          return (
            <G key={`bar-${index}`}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={point.color || barColor}
                rx={4}
              />
              {showValues && point.y > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 4}
                  fontSize={9}
                  fill={valueTextColor}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {point.y >= 1000 ? `${(point.y / 1000).toFixed(1)}k` : (point.y % 1 === 0 ? point.y : point.y.toFixed(1))}
                </SvgText>
              )}
              <SvgText
                x={x + barWidth / 2}
                y={height - 8}
                fontSize={9}
                fill={textColor}
                textAnchor="middle"
              >
                {point.label || point.x.toString()}
              </SvgText>
            </G>
          );
        })}

        <SvgText
          x={12}
          y={height / 2}
          fontSize={10}
          fill={textColor}
          textAnchor="middle"
          transform={`rotate(-90, 12, ${height / 2})`}
        >
          {yLabel}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});
