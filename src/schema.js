dc.schema = function() {

    var PIE_THRESHOLD = 10;

    var VALUE_ACCESSORS = {
        "standard": function(name) { return function(d) { return d[name]; } },
        "day": function(name) { return function(d) { 
		return d3.time.day(d[name]); 
	    } 
	},
        "hour": function(name) { return function(d) { return d[name] ? d[name].getHours() : null; } }
    };

    var _computeDateDomain = function(minDate, maxDate) {
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

    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

    var schema = {};

    schema.coerceData = function(data, metadata) {
        // find all properies whose type is 'date'.
	var dateprops = {};
	for ( var name in metadata.properties ) {
	    if ( metadata.properties[name].type == "date" ) {
	        dateprops[name] = true;
		var md = metadata.properties[name];
		if ( md.minimum != null ) {
		    md.minimum = parseDate(md.minimum);
		}
		if ( md.maximum != null ) {
		    md.maximum = parseDate(md.maximum);
		}
		
	    }
	}
	if ( ! dateprops ) { return; }
	for ( var i=0; i < data.length; i++ ) {
	    var d = data[i];
	    for ( var k in d ) {
	        if (  dateprops[k] ) {
		    d[k] = parseDate(d[k]);
		}
	    }
	}
    };

    schema.chartSuggestions = function(data, metadata) {
        // given the metadata, make dimensions and groups.
	var charts = {};

	if ( ! data.length || ! metadata )
	    return charts;

	for ( var propname in metadata.properties ) {
	    var fm = metadata.properties[propname];

	    // chart type
	    var chart_type;
	    if ( fm.type == "date" || fm.cardinality > PIE_THRESHOLD ) {
	        chart_type = "bar";
	    }
	    else {
	        chart_type = "pie";
	    }

	    // value accessor and dimension
	    // domain/scale, etc.
	    var value_accessor = null;
	    var domain = null;
	    var domainUnits = null;
	    var round = null;
	    if ( fm.type == "date" ) {
	        value_accessor = VALUE_ACCESSORS.day(propname);
		domain = d3.time.scale().domain(_computeDateDomain(fm.minimum, fm.maximum));
		domainUnits = d3.time.days;
		round = d3.time.day.round;
	    }
	    else if ( chart_type == "bar" ) {
	        value_accessor = VALUE_ACCESSORS.standard(propname);
		var max_domain = ( fm.type == "integer" || fm.type == "number" ) ?  fm.maximum + 1 : fm.maximum;
		domain = d3.scale.linear([fm.minimum, max_domain]);
		round = dc.round.floor;
	    }
	    else {
	        value_accessor = VALUE_ACCESSORS.standard(propname);
	    } 
	    // TODO group 

	    charts[propname] = {
		"type" : chart_type,
	        "value_accessor" : value_accessor,
	        "domain" : domain,
	        "domainUnits" : domainUnits,
	        "round" : round,
		"field_metadata": fm
	    };
	}

	// TODO collapse hierarchies into one composite.
	return charts;
    };

    schema.newCrossfilter = function(data, metadata, strategy) {
        var crfilt = crossfilter(data);
	var obj = { 
	    "crossfilter": crfilt,
	    "dimensions": {},
	    "groups": {},
	    "info": {}
	};

	for ( var propname in strategy ) {
	    var info = strategy[propname];
	    var dim = crfilt.dimension(info.value_accessor);
	    var grp = dim.group();
	    obj.dimensions[propname] = dim;
	    obj.groups[propname] = grp;
	    obj.info[propname] = info;
	}

	return obj;

    };

    schema.chartBuilder = function() {
        var builder = {
	    "defaultMargins" : {top: 10, right: 50, bottom: 30, left: 40},
	    "defaultHeight" : 100,
	    "defaultWidth" : 900,
	    "defaultTransition" : 300,
	    "defaultPieSize" : 180,
	    "defaultPieRadius": 80,
	    "defaultPieInnerRadius": 20
	};
	builder.build = function(selection, crossfilter_obj) {
	    var charts = {};
	    for ( var propname in crossfilter_obj.info ) {
		var info = crossfilter_obj.info[propname];
		var selector = "#" + propname + "-chart";
		if ( selection.select(selector).empty() ) {
		    selection.append("div").attr("id", selector);
		}
		var chart = null;
		if ( info.type == "bar" ) {
		    chart = dc.barChart(selector)
		    .width(builder.defaultWidth)
		    .height(builder.defaultHeight)
		    .transitionDuration(builder.defaultTransition)
		    .margins(builder.defaultMargins)
		    .dimension(crossfilter_obj.dimensions[propname])
		    .group(crossfilter_obj.groups[propname])
		    .elasticY(true)
		    .x(info.domain)
		    .round(info.round);
		    if ( info.domainUnits ) { chart.xUnits(info.domainUnits); }
		}
		else if ( info.type == "pie" ) {
		    chart = dc.pieChart(selector)
		    .width(builder.defaultPieSize)
		    .height(builder.defaultPieSize)
		    .radius(builder.defaultPieRadius)
		    .innerRadius(builder.defaultPieInnerRadius)
		    .transitionDuration(builder.defaultTransition)
		    .dimension(crossfilter_obj.dimensions[propname])
		    .group(crossfilter_obj.groups[propname])
		    .renderTitle(true);
		}
		charts[propname] = chart;
	    }
	    return charts;
	};
	return builder;
    };

    return schema;
}();


