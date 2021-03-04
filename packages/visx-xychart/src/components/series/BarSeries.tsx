import { AxisScale } from '@visx/axis';
import React from 'react';
import BaseBarSeries, { BaseBarSeriesProps } from './private/BaseBarSeries';
import Bars from './private/Bars';
import { BarsProps } from '../../types';
import { ValueOf } from '@visx/scale';
import { ScaleTypeToD3Scale } from '@visx/scale';
import { AxisScaleOutput } from '@visx/axis';

function BarSeries<XScale extends AxisScale, YScale extends AxisScale, Datum extends object>({
  colorAccessor,
  BarsComponent = Bars,
  ...props
}: BaseBarSeriesProps<XScale, YScale, Datum>) {
  return (
    <BaseBarSeries<XScale, YScale, Datum>
      {...props}
      // @TODO currently generics for non-SeriesProps are not passed correctly in
      // withRegisteredData HOC
      colorAccessor={colorAccessor as BaseBarSeriesProps<XScale, YScale, object>['colorAccessor']}
      BarsComponent={BarsComponent as React.FC<BarsProps<ValueOf<ScaleTypeToD3Scale<AxisScaleOutput, any, any>>, ValueOf<ScaleTypeToD3Scale<AxisScaleOutput, any, any>>>>}
    />
  );
}

export default BarSeries;
