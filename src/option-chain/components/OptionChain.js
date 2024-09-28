import AmCharts from "@amcharts/amcharts3-react";
import 'bootstrap/dist/css/bootstrap.css';
import React, { Component } from 'react';
import Select from "react-select";


export default class OptionChain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      jsonData: [],
      fields: {},
      dataProvider: [],
      modeList: [{ label: "Auto", value: "Auto" }, { label: "Manual", value: "Manual" },],
      recordCountList: [{ label: "All", value: -1 }, { label: "5", value: 5 }, { label: "10", value: 10 },
      { label: "15", value: 15 }, { label: "20", value: 20 }, { label: "30", value: 30 }, { label: "40", value: 40 },
      { label: "50", value: 50 }, { label: "75", value: 75 }, { label: "100", value: 100 }, { label: "150", value: 150 }],
      recordCount: { label: "All", value: -1 },
      movingAvgs: [{ label: "2", value: 2 }, { label: "3", value: 3 }, { label: "4", value: 4 }, { label: "5", value: 5 },
      { label: "6", value: 6 }, { label: "7", value: 7 }, { label: "8", value: 8 }, { label: "9", value: 9 },
      { label: "10", value: 10 }, { label: "15", value: 15 }, { label: "20", value: 20 }, { label: "25", value: 25 }],
      movingAvg: { label: "5", value: 5 },

      mode: { label: "Auto", value: "Auto" },
      symbolList: [{ label: "NIFTY", value: "NI" }, { label: "BANKNIFTY", value: "BA" },],
      symbol: { label: "BANKNIFTY", value: "BA" }
    };
    //this.props.setHeader("Option Chain");
  }

  componentDidMount() {
    var self = this;
    setInterval(function() {self.loadDataFromBackend()}, 5000);
  }

  loadDataFromBackend = () => {
    var self = this;
    if (this.state?.mode.value == "Auto") {
      const apiUrl = 'http://localhost:8080/mfaservices/trade/v1/oiData';

      const dataToSend = {
        symbol: this.state.symbol.value
      };

      // Define the request options with method and body
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)  // Convert JavaScript object to JSON string
      };

      // Make the API call
      fetch(apiUrl, requestOptions)
        .then(response => response.json())  // Parse the JSON from the response
        .then(data => {
          console.log('Response data:', data);
          self.state.jsonData = data.data;
          self.formatJson()
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
  }

  handleChange(name, parent, value, obj) {
    console.log("name----", name);
    console.log("obj---", obj);
    console.log("parent---", parent);
    console.log("value---", value);

    parent[name] = value;

    /*   const fields = parent.fields;
      const validate = validateForm(name, value, FormElements[name], null, null);
      if (validate) {
        fields[name] = validate;
      } else {
        fields[name] = { hasError: false, errorMsg: '' };
      }
      this.setState({ fields });
      parent[name] = value;
      if (!isTouched) {
        this.formatJson()
      } */

    this.formatJson()

    //console.log("value---", value);
    this.forceUpdate();
  }

  formatJson = (data) => {
    var MA = 2
    if (this.validate(this.state.movingAvg)) {
      MA = this.state.movingAvg.value;
    }
    try {
      var array = JSON.parse(this.state.jsonData)

      //Moving Avarage
      for (let index = 0; index < array.length; index++) {
        array[index].put = parseFloat(array[index].put.replaceAll(",", ""))
        array[index].call = parseFloat(array[index].call.replaceAll(",", ""))
        array[index].diff = array[index].put - array[index].call;
        array[index].diff = parseFloat(array[index].diff)?.toFixed(1)
        array[index].diff = parseFloat(array[index].diff)
        array[index].pcr = array[index].put / array[index].call;
        if (index - MA + 1 >= 0) {
          var sum = 0;
          for (var j = index; j > index - MA; j--) {
            sum += array[j].diff
          }
          array[index].movingAvg = sum / MA
        }

        if (index != 0) {
          if (array[index].diff > array[index - 1].diff) {
            array[index].trend = "uptrend"
          } else if (array[index].diff < array[index - 1].diff) {
            array[index].trend = "downtrend"
          }
        }

        var MIN_CHANGE_PERCENTAGE = 35
        if (array[index].put > array[index].call) {
          var changePercent = (array[index].put - array[index].call) / array[index].call * 100
          array[index].changePercent = changePercent.toFixed(1);
          array[index].currentTrend = changePercent > MIN_CHANGE_PERCENTAGE ? "Uptrend" : "No Trend"
        } else {
          var changePercent = (array[index].call - array[index].put) / array[index].put * 100
          array[index].changePercent = changePercent.toFixed(1);
          array[index].currentTrend = changePercent > MIN_CHANGE_PERCENTAGE ? "Downtrend" : "No Trend"
        }


      }
      console.log("=========array: " + JSON.stringify(array))
      if (this.validate(this.state.recordCount) && this.state.recordCount.value != -1) {
        //remove the initial N records
        array = array.slice(this.state.recordCount.value * -1)
      }

      for (let index = 0; index < array.length; index++) {
        const element = array[index];
        array[index].call = array[index].call
        array[index].put = array[index].put
        array[index].time = this.removeSecondFromTime(array[index].time)
      }

      //generating BUY/SELL Signals
      for (let index = 0; index < array.length; index++) {
        console.log("==============================")
        console.log("Call : " + array[index].call)
        console.log("Put : " + array[index].put)
        console.log("==============================")
        if (index == 0) {
          continue;
        }


        if (array[index].call >= array[index - 1].call && array[index].put >= array[index - 1].put) {
          array[index].buySignal = 0;
          array[index].sellSignal = 0;
        } else if (array[index].call <= array[index - 1].call && array[index].put <= array[index - 1].put) {
          array[index].buySignal = 0;
          array[index].sellSignal = 0;
        } else if (array[index].call >= array[index - 1].call && array[index].put <= array[index - 1].put) {
          array[index].buySignal = 0;
          array[index].sellSignal = 1;
        } else if (array[index].call <= array[index - 1].call && array[index].put >= array[index - 1].put) {
          array[index].buySignal = 1;
          array[index].sellSignal = 0;
        }

      }

      this.state.dataProvider = array
    } catch (error) {
      alert("Json Might be Wrong")
    }
    this.forceUpdate()
  }
  onSubmit = () => {
    this.formatJson()
  }

  removeSecondFromTime = (time) => {
    var index = time.indexOf(":");
    if (index !== -1) {
      index = time.indexOf(":", index + 1)
      if (index != -1) {
        return time.substring(0, index)
      }
    }

    return time
  }

  validate = (val) => {
    if (val != null && val != undefined && val != "") {
      return true;
    } else {
      return false;
    }
  }

  render() {
    const configDefault = {
      type: "serial",
      categoryField: "time",
      theme: "default",
      categoryAxis: {
        parseDates: false,
      },
      legend: {
        markerSize: 10,
        valueWidth: 0,
        verticalGap: 0,
      },
      chartCursor: {
        enabled: true,
      },
      trendLines: [],
      dataProvider: this.state.dataProvider,
      graphs: [
        {
          balloonText: "[[title]]<br/><b>[[value]]</b>",
          fillAlphas: 0.7,
          id: "AmGraph-1",
          lineAlpha: 0,
          title: "Call",
          valueField: "call",
          lineColor: "red",
        },
        {
          balloonText: "[[title]]<br/><b>[[value]]</b>",
          fillAlphas: 0.7,
          id: "AmGraph-2",
          lineAlpha: 0,
          title: "Put",
          valueField: "put",
          lineColor: "green",
        },
      ],
      guides: [],
      valueAxes: [
        {
          id: "ValueAxis-1",
          title: "OI",
          position: "left",
          fontSize: 9,
          " autoGridCount": false,
          /* labelFunction: function (value) {
            return value / 1000 + "k";
          }, */
        },
        /*  {
           id: "ValueAxis-1",
           title: "Percentage",
           position: "right",
           fontSize: 9,
           " autoGridCount": false,
           labelFunction: function (value) {
             return value / 10000;
           },
         }, */
      ],
      allLabels: [],
      balloon: {},
      export: {
        enabled: true,
      },
    };

    const pcrConfig = {
      type: "serial",
      theme: "light",
      legend: {
        useGraphSettings: true,
        equalWidths: false,
        valueAlign: "right",
        marginRight: 51,
        horizontalGap: -12,
        markerSize: 4,
        valueWidth: 20,
        verticalGap: -6,
      },
      valueAxes: [
        {
          id: "v1",
          title: "PUT/CALL",
          position: "left",
          fontSize: 9,
          autoGridCount: false,
          /*  labelFunction: function (value) {
             return Math.round(value) / 1000 + "k";
           }, */
        },
      ],
      graphs: [
        {
          id: "g1",
          valueAxis: "v2",
          bullet: "round",
          bulletBorderAlpha: 1,
          bulletSize: 5,
          hideBulletsCount: 50,
          lineThickness: 2,
          type: "smoothedLine",
          title: "PUT / CALL",
          useLineColorForBulletBorder: true,
          valueField: "pcr",
          lineColor: "#FF0080",
          balloonText: "[[title]]<br/><b>[[value]]</b>",
        },

      ],

      chartCursor: {
        pan: true,
        valueLineEnabled: true,
        valueLineBalloonEnabled: false,
        cursorAlpha: 0.2,
        valueLineAlpha: 0,
      },
      categoryField: "time",
      categoryAxis: {
        parseDates: false,
        dashLength: 1,
        minorGridEnabled: true,
      },
      balloon: {
        borderThickness: 1,
        shadowAlpha: 0,
      },
      export: {
        enabled: true,
      },
      dataProvider: this.state.dataProvider,
    };


    const lineChartConfig = {
      type: "serial",
      theme: "light",
      legend: {
        useGraphSettings: true,
        equalWidths: false,
        valueAlign: "right",
        marginRight: 51,
        horizontalGap: -12,
        markerSize: 4,
        valueWidth: 20,
        verticalGap: -6,
      },
      valueAxes: [
        {
          id: "v1",
          title: "OI",
          position: "left",
          fontSize: 9,
          autoGridCount: false,
          /*  labelFunction: function (value) {
             return Math.round(value) / 1000 + "k";
           }, */
        },
      ],
      graphs: [
        {
          id: "g1",
          valueAxis: "v2",
          bullet: "round",
          bulletBorderAlpha: 1,
          bulletSize: 5,
          hideBulletsCount: 50,
          lineThickness: 2,
          type: "smoothedLine",
          title: "PUT - CALL",
          useLineColorForBulletBorder: true,
          valueField: "diff",
          lineColor: "#FF0080",
          balloonText: "[[title]]<br/><b>[[value]]</b>",
        }, {
          id: "g2",
          valueAxis: "v3",
          bullet: "round",
          bulletBorderAlpha: 1,
          bulletSize: 5,
          hideBulletsCount: 50,
          lineThickness: 2,
          type: "smoothedLine",
          title: "AVG(PUT-CALL) ",
          useLineColorForBulletBorder: true,
          valueField: "movingAvg",
          lineColor: "yellow",
          balloonText: "[[title]]<br/><b>[[value]]</b>",
        },

      ],

      chartCursor: {
        pan: true,
        valueLineEnabled: true,
        valueLineBalloonEnabled: false,
        cursorAlpha: 0.2,
        valueLineAlpha: 0,
      },
      categoryField: "time",
      categoryAxis: {
        parseDates: false,
        dashLength: 1,
        minorGridEnabled: true,
      },
      balloon: {
        borderThickness: 1,
        shadowAlpha: 0,
      },
      export: {
        enabled: true,
      },
      dataProvider: this.state.dataProvider,
    };

    const buySellConfig = {
      type: "serial",
      theme: "light",
      legend: {
        markerSize: 10,
        valueWidth: 0,
        verticalGap: 0,
      },
      valueAxes: [
        {
          id: "v1",
          title: "",
          position: "left",
          fontSize: 9,
          gridThickness: 0,
          autoGridCount: false,
        },
      ],
      graphs: [
        {
          fillAlphas: 1,
          id: "AmGraph-1",
          title: "Buy Signal",
          type: "column",
          valueField: "buySignal",
          lineColor: "green",
          balloonText: "[[title]] : [[value]]",
        },
        {
          fillAlphas: 1,
          id: "AmGraph-2",
          title: "Sell Signal",
          type: "column",
          valueField: "sellSignal",
          lineColor: "red",
          balloonText: "[[title]] : [[value]]",
        }
      ],
      chartScrollbar: {
        graph: "g1",
        oppositeAxis: false,
        offset: 30,
        scrollbarHeight: 10,
        backgroundAlpha: 0,
        selectedBackgroundAlpha: 0,
        selectedBackgroundColor: "#888888",
        graphFillAlpha: 0,
        graphLineAlpha: 0,
        selectedGraphFillAlpha: 0,
        selectedGraphLineAlpha: 0,
        autoGridCount: true,
        color: "#FFFFFF",
      },
      chartCursor: {
        pan: true,
        valueLineEnabled: true,
        valueLineBalloonEnabled: false,
        cursorAlpha: 0.2,
        valueLineAlpha: 0,
      },
      categoryField: "time",
      categoryAxis: {
        parseDates: false,
      },

      balloon: {
        borderThickness: 1,
        shadowAlpha: 0,
      },

      dataProvider: this.state.dataProvider
    };

    console.log("Dataprovider : ", this.state.dataProvider);
    return (
      <div className="custom-container" style={{ padding: "17px", backgroundColor: "#eaeaea" }}>
        <div className="form-Brick" style={{ padding: "0px" }}>
          {/*  <div className="form-Brick-Head">
            <span>Basic Details  </span>
          </div> */}
          <b> Basic Details</b>
          <div className="form-Brick-body">
            <div className="row">

              <div className="col-md-1">
                <div >
                  <label className="commonLabel">  Mode  </label>
                </div>
                <Select options={this.state.modeList}
                  value={this.state.mode}
                  onChange={(e) => this.handleChange("mode", this.state, e)}
                  className="textField" />
                <div>
                  {/* <label className="default-validateLabel"> {getMsg(this.state.field.title)} </label> */}
                </div>
              </div>

              <div className="col-md-1">
                <div >
                  <label className="commonLabel">  Symbol  </label>
                </div>
                <Select options={this.state.symbolList}
                  value={this.state.symbol}
                  onChange={(e) => this.handleChange("symbol", this.state, e)}
                  className="textField" />
                <div>
                  {/* <label className="default-validateLabel"> {getMsg(this.state.field.title)} </label> */}
                </div>
              </div>

              <div className="col-md-6">
                <div >
                  <label className="commonLabel">  OI Data  </label>
                </div>
                <textarea className="textField" value={this.state.json} onChange={(e) => this.handleChange("jsonData", this.state, e.target.value)} style={{ height: "73px" }}></textarea>
                <div>
                  {/* <label className="default-validateLabel"> {getMsg(this.state.field.title)} </label> */}
                </div>
              </div>

              <div className="col-md-2">
                <div >
                  <label className="commonLabel">  Record Count  </label>
                </div>
                <Select options={this.state.recordCountList}
                  value={this.state.recordCount}
                  onChange={(e) => this.handleChange("recordCount", this.state, e)}
                  className="textField" />
                <div>
                  {/* <label className="default-validateLabel"> {getMsg(this.state.field.title)} </label> */}
                </div>
              </div>



              <div className="col-md-2">
                <div >
                  <label className="commonLabel">  Moving Avg  </label>
                </div>
                <Select options={this.state.movingAvgs}
                  value={this.state.movingAvg}
                  onChange={(e) => this.handleChange("movingAvg", this.state, e)}
                  className="textField" />
                <div>
                  {/* <label className="default-validateLabel"> {getMsg(this.state.field.title)} </label> */}
                </div>
              </div>


              {/*  <FieldItem
                {...FormElements.recordCount}
                value={this.state.recordCount}
                onChange={this.handleChange.bind(this, FormElements.recordCount.name, this.state)}
                width="lg"
                values={this.state.recordCountList}
              />
              <FieldItem
                {...FormElements.movingAvg}
                value={this.state.movingAvg}
                onChange={this.handleChange.bind(this, FormElements.movingAvg.name, this.state)}
                width="lg"
                values={this.state.movingAvgs}
              /> */}

            </div>
          </div>

          {this.state.dataProvider.length > 0 ?
            <div className="form-Brick-body" style={{ marginTop: "10px", maxHeight: "300px", overflow: "auto" }}>
              <center><b>Option Chain(In Lakhs)</b></center>
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">CALL</th>
                    <th scope="col">PUT</th>
                    <th scope="col">Diff(PUT-CALL)</th>
                    {/* <th scope="col">Average</th> */}
                    <th scope="col">Trend</th>
                    <th scope="col">Change %</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.dataProvider.slice().reverse().map((row, i) => (
                    <tr>
                      <th scope="row">{row.time}</th>
                      <td>{row.call}</td>
                      <td>{row.put}</td>
                      <td style={{ backgroundColor: row?.trend == "uptrend" ? "green" : row?.trend == "downtrend" ? "red" : "#d4d4f8", color: "white", fontWeight: "700" }}>{row.diff}</td>
                      {/* <td>{row.movingAvg}</td> */}
                      <td style={{ backgroundColor: row?.currentTrend == "Uptrend" ? "green" : row?.currentTrend == "Downtrend" ? "red" : "#d4d4f8", color: "white", fontWeight: "700" }}>{row.currentTrend}</td>
                      <td> {row.changePercent}</td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div> : null}

          {this.state.dataProvider.length > 0 ?
            <div className="form-Brick-body" style={{ marginTop: "10px" }}>
              <center><b>PUT-CALL Difference</b></center>
              <div>
                <AmCharts.React
                  style={{ width: "100%", height: "450px" }}
                  options={lineChartConfig}
                />
              </div>
            </div> : null}

          <div className="row">
            <div className="col-md-12" >
              {this.state.dataProvider.length > 0 ?
                <div className="form-Brick-body" style={{ marginTop: "10px", padding: "0px" }}>
                  <center><b>PUT-CALL Ratio</b></center>
                  <div>
                    <AmCharts.React
                      style={{ width: "100%", height: "450px" }}
                      options={configDefault}
                    />
                  </div>
                </div> : null}
            </div>


            <div className="col-md-12" >
              {this.state.dataProvider.length > 0 ?
                <div className="form-Brick-body" style={{ marginTop: "10px", padding: "0px" }}>
                  <center><b>BUY or SELL</b></center>
                  <div>
                    <AmCharts.React
                      style={{ width: "100%", height: "350px" }}
                      options={buySellConfig}
                    />
                  </div>
                </div> : null}
            </div>
          </div>


          <div className="col-md-12" >
            {this.state.dataProvider.length > 0 ?
              <div className="form-Brick-body" style={{ marginTop: "10px", padding: "0px" }}>
                <center><b>PCR ( Uptrend : {'>'} 1 , Downtrend : {'<'} 1 )</b></center>
                <div>
                  <AmCharts.React
                    style={{ width: "100%", height: "450px" }}
                    options={pcrConfig}
                  />
                </div>
              </div> : null}
          </div>


        </div>

        <div style={{ height: "100px" }}></div>
      </div >
    );
  }

}
