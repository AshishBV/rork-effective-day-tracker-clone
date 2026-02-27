import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Svg, { Line, Circle, Path, G, Text as SvgText, Rect } from 'react-native-svg';
import { THEME } from '../../constants/theme';

interface DataPoint {
  x: number;
  y: number | null;
}

interface LineChartProps {
  data: DataPoint[];
  yLabel: string;
  yMin: number;
  yMax: number;
  yStep: number;
  goalLine?: number;
  lineColor?: string;
  backgroundColor?: string;
  goalColor?: string;
  width?: number;
  height?: number;
  showValues?: boolean;
  valueFormatter?: (value: number) => string;
}

export default function LineChart({
  data,
  yLabel,
  yMin,
  yMax,
  yStep,
  goalLine,
  lineColor = THEME.highlight,
  backgroundColor = THEME.cardBackground,
  goalColor = THEME.error,
  width = 320,
  height = 200,
  showValues = false,
  valueFormatter,
}: LineChartProps) {
  const padding = { top: 20, right: 20, bottom: 50, left: 45 };
  const maxX = Math.max(...data.map(d => d.x), 1);
  const minPointSpacing = 28;
  const minChartWidth = width - padding.left - padding.right;
  const neededWidth = Math.max(minChartWidth, (maxX - 1) * minPointSpacing);
  const actualWidth = neededWidth + padding.left + padding.right;
  const isScrollable = actualWidth > width;
  const chartWidth = neededWidth;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = (x: number) => {
    return padding.left + ((x - 1) / Math.max(maxX - 1, 1)) * chartWidth;
  };

  const yScale = (y: number) => {
    return padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;
  };

  const validPoints = data.filter(d => d.y !== null) as { x: number; y: number }[];
  
  const pathData = validPoints.length > 0
    ? validPoints.reduce((acc, point, i) => {
        const x = xScale(point.x);
        const y = yScale(point.y);
        return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, '')
    : '';

  const yTicks: number[] = [];
  for (let i = yMin; i <= yMax; i += yStep) {
    yTicks.push(Math.round(i * 100) / 100);
  }

  const xTicks: number[] = [];
  for (let i = 1; i <= maxX; i++) {
    xTicks.push(i);
  }

  const isLightBg = backgroundColor === THEME.cardBackground || backgroundColor === '#FFFFFF' || backgroundColor === '#EFF6E0' || backgroundColor === '#AEC3B0';
  const textColor = isLightBg ? THEME.secondaryText : 'rgba(255,255,255,0.7)';
  const gridColor = isLightBg ? THEME.gridLine : 'rgba(255,255,255,0.15)';

  const svgWidth = isScrollable ? actualWidth : width;

  const chartContent = (
      <Svg width={svgWidth} height={height}>
        <Rect x={0} y={0} width={svgWidth} height={height} fill={backgroundColor} rx={8} />
        
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

        {xTicks.map((tick) => (
          <SvgText
            key={`x-${tick}`}
            x={xScale(tick)}
            y={height - 18}
            fontSize={9}
            fill={textColor}
            textAnchor="end"
            transform={`rotate(-45, ${xScale(tick)}, ${height - 18})`}
          >
            {tick}
          </SvgText>
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

        {pathData && (
          <Path
            d={pathData}
            stroke={lineColor}
            strokeWidth={2.5}
            fill="none"
          />
        )}

        {validPoints.map((point) => (
          <G key={`point-${point.x}`}>
            <Circle
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r={showValues ? 5 : 4}
              fill={lineColor}
            />
            {showValues && (
              <SvgText
                x={xScale(point.x)}
                y={yScale(point.y) - 10}
                fontSize={9}
                fill={textColor}
                textAnchor="middle"
                fontWeight="600"
              >
                {valueFormatter ? valueFormatter(point.y) : point.y.toFixed(1)}
              </SvgText>
            )}
          </G>
        ))}

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
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isScrollable ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={{ borderRadius: 8 }}
        >
          {chartContent}
        </ScrollView>
      ) : (
        chartContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});
