dc.schema = function() {

    var PIE_THRESHOLD = 10;
    var ATTRIBUTION_PROPERTIES = { 'channel': 1, 'subchannel': 2, 'source': 3, 'campaign': 4, 'subcampaign': 5 };
    var EXCLUDED_PROPERTIES = { 'coupon_ids' : true };
    var STRING_CARDINALITY_THRESHOLD = 200;
    var STRING_CARDINALITY_PCT_THRESHOLD = .9;;

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
		var md = metadata.properties[name]; if ( md.minimum != null ) { md.minimum = parseDate(md.minimum);
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

	    // exclude under certain conditions
	    if ( EXCLUDED_PROPERTIES[propname] ) 
	        continue;
	    if ( fm.type == "string" && (!ATTRIBUTION_PROPERTIES[propname]) &&
	         ( fm.cardinality > STRING_CARDINALITY_THRESHOLD || 
		   fm.cardinality / data.length > STRING_CARDINALITY_PCT_THRESHOLD ) )
	        continue;

	    // chart type
	    var chart_type;
	    if ( fm.type == "date" || 
	         ( fm.type != "string" && !(ATTRIBUTION_PROPERTIES[propname]) && fm.cardinality > PIE_THRESHOLD ) ) {
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
		domain = d3.scale.linear().domain([fm.minimum, max_domain]);
		round = dc.round.floor;
	    }
	    else {
	        value_accessor = VALUE_ACCESSORS.standard(propname);
	    } 

	    // TODO group by sum, etc.

	    charts[propname] = {
		"field_name": propname,
		"type" : chart_type,
	        "value_accessor" : value_accessor,
	        "domain" : domain,
	        "domainUnits" : domainUnits,
	        "round" : round,
		"field_metadata": fm
	    };
	}
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

    var defaultChartDivBuilder = function(div, chart_info) {
        var title = div.append("div").classed("title", true).text(chart_info.field_name);
	title.append("span").classed("filter", true).style("display", "none")
	if ( chart_info.hierarchical ) {
	    title.append("span").classed("filter-pop", true)
	        .attr("onclick", "dc.getChartFor(this).popFilter();dc.redrawAll();return true;")
		.style("display", "none").text("pop");
	}
	title.append("span").classed("reset", true)
	    .attr("onclick", "dc.getChartFor(this).filterAll();dc.redrawAll();return true;")
	    .style("display", "none").text("reset");
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
	builder.build = function(selection, crossfilter_obj, chart_div_builder) {
	    chart_div_builder = chart_div_builder || defaultChartDivBuilder;

	    var charts = {};

	    // collapse hierarchies into one composite.
	    // only case handled so far is channel + et al.
	    var hier = {};
	    var hier_type = null;
	    var hier_name = 'attribution';
	    for ( var propname in crossfilter_obj.info ) {
		if ( ! (propname in ATTRIBUTION_PROPERTIES) ) 
		    continue;
		if ( hier_type && crossfilter_obj.info[propname].type != hier_type )
		    continue;
		hier_type = crossfilter_obj.info[propname].type;
		hier[propname] = crossfilter_obj.info[propname];
	    }

	    if ( hier ) {
		var hlist = [];
		for ( propname in hier ) {
		    delete crossfilter_obj.info[propname];
		    hlist.push(hier[propname]);
		}
		hlist.sort(
		    function(a,b) { 
			var pa = ATTRIBUTION_PROPERTIES[a.field_name], pb = ATTRIBUTION_PROPERTIES[b.field_name]; 
			return pa < pb ? -1 : ( pa > pb ? 1 : 0 ); 
		    } 
		);
		crossfilter_obj.info[hier_name] = hlist;
		var dims = [];
		var grps = [];
		for ( var i = 0; i < hlist.length; i++ ) {
		    var info = hlist[i];
		    dims.push(crossfilter_obj.dimensions[info.field_name]);
		    grps.push(crossfilter_obj.groups[info.field_name]);
		    delete crossfilter_obj.dimensions[info.field_name];
		    delete crossfilter_obj.groups[info.field_name];
		}
		crossfilter_obj.dimensions[hier_name] = dims;
		crossfilter_obj.groups[hier_name] = grps;
		crossfilter_obj.info[hier_name] = hlist[0];
		crossfilter_obj.info[hier_name].hierarchical = true;
	    }

	    var propnames = [];
	    for ( var propname in crossfilter_obj.info ) {
	        propnames.push(propname);
	    }
	    propnames.sort(
	        function(a,b) { 
		    var pa = crossfilter_obj.info[a].type; 
		    var pb = crossfilter_obj.info[b].type; 
		    return (pa < pb) ? -1 : ( pa > pb ? 1 : 0 ); 
		}
            );

	    for ( var i = 0; i < propnames.length; i++ ) {
		var propname = propnames[i];
		var info = crossfilter_obj.info[propname];
		var selector = propname + "-chart";
		if ( selection.select("#" + selector).empty() ) {
		    var chart_div = selection.append("div").attr("id", selector)
		        .classed("chart", true).classed(info.type + "-chart", true);
		    chart_div_builder(chart_div, info);
		}
		var chart = null;
		if ( info.type == "bar" ) {
		    chart = dc.barChart("#" + selector)
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
		    var dim = crossfilter_obj.dimensions[propname];
		    var grp = crossfilter_obj.groups[propname];
		    chart = dc.pieChart("#" + selector, Array.isArray(dim))
		    .width(builder.defaultPieSize)
		    .height(builder.defaultPieSize)
		    .radius(builder.defaultPieRadius)
		    .innerRadius(builder.defaultPieInnerRadius)
		    .transitionDuration(builder.defaultTransition)
		    .renderTitle(true);

		    if ( Array.isArray(dim) ) {
		        for ( var j = 0; j < dim.length; j++ ) {
			    chart.addDimensionAndGroup(dim[j], grp[j]);
			}
		    }
		    else {
			chart.dimension(dim).group(grp);
		    }
		}
		charts[propname] = chart;
	    }
	    return charts;
	};
	return builder;
    };

    return schema;
}();


