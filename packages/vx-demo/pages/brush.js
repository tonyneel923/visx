import React from 'react';
import { localPoint } from '@vx/event';
import { Drag } from '@vx/drag';
import { Group } from '@vx/group';
import { AxisBottom } from '@vx/axis';
import { AreaClosed } from '@vx/shape';
import { curveMonotoneX } from '@vx/curve';
import { scaleTime, scaleLinear } from '@vx/scale';
import Show from '../components/show';

import { Brush } from '../components/brush';

const b = new Brush({ width: 1000, height: 90, clamp: true });
b.selection = [[150, 0], [300, 90]];

const bg = '#333';
const gray = '#efefef';
const x = d => new Date(d.time);
const y = d => d.price;

class FocusChart extends React.PureComponent {
  render() {
    const { margin, height, width, x, y, xScale, yScale, data } = this.props;
    return (
      <Group top={margin.top} left={margin.left}>
        <AxisBottom
          top={height - margin.bottom - margin.top}
          data={data}
          scale={xScale}
          x={x}
          numTicks={3}
          stroke={gray}
          tickStroke={gray}
          tickLabelProps={() => ({
            fill: '#ffffff',
            textAnchor: 'middle',
            fontSize: 10,
            fontFamily: 'Arial',
            dx: '-0.25em',
            dy: '0.25em'
          })}
          tickComponent={({ formattedValue, ...tickProps }) => (
            <text {...tickProps}>{formattedValue}</text>
          )}
        />
        <AreaClosed
          data={data}
          yScale={yScale}
          y={d => yScale(y(d))}
          x={d => xScale(x(d))}
          stroke="transparent"
          fill="white"
          fillOpacity={0.2}
          curve={curveMonotoneX}
        />
      </Group>
    );
  }
}

class BrushDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: undefined, chartXScale: undefined };
    this.updateFocusDomain = this.updateFocusDomain.bind(this);
  }

  componentDidMount() {
    fetch('https://api.coindesk.com/v1/bpi/historical/close.json?start=2015-12-01&end=2019-01-31')
      .then(res => res.json())
      .then(data => {
        this.setState({
          chartXScale: scaleTime({ domain: [], range: [0, 1] }),
          focusDomain: [],
          data: Object.keys(data.bpi).map(k => ({
            time: k,
            price: data.bpi[k]
          }))
        });
      });
  }

  updateFocusDomain(focusDomain) {
    this.setState({ focusDomain });
  }

  render() {
    const { width, height } = this.props;
    const { data, chartXScale, focusDomain } = this.state;

    const context = { margin: { top: 5, left: 10, right: 10, bottom: 5 } };
    context.height = 100 - context.margin.top - context.margin.bottom;
    context.width = width - context.margin.left - context.margin.right;

    b.extent = [[context.margin.left, context.margin.top], [context.width, context.height]];

    const chart = {
      width,
      height: height - context.height - context.margin.top - context.margin.bottom,
      margin: { top: 10, left: 10, right: 10, bottom: 25 }
    };

    if (!data) {
      return (
        <svg width={width} height={height}>
          <rect width={width} height={height} fill={bg} rx={14} />
        </svg>
      );
    }

    const firstPoint = data[0];
    const currentPoint = data[data.length - 1];

    const minPrice = Math.min(...data.map(y));
    const maxPrice = Math.max(...data.map(y));

    chartXScale.range([0, chart.width]);
    if (!chartXScale.domain().length) {
      chartXScale.domain([x(firstPoint), x(currentPoint)]);
    }

    const chartYScale = scaleLinear({
      range: [chart.height - chart.margin.top - chart.margin.bottom, 0],
      domain: [minPrice, maxPrice + 100]
    });
    const contextXScale = scaleTime({
      range: [0, context.width],
      domain: [x(firstPoint), x(currentPoint)],
      clamp: true
    });
    const contextYScale = scaleLinear({
      range: [context.height - context.margin.top - context.margin.bottom, 0],
      domain: [minPrice, maxPrice + 100]
    });

    return (
      <svg width={width} height={height}>
        <rect width={width} height={height} fill={bg} rx={14} />
        <FocusChart
          data={data}
          width={chart.width}
          height={chart.height}
          margin={chart.margin}
          focusDomain={focusDomain}
          xScale={chartXScale}
          yScale={chartYScale}
          x={x}
          y={y}
        />
        <Group top={chart.height + context.margin.top} left={context.margin.left}>
          <rect width={context.width} height={context.height} fill={'transparent'} stroke={gray} />
          <AreaClosed
            data={data}
            yScale={contextYScale}
            y={d => contextYScale(y(d))}
            x={d => contextXScale(x(d))}
            stroke="transparent"
            fill="white"
            fillOpacity={0.2}
            curve={curveMonotoneX}
          />
          <BBrush
            brush={b}
            width={context.width}
            height={context.height}
            margin={context.margin}
            contextXScale={contextXScale}
            updateFocusDomain={this.updateFocusDomain}
          />
        </Group>
      </svg>
    );
  }
}

class BBrush extends React.PureComponent {
  constructor(props) {
    super(props);
    this.move = this.move.bind(this);
  }

  move(drag) {
    const { brush, updateFocusDomain, contextXScale, width, margin } = this.props;
    const x = brush.selection[0][0] + drag.dx;
    const x0 = margin.left;
    const x1 = width + margin.left;
    const d0 = Math.min(Math.max(x0, x), x1);
    const d1 = Math.min(Math.max(x0, x + brush.width), x1);
    // updateFocusDomain([contextXScale.invert(d0), contextXScale.invert(d1)]);
  }

  render() {
    const { brush, width, height } = this.props;
    return (
      <Drag width={width} height={height}>
        {drag => {
          const x = brush.selection[0][0] + drag.dx;
          const x0 = 0;
          const x1 = width;
          const d0 = Math.min(Math.max(x0, x), x1 - brush.width);

          return (
            <Group left={d0}>
              <rect
                width={brush.width}
                height={brush.height}
                fill="white"
                fillOpacity={0.3}
                onMouseDown={drag.dragStart}
                onMouseMove={drag.dragMove}
                onMouseUp={drag.dragEnd}
              />
            </Group>
          );
        }}
      </Drag>
    );
  }
}

export default () => {
  return (
    <Show component={BrushDemo} title="Brush">
      {``}
    </Show>
  );
};
