var arr = [
  {
        id: "active",
        title: "Active Faces",
        x: 0,
        y: 0,
        width: 12,
        height: 4,
        type: "warning",
        locked: true,
        userData: {
            fn: "createActiveReport"
        }
  },
  {
        id: "pit",
        title: "Pending Interest Table Metric",
        x: 0,
        y: 0,
        width: 12,
        height: 4,
        type: "info",
        userData: {
            fn: "createPITMetricReport"
        },
  },
  {
        id: "faces",
        title: "Faces Metric",
        x: 0,
        y: 0,
        width: 6,
        height: 4,
        type: "success",
        locked: true,
        userData: {
            fn: "createFaceMetricReport"
        }
    },
    {
          id: "cs",
          title: "Content Store Metric",
          x: 6,
          y: 0,
          width: 6,
          height: 4,
          type: "danger",
          locked: true,
          userData: {
              fn: "createCSMetricReport"
          }
      },
];

const NFD = MMTDrop.constants.NfdColumn;


function inDetailMode() {
  return (fPeriod.selectedOption().id === MMTDrop.constants.period.MINUTE);
}

//create reports

var ReportFactory = {
    getCol: function (col, isIn) {
        var tmp = "PAYLOAD_VOLUME";
        if (col.id == COL.DATA_VOLUME.id)
            tmp = "DATA_VOLUME";
        else if (col.id == COL.PACKET_COUNT.id)
            tmp = "PACKET_COUNT";



        var label;
        if (isIn) {
            label = "In";
            tmp = "DL_" + tmp;
        } else {
            label = "Out";
            tmp = "UL_" + tmp;
        }
        return {
            id: COL[tmp].id,
            label: label,
            //type: "area"
        };
    },

    formatTime : function( date ){
            return moment( date.getTime() ).format( fPeriod.getTimeFormat() );
    },


    createFaceMetricReport: function (fPeriod) {

        var formatTime = function( date ){
            return moment( date.getTime() ).format( fPeriod.getTimeFormat() );
        };
        var DETAIL = {};//data detail of each MAC
        var database = new MMTDrop.Database({ collection: "nfd_metrics", action: "aggregate",
        no_group : true}, null, false);
        //this is called each time database is reloaded to update parameters of database
        database.updateParameter = function( _old_param ){
            var last5Minute = status_db.time.end - 5*60*1000;
            var $match = {};
            //$match[ NFD.TIMESTAMP.id ] = {$gte: last5Minute, $lte: status_db.time.end };
            $match[ NFD.METRIC_ID.id ] = {$in: [4,5,6,7,8,9,15,16,17] };
            return {query: [{$match: $match}]};
        }

        var cLine = MMTDrop.chartFactory.createTimeline({
            getData: {
                getDataFn: function (db) {
                    var cols = [];
    
                    var period = fPeriod.getDistanceBetweenToSamples();
    
                    var ylabel = "Packets/s";
    
                    
                    cols.push({
                        id: 4,
                        label: "InInterest",
                        total:0
                      });
                      cols.push({
                          id: 5,
                          label: "InData",
                          total:0
                      });
                      cols.push({
                        id: 6,
                        label: "InNack",
                        total:0
                      });
                      cols.push({
                          id: 7,
                          label: "OutInterest",
                          total:0
                      });
                      cols.push({
                        id: 8,
                        label: "OutData",
                        total:0
                      });
                      cols.push({
                          id: 9,
                          label: "OutNack",
                          total:0
                      });
                      cols.push({
                        id: 15,
                        label: "DropInterest",
                        total:0
                    });
                    cols.push({
                      id: 16,
                      label: "DropData",
                      total:0
                    });
                    cols.push({
                        id: 17,
                        label: "DropNack",
                        total:0
                    });
    
                    var obj  = {};
                    var data = db.data();
    
                    for (var i in data) {
                            var msg   = data[i];
                            var time  = msg[COL.TIMESTAMP.id];
                            var exist = true;
        
                            //data for this timestamp does not exist before
                            if (obj[time] == undefined) {
                                exist = false;
                                obj[time] = {};
                                obj[time][COL.TIMESTAMP.id] = time;
                            }
        
                            for (var j in cols) {
                                var id = cols[j].id;
        
        
                                if( msg[id] == undefined )
                                    msg[id] = 0;
                                if (id==msg[NFD.METRIC_ID.id]){
                                    cols[j].total += msg[NFD.METRIC_COUNT.id];                                
                                    if (exist)
                                        obj[time][id] += msg[NFD.METRIC_COUNT.id]/5 ;
                                    else
                                        obj[time][id] = msg[NFD.METRIC_COUNT.id]/5 ;
                                }else{
                                    if (!exist)
                                        obj[time][id] = 0 ;
                                }
                            }
                    }
    
                    for (var j in cols)
                        cols[j].label += " ("+ MMTDrop.tools.formatLocaleNumber( cols[j].total ) +")";
    
                    //first columns is timestamp
                    cols.unshift(COL.TIMESTAMP);
    
                    var $widget = $("#" + cLine.elemID).getWidgetParent();
                    var height  = $widget.find(".grid-stack-item-content").innerHeight();
                    height     -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    return {
                        data    : obj,
                        columns : cols,
                        ylabel  : ylabel,
                        height  : height,
                        _addZeroPoints:{
                            time_id       : 3,
                            time          : status_db.time,
                            sample_period : 1000 * fPeriod.getDistanceBetweenToSamples(),
                            probeStatus   : status_db.probeStatus
                        }
                    };
                }
            },
    
            chart: {
                data:{
                    type: "line"//step
                },
                color: {
                    pattern: ['orange', 'blue', 'red', 'darkkhaki', 'black', 'pink', 'green', 'DarkRed', 'lavender']
                },
                grid: {
                    x: {
                        show: false
                    },
                    y: {
                        show: true
                    }
                },
                axis: {
                    x: {
                        tick: {
                            format: formatTime,
                        }
                    },
                },
                zoom: {
                    enabled: false,
                    rescale: false
                },
                tooltip:{
                    format: {
                        title:  formatTime,
                        name : function (name, ratio, id, index) {
                            return name.split(" ")[0]; //return only In/Out
                        }
                    }
                },
            },
    
            afterRender: function (chart) {
                //register resize handle
                $("#" + chart.elemID).css("margin-top", 20);
                
                var $widget = $("#" + chart.elemID).getWidgetParent();
                
                $widget.on("widget-resized", function (event, $widget) {
                    var height = $widget.find(".grid-stack-item-content").innerHeight();
                    height -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    chart.chart.resize({
                        height: height
                    });
                });
            }
        });
        
       
        var dataFlow = [{object: cLine}];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
            [],

            // charts
            [
                {
                    charts: [cLine],
                    width: 12
                }
            ],

            //order of data flux
            dataFlow
        );
        return report;
    },
    createActiveReport: function (fPeriod) {
        
            var formatTime = function( date ){
                return moment( date.getTime() ).format( fPeriod.getTimeFormat() );
            };
            var DETAIL = {};//data detail of each MAC
            var database = new MMTDrop.Database({ collection: "nfd_metrics", action: "aggregate",
            no_group : true}, null, false);
            //this is called each time database is reloaded to update parameters of database
            database.updateParameter = function( _old_param ){
                var last5Minute = status_db.time.end - 5*60*1000;
                var $match = {};
                //$match[ NFD.TIMESTAMP.id ] = {$gte: last5Minute, $lte: status_db.time.end };
                $match[ NFD.METRIC_ID.id ] = {$gte: 4, $lte: 9 };
                return {query: [{$match: $match}]};
            }
    
            
            var cTable = MMTDrop.chartFactory.createTable({
                getData: {
                    getDataFn: function (db) {
                        var data = db.data();
                        var lastMinute  = status_db.time.end -   60*1000;
                        var last5Minute = status_db.time.end - 5*60*1000;
    
                        var obj = {};
                        for (var i in data) {
                                var msg = data[i];
    
                                var time = msg[NFD.TIMESTAMP.id];
    
                                var mac  = msg[NFD.PROBE_ID.id]+"_"+msg[NFD.FACE_ID.id];
    
                            
                                if (obj[mac] == undefined) {                          
                                    obj[mac] = {
                                        "Probe ID"          : msg[NFD.PROBE_ID.id],
                                        "Face ID"           : msg[NFD.FACE_ID.id],
                                        "InInt"             : 0,
                                        "InData"            : 0,
                                        "InNack"            : 0,
                                        "OutInt"            : 0,
                                        "OutData"           : 0,
                                        "OutNack"           : 0,
                                        "Total"             : 0,
                                        "StartTime"         : msg[COL.START_TIME.id],
                                        "LastTime"          : time,
                                    };
                                }
                                switch (msg[NFD.METRIC_ID.id]){
                                    case 4:
                                        obj[mac]["InInt"]=obj[mac]["InInt"]+msg[NFD.METRIC_COUNT.id];                        
                                        break;
                                    case 5:
                                        obj[mac]["InData"]=obj[mac]["InData"]+msg[NFD.METRIC_COUNT.id];                        
                                        break;
                                    case 6:
                                        obj[mac]["InNack"]=obj[mac]["InNack"]+msg[NFD.METRIC_COUNT.id];                        
                                        break;
                                    case 7:
                                        obj[mac]["OutInt"]=obj[mac]["OutInt"]+msg[NFD.METRIC_COUNT.id];                        
                                        break;
                                    case 8:
                                        obj[mac]["OutData"]=obj[mac]["OutData"]+msg[NFD.METRIC_COUNT.id];                        
                                        break;
                                    case 9:
                                        obj[mac]["OutNack"]=obj[mac]["OutNack"]+msg[NFD.METRIC_COUNT.id];                        
                                        break;
                                }
                                obj[mac]["Total"]=obj[mac]["Total"]+msg[NFD.METRIC_COUNT.id];
                                obj[mac]["LastTime"]=time;
                            
                                if( obj[mac]["StartTime"] == undefined )
                                obj[mac]["StartTime"] = time;
    
                                if( obj[mac]["StartTime"] > time )
                                    obj[mac]["StartTime"] = time;
    
                                if( time < lastMinute )
                                    continue;
    
    
                            //calculate only data from the last minute                      
                        }
    
                        var arr = [];
                        //retain only the machines updating in the last 5 minutes
                        for( var i in obj ){
                            if( obj[i]["LastTime"] >= status_db.time.begin && obj[i]["Total"]>0)
                                arr.push( obj[i] );
                        }
    
                        arr.sort(function (a, b) {
                            return b["LastTime"] - a["LastTime"];
                        });
    
                        for (var i = 0; i < arr.length; i++)
                            arr[i]["#"] = i + 1;
    
                        //Format data
                        for (var i in obj) {
                            var fun = "createNFDPopupReport('nfd_metrics'," //collection
                                + NFD.FACE_ID.id +","
                                + obj[i]["Face ID"] +",'Face #"+ obj[i]["Face ID"] +" of Probe #"
                                + obj[i]["Probe ID"]+"',"
                                + obj[i]["Probe ID"]+")";
    
                            //convert to time string
                            obj[i]["StartTime"]   = moment(obj[i]["StartTime"]).format( "YYYY/MM/DD HH:mm:ss" );                      
                            obj[i]["LastTime"]    = moment(obj[i]["LastTime"]).format( "YYYY/MM/DD HH:mm:ss" );
                            obj[i]["InInt"]   = MMTDrop.tools.formatLocaleNumber(obj[i]["InInt"]);
                            obj[i]["InData"]   = MMTDrop.tools.formatLocaleNumber(obj[i]["InData"]);
                            obj[i]["InNack"]   = MMTDrop.tools.formatLocaleNumber(obj[i]["InNack"]);
                            obj[i]["OutInt"]   = MMTDrop.tools.formatLocaleNumber(obj[i]["OutInt"]);
                            obj[i]["OutData"]   = MMTDrop.tools.formatLocaleNumber(obj[i]["OutData"]);
                            obj[i]["OutNack"]   = MMTDrop.tools.formatLocaleNumber(obj[i]["OutNack"]);
    
                            obj[i]["detail"]      = '<a title="Click to show graph" onclick="'+ fun +'"><i class="fa fa-line-chart" aria-hidden="true"></i></a>';
                        }
    
                        var columns = [{id: "#"            , label: ""               , align:"right"},
                                        {id:"Probe ID"        , label:"Probe ID"        , align:"right"},
                                        {id:"Face ID"     , label:"Face ID"     , align:"right"},
                                        {id:"InInt"       , label:"In Interest"      , align:"right"},
                                        {id:"InData"       , label:"In Data"      , align:"right"},
                                        {id:"InNack"       , label:"In Nack"      , align:"right"},
                                        {id:"OutInt"       , label:"Out Interest"      , align:"right"},
                                        {id:"OutData"       , label:"Out Data"      , align:"right"},
                                        {id:"OutNack"       , label:"Out Nack"      , align:"right"},
                                        {id:"StartTime"       , label:"Start Time"      , align:"right"},                                
                                        {id:"LastTime"        , label:"Last Updated"    , align:"right"},
                                        {id:"detail"          , label:""                , align:"center"}
                            ];
                        return {
                            data: arr,
                            columns: columns
                        };
                    }
                }
            });
    
            var dataFlow = [{object: cTable}];
    
            var report = new MMTDrop.Report(
                // title
                null,
    
                // database
                database,
    
                // filers
                [],
    
                // charts
                [
                    
                    {
                        charts: [cTable],
                        width: 12
                    },
                ],
    
                //order of data flux
                dataFlow
            );
            return report;
        },
    createCSMetricReport: function (fPeriod) {
        var _this = this;
        var formatTime = function( date ){
            return moment( (new Date(date)).getTime() ).format( fPeriod.getTimeFormat() );
        };
        var rep = _this.createCSReport();
        var param = rep.database.param;
        var param = {period: status_db.time, period_groupby: fPeriod.selectedOption().id};        
    
          param.no_group = true;
    
    
        rep.database.reload( param , function(new_data, rep){
              //for each element in dataFlow array
              for( var j in rep.dataFlow ){
                  var filter = rep.dataFlow[ j ];
                  if(!filter) return;
    
                  filter = filter.object;
                  if (filter instanceof MMTDrop.Filter)
                      filter.filter();
                  else if( filter ){ //chart
                      filter.attachTo( rep.database );
                      filter.redraw();
                  }
              }
          }, rep);    
        return rep;
    },  
    createCSReport(){        
        var formatTime = function( date ){
            return moment( date.getTime() ).format( fPeriod.getTimeFormat() );
        };
    
        var fMetric  = MMTDrop.filterFactory.createNFDEntityMetricFilter();
        var COL      = MMTDrop.constants.StatsColumn;
        
        var $match = {};
        var query= [];
        var database = new MMTDrop.Database({collection: "nfd_metrics", action: "aggregate",
        no_group : true}, null, false);
        database.updateParameter = function( _old_param ){
        var $match = {};
        $match[ NFD.METRIC_ID.id ] = {$in:[1,2,3]};
        return {query: [{$match: $match}]};
        }
    
        var cLine = MMTDrop.chartFactory.createTimeline({
            getData: {
                getDataFn: function (db) {
                    var cols = [];
    
                    var period = fPeriod.getDistanceBetweenToSamples();
    
                    var ylabel = "Entities/s"; 
                    cols.push({
                        id: 4,
                        label: "CsMiss",
                        total:0
                    });
                    cols.push({
                        id: 5,
                        label: "CsHit",
                        total:0
                    });
                    cols.push({
                        id: 6,
                        label: "CsInsert",
                        total:0
                    });
    
                    var obj  = {};
                    var data = db.data();
    
                    for (var i in data) {
                            var msg   = data[i];
                            var time  = msg[COL.TIMESTAMP.id];
                            var exist = true;
        
                            //data for this timestamp does not exist before
                            if (obj[time] == undefined) {
                                exist = false;
                                obj[time] = {};
                                obj[time][COL.TIMESTAMP.id] = time;
                            }
        
                            for (var j in cols) {
                                var id = cols[j].id;
        
        
                                if( msg[id] == undefined )
                                    msg[id] = 0;
                                if ((id-3)==msg[NFD.METRIC_ID.id]){
                                    cols[j].total += msg[NFD.METRIC_COUNT.id];                                
                                    if (exist)
                                        obj[time][id] += msg[NFD.METRIC_COUNT.id]/5 ;
                                    else
                                        obj[time][id] = msg[NFD.METRIC_COUNT.id]/5 ;
                                }else{
                                    if (!exist)
                                        obj[time][id] = 0 ;
                                }
                            }
                    }
    
                    for (var j in cols)
                        cols[j].label += " ("+ MMTDrop.tools.formatLocaleNumber( cols[j].total ) +")";
    
                    //first columns is timestamp
                    cols.unshift(COL.TIMESTAMP);
    
                    var $widget = $("#" + cLine.elemID).getWidgetParent();
                    var height  = $widget.find(".grid-stack-item-content").innerHeight();
                    height     -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    return {
                        data    : obj,
                        columns : cols,
                        ylabel  : ylabel,
                        height  : height,
                        _addZeroPoints:{
                            time_id       : 3,
                            time          : status_db.time,
                            sample_period : 1000 * fPeriod.getDistanceBetweenToSamples(),
                            probeStatus   : status_db.probeStatus
                        }
                    };
                }
            },
    
            chart: {
                data:{
                    type: "line"//step
                },
                color: {
                    pattern: ['orange', 'blue', 'red', 'darkkhaki', 'black', 'pink', 'green', ]
                },
                grid: {
                    x: {
                        show: false
                    },
                    y: {
                        show: true
                    }
                },
                axis: {
                    x: {
                        tick: {
                            format: formatTime,
                        }
                    },
                },
                zoom: {
                    enabled: false,
                    rescale: false
                },
                tooltip:{
                    format: {
                        title:  formatTime,
                        name : function (name, ratio, id, index) {
                            return name.split(" ")[0]; //return only In/Out
                        }
                    }
                },
            },
    
            afterRender: function (chart) {
                //register resize handle
                $("#" + chart.elemID).css("margin-top", 20);
                
                var $widget = $("#" + chart.elemID).getWidgetParent();
                $widget.on("widget-resized", function (event, $widget) {
                    var height = $widget.find(".grid-stack-item-content").innerHeight();
                    height -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    chart.chart.resize({
                        height: height
                    });
                });
            }
        });
    
        var dataFlow = [{object: cLine}];
    
        var report = new MMTDrop.Report(
            // title
            "",
            // database
            database,
            // filers
            [],
            //charts
            [
                {
                    charts: [cLine],
                    width: 12
                }
                ],
            //order of data flux
            dataFlow
        );
        return report;
    },
    createPITMetricReport: function (fPeriod) {
        var _this = this;
        var formatTime = function( date ){
            return moment( (new Date(date)).getTime() ).format( fPeriod.getTimeFormat() );
        };
        var rep = _this.createPITReport();
        var param = rep.database.param;
        var param = {period: status_db.time, period_groupby: fPeriod.selectedOption().id};        
    
          param.no_group = true;
    
    
        rep.database.reload( param , function(new_data, rep){
              //for each element in dataFlow array
              for( var j in rep.dataFlow ){
                  var filter = rep.dataFlow[ j ];
                  if(!filter) return;
    
                  filter = filter.object;
                  if (filter instanceof MMTDrop.Filter)
                      filter.filter();
                  else if( filter ){ //chart
                      filter.attachTo( rep.database );
                      filter.redraw();
                  }
              }
          }, rep);    
        return rep;
    },  
    createPITReport(){        
        var formatTime = function( date ){
            return moment( date.getTime() ).format( fPeriod.getTimeFormat() );
        };
    
        var fMetric  = MMTDrop.filterFactory.createNFDEntityMetricFilter();
        var COL      = MMTDrop.constants.StatsColumn;
        
        var $match = {};
        var query= [];
        var database = new MMTDrop.Database({collection: "nfd_metrics", action: "aggregate",
        no_group : true}, null, false);
        database.updateParameter = function( _old_param ){
        var $match = {};
        $match[ NFD.METRIC_ID.id ] = {$in:[10,11,12,13,14,18]};
        return {query: [{$match: $match}]};
        }
    
        var cLine = MMTDrop.chartFactory.createTimeline({
            getData: {
                getDataFn: function (db) {
                    var cols = [];
    
                    var period = fPeriod.getDistanceBetweenToSamples();
    
                    var ylabel = "Entities/s";                
    
                    ylabel += "";
    
                    
                    cols.push({
                        id: 13,
                        label: "PitCreated",
                        total:0
                    });
                    cols.push({
                        id: 14,
                        label: "PitUpdated",
                        total:0
                    });
                    cols.push({
                        id: 15,
                        label: "PitDeleted",
                        total:0
                    });
                    cols.push({
                        id: 17,
                        label: "PitUnsatisfied",
                        total:0
                    });
    
                    var obj  = {};
                    var data = db.data();
    
                    for (var i in data) {
                            var msg   = data[i];
                            var time  = msg[COL.TIMESTAMP.id];
                            var exist = true;
        
                            //data for this timestamp does not exist before
                            if (obj[time] == undefined) {
                                exist = false;
                                obj[time] = {};
                                obj[time][COL.TIMESTAMP.id] = time;
                            }
        
                            for (var j in cols) {
                                var id = cols[j].id;
        
        
                                if( msg[id] == undefined )
                                    msg[id] = 0;
                                if ((id-3)==msg[NFD.METRIC_ID.id]){
                                    cols[j].total += msg[NFD.METRIC_COUNT.id];                                
                                    if (exist)
                                        obj[time][id] += msg[NFD.METRIC_COUNT.id]/5 ;
                                    else
                                        obj[time][id] = msg[NFD.METRIC_COUNT.id]/5 ;
                                }else{
                                    if (!exist)
                                        obj[time][id] = 0 ;
                                }
                            }
                    }
    
                    for (var j in cols)
                        cols[j].label += " ("+ MMTDrop.tools.formatLocaleNumber( cols[j].total ) +")";
    
                    //first columns is timestamp
                    cols.unshift(COL.TIMESTAMP);
    
                    var $widget = $("#" + cLine.elemID).getWidgetParent();
                    var height  = $widget.find(".grid-stack-item-content").innerHeight();
                    height     -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    return {
                        data    : obj,
                        columns : cols,
                        ylabel  : ylabel,
                        height  : height,
                        _addZeroPoints:{
                            time_id       : 3,
                            time          : status_db.time,
                            sample_period : 1000 * fPeriod.getDistanceBetweenToSamples(),
                            probeStatus   : status_db.probeStatus
                        }
                    };
                }
            },
    
            chart: {
                data:{
                    type: "line"//step
                },
                color: {
                    pattern: ['orange', 'blue', 'red', 'darkkhaki', 'black', 'pink', 'green', ]
                },
                grid: {
                    x: {
                        show: false
                    },
                    y: {
                        show: true
                    }
                },
                axis: {
                    x: {
                        tick: {
                            format: formatTime,
                        }
                    },
                },
                zoom: {
                    enabled: false,
                    rescale: false
                },
                tooltip:{
                    format: {
                        title:  formatTime,
                        name : function (name, ratio, id, index) {
                            return name.split(" ")[0]; //return only In/Out
                        }
                    }
                },
            },
    
            afterRender: function (chart) {
                //register resize handle
                $("#" + chart.elemID).css("margin-top", 20);
                
                var $widget = $("#" + chart.elemID).getWidgetParent();
                $widget.on("widget-resized", function (event, $widget) {
                    var height = $widget.find(".grid-stack-item-content").innerHeight();
                    height -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    chart.chart.resize({
                        height: height
                    });
                });
            }
        });
    
        var cNum = MMTDrop.chartFactory.createTimeline({
            getData: {
                getDataFn: function (db) {
                    var cols = [];
    
                    var period = fPeriod.getDistanceBetweenToSamples();
    
                    var ylabel = ""; 
    
                    cols.push({
                        id: 18,
                        label: "PitNumber",
                        total:0
                    });
    
                    var obj  = {};
                    var data = db.data();
    
                    for (var i in data) {
                            var msg   = data[i];
                            var time  = msg[COL.TIMESTAMP.id];
                            var exist = true;
        
                            //data for this timestamp does not exist before
                            if (obj[time] == undefined) {
                                exist = false;
                                obj[time] = {};
                                obj[time][COL.TIMESTAMP.id] = time;
                            }
                            count=0;
                            for (var j in cols) {
                                var id = cols[j].id;        
                                count++;        
                                if( msg[id] == undefined )
                                    msg[id] = 0;
                                if (id==msg[NFD.METRIC_ID.id]){
                                    cols[j].total += msg[NFD.METRIC_COUNT.id];                                
                                    obj[time][id] = msg[NFD.METRIC_COUNT.id] ;
                                }else{
                                    if (!exist)
                                        obj[time][id] = 0 ;
                                }
                            }
                    }
    
                    /*for (var j in cols)
                        cols[j].label += " ("+ MMTDrop.tools.formatLocaleNumber( cols[j].total/count) +")";*/
    
                    //first columns is timestamp
                    cols.unshift(COL.TIMESTAMP);
    
                    var $widget = $("#" + cLine.elemID).getWidgetParent();
                    var height  = $widget.find(".grid-stack-item-content").innerHeight();
                    height     -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    return {
                        data    : obj,
                        columns : cols,
                        ylabel  : ylabel,
                        height  : height,
                        _addZeroPoints:{
                            time_id       : 3,
                            time          : status_db.time,
                            sample_period : 1000 * fPeriod.getDistanceBetweenToSamples(),
                            probeStatus   : status_db.probeStatus
                        }
                    };
                }
            },
    
            chart: {
                data:{
                    type: "line"//step
                },
                color: {
                    pattern: ['orange', 'blue', 'red', 'black', 'pink', 'green']
                },
                grid: {
                    x: {
                        show: false
                    },
                    y: {
                        show: true
                    }
                },
                axis: {
                    x: {
                        tick: {
                            format: formatTime,
                        }
                    },
                },
                zoom: {
                    enabled: false,
                    rescale: false
                },
                tooltip:{
                    format: {
                        title:  formatTime,
                        name : function (name, ratio, id, index) {
                            return name.split(" ")[0]; //return only In/Out
                        }
                    }
                },
            },
    
            afterRender: function (chart) {
                //register resize handle
                $("#" + chart.elemID).css("margin-top", 20);
                
                var $widget = $("#" + chart.elemID).getWidgetParent();
                $widget.on("widget-resized", function (event, $widget) {
                    var height = $widget.find(".grid-stack-item-content").innerHeight();
                    height -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    chart.chart.resize({
                        height: height
                    });
                });
            }
        });
        var cTime = MMTDrop.chartFactory.createTimeline({
            getData: {
                getDataFn: function (db) {
                    var cols = [];
    
                    var period = fPeriod.getDistanceBetweenToSamples();
    
                    var ylabel = "ms"; 
    
                    cols.push({
                        id: 13,
                        label: "PitExistingTime",
                        total:0
                    });
    
                    var obj  = {};
                    var data = db.data();
    
                    for (var i in data) {
                            var msg   = data[i];
                            var time  = msg[COL.TIMESTAMP.id];
                            var exist = true;
        
                            //data for this timestamp does not exist before
                            if (obj[time] == undefined) {
                                exist = false;
                                obj[time] = {};
                                obj[time][COL.TIMESTAMP.id] = time;
                            }
                            count=0;
                            for (var j in cols) {
                                var id = cols[j].id;        
                                count++;        
                                if( msg[id] == undefined )
                                    msg[id] = 0;
                                if (id==msg[NFD.METRIC_ID.id]){
                                    cols[j].total += msg[NFD.METRIC_COUNT.id];                                
                                    obj[time][id] = msg[NFD.METRIC_COUNT.id] ;
                                }else{
                                    if (!exist)
                                        obj[time][id] = 0 ;
                                }
                            }
                    }
    
                    /*for (var j in cols)
                        cols[j].label += " ("+ MMTDrop.tools.formatLocaleNumber( cols[j].total/count) +")";*/
    
                    //first columns is timestamp
                    cols.unshift(COL.TIMESTAMP);
    
                    var $widget = $("#" + cLine.elemID).getWidgetParent();
                    var height  = $widget.find(".grid-stack-item-content").innerHeight();
                    height     -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    return {
                        data    : obj,
                        columns : cols,
                        ylabel  : ylabel,
                        height  : height,
                        _addZeroPoints:{
                            time_id       : 3,
                            time          : status_db.time,
                            sample_period : 1000 * fPeriod.getDistanceBetweenToSamples(),
                            probeStatus   : status_db.probeStatus
                        }
                    };
                }
            },
    
            chart: {
                data:{
                    type: "line"//step
                },
                color: {
                    pattern: ['orange', 'blue', 'red', 'black', 'pink', 'green']
                },
                grid: {
                    x: {
                        show: false
                    },
                    y: {
                        show: true
                    }
                },
                axis: {
                    x: {
                        tick: {
                            format: formatTime,
                        }
                    },
                },
                zoom: {
                    enabled: false,
                    rescale: false
                },
                tooltip:{
                    format: {
                        title:  formatTime,
                        name : function (name, ratio, id, index) {
                            return name.split(" ")[0]; //return only In/Out
                        }
                    }
                },
            },
    
            afterRender: function (chart) {
                //register resize handle
                $("#" + chart.elemID).css("margin-top", 20);                
                var $widget = $("#" + chart.elemID).getWidgetParent();
                $widget.on("widget-resized", function (event, $widget) {
                    var height = $widget.find(".grid-stack-item-content").innerHeight();
                    height -= $widget.find(".filter-bar").outerHeight(true) + 35;
                    chart.chart.resize({
                        height: height
                    });
                });
            }
        });
        var dataFlow = [{object: cLine},{object: cNum},{object: cTime}];
    
        var report = new MMTDrop.Report(
            // title
            "",
            // database
            database,
            // filers
            [],
            //charts
            [
                {
                    charts: [cLine],
                    width: 4
                },{
                    charts: [cNum],
                    width: 4
                },{
                    charts: [cTime],
                    width: 4
                }
                ],
            //order of data flux
            dataFlow
        );
        return report;
    }
}
