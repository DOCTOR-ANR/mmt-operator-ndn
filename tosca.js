var arr = [
    {
        id: "config",
        title: "Configuration",
        x: 6,
        y: 0,
        width: 12,
        height: 8,
        type: "success",
        userData: {
            fn: "createConfigReport"
        },
    }
];

var availableReports = {
}

var REFRESH_INFO_INTERVAL = 5000; //5seconds

//create reports
var ReportFactory = {

  createConfigReport: function(){
    var form_config = {
      type : "<div>",
      attr : {
        style : "margin: 20px",
        class : "row",
      },
      children: [{
        type : "<div>",
        attr : {
          class: "col-sm-12",
        },
        children: [{
          type : "<form>",
          attr : {
            id: "conf-operator-form"
          },
          children: [{
            label : "TOSCA",
            type  : "<textarea>",
            attr  : {
              rows: 40,
              id      : "conf-operator-content",
              class   : "form-control textarea-config",
              required: true
            }
          },{
            type : "<input>",
            attr : {
              type : "submit",
              class: "btn btn-primary",
              value: 'Save',
              id   : "conf-btnSave"
            }
          }]
        }]
      }]
    }
    //generate form
    $("#config-content" ).append( MMTDrop.tools.createForm( form_config, true ) ) ;

    //log files
    var $datepicker = null;

    var minDate = (new Date()).getTime();
    if( status_db.probeStatus )
      for( var i=0; i<status_db.probeStatus.length; i++)
        if( status_db.probeStatus[i].start < minDate )
          minDate = status_db.probeStatus[i].start;
    minDate = new Date( minDate );

    


    //load data
    MMTDrop.tools.ajax("/info/tosca", null, "GET", {
      error : function(){
        MMTDrop.alert.error("Internal error", 10*1000);
      },
      success : function( data ){
        $("#conf-probe-content").val( data.data.probe )
        $("#conf-operator-content").val( data.data.operator )
      }
    });

    //save operator-conf
    //when user submit form
    $("#conf-operator-form").validate({
      errorClass  : "text-danger",
      errorElement: "span",
      //when the form was valided
      submitHandler : function( form ){

        var value = $("#conf-operator-content").val();
        /*try{
          var o = JSON.parse( value );
        }catch( err ){
          MMTDrop.alert.error( "<strong>Syntax error:</strong>" + err, 10*1000 );
          return;
        }*/

        if( !confirm("Update and Restart TOSCA\nAre you sure?\n\n") )
          return;

        var data = {
          operator: value,
        };

        MMTDrop.tools.ajax("/info/tosca", data, "POST", {
          error  : function(){
            MMTDrop.alert.error("Cannot update the configure of TOSCA", 10*1000);
          },
          success: function(){
            MMTDrop.alert.success("Successfully updated the configure of TOSCA", 5*1000);
            obj.interfaces[ data.admin.iface ] = data.admin;
          }
        })
        return false;
      }
    });

    //save probe-conf
    //when user submit form
    $("#conf-probe-form").validate({
      errorClass  : "text-danger",
      errorElement: "span",
      //when the form was valided
      submitHandler : function( form ){

        var value = $("#conf-probe-content").val();

        if( !confirm("Update Network Interfaces and Restart Machine \n\nAre you sure?") )
          return;

        if( !confirm("Update Network Interfaces and Restart Machine \n\nIs network interfaces description correct?") )
          return;

        var data = {
          probe: value,
        };

        MMTDrop.tools.ajax("/info/tosca", data, "POST", {
          error  : function(){
            MMTDrop.alert.error("Cannot update the configure of Network Interfaces", 10*1000);
          },
          success: function(){
            MMTDrop.alert.success("Successfully updated the configure of Network Interfaces", 10*1000);
            obj.interfaces[ data.admin.iface ] = data.admin;
          }
        })
        return false;
      }
    });

    //when user resize
    $("#conf-probe-form").getWidgetParent().on("widget-resized", function(){
      var h = $("#conf-probe-form").getWidgetContentOfParent().height() - 145;
      $(".textarea-config").css( "height", h + "px" );
    }).trigger("widget-resized");
  },
}
