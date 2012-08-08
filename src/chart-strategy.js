dc.chartStrategy = function() {

    var chartStrategy = {};

    chartStrategy.PIE_THRESHOLD = 10;
    chartStrategy.ATTRIBUTION_PROPERTIES = { 'channel': 1, 'subchannel': 2, 'source': 3, 'campaign': 4, 'subcampaign': 5 };
    chartStrategy.EXCLUDED_PROPERTIES = { 'coupon_ids' : true, 'website_id' : true };
    chartStrategy.STRING_CARDINALITY_THRESHOLD = 200;
    chartStrategy.STRING_CARDINALITY_PCT_THRESHOLD = .9;;

    chartStrategy.VALUE_ACCESSORS = {
        "standard": function(name) { return function(d) { var v = d[name]; return v == null ? "" : v; } },
        "day": function(name) { return function(d) { 
		return d3.time.day(d[name]); 
	    } 
	},
        "hour": function(name) { return function(d) { return d[name] ? d[name].getHours() : null; } }
    };

    var computeDateDomain = function(minDate, maxDate) {
	var start = new Date(minDate.getTime());
	start.setHours(0);
	start.setMinutes(0);
	start.setSeconds(0);
	start.setMilliseconds(0);
	var end = new Date(maxDate.getTime() + 86400 * 1000);
	end.setHours(0);     
	end.setMinutes(0);
	end.setSeconds(0);
	end.setMilliseconds(0);
	return [ start, end ];
    };

    function cloneObject(obj) {
       if ( typeof(obj) != "object" ) return obj;
       var clone = {};
       for ( var k in obj ) {
          if ( obj.hasOwnProperty(k) ) 
	      clone[k] = cloneObject(obj[k]);
       }
       return clone;
    }

    var getFieldStrategy = function(data) {
        return function(propname, fm) {
	    // exclude under certain conditions
	    if ( chartStrategy.EXCLUDED_PROPERTIES[propname] ) 
		return null;
	    if ( fm.type == "string" && (!chartStrategy.ATTRIBUTION_PROPERTIES[propname]) &&
		 ( fm.cardinality > chartStrategy.STRING_CARDINALITY_THRESHOLD || 
		   fm.cardinality / data.length > chartStrategy.STRING_CARDINALITY_PCT_THRESHOLD ) )
		return null;

	    // chart type
	    var chart_type;
	    if ( fm.type == "date" || 
		 ( fm.type != "string" && 
		   !(chartStrategy.ATTRIBUTION_PROPERTIES[propname]) && 
		   fm.cardinality > chartStrategy.PIE_THRESHOLD ) ) 
		chart_type = "bar";
	    else 
		chart_type = "pie";

	    // value accessor and dimension
	    // domain/scale, etc.
	    var value_accessor = null;
	    var domain = null;
	    var domainUnits = null;
	    var round = null;
	    if ( fm.treatment == "hour" && fm.type == "date" ) {
		value_accessor = chartStrategy.VALUE_ACCESSORS.hour(propname);
		domain = d3.scale.linear().domain([0,24]);
		round = dc.round.floor;
	    }
	    else if ( fm.type == "date" ) {
		value_accessor = chartStrategy.VALUE_ACCESSORS.day(propname);
		domain = d3.time.scale().domain(computeDateDomain(fm.minimum, fm.maximum));
		domainUnits = d3.time.days;
		round = d3.time.day.round;
	    }
	    else if ( chart_type == "bar" ) {
		value_accessor = chartStrategy.VALUE_ACCESSORS.standard(propname);
		var max_domain = ( fm.type == "integer" || fm.type == "number" ) ?  fm.maximum + 1 : fm.maximum;
		domain = d3.scale.linear().domain([fm.minimum, max_domain]);
		round = dc.round.floor;
	    }
	    else {
		value_accessor = chartStrategy.VALUE_ACCESSORS.standard(propname);
	    } 

	    // TODO group by sum, etc.

	    return {
		"field_name": propname,
		"type" : chart_type,
		"value_accessor" : value_accessor,
		"domain" : domain,
		"domainUnits" : domainUnits,
		"round" : round,
		"field_metadata": fm
	    };
        };
    };

    chartStrategy.getStrategy = function(data, metadata) {
        // given the metadata, make dimensions and groups.
	var charts = {};

	if ( ! data.length || ! metadata )
	    return charts;

	var gfs = getFieldStrategy(data);
	for ( var propname in metadata.properties ) {
	    var fm = metadata.properties[propname];
	    var chart_def = gfs(propname, fm);
	    if ( ! chart_def ) continue;

	    charts[propname] = chart_def;

	    // for date fields, push a special _hour dimension.
	    if ( fm.type == "date" ) {
	        var hour_fm = cloneObject(fm);
		hour_fm.treatment = 'hour';
		var hour_chart_def = gfs(propname, hour_fm);
		hour_chart_def.field_name = propname + "_hour";
		charts[propname + "_hour"] = hour_chart_def;
	    }
	}
	return charts;
    };

    return chartStrategy;
}();


