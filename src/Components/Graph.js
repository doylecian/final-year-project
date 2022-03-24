import React, { PureComponent } from 'react';
import { Area, LineChart, Label, Line, XAxis, YAxis, ReferenceArea, CartesianAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, ComposedChart } from 'recharts';
import { UNIXToDate } from '../Utils/UtilFunctions';

const getAxisYDomain = (data, from, to, ref, offset) => {
  console.log(data)
  const refData = data.filter(date => date.timestamp_unix >= from && date.timestamp_unix <= to)
  let [bottom, top] = [refData[0]['price'], refData[0]['price']];
  refData.forEach((date) => {
    if (date[ref] > top) top = date['price'];
    if (date[ref] < bottom) bottom = date['price'];
  });
  return [(bottom | 0), (top | 0) + offset];
};

export default class Graph extends PureComponent {
  
  constructor(props) {
    super(props);
    this.state = { originalData: "", priceData: "", xLeft: "", xRight: "", yBottom: 0, yTop: "dataMax+5000", domainLeft: 1471788800, domainRight: "dataMax+1", lastTime: "", chartElement: <Area xAxisId="1" type="linear" dataKey="price" stroke="#00a8ff" fillOpacity={0.7} fill="url(#colorUv)" animationDuration={300} /> }
    this.zoom = this.zoom.bind(this);
    this.setTimeframe = this.setTimeframe.bind(this);
    this.scrollZoom = this.scrollZoom.bind(this);
    this.resetZoom = this.resetZoom.bind(this);
    this.formatXAxis = this.formatXAxis.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.fetchHistoricalPriceData();
  }

  zoom() {
    const [bottom, top] = getAxisYDomain(this.state.priceData, this.state.xLeft, this.state.xRight, 'price', 2500);
    this.setState({domainLeft: this.state.xLeft, domainRight: this.state.xRight, yBottom: bottom, yTop: top})
    this.setState({xLeft: "", xRight: ""})
  }

  scrollZoom() {
    console.log("Mousewheel fired")
  }

  resetZoom() {
    this.setState({priceData: this.state.originalData}, () => {
      this.setState({domainLeft: 1471788800, domainRight: "dataMax+1", yBottom: 0, yTop: "dataMax+5000"})
      this.setState({xLeft: "", xRight: ""})
    })
  }         
  
  setTimeframe(event) {
    const timeframe = (event.target.value == 'all') ? 346032000 : (event.target.value * 86400);
    const slicedData = this.state.originalData.slice(-event.target.value); 
    console.log(slicedData)
    this.setState({priceData: slicedData}, () => {
      const [bottom, top] = getAxisYDomain(this.state.priceData, this.state.lastTime - timeframe, this.state.lastTime, 'price', 2500);
      this.setState({domainLeft: this.state.lastTime - timeframe, domainRight: "dataMax+1", yBottom: bottom, yTop: top})
    })
  }                    

  formatXAxis (timestamp) {
    return UNIXToDate(timestamp*1000)
  }

  handleChange(event) {
    switch(event.target.value) {
      case 'Area':
        this.setState({chartElement: <Area xAxisId="1" type="linear" dataKey="price" stroke="#00a8ff" fillOpacity={0.7} fill="url(#colorUv)" animationDuration={300} /> })
      break;
      case 'linear':
        this.setState({chartElement: <Line xAxisId="1" type="linear" dataKey="price" stroke="#00a8ff" dot={false} animationDuration={300} />})
      break;
      case 'basis':
        this.setState({chartElement: <Area xAxisId="1" type="basisClosed" dataKey="price" stroke="#00a8ff" dot={false} fillOpacity={0.7} fill="url(#basisGradient)" animationDuration={300} />})
      break;
    }
    event.preventDefault()
  }


  fetchHistoricalPriceData() {
    fetch("http://localhost:3001/api/price/historical")
    .then(res => res.json())
    .then(res => {this.setState({priceData: res, originalData: res, lastTime: res[res.length - 1]['timestamp_unix']}, () => {
      //console.log(this.state.priceData)
    })})
  }

  render() {
    if (!this.state.priceData) {
      return (<div>Loading...</div>)
    }
    return (
        <><ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={this.state.priceData}
          onMouseDown={(e) => this.setState({ xLeft: e.activeLabel })}
          onMouseMove={(e) => this.state.xLeft && this.setState({ xRight: e.activeLabel })}
          onWheel={(e) => this.zoom}
          onMouseUp={this.zoom}>
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00a8ff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00a8ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="basisGradient" x1="0" y1="0" x2="0" y2="0">
              <stop offset="100%" stopColor="#00a8ff" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <XAxis label={<Label axisType='yAxis' position="bottom" stroke='#ffffff'>Price ($)</Label>} tickCount={10} tickFormatter={this.formatXAxis} xAxisId="1" allowDataOverflow type="number" dataKey="timestamp_unix" stroke='white' domain={[this.state.domainLeft, this.state.domainRight]} />
          <YAxis label={<Label axisType='yAxis' angle={270} position='left' stroke='#ffffff'>Price ($)</Label>} tickCount={10} allowDataOverflow dataKey="price" type='number' stroke='white' domain={[this.state.yBottom, this.state.yTop]}/>
          <Tooltip />
          {this.state.chartElement}
          {this.state.xLeft && this.state.xRight ? (
            <ReferenceArea xAxisId="1" x1={this.state.xLeft} x2={this.state.xRight} strokeOpacity={0.3} />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
      <div className='chartButtonContainer'>
        <select name="chart-type" value={this.state.chartType} onChange={this.handleChange}>
          <option value="Area">Area chart</option>
          <option value="linear">Line chart</option>
          <option value="basis">Basis chart</option>
        </select>
        <button onClick={this.resetZoom}>Reset zoom</button>
        <div className='chartButtonTimeframes'>
          <button value={"30"} onClick={(event) => this.setTimeframe(event)}>30 days</button>
          <button value={"90"}onClick={(event) => this.setTimeframe(event)}>90 days</button>
          <button value={"365"}onClick={(event) => this.setTimeframe(event)}>1 year</button>
          <button value={"1095"}onClick={(event) => this.setTimeframe(event)}>3 year</button>
          <button value={"all"} onClick={(event) => this.setTimeframe(event)}>All time</button>
        </div>
      </div>
      </>
    );
  }
}
